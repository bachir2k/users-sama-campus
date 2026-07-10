import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // ── 1. Auth ───────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Non autorisé' }, 401)

    const authedClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await authedClient.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError?.message)
      return json({ error: 'Non autorisé' }, 401)
    }

    const { data: studentRow } = await authedClient
      .from('students')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (!studentRow) {
      return json({ error: 'Profil étudiant introuvable' }, 404)
    }
    const studentId = studentRow.id as string

    // ── 2. Paramètres ─────────────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const token = body.token as string | undefined
    if (!token) return json({ error: 'Token manquant' }, 400)

    // ── 3. Confirmation auprès de PayDunya ──────────────────────
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
    const customData = (confirmData.custom_data ?? {}) as
      { auth_user_id?: string; student_id?: string; amount?: number; type?: string }

    console.log('payment-confirm:', { token, status, response_code: confirmData.response_code, student: studentId })

    if (confirmData.response_code !== '00' || status !== 'completed') {
      return json({ credited: false, error: `Paiement non complété (statut: ${status ?? 'inconnu'})` }, 200)
    }

    // On ne crédite que le compte de l'utilisateur authentifié qui appelle cette
    // fonction — jamais celui indiqué dans custom_data — pour empêcher un étudiant
    // d'utiliser le token d'un autre pour se créditer lui-même.
    if (customData.auth_user_id !== user.id) {
      console.error('payment-confirm: user mismatch', { tokenUser: customData.auth_user_id, callerUser: user.id })
      return json({ error: 'Ce paiement ne correspond pas à votre compte' }, 403)
    }

    const amount = Math.round(Number(customData.amount ?? 0))
    if (!amount) return json({ error: 'Montant invalide dans la facture' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── 4. Anti-double-crédit : le webhook a peut-être déjà traité ce token ──
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('student_id', studentId)
      .eq('reference', token)
      .maybeSingle()

    if (existing) {
      console.log('payment-confirm: already credited, skipping', token)
      return json({ credited: true, amount, alreadyProcessed: true })
    }

    const { error: rpcErr } = await supabase.rpc('increment_card_balance', {
      p_user_id: customData.auth_user_id,
      p_amount:  amount,
    })
    if (rpcErr) {
      console.error('increment_card_balance error:', rpcErr)
      return json({ error: 'Erreur lors du crédit du solde' }, 500)
    }

    await supabase.from('transactions').insert({
      student_id:  studentId,
      service:     'Rechargement',
      type:        'recharge',
      description: 'Rechargement carte',
      reference:   token,
      amount,
      status:      'ok',
    }).then(({ error }) => {
      if (error) console.warn('transaction insert skipped:', error.message)
    })

    return json({ credited: true, amount })

  } catch (err) {
    console.error('Unhandled error in payment-confirm:', err)
    return json({ error: `Erreur serveur: ${(err as Error).message}` }, 500)
  }
})
