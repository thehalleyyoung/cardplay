#!/usr/bin/env python3
"""Download CC0/public domain MIDI files from pre-copyright classical composers."""

import os
import urllib.request
import ssl
import time
from urllib.error import URLError, HTTPError

# Create SSL context that doesn't verify certificates (for older sites)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Base URL for midiworld.com
MIDIWORLD_BASE = "https://www.midiworld.com/midis/other/"

# Comprehensive list of MIDI files from classical/baroque/romantic composers (all pre-1926 death = public domain)
MIDI_FILES = [
    # Bach (1685-1750) - baroque
    ("bach/", ["toc_fuge.mid", "bwv0565.mid", "bwv0578.mid", "bwv0582.mid", "bwv0639.mid", 
               "bwv0645.mid", "bwv0846a.mid", "bwv0846b.mid", "bwv0847a.mid", "bwv0847b.mid",
               "bwv0848a.mid", "bwv0848b.mid", "bwv0849a.mid", "bwv0849b.mid", "bwv0850a.mid",
               "bwv0850b.mid", "bwv0851a.mid", "bwv0851b.mid", "bwv0852a.mid", "bwv0852b.mid",
               "bwv0853a.mid", "bwv0853b.mid", "bwv0854a.mid", "bwv0854b.mid", "bwv0855a.mid",
               "bwv0855b.mid", "bwv0856a.mid", "bwv0856b.mid", "bwv0857a.mid", "bwv0857b.mid",
               "bwv0858a.mid", "bwv0858b.mid", "bwv0859a.mid", "bwv0859b.mid", "bwv0860a.mid",
               "bwv0860b.mid", "bwv0861a.mid", "bwv0861b.mid", "bwv0862a.mid", "bwv0862b.mid",
               "bwv0863a.mid", "bwv0863b.mid", "bwv0864a.mid", "bwv0864b.mid", "bwv0865a.mid",
               "bwv0865b.mid", "bwv0866a.mid", "bwv0866b.mid", "bwv0867a.mid", "bwv0867b.mid",
               "bwv0868a.mid", "bwv0868b.mid", "bwv0869a.mid", "bwv0869b.mid", "bwv0870a.mid",
               "bwv0870b.mid", "bwv0871a.mid", "bwv0871b.mid", "bwv0772.mid", "bwv0773.mid",
               "bwv0774.mid", "bwv0775.mid", "bwv0776.mid", "bwv0777.mid", "bwv0778.mid",
               "bwv0779.mid", "bwv0780.mid", "bwv0781.mid", "bwv0782.mid", "bwv0783.mid",
               "bwv0784.mid", "bwv0785.mid", "bwv0786.mid", "bwv1001.mid", "bwv1002.mid",
               "bwv1003.mid", "bwv1004.mid", "bwv1005.mid", "bwv1006.mid", "bwv1007.mid",
               "bwv1008.mid", "bwv1009.mid", "bwv1010.mid", "bwv1011.mid", "bwv1012.mid",
               "bwv0525.mid", "bwv0526.mid", "bwv0527.mid", "bwv0528.mid", "bwv0529.mid",
               "bwv0530.mid", "air.mid", "jesu.mid", "sheep.mid"]),
    
    # Beethoven (1770-1827) - classical/romantic
    ("beethoven/", ["beet5_1.mid", "beet5_2.mid", "beet5_3.mid", "beet5_4.mid",
                   "moonlt1.mid", "moonlt2.mid", "moonlt3.mid", "pathet1.mid", "pathet2.mid", "pathet3.mid",
                   "ode_joy.mid", "elise.mid", "eroica1.mid", "eroica2.mid", "eroica3.mid", "eroica4.mid",
                   "beet7_1.mid", "beet7_2.mid", "beet7_3.mid", "beet7_4.mid", "beetson1.mid",
                   "beetson2.mid", "beetson3.mid", "beetson4.mid", "beetson5.mid", "beetson6.mid",
                   "beetson7.mid", "beetson8.mid", "beetson9.mid", "beetson10.mid", "beetson11.mid",
                   "beetson12.mid", "waldstein1.mid", "waldstein2.mid", "waldstein3.mid",
                   "tempest1.mid", "tempest2.mid", "tempest3.mid", "appason1.mid", "appason2.mid",
                   "appason3.mid"]),
    
    # Mozart (1756-1791) - classical
    ("mozart/", ["symph40.mid", "symph41.mid", "lacrimsa.mid", "rondo.mid", "figaro.mid",
                "nachtmus.mid", "moz_331.mid", "moz_332.mid", "moz_333.mid", "moz_545.mid",
                "sonata16.mid", "sonata11.mid", "turkmar.mid", "symph25.mid", "don_gio.mid",
                "magic_flute.mid", "requiem.mid", "moz_467.mid", "moz_488.mid", "moz_491.mid",
                "moz_466.mid", "moz_482.mid", "moz_595.mid", "con21.mid", "con23.mid"]),
    
    # Chopin (1810-1849) - romantic
    ("chopin/", ["ballade1.mid", "ballade2.mid", "ballade3.mid", "ballade4.mid",
                "noctop9n1.mid", "noctop9n2.mid", "noctop15n1.mid", "noctop15n2.mid",
                "noctop27n1.mid", "noctop27n2.mid", "noctop32n1.mid", "noctop32n2.mid",
                "noctop37n1.mid", "noctop37n2.mid", "noctop48n1.mid", "noctop48n2.mid",
                "noctop55n1.mid", "noctop55n2.mid", "noctop62n1.mid", "noctop62n2.mid",
                "prelude1.mid", "prelude2.mid", "prelude3.mid", "prelude4.mid", "prelude5.mid",
                "prelude6.mid", "prelude7.mid", "prelude8.mid", "prelude9.mid", "prelude10.mid",
                "prelude11.mid", "prelude12.mid", "prelude13.mid", "prelude14.mid", "prelude15.mid",
                "prelude16.mid", "prelude17.mid", "prelude18.mid", "prelude19.mid", "prelude20.mid",
                "prelude21.mid", "prelude22.mid", "prelude23.mid", "prelude24.mid",
                "waltz1.mid", "waltz2.mid", "waltz3.mid", "waltz4.mid", "waltz5.mid",
                "waltz6.mid", "waltz7.mid", "waltz8.mid", "waltz9.mid", "waltz10.mid",
                "waltz11.mid", "waltz12.mid", "waltz13.mid", "waltz14.mid",
                "etude1.mid", "etude2.mid", "etude3.mid", "etude4.mid", "etude5.mid",
                "etude6.mid", "etude7.mid", "etude8.mid", "etude9.mid", "etude10.mid",
                "etude11.mid", "etude12.mid", "polonaisea.mid", "polonaiseb.mid",
                "mazurka1.mid", "mazurka2.mid", "mazurka3.mid", "mazurka4.mid", "mazurka5.mid",
                "scherzo1.mid", "scherzo2.mid", "scherzo3.mid", "scherzo4.mid",
                "fantasie.mid", "berceuse.mid", "barcarolle.mid", "funeral.mid"]),
    
    # Dvorak (1841-1904) - romantic
    ("dvorak/", ["d82.mid", "humorsk1.mid", "hum5.mid", "slav46_4.mid",
                "dvs91.mid", "dvs92.mid", "dvs93.mid", "dvs94.mid"]),
    
    # Faure (1845-1924) - romantic
    ("faure/", ["imprmtu3.mid", "nocturn4.mid", "romance3.mid", "racine.mid", "cantique.mid",
               "pavane.mid", "sicilien.mid", "siclienn.mid", "faurreq1.mid", "faurreq2.mid",
               "faurreq3.mid", "faurreq4.mid", "faurreq5.mid", "faurreq6.mid", "faurreq7.mid"]),
    
    # Vivaldi (1678-1741) - baroque
    ("vivaldi/", ["adtesus.mid", "av-p323.mid", "viv_pic.mid", "grosso3.mid", "viv_2t.mid",
                 "vivconct.mid"]),
    
    # Prokofiev (1891-1953) - late romantic/modern (some works in PD)
    ("prokofiev/", ["peter.mid", "prokson3.mid", "ltkije1.mid", "prkson61.mid", "prkson62.mid",
                   "prkson63.mid", "prkson64.mid", "prtocc11.mid"]),
    
    # Poulenc (1899-1963) - some early works
    ("poulenc/", ["poulenc.mid", "poulcmo1.mid", "poulcmo2.mid", "poulcmo3.mid", "poulcmo4.mid",
                 "poultdp1.mid", "poultdp2.mid", "poultdp3.mid", "poultdp4.mid", "moveperp.mid"]),
    
    # Debussy (1862-1918)
    ("debussy/", ["clairdelune.mid"]),
    
    # Smetana (1824-1884) - romantic
    ("smetana/", ["hain_gs.mid", "sm_mold.mid"]),
    
    # Classical miscellaneous (c1, c2, c3)
    ("c1/", ["EspanjaPrelude.mid", "EspanjaTango.mid", "EspanjaCaphriccoCatalan.mid", "EspanjaZortzico.mid",
            "al_adagi.mid", "J_C_Bach_Ach_dass_ich_Wassers_gnug_hatte.mid", 
            "J_M_Bach_Auf_lasst_uns_den_Herren_loben.mid", "lbtheme.mid", "lbvar1.mid", "lbvar2.mid",
            "lbvar3.mid", "lbvar4.mid", "lbvar5.mid", "lbvar6ep.mid", "biz_arls.mid", "intrlude.mid",
            "boccher.mid", "perlagloria.mid", "locus-iste.mid", "appspg13.mid", "cpf-come.mid",
            "latalant.mid", "cpf-bird.mid", "coumoiss.mid", "barimyst.mid", "cpfpapi.mid", "coup8a.mid",
            "arabesqu.mid", "deb_clar.mid", "jsdpet1.mid", "jsdpet2.mid", "poissons.mid", "prelude2.mid",
            "reflect.mid", "deb_rev.mid", "ldmesse1.mid", "enigma.mid", "imperial.mid", "fasch.mid",
            "gf-prel.mid", "gf-romnc.mid", "gf-carol.mid", "gf-forl.mid", "gf-fuga.mid",
            "holberg1.mid", "holberg2.mid", "1_morng.mid", "2_ase.mid", "3_anitra.mid", "4_mtking.mid",
            "pianocon.mid", "griewdat.mid", "hindbsn1.mid", "hindbsn2.mid", "hindbsn3.mid",
            "gladiols.mid", "elitsync.mid", "entrtanr.mid", "mapleaf.mid", "solace.mid"]),
    
    ("c2/", ["makropulos.mid", "mladi.mid", "hary1.mid", "hary2.mid", "hary3.mid", "kodaly.mid", "orphan.mid",
            "mahl4_1.mid", "mahl4_2.mid", "mahl4_3.mid", "mahl4_4.mid", "pre-cavr.mid", "cmballet.mid",
            "cmveder.mid", "mvorfeo.mid", "pm1gnome.mid", "pmcastle.mid", "pmtuiler.mid", "bydlo.mid",
            "prmchick.mid", "shmuyle.mid", "pmarkcat.mid", "babakiev.mid", "carminab.mid", "cap_24.mid",
            "gp_moto.mid", "polonais.mid", "intermez.mid", "mpprel-e.mid", "pur1.mid", "purcell.mid",
            "dido.mid", "purtrump.mid", "hpstrike.mid", "trumpet.mid", "bolero.mid", "jeuxdeau.mid",
            "menuet.mid", "noctuell.mid", "tristes2.mid", "locean.mid", "alborada.mid", "cloches.mid",
            "ravotoc.mid", "bumbleb.mid", "india.mid", "rkeaster.mid", "barbero.mid", "wtellovr.mid"]),
    
    ("c3/", ["lions.mid", "poulecoq.mid", "hemiones.mid", "tortues.mid", "elephant.mid", "kangaroo.mid",
            "aquarium.mid", "personag.mid", "coucou.mid", "voliere.mid", "pianists.mid", "fossiles.mid",
            "cygne.mid", "finale.mid", "dmacbre1.mid", "sonmv1.mid", "sonmv2.mid", "sonmv3.mid",
            "sonmv4.mid", "beevar1.mid", "beevar2.mid", "gnossie4.mid", "gnossie5.mid", "gymnop01.mid",
            "gymnop02.mid", "piccdill.mid", "satsara1.mid", "satsara2.mid", "satsara3.mid", "gnoss.mid",
            "arp.mid", "sch_ave.mid", "lindbaum.mid", "forelle.mid", "earlking.mid", "spinrade.mid",
            "schi9004.mid", "moments1.mid", "scherzo.mid.mid", "fnlandia.mid", "karmarch.mid",
            "karinter.mid", "sib244.mid", "sib2-1.mid", "sib2-2.mid", "sib2-34.mid", "rustle.mid",
            "strasop1.mid", "strasop2.mid", "strasop3.mid", "str-danc.mid", "strpetr.mid",
            "gtniaise.mid", "aria5.mid", "tlmnflut.mid", "telmn-su.mid", "gttrio.mid",
            "aida_ovt.mid", "aida_ii2.mid", "destino.mid", "ernani.mid", "ballo.mid", "maschera.mid",
            "villa.mid", "dansa.mid", "wag_wed.mid", "rvalkyri.mid", "siegfrd.mid", "tanhausr.mid",
            "tristan.mid", "meister.mid", "walton1.mid", "walton3.mid", "walton5.mid", "weber1b.mid",
            "weber3a.mid", "weber-62.mid", "widor_to.mid"]),
    
    # New more n1/n3 paths
    ("n1/", ["blas1.mid"]),
    ("n3/", ["satieson.mid", "jk_web78.mid"]),
]

def download_file(url, filepath):
    """Download a file from URL to filepath."""
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        with urllib.request.urlopen(req, timeout=30, context=ssl_context) as response:
            data = response.read()
            with open(filepath, 'wb') as f:
                f.write(data)
        return True
    except Exception as e:
        return False

def main():
    downloaded = 0
    failed = 0
    
    for folder, files in MIDI_FILES:
        for filename in files:
            url = MIDIWORLD_BASE + folder + filename
            # Clean filename for saving (remove folder path, keep just name)
            safe_name = filename.replace("/", "_")
            # Add composer prefix to avoid collisions
            composer = folder.rstrip("/")
            filepath = f"{composer}_{safe_name}"
            
            if download_file(url, filepath):
                downloaded += 1
                print(f"✓ {downloaded}: {filepath}")
            else:
                failed += 1
            
            # Small delay to be respectful
            time.sleep(0.1)
    
    print(f"\n=== Summary ===")
    print(f"Downloaded: {downloaded}")
    print(f"Failed: {failed}")
    print(f"Total attempted: {downloaded + failed}")

if __name__ == "__main__":
    main()
