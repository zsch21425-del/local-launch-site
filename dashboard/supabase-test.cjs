#!/usr/bin/env node
// Test connectivity: does the supabase URL + given key work?
const { createClient } = require("@supabase/supabase-js");

const url = "https://eaxytwaambkhjypzuole.supabase.co";
const publishable = "sb_publishable_X90QYMh75SgBNK9lOMrVRw_SBqcoZSr";

async function test() {
  for (const [label, key] of [["publishable", publishable]]) {
    try {
      const sb = createClient(url, key);
      const { data, error } = await sb.from("profiles").select("count").limit(1);
      console.log(label, "=>", error ? `ERR: ${error.message}` : `OK: ${JSON.stringify(data)}`);
    } catch (e) {
      console.log(label, "=> EXCEPTION:", e.message);
    }
  }
}
test();
