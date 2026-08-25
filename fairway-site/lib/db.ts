import { Pool } from 'pg';

// Connection to the dedicated 'fairway' Neon Postgres database.
// The URL must include /fairway (not /neondb). Set FAIRWAY_DATABASE_URL in env.
const connString = process.env.FAIRWAY_DATABASE_URL || '';

export const pool = connString
  ? new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false }, max: 3 })
  : null;

export async function getContent(): Promise<Record<string, any>> {
  // Content now lives in Directus CMS (https://cms.upstatewebsites.com).
  // Read via Directus REST with a service/static token from env.
  const directusUrl = process.env.DIRECTUS_URL || 'https://cms.upstatewebsites.com';
  const directusToken = process.env.DIRECTUS_TOKEN || '';
  try {
    const headers: Record<string,string> = {};
    if (directusToken) headers['Authorization'] = `Bearer ${directusToken}`;
    // fetch all site_content items (hero, about, footer, etc.) + locations
    const [sc, loc] = await Promise.all([
      fetch(`${directusUrl}/items/site_content?limit=-1`, { headers, cache: 'no-store' }).then(r=>r.ok?r.json():{data:[]}).catch(()=>({data:[]})),
      fetch(`${directusUrl}/items/locations?limit=-1&sort=sort`, { headers, cache: 'no-store' }).then(r=>r.ok?r.json():{data:[]}).catch(()=>({data:[]})),
    ]);
    const out: Record<string,any> = { ...defaultContent };
    for (const item of (sc.data || [])) out[item.id] = item.value ?? item;
    if ((loc.data||[]).length) out.locations = loc.data.map((l:any)=>({slug:l.id, brand:l.brand, name:l.name, addr:l.addr, url:l.url, image:l.image}));
    return out;
  } catch (e) {
    // fallback to defaults if Directus is unreachable (site stays up)
    return defaultContent;
  }
}

export async function saveContent(id: string, value: any) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO site_content (id, value, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [id, JSON.stringify(value)]
  );
}

export async function recordPageView(path: string) {
  if (!pool) return;
  await pool.query("INSERT INTO page_views (path, viewed_at) VALUES ($1, now())", [path]).catch(()=>{});
}

export async function recordOutboundClick(slug: string, url: string) {
  if (!pool) return;
  await pool.query("INSERT INTO outbound_clicks (slug, url, event_at) VALUES ($1, $2, now())", [slug, url]).catch(()=>{});
}

export async function getAnalytics() {
  if (!pool) return { pageViews: 0, clicks: [] };
  const pv = await pool.query("SELECT count(*)::int AS n FROM page_views");
  const cl = await pool.query(
    "SELECT slug, count(*)::int AS n FROM outbound_clicks GROUP BY slug ORDER BY n DESC"
  );
  const daily = await pool.query(
    "SELECT to_char(viewed_at,'YYYY-MM-DD') AS d, count(*)::int AS n FROM page_views GROUP BY d ORDER BY d"
  );
  return { pageViews: pv.rows[0].n, clicks: cl.rows, daily: daily.rows };
}

// Default content = the Fairway group (fallback if DB empty / offline)
export const defaultContent = {
  hero: {
    tagline: "FAIRWAY The Motor Mile · Greenville, South Carolina",
    headline: "Family-Owned & Locally-Operated Since 1966",
    sub: "Welcome to Fairway Automotive Group — six dealerships and service centers in the heart of the Upstate, ready to help you find your adventure.",
    heroImage: "/assets/hero-dealership.jpg",
    phone: "864-242-5060",
  },
  about: [
    "From new-and-used vehicles to expert service and collision repair, Fairway has served the Greenville community for three generations.",
    "If you would like to speak to a team member, please call 864-242-5060 or scroll down to learn more."
  ],
  locations: [
    { slug: "subaru", brand: "SUBARU", name: "Fairway Subaru", addr: "2209 Laurens Road, Greenville SC", url: "https://www.fairwaysubarusc.com", image: "/assets/dealership-1.jpg" },
    { slug: "ford", brand: "FORD", name: "Fairway Ford", addr: "2323 Laurens Road, Greenville SC", url: "https://www.fairwayford.com", image: "/assets/dealership-2.jpg" },
    { slug: "lincoln", brand: "LINCOLN", name: "Fairway Lincoln", addr: "2323 Laurens Road, Greenville SC", url: "https://www.fairwaylincoln.com", image: "/assets/showroom-service.jpg" },
    { slug: "bodyshop", brand: "BODY SHOP", name: "Fairway Body Shop", addr: "723 Keith Drive, Greenville SC", url: "https://www.fairwayford.com/bodyshop/body-shop.htm", image: "/assets/service-logo.jpg" },
    { slug: "commercial", brand: "COMMERCIAL", name: "Fairway Commercial Center", addr: "351 Halton Road, Greenville SC", url: "https://fairwayfordpro.com/p/commercial-vehicle-service-and-parts-in-greenville-sc", image: "/assets/lot-night.jpg" },
    { slug: "used", brand: "USED", name: "Fairway Ford Commercial · Used", addr: "1 Haywood Road, Greenville SC", url: "https://fairwayfordpro.com/?filters=Chassis.Condition:All", image: "/assets/interior-showroom.jpg" },
  ],
  footer: { copyright: "©2026 Fairway", phone: "864-242-5060", city: "Greenville, SC" },
};
