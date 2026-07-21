// Scheduled keep-alive: pings Supabase daily so the free project never auto-pauses.
export default async () => {
  const r = await fetch(
    "https://ofvanbbujgcqhbiyihgy.supabase.co/rest/v1/listings?select=id&limit=1",
    { headers: {
        apikey: "sb_publishable_JuWg32nAFZN7nMmOGVYSsA_-bYnDiUr",
        Authorization: "Bearer sb_publishable_JuWg32nAFZN7nMmOGVYSsA_-bYnDiUr"
    } }
  );
  return new Response("supabase ping: " + r.status);
};
export const config = { schedule: "@daily" };
