#!/usr/bin/env python3
"""Download additional MIDI files to reach 500+."""

import os
import urllib.request
import ssl
import time

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

MIDIWORLD_BASE = "https://www.midiworld.com/midis/other/"

# Additional files from Bach, Handel, Schumann, Haydn, Liszt
ADDITIONAL_FILES = [
    # More Bach - 3 part inventions (sinfonias)
    ("bach/", ["bwv787.mid", "bwv788.mid", "bwv789.mid", "bwv790.mid", "bwv791.mid",
               "bwv792.mid", "bwv793.mid", "bwv794.mid", "bwv795.mid", "bwv796.mid",
               "bwv797.mid", "bwv798.mid", "bwv799.mid", "bwv800.mid", "bwv801.mid",
               "bwv806.mid", "bwv807.mid", "bwv808.mid", "bwv809.mid", "bwv810.mid",
               "bwv811.mid", "bwv812.mid", "bwv813.mid", "bwv814.mid", "bwv815.mid",
               "bwv816.mid", "bwv817.mid", "bwv825.mid", "bwv826.mid", "bwv827.mid",
               "bwv828.mid", "bwv829.mid", "bwv830.mid", "goldberg.mid", "bwv988.mid"]),
    
    # Handel
    ("handel/", ["overture.mid", "hallujah.mid", "messiah.mid", "largo.mid", "largo1.mid",
                "vadoro.mid", "lascia.mid", "cara.mid", "gp_fwork.mid", "blksmith.mid",
                "sarabnde.mid", "allegro.mid", "bourree.mid"]),
    
    # Schumann
    ("schumann/", ["srhapfa.mid", "ruprecht.mid", "riders.mid", "srop18.mid", "blumnstk.mid",
                  "carnaval.mid", "sr12-1.mid", "sr12-2.mid", "sr12-3.mid", "sr12-4.mid",
                  "sr12-5.mid", "sr12-7.mid", "sr12-8.mid", "scenes.mid", "traumeri.mid"]),
    
    # Haydn
    ("haydn/", ["hdn-gqd.mid", "hdngypsp.mid", "hayln01.mid", "hayln02.mid", "hayln03.mid",
               "hdn104_1.mid", "hdn104_2.mid", "hdn104_3.mid", "hdn104_4.mid"]),
    
    # Liszt
    ("liszt/", ["lszt_ave.mid", "lszt_et3.mid", "heroica.mid", "feux.mid", "mazeppa.mid",
               "liszthr2.mid", "preldo.mid", "liebstrm.mid", "mephisto.mid", "lszt_pe3.mid",
               "lisztson.mid", "lisztanz.mid", "valseoub.mid", "gondola.mid", "tarantel.mid"]),
]

def download_file(url, filepath):
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        with urllib.request.urlopen(req, timeout=30, context=ssl_context) as response:
            data = response.read()
            with open(filepath, 'wb') as f:
                f.write(data)
        return True
    except:
        return False

downloaded = 0
for folder, files in ADDITIONAL_FILES:
    for filename in files:
        url = MIDIWORLD_BASE + folder + filename
        composer = folder.rstrip("/")
        filepath = f"{composer}_{filename}"
        if not os.path.exists(filepath):
            if download_file(url, filepath):
                downloaded += 1
                print(f"+ {downloaded}: {filepath}")
        time.sleep(0.1)

print(f"\nAdditional files downloaded: {downloaded}")
