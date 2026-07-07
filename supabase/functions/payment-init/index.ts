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

    // ── 3. Secrets PayTech ────────────────────────────────────
    const API_KEY    = Deno.env.get('PAYTECH_API_KEY')
    const API_SECRET = Deno.env.get('PAYTECH_API_SECRET')
    const APP_URL    = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '')

    if (!API_KEY || !API_SECRET) {
      console.error('Secrets manquants: PAYTECH_API_KEY ou PAYTECH_API_SECRET')
      return json({ error: 'Configuration paiement incomplète' }, 500)
    }
    if (!APP_URL) {
      console.error('Secret manquant: APP_URL')
      return json({ error: 'Configuration APP_URL manquante' }, 500)
    }

    // ── 4. Appel PayTech ──────────────────────────────────────
    const refCommand  = `SAMA-${type.toUpperCase()}-${Date.now()}`
    const notifyUrl   = `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`
    const customField = JSON.stringify({ user_id: user.id, amount, type })

    const params = new URLSearchParams()
    params.set('item_name',   'Rechargement SamaCampus')
    params.set('item_price',  String(amount))
    params.set('ref_command', refCommand)
    params.set('currency',    'xof')
    params.set('notify_url',  notifyUrl)
    params.set('success_url', `${APP_URL}?status=success`)
    params.set('cancel_url',  `${APP_URL}?status=cancel`)
    params.set('custom_field', customField)

    console.log('Calling PayTech:', { amount, refCommand, notifyUrl, success_url: `${APP_URL}?status=success` })

    const ptRes = await fetch('https://paytech.sn/api/payment/request-payment', {
      method: 'POST',
      headers: {
        'API_KEY':      API_KEY,
        'API_SECRET':   API_SECRET,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const rawText = await ptRes.text()
    console.log('PayTech HTTP status:', ptRes.status)
    console.log('PayTech response:', rawText)

    let ptData: Record<string, unknown> = {}
    try { ptData = JSON.parse(rawText) } catch {
      return json({ error: `Réponse PayTech invalide: ${rawText.slice(0, 200)}` }, 502)
    }

    // PayTech retourne success:1 (int) ou success:"1" (string) selon la version
    const isSuccess = ptData.success === 1 || ptData.success === '1'
    if (!isSuccess) {
      const errMsg = Array.isArray(ptData.errors)
        ? (ptData.errors as string[]).join(', ')
        : String(ptData.errors ?? ptData.error ?? 'Erreur inconnue PayTech')
      console.error('PayTech refused:', errMsg)
      return json({ error: `PayTech: ${errMsg}` }, 502)
    }

    const redirectUrl = ptData.redirectUrl ?? ptData.redirect_url
    if (!redirectUrl) {
      console.error('PayTech success but no redirectUrl:', ptData)
      return json({ error: 'URL de redirection manquante dans la réponse PayTech' }, 502)
    }

    return json({ redirectUrl, token: ptData.token })

  } catch (err) {
    console.error('Unhandled error in payment-init:', err)
    return json({ error: `Erreur serveur: ${(err as Error).message}` }, 500)
  }
})
