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
    // PayTech envoie un POST avec le token et le statut
    const body = await req.text()
    const params = new URLSearchParams(body)

    const token       = params.get('token')
    const typeEvent   = params.get('type_event')   // 'sale_complete' | 'sale_canceled'
    const customField = params.get('custom_field')

    if (!token || !typeEvent) {
      return new Response('Bad Request', { status: 400 })
    }

    let customData: { user_id?: string; amount?: number; type?: string } = {}
    try { customData = JSON.parse(customField ?? '{}') } catch { /* ignore */ }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (typeEvent === 'sale_complete' && customData.user_id && customData.amount) {
      // ── Créditer le solde de la carte via la fonction SQL ──
      const { error: rpcErr } = await supabase.rpc('increment_card_balance', {
        p_user_id: customData.user_id,
        p_amount:  Math.round(customData.amount),
      })
      if (rpcErr) console.error('increment_card_balance error:', rpcErr)

      // ── Enregistrer la transaction de rechargement ──────────
      await supabase.from('transactions').insert({
        student_id:  customData.user_id, // sera résolu via RLS ou trigger si besoin
        service:     'Rechargement',
        description: `Rechargement PayTech — ${token}`,
        amount:      Math.round(customData.amount),
        status:      'completed',
      }).then(({ error }) => {
        if (error) console.warn('transaction insert skipped:', error.message)
      })

      console.log('Payment completed:', token, 'amount:', customData.amount)

    } else if (typeEvent === 'sale_canceled') {
      console.log('Payment cancelled:', token)
    }

    return new Response('200', { status: 200 })

  } catch (err) {
    console.error('payment-webhook error:', err)
    return new Response('Server Error', { status: 500 })
  }
})
