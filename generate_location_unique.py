#!/usr/bin/env python3
"""
Generate unique-content sections for the 9 locations/*-sc.html pages (2026-08-16).

Adopts the same fix as the service pages: each location page gets an expanded intro + a
"About {City}" body section drawn from VERIFIED local facts (Wikipedia, 2026-08-16).

INTEGRITY: the existing location pages carry an AggregateRating (5.0 / 5 reviews) and a
street address (243 Oak Branch Dr) in schema that are NOT verified. This script does NOT
add/repeat rating or address data — it only adds a rich "About {city}" section from verified
facts and leaves the existing schema untouched. (Flagged for Zach's review separately.)
"""
import os

BASE = "/mnt/d/LocalLaunch/locations"

CITIES = {
    "greenville":       {"name": "Greenville", "county": "Greenville County", "pop": "70,720 (2020); metro ~997,000, the largest in SC", "corridor": "roughly halfway between Atlanta and Charlotte on I-85, with I-185 and I-385", "facts": "Established in 1797, Greenville anchors the Upstate from the Blue Ridge foothills. Its growth drivers are corporate headquarters, healthcare, and a fast-growing services and tech base.", "extra": "Whether your customers are in downtown, along Woodruff Road, or out by the lake, we set up businesses across the whole Greenville metro so they get found for the searches that matter locally."},
    "simpsonville":     {"name": "Simpsonville", "county": "Greenville County", "pop": "23,354 (2020), estimated near 27,500–28,000 in 2024", "corridor": "the southern end of the 'Golden Strip' with Mauldin and Fountain Inn, minutes off I-385", "facts": "New subdivisions keep going up around Simpsonville, and each brings more homeowners calling on local trades. The town's low-unemployment mix is served by manufacturers like H.B. Fuller, KEMET, Sealed Air, and Milliken.", "extra": "Whether your customers are in the new subdivisions around town or off Grandview or Fairview Road, a Simpsonville-specific page and profile make sure you rank for the searches homeowners actually type."},
    "greer":            {"name": "Greer", "county": "Greenville and Spartanburg counties", "pop": "35,308 (2020), the 14th-largest city in SC", "corridor": "straddling Greenville and Spartanburg counties near GSP International Airport on the I-85 corridor", "facts": "Greer sits at the center of the Upstate's manufacturing boom. BMW and Michelin anchor the industrial base, and the nearby airport keeps homes and work turning over fast.", "extra": "Whether your work takes you to the airport corridor, Wade Hampton, or into Spartanburg County, we build your local content and schema around the full area you serve."},
    "mauldin":          {"name": "Mauldin", "county": "Greenville County", "pop": "24,724 (2020), the 19th-most-populous city in SC", "corridor": "SC-14 in the 'Golden Strip,' between Greenville and Simpsonville", "facts": "Mauldin started as a railroad village on the old Greenville and Laurens line and has grown into a bedroom community where homeowners work in the city and come home to call on local trades. As part of the low-unemployment Golden Strip with Simpsonville and Fountain Inn, it draws steady residential demand.", "extra": "We help Mauldin trades cover the triangle that reaches into Simpsonville and Greenville every day, so no search in the area points anywhere but to you."},
    "easley":           {"name": "Easley", "county": "Pickens County (with a share in Anderson County)", "pop": "22,921 (2020), the anchor of Pickens County", "corridor": "US-123 and SC-153, serving the town and the lake country toward Lake Keowee", "facts": "Easley has run on word of mouth for generations. It hosted the Big League World Series from 2001 to 2016, and the Senior League World Series from 2017 on.", "extra": "Easley crews serve a wide area — from downtown out to the lake communities and the Pickens County line — and we make sure your profile reflects all of it."},
    "travelers-rest":   {"name": "Travelers Rest", "county": "Greenville County", "pop": "7,788 (2020), about 10 miles north of Greenville", "corridor": "Geer Highway (US-25) and SC-276, on the route toward the North Carolina mountains", "facts": "Travelers Rest has gone from a quiet crossroads to one of the Upstate's fastest-growing towns, with Furman University's campus within the city limits and the Swamp Rabbit Trail running through it.", "extra": "From Main Street to the neighborhoods climbing toward the Blue Ridge, we help TR businesses get found by homeowners and commuters on the US-25 corridor."},
    "fountain-inn":     {"name": "Fountain Inn", "county": "Greenville and Laurens counties", "pop": "10,416 (2020), up from 7,799 in 2010", "corridor": "the 'Diamond Tip of the Golden Strip,' along SC-14 and Interstate 385", "facts": "Fountain Inn's historic Main Street and its spot on the 385 interchange make it a bedroom town that keeps pulling in new homeowners and new construction.", "extra": "From historic Main Street to the I-385 interchange, we help Fountain Inn businesses win the searches that come with the town's growth."},
    "five-forks":       {"name": "Five Forks", "county": "Greenville County (CDP)", "pop": "17,737 (2020), a growing, affluent suburb of Greenville", "corridor": "eastern Greenville County, bounded by SC-14 and Roper Mountain Road", "facts": "Five Forks is one of the most affluent corners of the Upstate, where homeowners research before they hire and expect quality work.", "extra": "From the SC-14 corridor to the Jonesville Road area, we make sure Five Forks homeowners researching a service find you before a competitor."},
    "slater-marietta":  {"name": "Slater-Marietta", "county": "Greenville County (CDP)", "pop": "1,873 (2020), a small community along the North Saluda River", "corridor": "US-25, where the Upstate meets the mountains", "facts": "Slater-Marietta is a tight-knit community on the North Saluda River where homeowners know their tradespeople by name — a clean profile and a real website put a business ahead of nearly everyone here.", "extra": "From the North Saluda River up toward the Hendersonville route, we help Slater-Marietta businesses get found by the homeowners and mountain communities they serve."},
}

def inject(fname, c):
    path = os.path.join(BASE, fname)
    txt = open(path, encoding="utf-8").read()
    if "About " + c["name"] in txt:
        return fname + " (skip: already present)"
    block = f"""
<section>
  <div class="wrap">
    <div style="margin-top:8px;background:var(--bg2);border:1px solid var(--line);border-radius:18px;padding:clamp(26px,4vw,38px)">
      <h2>About {c['name']}, SC</h2>
      <p style="color:var(--muted);font-size:1rem;line-height:1.7;margin-bottom:12px">{c['name']} is in {c['county']}, with a population of {c['pop']}. It sits {c['corridor']}.</p>
      <p style="color:var(--muted);font-size:1rem;line-height:1.7;margin-bottom:12px">{c['facts']}</p>
      <p style="color:var(--muted);font-size:1rem;line-height:1.7">{c['extra']}</p>
    </div>
  </div>
</section>
"""
    new = txt.replace("</body>", block + "\n</body>", 1)
    open(path, "w", encoding="utf-8").write(new)
    return fname

def main():
    for ck, c in CITIES.items():
        print(" ", inject(f"{ck}-sc.html", c))

if __name__ == "__main__":
    main()
