#!/usr/bin/env python3
"""
Reorganize Synth Asset Database by Instrument Type

This script reads the existing synth-assets.db and creates a new database
organized by instrument category rather than by source/author.
"""

import sqlite3
import json
import re
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

# ============================================================================
# CATEGORY DEFINITIONS
# ============================================================================

CATEGORIES = [
    'bass',
    'lead', 
    'pad',
    'pluck',
    'keys',
    'brass',
    'strings',
    'vocal',
    'fx',
    'drum',
    'arp',
    'ambient',
    'other'
]

SUBCATEGORIES = {
    'bass': ['sub-bass', 'reese', 'growl', 'wobble', 'pluck-bass', 'fm-bass', 'acid-bass', 'generic-bass'],
    'lead': ['mono-lead', 'poly-lead', 'screech', 'acid-lead', 'saw-lead', 'square-lead', 'generic-lead'],
    'pad': ['warm-pad', 'evolving-pad', 'ambient-pad', 'dark-pad', 'bright-pad', 'string-pad', 'generic-pad'],
    'pluck': ['bell', 'mallet', 'pizzicato', 'harpsichord', 'guitar', 'generic-pluck'],
    'keys': ['piano', 'electric-piano', 'organ', 'clav', 'generic-keys'],
    'brass': ['synth-brass', 'horn', 'generic-brass'],
    'strings': ['synth-strings', 'orchestral', 'generic-strings'],
    'vocal': ['choir', 'formant', 'talkbox', 'generic-vocal'],
    'fx': ['riser', 'impact', 'texture', 'noise', 'generic-fx'],
    'drum': ['kick', 'snare', 'hihat', 'perc', 'generic-drum'],
    'arp': ['sequence', 'arp-lead', 'arp-bass', 'generic-arp'],
    'ambient': ['drone', 'soundscape', 'cinematic', 'generic-ambient'],
    'other': ['generic']
}

# Keyword patterns for classification
CATEGORY_KEYWORDS = {
    'bass': [
        r'\bbass\b', r'\bsub\b', r'\breese\b', r'\bgrowl\b', r'\bwobble\b', 
        r'\b808\b', r'\blow\b', r'\bdeep\b', r'\brumble\b', r'\bthump\b',
        r'\bboom\b', r'\bheavy\b', r'\bmassive\b', r'\bfat\b'
    ],
    'lead': [
        r'\blead\b', r'\bsolo\b', r'\bscreech\b', r'\bscream\b', r'\bacid\b',
        r'\bmono\b', r'\bstab\b', r'\bsharp\b', r'\bcutting\b', r'\bbright\b',
        r'\bsearing\b', r'\blaser\b', r'\bsync\b'
    ],
    'pad': [
        r'\bpad\b', r'\batmosphere\b', r'\bambient\b', r'\bwarm\b', r'\blush\b',
        r'\bsoft\b', r'\bevolving\b', r'\bsweep\b', r'\bswell\b', r'\bdrift\b',
        r'\bfloat\b', r'\bcloud\b', r'\bheaven\b', r'\bspace\b'
    ],
    'pluck': [
        r'\bpluck\b', r'\bbell\b', r'\bmallet\b', r'\bmarimba\b', r'\bvibes\b',
        r'\bkalimba\b', r'\bpizz\b', r'\bguitar\b', r'\bharp\b', r'\bpicked\b',
        r'\bpling\b', r'\bplink\b', r'\bchime\b', r'\bceleste\b'
    ],
    'keys': [
        r'\bpiano\b', r'\bkey\b', r'\borgan\b', r'\bclav\b', r'\brhodes\b',
        r'\bwurli\b', r'\bepiano\b', r'\bep\b', r'\btine\b', r'\bhammer\b',
        r'\bkeyboard\b', r'\bacoustic\b'
    ],
    'brass': [
        r'\bbrass\b', r'\bhorn\b', r'\btrumpet\b', r'\btrombone\b', r'\bblare\b',
        r'\bfanfare\b', r'\bsection\b'
    ],
    'strings': [
        r'\bstring\b', r'\bviolin\b', r'\bcello\b', r'\borchestra\b', 
        r'\bensemble\b', r'\bsection\b', r'\blegato\b', r'\barco\b', r'\bbowed\b'
    ],
    'vocal': [
        r'\bvocal\b', r'\bvoice\b', r'\bchoir\b', r'\bvox\b', r'\bformant\b',
        r'\btalk\b', r'\bspeech\b', r'\bsing\b', r'\baah\b', r'\booh\b', r'\bhuman\b'
    ],
    'fx': [
        r'\bfx\b', r'\beffect\b', r'\bsfx\b', r'\bnoise\b', r'\btexture\b',
        r'\briser\b', r'\bimpact\b', r'\bhit\b', r'\bswoosh\b', r'\bwhoosh\b',
        r'\bzap\b', r'\bglitch\b', r'\bstutter\b', r'\btransition\b'
    ],
    'drum': [
        r'\bdrum\b', r'\bkick\b', r'\bsnare\b', r'\bhihat\b', r'\bhi-hat\b',
        r'\bperc\b', r'\btom\b', r'\bclap\b', r'\bcymbal\b', r'\brim\b', r'\bbeat\b'
    ],
    'arp': [
        r'\barp\b', r'\barpegg\b', r'\bsequence\b', r'\bseq\b', r'\bpattern\b',
        r'\bpulse\b', r'\bmotion\b', r'\brhythmic\b', r'\btempo\b'
    ],
    'ambient': [
        r'\bambient\b', r'\bdrone\b', r'\bsoundscape\b', r'\bethereal\b',
        r'\bcinematic\b', r'\bfilm\b', r'\bmovie\b', r'\batmos\b'
    ],
}

SUBCATEGORY_KEYWORDS = {
    'sub-bass': [r'\bsub\b', r'\b808\b', r'\bsine bass\b', r'\bpure\b'],
    'reese': [r'\breese\b', r'\bdnb\b', r'\bneuro\b', r'\bliquid\b'],
    'growl': [r'\bgrowl\b', r'\bdubstep\b', r'\bbrostep\b', r'\bdirty\b', r'\bfilthy\b'],
    'wobble': [r'\bwobble\b', r'\bwub\b', r'\blfo bass\b'],
    'acid-bass': [r'\bacid\b', r'\b303\b', r'\bsquelch\b'],
    'fm-bass': [r'\bfm\b', r'\bdx\b', r'\bdigital bass\b'],
    'saw-lead': [r'\bsaw\b', r'\bsupersaw\b', r'\btrance\b'],
    'square-lead': [r'\bsquare\b', r'\bpulse\b'],
    'warm-pad': [r'\bwarm\b', r'\banalog\b', r'\bvintage\b'],
    'evolving-pad': [r'\bevolv\b', r'\bmorph\b', r'\bmoving\b'],
    'dark-pad': [r'\bdark\b', r'\bominous\b', r'\bsinister\b'],
    'bright-pad': [r'\bbright\b', r'\bairy\b', r'\blight\b'],
    'bell': [r'\bbell\b', r'\btubular\b', r'\bglock\b'],
    'mallet': [r'\bmallet\b', r'\bmarimba\b', r'\bxylo\b', r'\bvibes\b'],
    'electric-piano': [r'\bep\b', r'\brhodes\b', r'\bwurli\b', r'\btine\b'],
    'organ': [r'\borgan\b', r'\bhammond\b', r'\bb3\b', r'\bdrawbar\b'],
    'choir': [r'\bchoir\b', r'\bchorus\b', r'\bvoices\b'],
    'formant': [r'\bformant\b', r'\bvowel\b', r'\btalk\b'],
    'riser': [r'\briser\b', r'\bbuild\b', r'\btension\b'],
    'impact': [r'\bimpact\b', r'\bhit\b', r'\bdrop\b'],
    'drone': [r'\bdrone\b', r'\bsustain\b', r'\bheld\b'],
    'soundscape': [r'\bsoundscape\b', r'\bcinematic\b', r'\bfilm\b'],
}

# ============================================================================
# CLASSIFICATION FUNCTIONS  
# ============================================================================

def classify_preset(name: str, original_category: str, oscillators_json: str, envelopes_json: str) -> Tuple[str, str]:
    """Classify a preset into category and subcategory."""
    search_text = f"{name} {original_category}".lower()
    
    # Score each category
    scores = {cat: 0 for cat in CATEGORIES}
    
    for category, patterns in CATEGORY_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, search_text, re.IGNORECASE):
                scores[category] += 2
    
    # Analyze envelopes for hints
    try:
        envelopes = json.loads(envelopes_json) if envelopes_json else []
        for env in envelopes:
            if env.get('name') in ['amp', 'env_1']:
                attack = env.get('attack', 0)
                decay = env.get('decay', 0)
                sustain = env.get('sustain', 1)
                release = env.get('release', 0)
                
                # Short attack + short decay + low sustain = pluck
                if attack < 0.02 and decay < 0.3 and sustain < 0.3:
                    scores['pluck'] += 2
                # Short attack + high sustain = lead/bass
                if attack < 0.02 and sustain > 0.7:
                    scores['lead'] += 1
                    scores['bass'] += 1
                # Long attack = pad
                if attack > 0.1:
                    scores['pad'] += 2
                # Long release = pad/ambient
                if release > 1:
                    scores['pad'] += 1
                    scores['ambient'] += 1
                # Very short everything = drum/perc
                if attack < 0.01 and decay < 0.2 and sustain < 0.1:
                    scores['drum'] += 2
    except:
        pass
    
    # Analyze oscillators for hints
    try:
        oscillators = json.loads(oscillators_json) if oscillators_json else []
        for osc in oscillators:
            if osc.get('unison_voices', 1) > 4:
                scores['lead'] += 2
            octave = osc.get('tune_semitones', 0) / 12 if osc.get('tune_semitones') else 0
            if octave <= -1:
                scores['bass'] += 2
    except:
        pass
    
    # Find best category
    best_category = max(scores, key=lambda k: scores[k])
    if scores[best_category] == 0:
        best_category = 'other'
    
    # Determine subcategory
    subcategory = f"generic-{best_category}" if best_category != 'other' else 'generic'
    
    for subcat, patterns in SUBCATEGORY_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, search_text, re.IGNORECASE):
                # Check if this subcategory belongs to our category
                for cat, subcats in SUBCATEGORIES.items():
                    if subcat in subcats and cat == best_category:
                        subcategory = subcat
                        break
    
    return best_category, subcategory

def classify_wavetable(name: str, original_category: str) -> str:
    """Classify a wavetable into a category."""
    search_text = f"{name} {original_category}".lower()
    
    # Wavetable categories based on sound type
    wt_categories = {
        'basic': [r'\bsine\b', r'\bsaw\b', r'\bsquare\b', r'\btriangle\b', r'\bpulse\b', r'\bbasic\b'],
        'analog': [r'\banalog\b', r'\bvintage\b', r'\bclassic\b', r'\bwarm\b', r'\bfat\b'],
        'digital': [r'\bdigital\b', r'\bfm\b', r'\bharmonic\b', r'\badditive\b', r'\bspectral\b'],
        'vocal': [r'\bvocal\b', r'\bvoice\b', r'\bformant\b', r'\bchoir\b', r'\bvowel\b'],
        'strings': [r'\bstring\b', r'\bcello\b', r'\bviolin\b', r'\borchestra\b'],
        'keys': [r'\bpiano\b', r'\borgan\b', r'\bbell\b', r'\bmallet\b', r'\bclav\b'],
        'brass': [r'\bbrass\b', r'\bhorn\b', r'\btrumpet\b'],
        'noise': [r'\bnoise\b', r'\btexture\b', r'\bgrainy\b'],
        'evolving': [r'\bevolv\b', r'\bmorph\b', r'\bsweep\b', r'\bmoving\b'],
        'experimental': [r'\bglitch\b', r'\bweird\b', r'\bexperimental\b', r'\bcrazy\b'],
    }
    
    for category, patterns in wt_categories.items():
        for pattern in patterns:
            if re.search(pattern, search_text, re.IGNORECASE):
                return category
    
    return 'general'

# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

def create_organized_database(input_db: str, output_db: str):
    """Create a new database organized by instrument type."""
    
    print(f"Reading from: {input_db}")
    print(f"Writing to: {output_db}")
    
    # Connect to source database
    src_conn = sqlite3.connect(input_db)
    src_conn.row_factory = sqlite3.Row
    
    # Create destination database
    dst_conn = sqlite3.connect(output_db)
    dst_cursor = dst_conn.cursor()
    
    # Create schema for organized database
    dst_cursor.executescript('''
        -- Instrument categories lookup
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            display_order INTEGER
        );
        
        -- Subcategories
        CREATE TABLE IF NOT EXISTS subcategories (
            id TEXT PRIMARY KEY,
            category_id TEXT NOT NULL,
            name TEXT NOT NULL,
            display_order INTEGER,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );
        
        -- Wavetables organized by sound type
        CREATE TABLE IF NOT EXISTS wavetables (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sound_category TEXT,  -- basic, analog, digital, vocal, etc.
            original_source TEXT,  -- surge or vital
            original_category TEXT,
            path TEXT,
            frame_count INTEGER,
            frame_size INTEGER,
            sample_rate INTEGER DEFAULT 44100,
            is_third_party INTEGER DEFAULT 0,
            contributor TEXT,
            data_b64 TEXT,
            sha256 TEXT,
            file_size INTEGER
        );
        
        -- Presets organized by instrument type
        CREATE TABLE IF NOT EXISTS presets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category_id TEXT NOT NULL,
            subcategory_id TEXT,
            original_source TEXT,  -- surge or vital
            original_category TEXT,
            path TEXT,
            author TEXT,
            description TEXT,
            tags TEXT,
            
            -- Unified preset data (JSON)
            oscillators TEXT,
            filters TEXT,
            envelopes TEXT,
            lfos TEXT,
            modulations TEXT,
            effects TEXT,
            
            -- Global settings
            master_volume REAL DEFAULT 1.0,
            polyphony INTEGER DEFAULT 16,
            portamento REAL DEFAULT 0.0,
            
            -- Metadata
            sha256 TEXT,
            file_size INTEGER,
            
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
        );
        
        -- Wavetable references in presets
        CREATE TABLE IF NOT EXISTS preset_wavetables (
            preset_id TEXT,
            wavetable_name TEXT,
            oscillator_index INTEGER,
            PRIMARY KEY (preset_id, oscillator_index),
            FOREIGN KEY (preset_id) REFERENCES presets(id)
        );
        
        -- Tags for filtering
        CREATE TABLE IF NOT EXISTS preset_tags (
            preset_id TEXT,
            tag TEXT,
            PRIMARY KEY (preset_id, tag),
            FOREIGN KEY (preset_id) REFERENCES presets(id)
        );
        
        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_wavetables_category ON wavetables(sound_category);
        CREATE INDEX IF NOT EXISTS idx_presets_category ON presets(category_id);
        CREATE INDEX IF NOT EXISTS idx_presets_subcategory ON presets(subcategory_id);
        CREATE INDEX IF NOT EXISTS idx_preset_tags ON preset_tags(tag);
    ''')
    
    # Insert categories
    for i, cat in enumerate(CATEGORIES):
        dst_cursor.execute(
            'INSERT OR REPLACE INTO categories (id, name, display_order) VALUES (?, ?, ?)',
            (cat, cat.title(), i)
        )
    
    # Insert subcategories
    for cat, subcats in SUBCATEGORIES.items():
        for i, subcat in enumerate(subcats):
            dst_cursor.execute(
                'INSERT OR REPLACE INTO subcategories (id, category_id, name, display_order) VALUES (?, ?, ?, ?)',
                (subcat, cat, subcat.replace('-', ' ').title(), i)
            )
    
    dst_conn.commit()
    
    # Process wavetables
    print("\nProcessing wavetables...")
    src_cursor = src_conn.cursor()
    src_cursor.execute('SELECT * FROM wavetables')
    
    wt_count = 0
    for row in src_cursor:
        name = row['name']
        original_category = row['category'] or ''
        sound_category = classify_wavetable(name, original_category)
        
        dst_cursor.execute('''
            INSERT OR REPLACE INTO wavetables 
            (id, name, sound_category, original_source, original_category, path,
             frame_count, frame_size, sample_rate, is_third_party, contributor,
             data_b64, sha256, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            row['id'], name, sound_category, row['source'], original_category,
            row['path'], row['frame_count'], row['frame_size'], row['sample_rate'],
            row['is_third_party'], row['contributor'], row['data_b64'],
            row['sha256'], row['file_size']
        ))
        wt_count += 1
    
    print(f"  Processed {wt_count} wavetables")
    dst_conn.commit()
    
    # Process presets
    print("\nProcessing presets...")
    src_cursor.execute('SELECT * FROM presets')
    
    preset_count = 0
    category_counts = {cat: 0 for cat in CATEGORIES}
    
    for row in src_cursor:
        name = row['name']
        original_category = row['category'] or ''
        oscillators = row['oscillators'] or '[]'
        envelopes = row['envelopes'] or '[]'
        
        # Classify
        category, subcategory = classify_preset(name, original_category, oscillators, envelopes)
        category_counts[category] += 1
        
        dst_cursor.execute('''
            INSERT OR REPLACE INTO presets
            (id, name, category_id, subcategory_id, original_source, original_category,
             path, author, description, tags, oscillators, filters, envelopes,
             lfos, modulations, effects, master_volume, polyphony, portamento,
             sha256, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            row['id'], name, category, subcategory, row['source'], original_category,
            row['path'], row['author'], row['description'], row['tags'],
            row['oscillators'], row['filters'], row['envelopes'], row['lfos'],
            row['modulations'], row['effects'], row['master_volume'],
            row['polyphony'], row['portamento'], row['sha256'], row['file_size']
        ))
        
        # Extract wavetable references
        try:
            oscs = json.loads(oscillators)
            for i, osc in enumerate(oscs):
                wt_name = osc.get('wavetable_name')
                if wt_name:
                    dst_cursor.execute('''
                        INSERT OR REPLACE INTO preset_wavetables
                        (preset_id, wavetable_name, oscillator_index)
                        VALUES (?, ?, ?)
                    ''', (row['id'], wt_name, i))
        except:
            pass
        
        # Extract tags
        try:
            tags = json.loads(row['tags'] or '[]')
            for tag in tags:
                if tag:
                    dst_cursor.execute('''
                        INSERT OR REPLACE INTO preset_tags (preset_id, tag)
                        VALUES (?, ?)
                    ''', (row['id'], tag.lower()))
        except:
            pass
        
        preset_count += 1
    
    print(f"  Processed {preset_count} presets")
    print("\n  Category distribution:")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        print(f"    {cat}: {count}")
    
    dst_conn.commit()
    
    # Add metadata
    dst_cursor.execute('''
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    
    import datetime
    dst_cursor.execute('INSERT OR REPLACE INTO metadata VALUES (?, ?)',
                       ('last_updated', datetime.datetime.now().isoformat()))
    dst_cursor.execute('INSERT OR REPLACE INTO metadata VALUES (?, ?)',
                       ('total_wavetables', str(wt_count)))
    dst_cursor.execute('INSERT OR REPLACE INTO metadata VALUES (?, ?)',
                       ('total_presets', str(preset_count)))
    dst_cursor.execute('INSERT OR REPLACE INTO metadata VALUES (?, ?)',
                       ('version', '2.0.0'))
    
    dst_conn.commit()
    
    # Close connections
    src_conn.close()
    dst_conn.close()
    
    print(f"\nDone! Created {output_db}")
    print(f"  {wt_count} wavetables")
    print(f"  {preset_count} presets")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Reorganize synth asset database by instrument type')
    parser.add_argument('--input', '-i', default='./assets/synth-assets.db', help='Input database')
    parser.add_argument('--output', '-o', default='./assets/synth-instruments.db', help='Output database')
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    output_path = Path(args.output)
    
    if not input_path.exists():
        print(f"Error: Input database not found: {input_path}")
        return 1
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    create_organized_database(str(input_path), str(output_path))
    return 0

if __name__ == '__main__':
    exit(main())
