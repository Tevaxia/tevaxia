// =============================================================================
// Supabase Edge Function: check-alerts
// Checks active market alerts and notifies users when conditions are met.
//
// Deployment:
//   supabase functions deploy check-alerts
//
// Cron schedule (set up in Supabase Dashboard > Database > Extensions > pg_cron):
//   select cron.schedule(
//     'check-market-alerts',
//     '0 8 * * 1',  -- every Monday at 08:00 UTC
//     $$
//     select net.http_post(
//       url := 'https://<project-ref>.supabase.co/functions/v1/check-alerts',
//       headers := jsonb_build_object(
//         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
//         'Content-Type', 'application/json'
//       ),
//       body := '{}'::jsonb
//     );
//     $$
//   );
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface MarketAlert {
  id: string;
  user_id: string;
  commune: string;
  target_price_m2: number | null;
  direction: "below" | "above";
  active: boolean;
  last_notified_at: string | null;
}

interface _CommunePrice {
  commune: string;
  price_m2: number;
}

// ---------------------------------------------------------------------------
// Price lookup
// In production, replace this with a real API call or a reference table query.
// For example, you could query a `commune_prices` table or call an external API.
// ---------------------------------------------------------------------------
async function getCurrentPrices(
  supabase: ReturnType<typeof createClient>,
  communes: string[]
): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();

  // Option A: Query a reference table (recommended — create this table separately)
  // const { data } = await supabase
  //   .from("commune_prices")
  //   .select("commune, price_m2")
  //   .in("commune", communes);
  // if (data) {
  //   for (const row of data as CommunePrice[]) {
  //     priceMap.set(row.commune, row.price_m2);
  //   }
  // }

  // Option B: Placeholder — returns empty map (no notifications will fire)
  // Replace with actual implementation when price data source is available.
  console.log(`[check-alerts] Would fetch prices for ${communes.length} communes:`, communes);

  return priceMap;
}

// ---------------------------------------------------------------------------
// Notification sender
// For now, just logs. Replace with Resend / SendGrid / push notification.
// ---------------------------------------------------------------------------
async function sendNotification(
  userId: string,
  commune: string,
  currentPrice: number,
  targetPrice: number,
  direction: "below" | "above"
): Promise<void> {
  const label = direction === "below" ? "en dessous de" : "au-dessus de";
  console.log(
    `[NOTIFICATION] User ${userId}: ` +
    `Le prix au m2 a ${commune} est maintenant ${currentPrice} EUR/m2, ` +
    `${label} votre seuil de ${targetPrice} EUR/m2.`
  );

  // TODO: Integrate email via Resend or SendGrid
  // await fetch("https://api.resend.com/emails", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     from: "alertes@tevaxia.lu",
  //     to: userEmail,
  //     subject: `Alerte prix immobilier - ${commune}`,
  //     html: `<p>Le prix au m&sup2; &agrave; <strong>${commune}</strong> est de <strong>${currentPrice} &euro;/m&sup2;</strong>, ${label} votre seuil de ${targetPrice} &euro;/m&sup2;.</p>`,
  //   }),
  // });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role to bypass RLS — this function reads all users' alerts
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Fetch all active alerts that have a target price set
    const { data: alerts, error: alertsError } = await supabase
      .from("market_alerts")
      .select("*")
      .eq("active", true)
      .not("target_price_m2", "is", null);

    if (alertsError) {
      console.error("[check-alerts] Error fetching alerts:", alertsError);
      return new Response(JSON.stringify({ error: alertsError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!alerts || alerts.length === 0) {
      console.log("[check-alerts] No active alerts found.");
      return new Response(JSON.stringify({ checked: 0, notified: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[check-alerts] Found ${alerts.length} active alert(s).`);

    // 2. Collect unique communes and fetch current prices
    const communes = [...new Set((alerts as MarketAlert[]).map((a) => a.commune))];
    const prices = await getCurrentPrices(supabase, communes);

    // 3. Check each alert against current prices
    let notifiedCount = 0;
    const now = new Date().toISOString();

    for (const alert of alerts as MarketAlert[]) {
      const currentPrice = prices.get(alert.commune);
      if (currentPrice === undefined || alert.target_price_m2 === null) continue;

      const conditionMet =
        alert.direction === "below"
          ? currentPrice <= alert.target_price_m2
          : currentPrice >= alert.target_price_m2;

      if (!conditionMet) continue;

      // Skip if already notified within the last 7 days
      if (alert.last_notified_at) {
        const lastNotified = new Date(alert.last_notified_at).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (lastNotified > sevenDaysAgo) continue;
      }

      // Send notification and update timestamp
      await sendNotification(
        alert.user_id,
        alert.commune,
        currentPrice,
        alert.target_price_m2,
        alert.direction
      );

      await supabase
        .from("market_alerts")
        .update({ last_notified_at: now, updated_at: now })
        .eq("id", alert.id);

      notifiedCount++;
    }

    console.log(`[check-alerts] Done. Checked: ${alerts.length}, Notified: ${notifiedCount}`);

    return new Response(
      JSON.stringify({ checked: alerts.length, notified: notifiedCount }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[check-alerts] Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
