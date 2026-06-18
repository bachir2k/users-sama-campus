import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // ── Auth: vérifier que l'utilisateur est connecté ──────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // ── Lire le body ───────────────────────────────────────
    const { amount, type } = await req.json()

    if (!amount || amount < 100) {
      return new Response(JSON.stringify({ error: 'Montant invalide (min 100 F)' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // ── Clés PayTech ───────────────────────────────────────
    const PAYTECH_API_KEY    = Deno.env.get('PAYTECH_API_KEY')
    const PAYTECH_API_SECRET = Deno.env.get('PAYTECH_API_SECRET')
    const APP_URL            = Deno.env.get('APP_URL') ?? 'https://sama-campus.vercel.app'
    const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!

    if (!PAYTECH_API_KEY || !PAYTECH_API_SECRET) {
      console.error('PAYTECH_API_KEY ou PAYTECH_API_SECRET manquant')
      return new Response(JSON.stringify({ error: 'Configuration paiement incomplète' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // ── Appel API PayTech ──────────────────────────────────
    const commandName = `SAMA-${type?.toUpperCase() ?? 'RECHARGE'}-${Date.now()}`
    const params = new URLSearchParams({
      item_name:    'Rechargement SamaCampus',
      item_price:   String(amount),
      command_name: commandName,
      currency:     'xof',
      notify_url:   `${SUPABASE_URL}/functions/v1/payment-webhook`,
      success_url:  `${APP_URL}?status=success`,
      cancel_url:   `${APP_URL}?status=cancel`,
      custom_field: JSON.stringify({ user_id: user.id, amount, type }),
    })

    const ptRes = await fetch('https://paytech.sn/api/payment/request-payment', {
      method:  'POST',
      headers: {
        'API_KEY':      PAYTECH_API_KEY,
        'API_SECRET':   PAYTECH_API_SECRET,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const ptData = await ptRes.json()

    if (!ptRes.ok || ptData.success !== 1) {
      console.error('PayTech error:', ptData)
      return new Response(JSON.stringify({ error: ptData?.errors?.[0] ?? 'Erreur PayTech' }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ redirectUrl: ptData.redirectUrl }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('payment-init error:', err)
    return new Response(JSON.stringify({ error: 'Erreur serveur inattendue' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
