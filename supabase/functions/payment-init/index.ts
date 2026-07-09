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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError?.message)
      return json({ error: 'Non autorisé' }, 401)
    }

    // ── 2. Paramètres ─────────────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const amount = Math.round(Number(body.amount ?? 0))
    const type   = body.type ?? 'recharge'

    if (!amount || amount < 100) {
      return json({ error: `Montant invalide: ${amount} (min 100 F)` }, 400)
    }

    // ── 3. Secrets PayDunya ─────────────────────────────────────
    const MASTER_KEY  = Deno.env.get('PAYDUNYA_MASTER_KEY')
    const PRIVATE_KEY = Deno.env.get('PAYDUNYA_PRIVATE_KEY')
    const TOKEN_KEY   = Deno.env.get('PAYDUNYA_TOKEN')
    const APP_URL     = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '')
    const MODE        = (Deno.env.get('PAYDUNYA_MODE') ?? 'test').toLowerCase()

    if (!MASTER_KEY || !PRIVATE_KEY || !TOKEN_KEY) {
      console.error('Secrets manquants: PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY ou PAYDUNYA_TOKEN')
      return json({ error: 'Configuration paiement incomplète' }, 500)
    }
    if (!APP_URL) {
      console.error('Secret manquant: APP_URL')
      return json({ error: 'Configuration APP_URL manquante' }, 500)
    }

    const API_BASE = MODE === 'live'
      ? 'https://app.paydunya.com/api/v1'
      : 'https://app.paydunya.com/sandbox-api/v1'
    const CHECKOUT_BASE = MODE === 'live'
      ? 'https://app.paydunya.com/checkout/invoice'
      : 'https://app.paydunya.com/sandbox-checkout/invoice'

    // ── 4. Appel PayDunya ────────────────────────────────────────
    const refCommand = `SAMA-${type.toUpperCase()}-${Date.now()}`
    const notifyUrl  = `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`

    const payload = {
      invoice: {
        total_amount: amount,
        description: `Rechargement SamaCampus — ${refCommand}`,
      },
      store: {
        name: 'SamaCampus',
      },
      actions: {
        cancel_url:   `${APP_URL}?status=cancel`,
        return_url:   `${APP_URL}?status=success`,
        callback_url: notifyUrl,
      },
      custom_data: {
        user_id: user.id,
        amount,
        type,
        ref_command: refCommand,
      },
    }

    console.log('Calling PayDunya:', { mode: MODE, amount, refCommand, notifyUrl })

    const pdRes = await fetch(`${API_BASE}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'PAYDUNYA-MASTER-KEY':  MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN':       TOKEN_KEY,
      },
      body: JSON.stringify(payload),
    })

    const rawText = await pdRes.text()
    console.log('PayDunya HTTP status:', pdRes.status)
    console.log('PayDunya response:', rawText)

    let pdData: Record<string, unknown> = {}
    try { pdData = JSON.parse(rawText) } catch {
      return json({ error: `Réponse PayDunya invalide: ${rawText.slice(0, 200)}` }, 502)
    }

    if (pdData.response_code !== '00') {
      const errMsg = String(pdData.response_text ?? pdData.description ?? 'Erreur inconnue PayDunya')
      console.error('PayDunya refused:', errMsg)
      return json({ error: `PayDunya: ${errMsg}` }, 502)
    }

    const token = pdData.token as string | undefined
    if (!token) {
      console.error('PayDunya success but no token:', pdData)
      return json({ error: 'Token de facture manquant dans la réponse PayDunya' }, 502)
    }

    // PayDunya renvoie parfois l'URL de paiement directement dans response_text
    const responseText = typeof pdData.response_text === 'string' ? pdData.response_text : ''
    const redirectUrl = responseText.startsWith('http') ? responseText : `${CHECKOUT_BASE}/${token}`

    return json({ redirectUrl, token })

  } catch (err) {
    console.error('Unhandled error in payment-init:', err)
    return json({ error: `Erreur serveur: ${(err as Error).message}` }, 500)
  }
})
