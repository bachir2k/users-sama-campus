import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // PayDunya envoie un POST form-urlencoded avec un champ "data" (JSON)
    const body = await req.text()
    const params = new URLSearchParams(body)
    const rawData = params.get('data')
    if (!rawData) return new Response('Bad Request', { status: 400 })

    let ipn: Record<string, unknown> = {}
    try { ipn = JSON.parse(rawData) } catch { return new Response('Bad Request', { status: 400 }) }

    const invoice = ipn.invoice as Record<string, unknown> | undefined
    const token = (invoice?.token ?? ipn.token) as string | undefined
    if (!token) return new Response('Bad Request', { status: 400 })

    // ── Re-vérification côté serveur via l'API Confirm PayDunya ──
    // On ne fait jamais confiance au seul payload de l'IPN : on rappelle
    // PayDunya avec le token reçu pour confirmer le statut réel du paiement.
    const MASTER_KEY  = Deno.env.get('PAYDUNYA_MASTER_KEY')!
    const PRIVATE_KEY = Deno.env.get('PAYDUNYA_PRIVATE_KEY')!
    const TOKEN_KEY   = Deno.env.get('PAYDUNYA_TOKEN')!
    const MODE        = (Deno.env.get('PAYDUNYA_MODE') ?? 'test').toLowerCase()
    const API_BASE    = MODE === 'live'
      ? 'https://app.paydunya.com/api/v1'
      : 'https://app.paydunya.com/sandbox-api/v1'

    const confirmRes = await fetch(`${API_BASE}/checkout-invoice/confirm/${token}`, {
      headers: {
        'Content-Type':         'application/json',
        'PAYDUNYA-MASTER-KEY':  MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN':       TOKEN_KEY,
      },
    })
    const confirmData = await confirmRes.json().catch(() => ({} as Record<string, unknown>))

    const status = (confirmData.status
      ?? (confirmData.invoice as Record<string, unknown> | undefined)?.status) as string | undefined
    const customData = (confirmData.custom_data ?? ipn.custom_data ?? {}) as
      { auth_user_id?: string; student_id?: string; amount?: number; type?: string }

    console.log('PayDunya confirm:', { token, status, response_code: confirmData.response_code })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (confirmData.response_code === '00' && status === 'completed'
      && customData.auth_user_id && customData.student_id && customData.amount) {
      // ── Anti-double-crédit : payment-confirm a peut-être déjà traité ce token ──
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('student_id', customData.student_id)
        .eq('reference', token)
        .maybeSingle()

      if (existing) {
        console.log('Payment already credited, skipping:', token)
      } else {
        // ── Créditer le solde de la carte via la fonction SQL ──
        const { error: rpcErr } = await supabase.rpc('increment_card_balance', {
          p_user_id: customData.auth_user_id,
          p_amount:  Math.round(customData.amount),
        })
        if (rpcErr) console.error('increment_card_balance error:', rpcErr)

        // ── Enregistrer la transaction de rechargement ──────────
        await supabase.from('transactions').insert({
          student_id:  customData.student_id,
          service:     'Rechargement',
          type:        'recharge',
          description: 'Rechargement carte',
          reference:   token,
          amount:      Math.round(customData.amount),
          status:      'ok',
        }).then(({ error }) => {
          if (error) console.warn('transaction insert skipped:', error.message)
        })

        console.log('Payment completed:', token, 'amount:', customData.amount)
      }

    } else {
      console.log('Payment not completed, status:', status)
    }

    return new Response('200', { status: 200 })

  } catch (err) {
    console.error('payment-webhook error:', err)
    return new Response('Server Error', { status: 500 })
  }
})
