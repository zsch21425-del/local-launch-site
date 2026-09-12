import { get } from "@vercel/blob";
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function loadEnv(){const p=path.resolve(__dirname,"..",".env.local");const env={};for(const l of fs.readFileSync(p,"utf8").split("\n")){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim().replace(/^["']|["']$/g,"");}return env;}
const t=loadEnv().BLOB_READ_WRITE_TOKEN;
const res=await get("pipeline.json",{access:"private",token:t});
console.log("get() result keys:", Object.keys(res));
console.log("statusCode:", res.statusCode);
console.log("stream type:", typeof res.stream, res.stream?.constructor?.name);
const r=res.stream.getReader();
let n=0, total=0;
for(;;){const{done,v}=await r.read(); if(done)break; if(v){n++;total+=v.length;}}
console.log("chunks:",n,"bytes:",total);
