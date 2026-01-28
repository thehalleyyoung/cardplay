#!/usr/bin/env python3
"""
Synth Asset Parser - Local Version

Parses wavetables and presets from local Surge submodule and creates SQLite database.

Usage:
    python parse-synth-assets.py [--surge-path ./external/surge] [--db-path ./synth-assets.db]
"""

import os
import sys
import json
import gzip
import struct
import sqlite3
import hashlib
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import base64
import re
import xml.etree.ElementTree as ET
import array
import datetime

# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class WavetableData:
    """Parsed wavetable data."""
    id: str
    name: str
    source: str
    category: str
    path: str
    frame_count: int
    frame_size: int
    sample_rate: int = 44100
    bit_depth: int = 32
    is_third_party: bool = False
    contributor: Optional[str] = None
    data_b64: Optional[str] = None
    sha256: Optional[str] = None
    file_size: int = 0
    
@dataclass
class OscillatorData:
    """Oscillator settings from a preset."""
    index: int
    osc_type: int
    osc_type_name: str
    wavetable_name: Optional[str] = None
    wavetable_position: float = 0.0
    level: float = 1.0
    pan: float = 0.0
    tune_semitones: float = 0.0
    tune_cents: float = 0.0
    unison_voices: int = 1
    unison_detune: float = 0.0
    unison_blend: float = 0.0
    phase: float = 0.0
    phase_randomize: float = 0.0
    distortion: float = 0.0
    fm_depth: float = 0.0
    extra_params: str = "{}"

@dataclass
class FilterData:
    """Filter settings from a preset."""
    index: int
    filter_type: int
    filter_type_name: str
    cutoff: float = 1000.0
    resonance: float = 0.0
    drive: float = 0.0
    mix: float = 1.0
    keytrack: float = 0.0
    env_depth: float = 0.0
    extra_params: str = "{}"

@dataclass
class EnvelopeData:
    """Envelope settings."""
    name: str
    attack: float = 0.01
    decay: float = 0.1
    sustain: float = 0.7
    release: float = 0.3
    attack_curve: float = 0.0
    decay_curve: float = 0.0
    release_curve: float = 0.0

@dataclass
class LFOData:
    """LFO settings."""
    index: int
    waveform: int
    waveform_name: str
    rate: float = 1.0
    sync: bool = False
    sync_rate: str = "1/4"
    depth: float = 1.0
    phase: float = 0.0
    delay: float = 0.0
    fade_in: float = 0.0

@dataclass
class ModulationData:
    """Modulation routing."""
    source: str
    destination: str
    amount: float
    bipolar: bool = True

@dataclass 
class EffectData:
    """Effect settings."""
    effect_type: str
    enabled: bool = True
    mix: float = 1.0
    params: str = "{}"

@dataclass
class PresetData:
    """Complete preset data."""
    id: str
    name: str
    source: str
    category: str
    path: str
    author: Optional[str] = None
    description: Optional[str] = None
    tags: str = "[]"
    oscillators: str = "[]"
    filters: str = "[]"
    envelopes: str = "[]"
    lfos: str = "[]"
    modulations: str = "[]"
    effects: str = "[]"
    master_volume: float = 1.0
    master_tune: float = 0.0
    polyphony: int = 16
    portamento: float = 0.0
    raw_data: Optional[str] = None
    sha256: Optional[str] = None
    file_size: int = 0

# ============================================================================
# SURGE WAVETABLE PARSING
# ============================================================================

def parse_surge_wt(file_path: Path) -> Optional[WavetableData]:
    """Parse a Surge .wt wavetable file."""
    try:
        data = file_path.read_bytes()
        if len(data) < 12:
            return None
        
        # Surge WT magic: 'vaws' (0x77617673) in little-endian
        magic = struct.unpack('<I', data[0:4])[0]
        if magic != 0x77617673:
            return None
        
        frame_size = struct.unpack('<I', data[4:8])[0]
        frame_count = struct.unpack('<I', data[8:12])[0]
        
        flags = 0
        header_size = 12
        if len(data) >= 16:
            flags = struct.unpack('<I', data[12:16])[0]
            header_size = 16
        
        is_float = (flags & 0x04) != 0
        samples_per_table = frame_size * frame_count
        
        if is_float:
            expected_size = header_size + samples_per_table * 4
            if len(data) < expected_size:
                return None
            samples = struct.unpack(f'<{samples_per_table}f', 
                                   data[header_size:header_size + samples_per_table * 4])
        else:
            expected_size = header_size + samples_per_table * 2
            if len(data) < expected_size:
                return None
            int_samples = struct.unpack(f'<{samples_per_table}h', 
                                       data[header_size:header_size + samples_per_table * 2])
            samples = [s / 32768.0 for s in int_samples]
        
        # Convert to float32 and base64 encode
        float_array = array.array('f', samples)
        data_b64 = base64.b64encode(float_array.tobytes()).decode('ascii')
        
        # Determine category from path
        rel_path = str(file_path)
        is_third_party = 'wavetables_3rdparty' in rel_path
        
        if is_third_party:
            parts = rel_path.split('wavetables_3rdparty/')[-1].split('/')
            contributor = parts[0] if len(parts) > 1 else None
            category = '/'.join(parts[:-1]) if len(parts) > 1 else 'Uncategorized'
        else:
            parts = rel_path.split('wavetables/')[-1].split('/')
            contributor = None
            category = '/'.join(parts[:-1]) if len(parts) > 1 else 'root'
        
        name = file_path.stem
        
        return WavetableData(
            id=hashlib.sha256(str(file_path).encode()).hexdigest()[:16],
            name=name,
            source='surge',
            category=category,
            path=str(file_path),
            frame_count=frame_count,
            frame_size=frame_size,
            bit_depth=32 if is_float else 16,
            is_third_party=is_third_party,
            contributor=contributor,
            data_b64=data_b64,
            sha256=hashlib.sha256(data).hexdigest(),
            file_size=len(data)
        )
        
    except Exception as e:
        print(f"  Error parsing {file_path}: {e}")
        return None

def parse_surge_wav(file_path: Path) -> Optional[WavetableData]:
    """Parse a WAV file as wavetable."""
    try:
        data = file_path.read_bytes()
        if len(data) < 44:
            return None
        
        # Check RIFF header
        if data[0:4] != b'RIFF' or data[8:12] != b'WAVE':
            return None
        
        # Parse WAV chunks
        pos = 12
        fmt_data = None
        audio_data = None
        
        while pos < len(data) - 8:
            chunk_id = data[pos:pos+4]
            chunk_size = struct.unpack('<I', data[pos+4:pos+8])[0]
            
            if chunk_id == b'fmt ':
                fmt_data = data[pos+8:pos+8+chunk_size]
            elif chunk_id == b'data':
                audio_data = data[pos+8:pos+8+chunk_size]
                break
                
            pos += 8 + chunk_size
            if chunk_size % 2:
                pos += 1
        
        if not fmt_data or not audio_data:
            return None
        
        audio_format = struct.unpack('<H', fmt_data[0:2])[0]
        num_channels = struct.unpack('<H', fmt_data[2:4])[0]
        sample_rate = struct.unpack('<I', fmt_data[4:8])[0]
        bits_per_sample = struct.unpack('<H', fmt_data[14:16])[0]
        
        if audio_format not in [1, 3]:  # PCM or IEEE float
            return None
        
        bytes_per_sample = bits_per_sample // 8
        total_samples = len(audio_data) // (bytes_per_sample * num_channels)
        
        samples = []
        for i in range(total_samples):
            offset = i * bytes_per_sample * num_channels
            if bits_per_sample == 16:
                val = struct.unpack('<h', audio_data[offset:offset+2])[0]
                samples.append(val / 32768.0)
            elif bits_per_sample == 24:
                b = audio_data[offset:offset+3]
                val = struct.unpack('<i', b + (b'\x00' if b[2] < 128 else b'\xff'))[0]
                samples.append(val / 8388608.0)
            elif bits_per_sample == 32:
                if audio_format == 3:
                    val = struct.unpack('<f', audio_data[offset:offset+4])[0]
                else:
                    val = struct.unpack('<i', audio_data[offset:offset+4])[0] / 2147483648.0
                samples.append(val)
        
        # Detect frame size
        frame_size = 2048  # Default Serum-style
        common_sizes = [256, 512, 1024, 2048, 4096]
        for size in common_sizes:
            if total_samples % size == 0:
                frame_size = size
                break
        
        frame_count = max(1, total_samples // frame_size)
        samples = samples[:frame_count * frame_size]
        
        float_array = array.array('f', samples)
        data_b64 = base64.b64encode(float_array.tobytes()).decode('ascii')
        
        # Determine category from path
        rel_path = str(file_path)
        is_third_party = 'wavetables_3rdparty' in rel_path
        
        if is_third_party:
            parts = rel_path.split('wavetables_3rdparty/')[-1].split('/')
            contributor = parts[0] if len(parts) > 1 else None
            category = '/'.join(parts[:-1]) if len(parts) > 1 else 'Uncategorized'
        else:
            parts = rel_path.split('wavetables/')[-1].split('/')
            contributor = None
            category = '/'.join(parts[:-1]) if len(parts) > 1 else 'root'
        
        name = file_path.stem
        
        return WavetableData(
            id=hashlib.sha256(str(file_path).encode()).hexdigest()[:16],
            name=name,
            source='surge',
            category=category,
            path=str(file_path),
            frame_count=frame_count,
            frame_size=frame_size,
            sample_rate=sample_rate,
            bit_depth=bits_per_sample,
            is_third_party=is_third_party,
            contributor=contributor,
            data_b64=data_b64,
            sha256=hashlib.sha256(data).hexdigest(),
            file_size=len(data)
        )
        
    except Exception as e:
        print(f"  Error parsing WAV {file_path}: {e}")
        return None

# ============================================================================
# SURGE PRESET PARSING
# ============================================================================

def parse_surge_fxp(file_path: Path) -> Optional[PresetData]:
    """Parse a Surge FXP preset file."""
    try:
        data = file_path.read_bytes()
        if len(data) < 60:
            return None
        
        if data[0:4] != b'CcnK':
            return None
        
        fx_magic = data[8:12]
        if fx_magic not in [b'FxCk', b'FPCh']:
            return None
        
        # Get preset name from header
        preset_name_bytes = data[28:56]
        preset_name = preset_name_bytes.split(b'\x00')[0].decode('utf-8', errors='replace')
        
        if fx_magic == b'FPCh':
            chunk_size = struct.unpack('>I', data[56:60])[0]
            chunk_data = data[60:60+chunk_size]
            
            # Find XML in chunk
            xml_start = -1
            for i in range(min(len(chunk_data), 1000)):
                if chunk_data[i:i+5] == b'<?xml' or chunk_data[i:i+6] == b'<patch':
                    xml_start = i
                    break
            
            if xml_start >= 0:
                xml_end = len(chunk_data)
                for i in range(len(chunk_data) - 1, xml_start, -1):
                    if chunk_data[i] == ord('>'):
                        xml_end = i + 1
                        break
                
                xml_str = chunk_data[xml_start:xml_end].decode('utf-8', errors='replace')
                return parse_surge_preset_xml(xml_str, str(file_path), preset_name)
        
        return None
        
    except Exception as e:
        print(f"  Error parsing FXP {file_path}: {e}")
        return None

def parse_surge_preset_xml(xml_str: str, path: str, preset_name: str) -> Optional[PresetData]:
    """Parse Surge preset XML content."""
    try:
        xml_str = xml_str.strip()
        if not xml_str.startswith('<?xml') and not xml_str.startswith('<patch'):
            return None
        
        root = ET.fromstring(xml_str)
        
        name = root.get('name', preset_name)
        category = root.get('category', 'Uncategorized')
        author = root.get('author')
        comment = root.get('comment')
        
        oscillators = []
        filters = []
        envelopes = []
        lfos = []
        modulations = []
        effects = []
        
        # Parse scenes
        for scene in root.findall('.//scene'):
            # Parse oscillators
            for i, osc in enumerate(scene.findall('.//osc')):
                osc_type = int(osc.get('type', 0))
                osc_data = OscillatorData(
                    index=i,
                    osc_type=osc_type,
                    osc_type_name=get_surge_osc_type_name(osc_type),
                    wavetable_name=osc.get('wavetable'),
                    wavetable_position=float(osc.get('morph', 0)),
                    level=float(osc.get('level', 1)),
                    pan=float(osc.get('pan', 0)),
                    tune_semitones=float(osc.get('pitch', 0)),
                    tune_cents=float(osc.get('detune', 0)),
                    unison_voices=int(osc.get('unison_voices', 1)),
                    unison_detune=float(osc.get('unison_detune', 0)),
                )
                oscillators.append(asdict(osc_data))
            
            # Parse filters
            for i, filt in enumerate(scene.findall('.//filter')):
                filt_type = int(filt.get('type', 0))
                filt_data = FilterData(
                    index=i,
                    filter_type=filt_type,
                    filter_type_name=get_surge_filter_type_name(filt_type),
                    cutoff=float(filt.get('cutoff', 1000)),
                    resonance=float(filt.get('resonance', 0)),
                    drive=float(filt.get('drive', 0)),
                    keytrack=float(filt.get('keytrack', 0)),
                )
                filters.append(asdict(filt_data))
            
            # Parse envelopes
            for env in scene.findall('.//envelope'):
                env_name = env.get('id', 'amp')
                env_data = EnvelopeData(
                    name=env_name,
                    attack=float(env.get('attack', 0.01)),
                    decay=float(env.get('decay', 0.1)),
                    sustain=float(env.get('sustain', 0.7)),
                    release=float(env.get('release', 0.3)),
                )
                envelopes.append(asdict(env_data))
            
            # Parse LFOs
            for i, lfo in enumerate(scene.findall('.//lfo')):
                shape = int(lfo.get('shape', 0))
                lfo_data = LFOData(
                    index=i,
                    waveform=shape,
                    waveform_name=get_surge_lfo_shape_name(shape),
                    rate=float(lfo.get('rate', 1)),
                    sync=lfo.get('temposync', '0') == '1',
                    depth=float(lfo.get('magnitude', 1)),
                )
                lfos.append(asdict(lfo_data))
        
        # Parse modulation matrix
        for mod in root.findall('.//modrouting'):
            mod_data = ModulationData(
                source=mod.get('source', ''),
                destination=mod.get('destination', ''),
                amount=float(mod.get('depth', 0)),
            )
            modulations.append(asdict(mod_data))
        
        # Parse effects
        for fx in root.findall('.//fx'):
            fx_type = fx.get('type', 'off')
            fx_data = EffectData(
                effect_type=fx_type,
                enabled=fx.get('enabled', '1') == '1',
                mix=float(fx.get('mix', 1)),
            )
            effects.append(asdict(fx_data))
        
        # Determine category from path
        rel_path = path
        is_third_party = 'patches_3rdparty' in rel_path
        
        if is_third_party:
            parts = rel_path.split('patches_3rdparty/')[-1].split('/')
            if len(parts) > 1:
                category = parts[0]  # First part after patches_3rdparty
        else:
            parts = rel_path.split('patches_factory/')[-1].split('/')
            if len(parts) > 1:
                category = parts[0]  # First part after patches_factory
        
        return PresetData(
            id=hashlib.sha256(path.encode()).hexdigest()[:16],
            name=name,
            source='surge',
            category=category,
            path=path,
            author=author,
            description=comment,
            oscillators=json.dumps(oscillators),
            filters=json.dumps(filters),
            envelopes=json.dumps(envelopes),
            lfos=json.dumps(lfos),
            modulations=json.dumps(modulations),
            effects=json.dumps(effects),
            raw_data=xml_str[:10000],
            sha256=hashlib.sha256(xml_str.encode()).hexdigest(),
            file_size=len(xml_str)
        )
        
    except ET.ParseError as e:
        return None

def get_surge_osc_type_name(osc_type: int) -> str:
    names = {
        0: 'Classic', 1: 'Sine', 2: 'Wavetable', 3: 'SH Noise',
        4: 'Audio Input', 5: 'FM3', 6: 'FM2', 7: 'Window',
        8: 'Modern', 9: 'String', 10: 'Twist', 11: 'Alias',
        12: 'Phase Mod'
    }
    return names.get(osc_type, f'Unknown ({osc_type})')

def get_surge_filter_type_name(filt_type: int) -> str:
    names = {
        0: 'Off', 1: 'LP 12dB', 2: 'LP 24dB', 3: 'LP Legacy',
        4: 'HP 12dB', 5: 'HP 24dB', 6: 'BP 12dB', 7: 'BP 24dB',
        8: 'Notch 12dB', 9: 'Notch 24dB', 10: 'Comb+', 11: 'Comb-',
        12: 'Sample&Hold', 13: 'Vintage Ladder', 14: 'OB-Xd 12dB',
        15: 'OB-Xd 24dB', 16: 'K35 LP', 17: 'K35 HP', 18: 'Diode Ladder',
        19: 'Cutoff Warp LP', 20: 'Cutoff Warp HP', 21: 'Cutoff Warp BP',
        22: 'Cutoff Warp N', 23: 'Resonance Warp LP', 24: 'Resonance Warp HP',
        25: 'Resonance Warp BP', 26: 'Resonance Warp N', 27: 'Tri-Pole'
    }
    return names.get(filt_type, f'Unknown ({filt_type})')

def get_surge_lfo_shape_name(shape: int) -> str:
    names = {
        0: 'Sine', 1: 'Triangle', 2: 'Square', 3: 'Ramp',
        4: 'Noise', 5: 'S&H', 6: 'Envelope', 7: 'Stepseq',
        8: 'MSEG', 9: 'Function'
    }
    return names.get(shape, f'Unknown ({shape})')

# ============================================================================
# DATABASE
# ============================================================================

def create_database(db_path: str) -> sqlite3.Connection:
    """Create SQLite database with schema."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS wavetables (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            source TEXT NOT NULL,
            category TEXT,
            path TEXT,
            frame_count INTEGER,
            frame_size INTEGER,
            sample_rate INTEGER DEFAULT 44100,
            bit_depth INTEGER DEFAULT 32,
            is_third_party INTEGER DEFAULT 0,
            contributor TEXT,
            data_b64 TEXT,
            sha256 TEXT,
            file_size INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS presets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            source TEXT NOT NULL,
            category TEXT,
            path TEXT,
            author TEXT,
            description TEXT,
            tags TEXT,
            oscillators TEXT,
            filters TEXT,
            envelopes TEXT,
            lfos TEXT,
            modulations TEXT,
            effects TEXT,
            master_volume REAL DEFAULT 1.0,
            master_tune REAL DEFAULT 0.0,
            polyphony INTEGER DEFAULT 16,
            portamento REAL DEFAULT 0.0,
            raw_data TEXT,
            sha256 TEXT,
            file_size INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_wavetables_source ON wavetables(source)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_wavetables_category ON wavetables(category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_wavetables_name ON wavetables(name)')
    
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_presets_source ON presets(source)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_presets_category ON presets(category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_presets_author ON presets(author)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_presets_name ON presets(name)')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    
    conn.commit()
    return conn

def insert_wavetable(conn: sqlite3.Connection, wt: WavetableData):
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO wavetables 
        (id, name, source, category, path, frame_count, frame_size, sample_rate, 
         bit_depth, is_third_party, contributor, data_b64, sha256, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        wt.id, wt.name, wt.source, wt.category, wt.path, wt.frame_count,
        wt.frame_size, wt.sample_rate, wt.bit_depth, 1 if wt.is_third_party else 0,
        wt.contributor, wt.data_b64, wt.sha256, wt.file_size
    ))

def insert_preset(conn: sqlite3.Connection, preset: PresetData):
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO presets
        (id, name, source, category, path, author, description, tags, oscillators,
         filters, envelopes, lfos, modulations, effects, master_volume, master_tune,
         polyphony, portamento, raw_data, sha256, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        preset.id, preset.name, preset.source, preset.category, preset.path,
        preset.author, preset.description, preset.tags, preset.oscillators,
        preset.filters, preset.envelopes, preset.lfos, preset.modulations,
        preset.effects, preset.master_volume, preset.master_tune, preset.polyphony,
        preset.portamento, preset.raw_data, preset.sha256, preset.file_size
    ))

# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description='Parse synth assets from local files')
    parser.add_argument('--surge-path', type=str, default='./external/surge', 
                       help='Path to Surge repository')
    parser.add_argument('--db-path', type=str, default='./assets/synth-assets.db', 
                       help='SQLite database path')
    
    args = parser.parse_args()
    
    surge_path = Path(args.surge_path)
    db_path = Path(args.db_path)
    
    if not surge_path.exists():
        print(f"Error: Surge path not found: {surge_path}")
        sys.exit(1)
    
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("Synth Asset Parser (Local)")
    print("=" * 60)
    print(f"Surge path: {surge_path}")
    print(f"Database: {db_path}")
    
    conn = create_database(str(db_path))
    
    # Parse wavetables
    print("\n=== Parsing Wavetables ===")
    
    wt_dirs = [
        surge_path / 'resources' / 'data' / 'wavetables',
        surge_path / 'resources' / 'data' / 'wavetables_3rdparty',
    ]
    
    wavetable_count = 0
    
    for wt_dir in wt_dirs:
        if not wt_dir.exists():
            print(f"Skipping: {wt_dir}")
            continue
        
        print(f"\nScanning: {wt_dir}")
        
        for file_path in wt_dir.rglob('*'):
            if file_path.suffix.lower() == '.wt':
                wt = parse_surge_wt(file_path)
                if wt:
                    insert_wavetable(conn, wt)
                    wavetable_count += 1
                    if wavetable_count % 50 == 0:
                        print(f"  Parsed {wavetable_count} wavetables...")
                        conn.commit()
            elif file_path.suffix.lower() == '.wav':
                wt = parse_surge_wav(file_path)
                if wt:
                    insert_wavetable(conn, wt)
                    wavetable_count += 1
                    if wavetable_count % 50 == 0:
                        print(f"  Parsed {wavetable_count} wavetables...")
                        conn.commit()
    
    conn.commit()
    print(f"\nTotal wavetables: {wavetable_count}")
    
    # Parse presets
    print("\n=== Parsing Presets ===")
    
    preset_dirs = [
        surge_path / 'resources' / 'data' / 'patches_factory',
        surge_path / 'resources' / 'data' / 'patches_3rdparty',
    ]
    
    preset_count = 0
    
    for preset_dir in preset_dirs:
        if not preset_dir.exists():
            print(f"Skipping: {preset_dir}")
            continue
        
        print(f"\nScanning: {preset_dir}")
        
        for file_path in preset_dir.rglob('*.fxp'):
            preset = parse_surge_fxp(file_path)
            if preset:
                insert_preset(conn, preset)
                preset_count += 1
                if preset_count % 100 == 0:
                    print(f"  Parsed {preset_count} presets...")
                    conn.commit()
    
    conn.commit()
    print(f"\nTotal presets: {preset_count}")
    
    # Store metadata
    cursor = conn.cursor()
    cursor.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', 
                  ('last_updated', datetime.datetime.now().isoformat()))
    cursor.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
                  ('version', '1.0.0'))
    cursor.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
                  ('total_wavetables', str(wavetable_count)))
    cursor.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
                  ('total_presets', str(preset_count)))
    conn.commit()
    conn.close()
    
    print("\n" + "=" * 60)
    print("COMPLETE")
    print("=" * 60)
    print(f"Wavetables: {wavetable_count}")
    print(f"Presets: {preset_count}")
    print(f"Database: {db_path}")

if __name__ == '__main__':
    main()
