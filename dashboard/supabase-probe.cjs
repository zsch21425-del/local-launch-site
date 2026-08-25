#!/usr/bin/env node
// Test what the publishable key can do + detect available roles
const { createClient } = require("@supabase/supabase-js");
const url = "https://eaxytwaambkhjypzuole.supabase.co";
const key = "sb_publishable_X90QYMh75SgBNK9lOMrVRw_SBqcoZSr";

async function main() {
  const sb = createClient(url, key);
  // Try a raw SQL via the REST/SQL proxy — most Supabase projects expose /rest/v1
  const host = sb.restUrl || (url + "/rest/v1");
  console.log("rest host:", host);
  try {
    const r = await fetch(host + "/profiles?select=*&limit=1", {
      headers: { apikey: key, Authorization: "Bearer " + key },
    });
    console.log("GET /profiles:", r.status, (await r.text()).slice(0, 200));
  } catch (e) { console.log("GET err:", e.message); }

  // Check auth health / roles via the auth endpoint
  try {
    const r = await fetch(url + "/auth/v1/health", { headers: { apikey: key } });
    console.log("auth health:", r.status, (await r.text()).slice(0, 100));
  } catch (e) { console.log("health err:", e.message); }
}
main();
