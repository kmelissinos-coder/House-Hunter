// Scheduled keep-alive: pings Supabase daily so the free project never auto-pauses.
// 5 Oct 2026: calls hh_ping() — the publishable key can no longer read the listings.
export default async () => {
  const r = await fetch(
    "https://ofvanbbujgcqhbiyihgy.supabase.co/rest/v1/rpc/hh_ping",
    { method: "POST", headers: {
        "Content-Type": "application/json",
        apikey: "sb_publishable_JuWg32nAFZN7nMmOGVYSsA_-bYnDiUr",
        Authorization: "Bearer sb_publishable_JuWg32nAFZN7nMmOGVYSsA_-bYnDiUr"
    } }
  );
  return new Response("supabase ping: " + r.status);
};
export const config = { schedule: "@daily" };
