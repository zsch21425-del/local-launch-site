#!/usr/bin/env python3
"""Generate the LLOS dashboard HD slideshow image set (tech / architecture /
landscapes) via GPT Image 2.5 (Astra codex backend), saved to public/art/slides/."""
import subprocess, sys, time, os

SLIDES = [
    ("01-tech-circuit.jpg", "Abstract macro photograph of a glowing blue and violet circuit board, shallow depth of field, futuristic technology, cinematic lighting, photorealistic, wide 16:9 aspect ratio"),
    ("02-skyscraper.jpg", "Looking up at a modern glass skyscraper from street level, dramatic perspective, blue sky reflections, architectural photography, photorealistic, wide 16:9 aspect ratio"),
    ("03-mountains.jpg", "Epic alpine mountain range at golden hour, dramatic clouds and god rays, photorealistic landscape, wide 16:9 aspect ratio"),
    ("04-data-center.jpg", "Futuristic data center corridor with rows of server racks and blue LED lights, cinematic, photorealistic, wide 16:9 aspect ratio"),
    ("05-ocean.jpg", "Aerial view of turquoise ocean waves crashing on a dark sand beach, photorealistic nature photography, wide 16:9 aspect ratio"),
    ("06-architecture.jpg", "Minimalist modern architecture interior with sweeping curves and soft natural light, concrete and glass, photorealistic, wide 16:9 aspect ratio"),
    ("07-nebula.jpg", "Deep space nebula with vibrant teal and magenta gas clouds and stars, astrophotography, photorealistic, wide 16:9 aspect ratio"),
    ("08-forest.jpg", "Sunlight rays streaming through a misty pine forest at dawn, atmospheric, photorealistic landscape, wide 16:9 aspect ratio"),
]

SCRIPT = "/mnt/d/LocalLaunch/dashboard/scripts/astra_image.py"
OUT = "/mnt/d/LocalLaunch/dashboard/public/art/slides"

def main():
    for name, prompt in SLIDES:
        dest = os.path.join(OUT, name)
        if os.path.exists(dest) and os.path.getsize(dest) > 100000:
            print("SKIP (exists)", name)
            continue
        print("GENERATING", name, "...")
        t = time.time()
        r = subprocess.run(["python3", SCRIPT, prompt, dest],
                           capture_output=True, text=True, timeout=600)
        print("  ", r.stdout.strip()[-80:], f"({time.time()-t:.0f}s)")

if __name__ == "__main__":
    main()
