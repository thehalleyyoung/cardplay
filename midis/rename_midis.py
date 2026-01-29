#!/usr/bin/env python3
"""
Rename MIDI files to {artist}-{broad_style}-{piecename}.mid format
Based on known composer catalogs and style classifications
"""

import os
import re

# Composer style mappings
COMPOSER_STYLES = {
    'bach': 'baroque',
    'handel': 'baroque',
    'vivaldi': 'baroque',
    'beethoven': 'classical',
    'mozart': 'classical',
    'haydn': 'classical',
    'chopin': 'romantic',
    'schumann': 'romantic',
    'dvorak': 'romantic',
    'faure': 'romantic',
    'debussy': 'impressionist',
    'satie': 'impressionist',
    'ravel': 'impressionist',
    'prokofiev': 'modern',
    'poulenc': 'modern',
    'smetana': 'romantic',
    'grieg': 'romantic',
    'liszt': 'romantic',
    'brahms': 'romantic',
    'schubert': 'romantic',
    'mendelssohn': 'romantic',
    'wagner': 'romantic',
    'verdi': 'romantic',
    'puccini': 'romantic',
    'mahler': 'romantic',
    'sibelius': 'romantic',
    'rachmaninoff': 'romantic',
    'tchaikovsky': 'romantic',
    'mussorgsky': 'romantic',
    'rimsky': 'romantic',
    'borodin': 'romantic',
    'elgar': 'romantic',
    'holst': 'modern',
    'vaughan': 'modern',
    'bartok': 'modern',
    'stravinsky': 'modern',
    'kodaly': 'modern',
    'janacek': 'modern',
    'purcell': 'baroque',
    'telemann': 'baroque',
    'couperin': 'baroque',
    'scarlatti': 'baroque',
    'albinoni': 'baroque',
    'corelli': 'baroque',
    'pachelbel': 'baroque',
    'buxtehude': 'baroque',
    'lully': 'baroque',
    'rameau': 'baroque',
    'boccherini': 'classical',
    'paganini': 'romantic',
    'joplin': 'ragtime',
    'hindemith': 'modern',
}

# BWV number to piece name mappings for Bach
BACH_BWV_NAMES = {
    '0525': 'triosonata1', '0526': 'triosonata2', '0527': 'triosonata3',
    '0528': 'triosonata4', '0529': 'triosonata5', '0530': 'triosonata6',
    '0565': 'toccata_dm', '0578': 'fugue_gm', '0582': 'passacaglia',
    '0639': 'chorale_ich_ruf', '0645': 'wachet_auf',
    '0772': 'invention1', '0773': 'invention2', '0774': 'invention3',
    '0775': 'invention4', '0776': 'invention5', '0777': 'invention6',
    '0778': 'invention7', '0779': 'invention8', '0780': 'invention9',
    '0781': 'invention10', '0782': 'invention11', '0783': 'invention12',
    '0784': 'invention13', '0785': 'invention14', '0786': 'invention15',
    '787': 'sinfonia1', '788': 'sinfonia2', '789': 'sinfonia3',
    '790': 'sinfonia4', '791': 'sinfonia5', '792': 'sinfonia6',
    '793': 'sinfonia7', '794': 'sinfonia8', '795': 'sinfonia9',
    '797': 'sinfonia11', '798': 'sinfonia12', '799': 'sinfonia13',
    '800': 'sinfonia14', '801': 'sinfonia15',
    '806': 'english_suite1', '807': 'english_suite2', '808': 'english_suite3',
    '809': 'english_suite4', '810': 'english_suite5', '811': 'english_suite6',
    '812': 'french_suite1', '813': 'french_suite2', '814': 'french_suite3',
    '815': 'french_suite4', '816': 'french_suite5', '817': 'french_suite6',
    '825': 'partita1', '826': 'partita2', '827': 'partita3',
    '828': 'partita4', '829': 'partita5', '830': 'partita6',
    '988': 'goldberg_variations',
    '0846a': 'wtc1_prelude1', '0846b': 'wtc1_fugue1',
    '0847a': 'wtc1_prelude2', '0847b': 'wtc1_fugue2',
    '0848a': 'wtc1_prelude3', '0848b': 'wtc1_fugue3',
    '0849a': 'wtc1_prelude4', '0849b': 'wtc1_fugue4',
    '0850a': 'wtc1_prelude5', '0850b': 'wtc1_fugue5',
    '0851a': 'wtc1_prelude6', '0851b': 'wtc1_fugue6',
    '0852a': 'wtc1_prelude7', '0852b': 'wtc1_fugue7',
    '0853a': 'wtc1_prelude8', '0853b': 'wtc1_fugue8',
    '0854a': 'wtc1_prelude9', '0854b': 'wtc1_fugue9',
    '0855a': 'wtc1_prelude10', '0855b': 'wtc1_fugue10',
    '0856a': 'wtc1_prelude11', '0856b': 'wtc1_fugue11',
    '0857a': 'wtc1_prelude12', '0857b': 'wtc1_fugue12',
    '0858a': 'wtc1_prelude13', '0858b': 'wtc1_fugue13',
    '0859a': 'wtc1_prelude14', '0859b': 'wtc1_fugue14',
    '0860a': 'wtc1_prelude15', '0860b': 'wtc1_fugue15',
    '0861a': 'wtc1_prelude16', '0861b': 'wtc1_fugue16',
    '0862a': 'wtc1_prelude17', '0862b': 'wtc1_fugue17',
    '0863a': 'wtc1_prelude18', '0863b': 'wtc1_fugue18',
    '0864a': 'wtc1_prelude19', '0864b': 'wtc1_fugue19',
    '0865a': 'wtc1_prelude20', '0865b': 'wtc1_fugue20',
    '0866a': 'wtc1_prelude21', '0866b': 'wtc1_fugue21',
    '0867a': 'wtc1_prelude22', '0867b': 'wtc1_fugue22',
    '0868a': 'wtc1_prelude23', '0868b': 'wtc1_fugue23',
    '0869a': 'wtc1_prelude24', '0869b': 'wtc1_fugue24',
    '0870a': 'wtc2_prelude1', '0870b': 'wtc2_fugue1',
    '0871a': 'wtc2_prelude2', '0871b': 'wtc2_fugue2',
    '1001': 'violin_sonata1', '1002': 'violin_partita1',
    '1003': 'violin_sonata2', '1004': 'violin_partita2',
    '1005': 'violin_sonata3', '1006': 'violin_partita3',
    '1007': 'cello_suite1', '1008': 'cello_suite2',
    '1009': 'cello_suite3', '1010': 'cello_suite4',
    '1011': 'cello_suite5', '1012': 'cello_suite6',
}

# Named piece mappings
NAMED_PIECES = {
    'bach_air': 'bach-baroque-air_on_g_string',
    'bach_goldberg': 'bach-baroque-goldberg_variations',
    'bach_jesu': 'bach-baroque-jesu_joy_of_mans_desiring',
    'bach_sheep': 'bach-baroque-sheep_may_safely_graze',
    'bach_toc_fuge': 'bach-baroque-toccata_and_fugue_dm',
    'beethoven_elise': 'beethoven-classical-fur_elise',
    'beethoven_ode_joy': 'beethoven-classical-ode_to_joy',
    'debussy_clairdelune': 'debussy-impressionist-clair_de_lune',
}

# C-prefix file style detection (mixed classical compilations)
C_PREFIX_MAPPINGS = {
    # c1_ files - mixed composers
    'c1_1_morng': 'grieg-romantic-morning_mood',
    'c1_2_ase': 'grieg-romantic-ases_death',
    'c1_3_anitra': 'grieg-romantic-anitras_dance',
    'c1_4_mtking': 'grieg-romantic-in_the_hall_of_mountain_king',
    'c1_EspanjaCaphriccoCatalan': 'albeniz-romantic-espana_capricho_catalan',
    'c1_EspanjaPrelude': 'albeniz-romantic-espana_prelude',
    'c1_EspanjaTango': 'albeniz-romantic-espana_tango',
    'c1_EspanjaZortzico': 'albeniz-romantic-espana_zortzico',
    'c1_J_C_Bach_Ach_dass_ich_Wassers_gnug_hatte': 'jc_bach-baroque-ach_dass_ich_wassers',
    'c1_J_M_Bach_Auf_lasst_uns_den_Herren_loben': 'jm_bach-baroque-auf_lasst_uns_den_herren',
    'c1_al_adagi': 'albinoni-baroque-adagio',
    'c1_appspg13': 'beethoven-classical-spring_sonata',
    'c1_arabesqu': 'debussy-impressionist-arabesque',
    'c1_barimyst': 'balakirev-romantic-islamey',
    'c1_biz_arls': 'bizet-romantic-arlesienne',
    'c1_boccher': 'boccherini-classical-minuet',
    'c1_coumoiss': 'couperin-baroque-les_moissonneurs',
    'c1_coup8a': 'couperin-baroque-ordre_8',
    'c1_cpf-bird': 'cpe_bach-baroque-solfeggietto',
    'c1_cpf-come': 'cpe_bach-baroque-rondo',
    'c1_cpfpapi': 'cpe_bach-baroque-papillons',
    'c1_deb_clar': 'debussy-impressionist-clair_de_lune',
    'c1_deb_rev': 'debussy-impressionist-reverie',
    'c1_elitsync': 'joplin-ragtime-elite_syncopations',
    'c1_enigma': 'elgar-romantic-enigma_variations',
    'c1_entrtanr': 'joplin-ragtime-entertainer',
    'c1_fasch': 'fasch-baroque-concerto',
    'c1_gf-carol': 'gibbons-renaissance-fantasia',
    'c1_gf-forl': 'gibbons-renaissance-forlane',
    'c1_gf-fuga': 'gibbons-renaissance-fuga',
    'c1_gf-prel': 'gibbons-renaissance-prelude',
    'c1_gf-romnc': 'gibbons-renaissance-romance',
    'c1_gladiols': 'joplin-ragtime-gladiolus_rag',
    'c1_griewdat': 'grieg-romantic-wedding_day',
    'c1_hindbsn1': 'hindemith-modern-bassoon_sonata_mv1',
    'c1_hindbsn2': 'hindemith-modern-bassoon_sonata_mv2',
    'c1_hindbsn3': 'hindemith-modern-bassoon_sonata_mv3',
    'c1_holberg1': 'grieg-romantic-holberg_suite_prelude',
    'c1_holberg2': 'grieg-romantic-holberg_suite_sarabande',
    'c1_imperial': 'sousa-march-imperial_march',
    'c1_intrlude': 'brahms-romantic-intermezzo',
    'c1_jsdpet1': 'handel-baroque-suite_petite1',
    'c1_jsdpet2': 'handel-baroque-suite_petite2',
    'c1_latalant': 'couperin-baroque-la_triomphante',
    'c1_lbtheme': 'beethoven-classical-diabelli_theme',
    'c1_lbvar1': 'beethoven-classical-diabelli_var1',
    'c1_lbvar2': 'beethoven-classical-diabelli_var2',
    'c1_lbvar3': 'beethoven-classical-diabelli_var3',
    'c1_lbvar4': 'beethoven-classical-diabelli_var4',
    'c1_lbvar5': 'beethoven-classical-diabelli_var5',
    'c1_lbvar6ep': 'beethoven-classical-diabelli_var6',
    'c1_ldmesse1': 'mozart-classical-mass_c_minor',
    'c1_locus-iste': 'bruckner-romantic-locus_iste',
    'c1_mapleaf': 'joplin-ragtime-maple_leaf_rag',
    'c1_perlagloria': 'pergolesi-baroque-stabat_mater',
    'c1_pianocon': 'grieg-romantic-piano_concerto',
    'c1_poissons': 'debussy-impressionist-poissons_dor',
    'c1_prelude2': 'chopin-romantic-prelude_op28no2',
    'c1_reflect': 'debussy-impressionist-reflets_dans_leau',
    'c1_solace': 'joplin-ragtime-solace',
    # c2_ files  
    'c2_alborada': 'ravel-impressionist-alborada_del_gracioso',
    'c2_babakiev': 'mussorgsky-romantic-baba_yaga',
    'c2_barbero': 'rossini-classical-barber_of_seville',
    'c2_bolero': 'ravel-impressionist-bolero',
    'c2_bumbleb': 'rimsky_korsakov-romantic-flight_of_bumblebee',
    'c2_bydlo': 'mussorgsky-romantic-bydlo',
    'c2_cap_24': 'paganini-romantic-caprice_24',
    'c2_carminab': 'orff-modern-carmina_burana',
    'c2_cloches': 'debussy-impressionist-cloches_a_travers',
    'c2_cmballet': 'stravinsky-modern-firebird_ballet',
    'c2_cmveder': 'stravinsky-modern-firebird_veder',
    'c2_dido': 'purcell-baroque-dido_and_aeneas',
    'c2_gp_moto': 'paganini-romantic-moto_perpetuo',
    'c2_hary1': 'kodaly-modern-hary_janos_suite1',
    'c2_hary2': 'kodaly-modern-hary_janos_suite2',
    'c2_hary3': 'kodaly-modern-hary_janos_suite3',
    'c2_hpstrike': 'holst-modern-mars_bringer_of_war',
    'c2_india': 'rimsky_korsakov-romantic-scheherazade_india',
    'c2_intermez': 'mascagni-romantic-intermezzo',
    'c2_jeuxdeau': 'ravel-impressionist-jeux_deau',
    'c2_kodaly': 'kodaly-modern-dances_of_galanta',
    'c2_locean': 'debussy-impressionist-la_mer',
    'c2_mahl4_1': 'mahler-romantic-symphony4_mv1',
    'c2_mahl4_2': 'mahler-romantic-symphony4_mv2',
    'c2_mahl4_3': 'mahler-romantic-symphony4_mv3',
    'c2_mahl4_4': 'mahler-romantic-symphony4_mv4',
    'c2_makropulos': 'janacek-modern-makropulos_affair',
    'c2_menuet': 'ravel-impressionist-menuet_antique',
    'c2_mladi': 'janacek-modern-mladi',
    'c2_mpprel-e': 'debussy-impressionist-prelude_lapresmidi',
    'c2_mvorfeo': 'monteverdi-baroque-orfeo',
    'c2_noctuell': 'poulenc-modern-nocturnes',
    'c2_orphan': 'mussorgsky-romantic-orphan',
    'c2_pm1gnome': 'mussorgsky-romantic-pictures_gnome',
    'c2_pmarkcat': 'mussorgsky-romantic-pictures_catacombs',
    'c2_pmcastle': 'mussorgsky-romantic-pictures_kiev_gate',
    'c2_pmtuiler': 'mussorgsky-romantic-pictures_tuileries',
    'c2_polonais': 'mussorgsky-romantic-polonaise',
    'c2_pre-cavr': 'mascagni-romantic-cavalleria_rusticana',
    'c2_prmchick': 'mussorgsky-romantic-pictures_chicks',
    'c2_pur1': 'purcell-baroque-abdelazer_suite',
    'c2_purcell': 'purcell-baroque-rondeau',
    'c2_purtrump': 'purcell-baroque-trumpet_voluntary',
    'c2_ravotoc': 'ravel-impressionist-le_tombeau_de_couperin',
    'c2_rkeaster': 'rimsky_korsakov-romantic-russian_easter',
    'c2_shmuyle': 'mussorgsky-romantic-pictures_samuel',
    'c2_tristes2': 'granados-romantic-goyescas',
    'c2_trumpet': 'clarke-baroque-trumpet_voluntary',
    'c2_wtellovr': 'rossini-classical-william_tell_overture',
    # c3_ files
    'c3_aida_ii2': 'verdi-romantic-aida_act2',
    'c3_aida_ovt': 'verdi-romantic-aida_overture',
    'c3_aquarium': 'saint_saens-romantic-aquarium',
    'c3_aria5': 'bach-baroque-goldberg_aria',
    'c3_arp': 'debussy-impressionist-arabesque',
    'c3_ballo': 'verdi-romantic-un_ballo_in_maschera',
    'c3_beevar1': 'beethoven-classical-eroica_variations',
    'c3_beevar2': 'beethoven-classical-diabelli_variations',
    'c3_coucou': 'daquin-baroque-le_coucou',
    'c3_cygne': 'saint_saens-romantic-the_swan',
    'c3_dansa': 'granados-romantic-danza_espanola',
    'c3_destino': 'verdi-romantic-la_forza_del_destino',
    'c3_dmacbre1': 'saint_saens-romantic-danse_macabre',
    'c3_earlking': 'schubert-romantic-erlkonig',
    'c3_elephant': 'saint_saens-romantic-elephant',
    'c3_ernani': 'verdi-romantic-ernani',
    'c3_finale': 'saint_saens-romantic-carnival_finale',
    'c3_fnlandia': 'sibelius-romantic-finlandia',
    'c3_forelle': 'schubert-romantic-die_forelle',
    'c3_fossiles': 'saint_saens-romantic-fossils',
    'c3_gnoss': 'satie-impressionist-gnossienne1',
    'c3_gnossie4': 'satie-impressionist-gnossienne4',
    'c3_gnossie5': 'satie-impressionist-gnossienne5',
    'c3_gtniaise': 'satie-impressionist-gnossiennes',
    'c3_gttrio': 'satie-impressionist-trois_gymnopedies',
    'c3_gymnop01': 'satie-impressionist-gymnopedie1',
    'c3_gymnop02': 'satie-impressionist-gymnopedie2',
    'c3_hemiones': 'saint_saens-romantic-wild_asses',
    'c3_kangaroo': 'saint_saens-romantic-kangaroos',
    'c3_karinter': 'sibelius-romantic-karelia_intermezzo',
    'c3_karmarch': 'sibelius-romantic-karelia_march',
    'c3_lindbaum': 'schubert-romantic-der_lindenbaum',
    'c3_lions': 'saint_saens-romantic-royal_march_lion',
    'c3_maschera': 'verdi-romantic-un_ballo_mask',
    'c3_meister': 'wagner-romantic-meistersinger',
    'c3_moments1': 'schubert-romantic-moment_musical1',
    'c3_personag': 'saint_saens-romantic-personages',
    'c3_pianists': 'saint_saens-romantic-pianists',
    'c3_piccdill': 'satie-impressionist-piccadilly',
    'c3_poulecoq': 'saint_saens-romantic-hens_and_cocks',
    'c3_rustle': 'liszt-romantic-waldesrauschen',
    'c3_rvalkyri': 'wagner-romantic-ride_of_valkyries',
    'c3_satsara1': 'satie-impressionist-sarabande1',
    'c3_satsara2': 'satie-impressionist-sarabande2',
    'c3_satsara3': 'satie-impressionist-sarabande3',
    'c3_sch_ave': 'schubert-romantic-ave_maria',
    'c3_scherzo.mid': 'mendelssohn-romantic-scherzo',
    'c3_schi9004': 'schubert-romantic-symphony9_mv4',
    'c3_sib2-1': 'sibelius-romantic-symphony2_mv1',
    'c3_sib2-2': 'sibelius-romantic-symphony2_mv2',
    'c3_sib2-34': 'sibelius-romantic-symphony2_mv34',
    'c3_sib244': 'sibelius-romantic-valse_triste',
    'c3_siegfrd': 'wagner-romantic-siegfried',
    'c3_sonmv1': 'beethoven-classical-pathetique_mv1',
    'c3_sonmv2': 'beethoven-classical-pathetique_mv2',
    'c3_sonmv3': 'beethoven-classical-pathetique_mv3',
    'c3_sonmv4': 'beethoven-classical-pathetique_mv4',
    'c3_spinrade': 'schubert-romantic-gretchen_am_spinnrade',
    'c3_str-danc': 'dvorak-romantic-slavonic_dance',
    'c3_strasop1': 'strauss-romantic-also_sprach_mv1',
    'c3_strasop2': 'strauss-romantic-also_sprach_mv2',
    'c3_strasop3': 'strauss-romantic-also_sprach_mv3',
    'c3_strpetr': 'stravinsky-modern-petrushka',
    'c3_tanhausr': 'wagner-romantic-tannhauser',
    'c3_telmn-su': 'telemann-baroque-suite',
    'c3_tlmnflut': 'telemann-baroque-flute_fantasia',
    'c3_tortues': 'saint_saens-romantic-tortoises',
    'c3_tristan': 'wagner-romantic-tristan_und_isolde',
    'c3_villa': 'villa_lobos-modern-bachianas',
    'c3_voliere': 'saint_saens-romantic-aviary',
    'c3_wag_wed': 'wagner-romantic-wedding_march',
    'c3_walton1': 'walton-modern-facade_mv1',
    'c3_walton3': 'walton-modern-facade_mv3',
    'c3_walton5': 'walton-modern-facade_mv5',
    'c3_weber-62': 'weber-romantic-invitation_to_dance',
    'c3_weber1b': 'weber-romantic-konzertstuck',
    'c3_weber3a': 'weber-romantic-piano_sonata3',
    'c3_widor_to': 'widor-romantic-toccata',
    # n-prefix files
    'n1_blas1': 'brahms-romantic-liebeslieder_walzer',
    'n3_jk_web78': 'weber-romantic-clarinet_concerto',
    'n3_satieson': 'satie-impressionist-sonatine',
}

# Beethoven piece mappings
BEETHOVEN_PIECES = {
    'appason1': 'appassionata_mv1',
    'appason2': 'appassionata_mv2',
    'appason3': 'appassionata_mv3',
    'beet5_1': 'symphony5_mv1',
    'beet5_2': 'symphony5_mv2',
    'beet5_3': 'symphony5_mv3',
    'beet5_4': 'symphony5_mv4',
    'beet7_1': 'symphony7_mv1',
    'beet7_2': 'symphony7_mv2',
    'beet7_3': 'symphony7_mv3',
    'beet7_4': 'symphony7_mv4',
    'beetson1': 'piano_sonata1',
    'beetson2': 'piano_sonata2',
    'beetson3': 'piano_sonata3',
    'beetson4': 'piano_sonata4',
    'beetson5': 'piano_sonata5',
    'beetson6': 'piano_sonata6',
    'beetson7': 'piano_sonata7',
    'beetson8': 'piano_sonata8',
    'beetson9': 'piano_sonata9',
    'beetson10': 'piano_sonata10',
    'beetson11': 'piano_sonata11',
    'beetson12': 'piano_sonata12',
    'eroica1': 'eroica_mv1',
    'eroica2': 'eroica_mv2',
    'eroica3': 'eroica_mv3',
    'eroica4': 'eroica_mv4',
    'moonlt1': 'moonlight_mv1',
    'moonlt2': 'moonlight_mv2',
    'moonlt3': 'moonlight_mv3',
    'pathet1': 'pathetique_mv1',
    'pathet2': 'pathetique_mv2',
    'pathet3': 'pathetique_mv3',
    'tempest1': 'tempest_mv1',
    'tempest2': 'tempest_mv2',
    'tempest3': 'tempest_mv3',
    'waldstein1': 'waldstein_mv1',
    'waldstein2': 'waldstein_mv2',
    'waldstein3': 'waldstein_mv3',
}

# Mozart pieces
MOZART_PIECES = {
    'con21': 'piano_concerto21',
    'con23': 'piano_concerto23',
    'don_gio': 'don_giovanni',
    'figaro': 'marriage_of_figaro',
    'lacrimsa': 'lacrimosa',
    'magic_flute': 'magic_flute',
    'moz_331': 'piano_sonata11',
    'moz_332': 'piano_sonata12',
    'moz_333': 'piano_sonata13',
    'moz_466': 'piano_concerto20',
    'moz_467': 'piano_concerto21',
    'moz_482': 'piano_concerto22',
    'moz_488': 'piano_concerto23',
    'moz_491': 'piano_concerto24',
    'moz_545': 'piano_sonata16',
    'moz_595': 'piano_concerto27',
    'nachtmus': 'eine_kleine_nachtmusik',
    'requiem': 'requiem',
    'rondo': 'rondo_alla_turca',
    'sonata11': 'piano_sonata11',
    'sonata16': 'piano_sonata16',
    'symph25': 'symphony25',
    'symph40': 'symphony40',
    'symph41': 'symphony41',
    'turkmar': 'turkish_march',
}

# Chopin pieces 
CHOPIN_PIECES = {
    'ballade1': 'ballade1_gm', 'ballade2': 'ballade2_f', 
    'ballade3': 'ballade3_ab', 'ballade4': 'ballade4_fm',
    'barcarolle': 'barcarolle', 'berceuse': 'berceuse',
    'fantasie': 'fantasie_fm', 'funeral': 'funeral_march',
    'polonaisea': 'heroic_polonaise', 'polonaiseb': 'military_polonaise',
    'scherzo1': 'scherzo1', 'scherzo2': 'scherzo2',
    'scherzo3': 'scherzo3', 'scherzo4': 'scherzo4',
}

def get_new_name(filename):
    """Generate new name in {artist}-{style}-{piecename}.mid format"""
    base = filename.replace('.mid', '')
    
    # Check direct mappings first
    if base in NAMED_PIECES:
        return NAMED_PIECES[base] + '.mid'
    if base in C_PREFIX_MAPPINGS:
        return C_PREFIX_MAPPINGS[base] + '.mid'
    
    # Handle Bach BWV numbers
    if base.startswith('bach_bwv'):
        bwv = base.replace('bach_bwv', '')
        if bwv in BACH_BWV_NAMES:
            return f"bach-baroque-{BACH_BWV_NAMES[bwv]}.mid"
        return f"bach-baroque-bwv{bwv}.mid"
    
    # Handle composer_piece format
    for composer in COMPOSER_STYLES:
        if base.startswith(composer + '_'):
            piece = base.replace(composer + '_', '')
            style = COMPOSER_STYLES[composer]
            
            # Check composer-specific mappings
            if composer == 'beethoven' and piece in BEETHOVEN_PIECES:
                piece = BEETHOVEN_PIECES[piece]
            elif composer == 'mozart' and piece in MOZART_PIECES:
                piece = MOZART_PIECES[piece]
            elif composer == 'chopin':
                if piece in CHOPIN_PIECES:
                    piece = CHOPIN_PIECES[piece]
                # Handle numbered pieces (etude1, prelude1, etc.)
                
            return f"{composer}-{style}-{piece}.mid"
    
    # Handle c1_, c2_, c3_ prefix files not in mapping
    if base.startswith('c1_') or base.startswith('c2_') or base.startswith('c3_'):
        return f"various-classical-{base}.mid"
    
    # Default fallback
    return f"unknown-classical-{base}.mid"

def main():
    """Rename all MIDI files in current directory"""
    midi_dir = os.path.dirname(os.path.abspath(__file__))
    renamed_count = 0
    
    for filename in os.listdir(midi_dir):
        if not filename.endswith('.mid'):
            continue
        if filename.startswith(('bach-', 'beethoven-', 'mozart-', 'chopin-', 
                                'handel-', 'vivaldi-', 'debussy-', 'schumann-',
                                'dvorak-', 'faure-', 'prokofiev-', 'poulenc-',
                                'smetana-', 'grieg-', 'satie-', 'ravel-',
                                'various-', 'unknown-')):
            continue  # Already renamed
            
        new_name = get_new_name(filename)
        if new_name != filename:
            old_path = os.path.join(midi_dir, filename)
            new_path = os.path.join(midi_dir, new_name)
            
            # Handle duplicates
            if os.path.exists(new_path):
                base, ext = os.path.splitext(new_name)
                counter = 2
                while os.path.exists(new_path):
                    new_path = os.path.join(midi_dir, f"{base}_v{counter}{ext}")
                    counter += 1
                new_name = os.path.basename(new_path)
            
            print(f"{filename} -> {new_name}")
            os.rename(old_path, new_path)
            renamed_count += 1
    
    print(f"\nRenamed {renamed_count} files")

if __name__ == '__main__':
    main()
