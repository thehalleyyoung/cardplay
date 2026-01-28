#!/usr/bin/env python3
"""
Synth Asset Downloader & Parser

Downloads and parses wavetables and presets from:
- Surge (GitHub: surge-synthesizer/surge)
- Vital (GitHub: vital-audio/vital + community presets)

Creates a SQLite database with all patch data accessible from TypeScript.

Usage:
    python synth-asset-downloader.py [--output-dir ./assets] [--db-path ./synth-assets.db]
"""

import os
import sys
import json
import gzip
import struct
import sqlite3
import hashlib
import argparse
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict, field
from concurrent.futures import ThreadPoolExecutor, as_completed
import base64
import re
import xml.etree.ElementTree as ET

# ============================================================================
# CONFIGURATION
# ============================================================================

SURGE_REPO = "surge-synthesizer/surge"
SURGE_BRANCH = "main"
SURGE_API_BASE = f"https://api.github.com/repos/{SURGE_REPO}/contents"
SURGE_RAW_BASE = f"https://raw.githubusercontent.com/{SURGE_REPO}/{SURGE_BRANCH}"

VITAL_REPO = "vital-audio/vital"
VITAL_BRANCH = "main"
VITAL_API_BASE = f"https://api.github.com/repos/{VITAL_REPO}/contents"
VITAL_RAW_BASE = f"https://raw.githubusercontent.com/{VITAL_REPO}/{VITAL_BRANCH}"

# Additional community preset sources
VITAL_PRESETS_REPO = "itsmedavep/vital-presets"
VITAL_PRESETS_BRANCH = "main"

GITHUB_HEADERS = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "SynthAssetDownloader/1.0"
}

# Rate limiting
MAX_CONCURRENT_DOWNLOADS = 5
REQUEST_DELAY = 0.1  # seconds between requests

# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class WavetableData:
    """Parsed wavetable data."""
    id: str
    name: str
    source: str  # 'surge' or 'vital'
    category: str
    path: str
    frame_count: int
    frame_size: int
    sample_rate: int = 44100
    bit_depth: int = 32
    is_third_party: bool = False
    contributor: Optional[str] = None
    # Actual waveform data stored as base64-encoded float32 array
    data_b64: Optional[str] = None
    sha256: Optional[str] = None
    file_size: int = 0
    
@dataclass
class OscillatorData:
    """Oscillator settings from a preset."""
    index: int  # 0, 1, 2 for osc1, osc2, osc3
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
    # FM/distortion
    distortion: float = 0.0
    fm_depth: float = 0.0
    # Extra params as JSON
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
    name: str  # 'amp', 'filter', 'mod1', etc.
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
    params: str = "{}"  # JSON params

@dataclass
class PresetData:
    """Complete preset data."""
    id: str
    name: str
    source: str  # 'surge' or 'vital'
    category: str
    path: str
    author: Optional[str] = None
    description: Optional[str] = None
    tags: str = "[]"  # JSON array
    # Oscillators stored as JSON array
    oscillators: str = "[]"
    # Filters stored as JSON array  
    filters: str = "[]"
    # Envelopes stored as JSON array
    envelopes: str = "[]"
    # LFOs stored as JSON array
    lfos: str = "[]"
    # Modulation matrix stored as JSON array
    modulations: str = "[]"
    # Effects stored as JSON array
    effects: str = "[]"
    # Master settings
    master_volume: float = 1.0
    master_tune: float = 0.0
    polyphony: int = 16
    portamento: float = 0.0
    # Raw preset data for reference
    raw_data: Optional[str] = None
    sha256: Optional[str] = None
    file_size: int = 0

# ============================================================================
# GITHUB API HELPERS
# ============================================================================

def github_request(url: str, headers: Optional[Dict] = None) -> bytes:
    """Make a GitHub API request with error handling."""
    req_headers = {**GITHUB_HEADERS, **(headers or {})}
    
    # Add token if available
    token = os.environ.get('GITHUB_TOKEN')
    if token:
        req_headers['Authorization'] = f'token {token}'
    
    request = urllib.request.Request(url, headers=req_headers)
    
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read()
    except urllib.error.HTTPError as e:
        if e.code == 403:
            print(f"Rate limited. Set GITHUB_TOKEN env var for higher limits.")
        raise

def list_github_directory(api_url: str, path: str = "") -> List[Dict]:
    """List contents of a GitHub directory recursively."""
    full_url = f"{api_url}/{path}" if path else api_url
    
    try:
        data = github_request(full_url)
        items = json.loads(data)
        
        if not isinstance(items, list):
            return []
            
        results = []
        for item in items:
            if item['type'] == 'file':
                results.append(item)
            elif item['type'] == 'dir':
                # Recurse into subdirectories
                sub_items = list_github_directory(api_url, item['path'])
                results.extend(sub_items)
                
        return results
    except Exception as e:
        print(f"Error listing {full_url}: {e}")
        return []

def download_file(url: str) -> Optional[bytes]:
    """Download a file from URL."""
    try:
        return github_request(url)
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return None

# ============================================================================
# SURGE PARSING
# ============================================================================

def parse_surge_wt_header(data: bytes) -> Optional[Dict]:
    """Parse Surge .wt wavetable header."""
    if len(data) < 12:
        return None
    
    # Surge WT magic: 'vaws' (0x77617673) in little-endian
    magic = struct.unpack('<I', data[0:4])[0]
    if magic != 0x77617673:
        return None
    
    # Header: magic(4) + frame_size(4) + frame_count(4) + flags(4)
    frame_size = struct.unpack('<I', data[4:8])[0]
    frame_count = struct.unpack('<I', data[8:12])[0]
    
    flags = 0
    if len(data) >= 16:
        flags = struct.unpack('<I', data[12:16])[0]
    
    is_float = (flags & 0x04) != 0
    
    return {
        'frame_size': frame_size,
        'frame_count': frame_count,
        'is_float': is_float,
        'header_size': 16 if len(data) >= 16 else 12
    }

def parse_surge_wavetable(data: bytes, name: str, path: str, category: str, 
                          is_third_party: bool = False, contributor: Optional[str] = None) -> Optional[WavetableData]:
    """Parse a Surge .wt wavetable file."""
    header = parse_surge_wt_header(data)
    if not header:
        return None
    
    # Extract waveform data
    header_size = header['header_size']
    frame_size = header['frame_size']
    frame_count = header['frame_count']
    is_float = header['is_float']
    
    samples_per_table = frame_size * frame_count
    
    if is_float:
        expected_size = header_size + samples_per_table * 4
        if len(data) < expected_size:
            return None
        samples = struct.unpack(f'<{samples_per_table}f', data[header_size:header_size + samples_per_table * 4])
    else:
        expected_size = header_size + samples_per_table * 2
        if len(data) < expected_size:
            return None
        int_samples = struct.unpack(f'<{samples_per_table}h', data[header_size:header_size + samples_per_table * 2])
        samples = [s / 32768.0 for s in int_samples]
    
    # Convert to float32 and base64 encode
    import array
    float_array = array.array('f', samples)
    data_b64 = base64.b64encode(float_array.tobytes()).decode('ascii')
    
    return WavetableData(
        id=hashlib.sha256(path.encode()).hexdigest()[:16],
        name=name,
        source='surge',
        category=category,
        path=path,
        frame_count=frame_count,
        frame_size=frame_size,
        bit_depth=32 if is_float else 16,
        is_third_party=is_third_party,
        contributor=contributor,
        data_b64=data_b64,
        sha256=hashlib.sha256(data).hexdigest(),
        file_size=len(data)
    )

def parse_surge_wav_wavetable(data: bytes, name: str, path: str, category: str,
                               is_third_party: bool = False, contributor: Optional[str] = None) -> Optional[WavetableData]:
    """Parse a WAV file as wavetable (Serum-style or multi-cycle)."""
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
        if chunk_size % 2:  # Pad to even
            pos += 1
    
    if not fmt_data or not audio_data:
        return None
    
    # Parse format
    audio_format = struct.unpack('<H', fmt_data[0:2])[0]
    num_channels = struct.unpack('<H', fmt_data[2:4])[0]
    sample_rate = struct.unpack('<I', fmt_data[4:8])[0]
    bits_per_sample = struct.unpack('<H', fmt_data[14:16])[0]
    
    if audio_format not in [1, 3]:  # PCM or IEEE float
        return None
    
    # Extract samples (mono only, take first channel)
    bytes_per_sample = bits_per_sample // 8
    total_samples = len(audio_data) // (bytes_per_sample * num_channels)
    
    samples = []
    for i in range(total_samples):
        offset = i * bytes_per_sample * num_channels
        if bits_per_sample == 16:
            val = struct.unpack('<h', audio_data[offset:offset+2])[0]
            samples.append(val / 32768.0)
        elif bits_per_sample == 24:
            val = struct.unpack('<i', audio_data[offset:offset+3] + (b'\x00' if audio_data[offset+2] < 128 else b'\xff'))[0]
            samples.append(val / 8388608.0)
        elif bits_per_sample == 32:
            if audio_format == 3:  # Float
                val = struct.unpack('<f', audio_data[offset:offset+4])[0]
            else:
                val = struct.unpack('<i', audio_data[offset:offset+4])[0]
                val = val / 2147483648.0
            samples.append(val)
    
    # Detect frame size (Serum uses 2048)
    frame_size = 2048
    common_sizes = [256, 512, 1024, 2048, 4096]
    for size in common_sizes:
        if total_samples % size == 0:
            frame_size = size
            break
    
    frame_count = max(1, total_samples // frame_size)
    
    # Truncate to whole frames
    samples = samples[:frame_count * frame_size]
    
    import array
    float_array = array.array('f', samples)
    data_b64 = base64.b64encode(float_array.tobytes()).decode('ascii')
    
    return WavetableData(
        id=hashlib.sha256(path.encode()).hexdigest()[:16],
        name=name,
        source='surge',
        category=category,
        path=path,
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

def parse_surge_fxp_preset(data: bytes, path: str) -> Optional[PresetData]:
    """Parse a Surge FXP preset file."""
    if len(data) < 60:
        return None
    
    # Check FXP header: CcnK magic
    if data[0:4] != b'CcnK':
        return None
    
    # FXP format
    fx_magic = data[8:12]
    if fx_magic not in [b'FxCk', b'FPCh']:
        return None
    
    # Get preset name from header (offset 28, 28 bytes)
    preset_name_bytes = data[28:56]
    preset_name = preset_name_bytes.split(b'\x00')[0].decode('utf-8', errors='replace')
    
    # For FPCh (chunk), extract XML
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
            # Find end of XML
            xml_end = len(chunk_data)
            for i in range(len(chunk_data) - 1, xml_start, -1):
                if chunk_data[i] == ord('>'):
                    xml_end = i + 1
                    break
            
            xml_str = chunk_data[xml_start:xml_end].decode('utf-8', errors='replace')
            return parse_surge_preset_xml(xml_str, path, preset_name)
    
    return None

def parse_surge_preset_xml(xml_str: str, path: str, preset_name: str) -> Optional[PresetData]:
    """Parse Surge preset XML content."""
    try:
        # Clean up XML if needed
        xml_str = xml_str.strip()
        if not xml_str.startswith('<?xml') and not xml_str.startswith('<patch'):
            return None
        
        root = ET.fromstring(xml_str)
        
        # Get patch-level attributes
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
            scene_id = scene.get('id', '0')
            
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
            raw_data=xml_str[:10000],  # Store first 10KB of raw XML
            sha256=hashlib.sha256(xml_str.encode()).hexdigest(),
            file_size=len(xml_str)
        )
        
    except ET.ParseError as e:
        print(f"XML parse error for {path}: {e}")
        return None

def get_surge_osc_type_name(osc_type: int) -> str:
    """Get Surge oscillator type name."""
    names = {
        0: 'Classic', 1: 'Sine', 2: 'Wavetable', 3: 'SH Noise',
        4: 'Audio Input', 5: 'FM3', 6: 'FM2', 7: 'Window',
        8: 'Modern', 9: 'String', 10: 'Twist', 11: 'Alias',
        12: 'Phase Mod'
    }
    return names.get(osc_type, f'Unknown ({osc_type})')

def get_surge_filter_type_name(filt_type: int) -> str:
    """Get Surge filter type name."""
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
    """Get Surge LFO shape name."""
    names = {
        0: 'Sine', 1: 'Triangle', 2: 'Square', 3: 'Ramp',
        4: 'Noise', 5: 'S&H', 6: 'Envelope', 7: 'Stepseq',
        8: 'MSEG', 9: 'Function'
    }
    return names.get(shape, f'Unknown ({shape})')

# ============================================================================
# VITAL PARSING
# ============================================================================

def parse_vital_preset(data: bytes, path: str) -> Optional[PresetData]:
    """Parse a Vital .vital preset file (gzipped JSON)."""
    try:
        # Vital presets are gzipped JSON
        try:
            json_data = gzip.decompress(data)
        except:
            # Maybe not gzipped
            json_data = data
        
        preset = json.loads(json_data)
        
        # Extract preset info
        preset_name = preset.get('preset_name', Path(path).stem)
        author = preset.get('author', '')
        comments = preset.get('comments', '')
        
        # Determine category from path or style
        style = preset.get('preset_style', '')
        category = style if style else path.split('/')[-2] if '/' in path else 'Uncategorized'
        
        oscillators = []
        filters = []
        envelopes = []
        lfos = []
        modulations = []
        effects = []
        
        settings = preset.get('settings', preset)
        
        # Parse oscillators (osc_1, osc_2, osc_3)
        for i in range(1, 4):
            prefix = f'osc_{i}_'
            if f'{prefix}on' in settings:
                osc_on = settings.get(f'{prefix}on', 1)
                if osc_on:
                    # Get wavetable info
                    wt_name = None
                    wavetables = preset.get('wavetables', {})
                    wt_key = f'osc_{i}'
                    if wt_key in wavetables:
                        wt_data = wavetables[wt_key]
                        wt_name = wt_data.get('name', f'Wavetable {i}')
                    
                    osc_data = OscillatorData(
                        index=i-1,
                        osc_type=2,  # Vital is always wavetable
                        osc_type_name='Wavetable',
                        wavetable_name=wt_name,
                        wavetable_position=settings.get(f'{prefix}wave_frame', 0),
                        level=settings.get(f'{prefix}level', 1),
                        pan=settings.get(f'{prefix}pan', 0),
                        tune_semitones=settings.get(f'{prefix}transpose', 0),
                        tune_cents=settings.get(f'{prefix}tune', 0),
                        unison_voices=int(settings.get(f'{prefix}unison_voices', 1)),
                        unison_detune=settings.get(f'{prefix}unison_detune', 0),
                        unison_blend=settings.get(f'{prefix}unison_blend', 0),
                        phase=settings.get(f'{prefix}phase', 0),
                        phase_randomize=settings.get(f'{prefix}random_phase', 0),
                        distortion=settings.get(f'{prefix}distortion_amount', 0),
                    )
                    oscillators.append(asdict(osc_data))
        
        # Parse filters (filter_1, filter_2)
        for i in range(1, 3):
            prefix = f'filter_{i}_'
            if f'{prefix}on' in settings:
                filt_on = settings.get(f'{prefix}on', 0)
                filt_model = int(settings.get(f'{prefix}model', 0))
                filt_data = FilterData(
                    index=i-1,
                    filter_type=filt_model,
                    filter_type_name=get_vital_filter_type_name(filt_model),
                    cutoff=settings.get(f'{prefix}cutoff', 60),  # In semitones
                    resonance=settings.get(f'{prefix}resonance', 0),
                    drive=settings.get(f'{prefix}drive', 0),
                    mix=settings.get(f'{prefix}mix', 1),
                    keytrack=settings.get(f'{prefix}keytrack', 0),
                )
                filters.append(asdict(filt_data))
        
        # Parse envelopes
        env_names = ['env_1', 'env_2', 'env_3', 'env_4', 'env_5', 'env_6']
        for env_name in env_names:
            prefix = f'{env_name}_'
            if f'{prefix}attack' in settings:
                env_data = EnvelopeData(
                    name=env_name,
                    attack=settings.get(f'{prefix}attack', 0),
                    decay=settings.get(f'{prefix}decay', 0),
                    sustain=settings.get(f'{prefix}sustain', 1),
                    release=settings.get(f'{prefix}release', 0),
                    attack_curve=settings.get(f'{prefix}attack_power', 0),
                    decay_curve=settings.get(f'{prefix}decay_power', 0),
                    release_curve=settings.get(f'{prefix}release_power', 0),
                )
                envelopes.append(asdict(env_data))
        
        # Parse LFOs
        for i in range(1, 9):
            prefix = f'lfo_{i}_'
            if f'{prefix}frequency' in settings:
                lfo_data = LFOData(
                    index=i-1,
                    waveform=int(settings.get(f'{prefix}shape', 0)),
                    waveform_name=get_vital_lfo_shape_name(int(settings.get(f'{prefix}shape', 0))),
                    rate=settings.get(f'{prefix}frequency', 1),
                    sync=settings.get(f'{prefix}sync', 0) > 0,
                    sync_rate=settings.get(f'{prefix}sync_type', '1/4'),
                    phase=settings.get(f'{prefix}phase', 0),
                    delay=settings.get(f'{prefix}delay', 0),
                    fade_in=settings.get(f'{prefix}fade', 0),
                )
                lfos.append(asdict(lfo_data))
        
        # Parse modulations
        mod_matrix = preset.get('modulations', [])
        for mod in mod_matrix:
            mod_data = ModulationData(
                source=mod.get('source', ''),
                destination=mod.get('destination', ''),
                amount=mod.get('amount', 0),
                bipolar=mod.get('bipolar', 1) == 1,
            )
            modulations.append(asdict(mod_data))
        
        # Parse effects
        effect_types = ['chorus', 'compressor', 'delay', 'distortion', 'eq', 
                       'filter_fx', 'flanger', 'phaser', 'reverb']
        for fx_type in effect_types:
            prefix = f'{fx_type}_'
            if f'{prefix}on' in settings:
                fx_on = settings.get(f'{prefix}on', 0)
                fx_mix = settings.get(f'{prefix}mix', 1) if fx_type != 'eq' else 1
                fx_params = {k: v for k, v in settings.items() if k.startswith(prefix)}
                
                fx_data = EffectData(
                    effect_type=fx_type,
                    enabled=fx_on > 0,
                    mix=fx_mix,
                    params=json.dumps(fx_params)
                )
                effects.append(asdict(fx_data))
        
        return PresetData(
            id=hashlib.sha256(path.encode()).hexdigest()[:16],
            name=preset_name,
            source='vital',
            category=category,
            path=path,
            author=author if author else None,
            description=comments if comments else None,
            oscillators=json.dumps(oscillators),
            filters=json.dumps(filters),
            envelopes=json.dumps(envelopes),
            lfos=json.dumps(lfos),
            modulations=json.dumps(modulations),
            effects=json.dumps(effects),
            master_volume=settings.get('volume', 1),
            polyphony=int(settings.get('polyphony', 32)),
            portamento=settings.get('portamento_time', 0),
            raw_data=json_data[:10000].decode('utf-8', errors='replace'),
            sha256=hashlib.sha256(data).hexdigest(),
            file_size=len(data)
        )
        
    except Exception as e:
        print(f"Error parsing Vital preset {path}: {e}")
        return None

def parse_vital_wavetable(data: bytes, name: str, path: str, category: str) -> Optional[WavetableData]:
    """Parse a Vital wavetable from preset or standalone file."""
    try:
        # Try to decompress if gzipped
        try:
            json_data = gzip.decompress(data)
        except:
            json_data = data
        
        wt_data = json.loads(json_data)
        
        # Vital wavetables have 'groups' with 'components'
        groups = wt_data.get('groups', [])
        if not groups:
            return None
        
        # Extract frame data
        frames = []
        for group in groups:
            for component in group.get('components', []):
                keyframes = component.get('keyframes', [])
                for kf in keyframes:
                    wave_data = kf.get('wave_data')
                    if wave_data:
                        # wave_data is base64 encoded
                        frames.append(base64.b64decode(wave_data))
        
        if not frames:
            return None
        
        # Vital uses 2048 samples per frame
        frame_size = 2048
        frame_count = len(frames)
        
        # Combine all frames
        all_samples = []
        for frame in frames:
            # Vital stores as float32
            num_samples = len(frame) // 4
            samples = struct.unpack(f'<{num_samples}f', frame)
            all_samples.extend(samples)
        
        import array
        float_array = array.array('f', all_samples)
        data_b64 = base64.b64encode(float_array.tobytes()).decode('ascii')
        
        return WavetableData(
            id=hashlib.sha256(path.encode()).hexdigest()[:16],
            name=name,
            source='vital',
            category=category,
            path=path,
            frame_count=frame_count,
            frame_size=frame_size,
            data_b64=data_b64,
            sha256=hashlib.sha256(data).hexdigest(),
            file_size=len(data)
        )
        
    except Exception as e:
        print(f"Error parsing Vital wavetable {path}: {e}")
        return None

def get_vital_filter_type_name(model: int) -> str:
    """Get Vital filter model name."""
    names = {
        0: 'Analog', 1: 'Dirty', 2: 'Ladder', 3: 'Digital',
        4: 'Diode', 5: 'Formant', 6: 'Comb', 7: 'Phaser'
    }
    return names.get(model, f'Unknown ({model})')

def get_vital_lfo_shape_name(shape: int) -> str:
    """Get Vital LFO shape name."""
    # Vital allows custom shapes, but has presets
    names = {
        0: 'Sine', 1: 'Triangle', 2: 'Saw Up', 3: 'Saw Down',
        4: 'Square', 5: 'Random'
    }
    return names.get(shape, 'Custom')

# ============================================================================
# DATABASE
# ============================================================================

def create_database(db_path: str):
    """Create SQLite database with schema."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Wavetables table
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
    
    # Presets table
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
    
    # Indexes for efficient queries
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_wavetables_source ON wavetables(source)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_wavetables_category ON wavetables(category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_wavetables_name ON wavetables(name)')
    
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_presets_source ON presets(source)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_presets_category ON presets(category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_presets_author ON presets(author)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_presets_name ON presets(name)')
    
    # Metadata table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    
    conn.commit()
    return conn

def insert_wavetable(conn: sqlite3.Connection, wt: WavetableData):
    """Insert a wavetable into the database."""
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
    """Insert a preset into the database."""
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
# MAIN DOWNLOAD LOGIC
# ============================================================================

def download_surge_assets(conn: sqlite3.Connection, output_dir: Path):
    """Download all Surge wavetables and presets."""
    print("\n=== Downloading Surge Assets ===")
    
    # Wavetable paths
    wt_paths = [
        ('resources/data/wavetables', False),
        ('resources/data/wavetables_3rdparty', True),
    ]
    
    wavetables_downloaded = 0
    
    for wt_path, is_third_party in wt_paths:
        print(f"\nScanning {wt_path}...")
        
        try:
            files = list_github_directory(SURGE_API_BASE, wt_path)
            wt_files = [f for f in files if f['name'].endswith(('.wt', '.wav'))]
            
            print(f"Found {len(wt_files)} wavetable files")
            
            for file_info in wt_files:
                file_path = file_info['path']
                file_name = file_info['name']
                download_url = file_info.get('download_url') or f"{SURGE_RAW_BASE}/{file_path}"
                
                # Determine category and contributor
                rel_path = file_path.replace(wt_path + '/', '')
                parts = rel_path.split('/')
                
                if is_third_party and len(parts) >= 2:
                    contributor = parts[0]
                    category = '/'.join(parts[:-1])
                else:
                    contributor = None
                    category = '/'.join(parts[:-1]) if len(parts) > 1 else 'root'
                
                name = file_name.rsplit('.', 1)[0]
                
                print(f"  Downloading: {name}...", end=' ', flush=True)
                
                data = download_file(download_url)
                if not data:
                    print("FAILED")
                    continue
                
                # Parse based on extension
                if file_name.endswith('.wt'):
                    wt = parse_surge_wavetable(data, name, file_path, category, is_third_party, contributor)
                else:
                    wt = parse_surge_wav_wavetable(data, name, file_path, category, is_third_party, contributor)
                
                if wt:
                    insert_wavetable(conn, wt)
                    wavetables_downloaded += 1
                    print(f"OK ({wt.frame_count} frames)")
                else:
                    print("PARSE ERROR")
                    
        except Exception as e:
            print(f"Error scanning {wt_path}: {e}")
    
    conn.commit()
    print(f"\nTotal Surge wavetables: {wavetables_downloaded}")
    
    # Preset paths
    preset_paths = [
        'resources/data/patches_factory',
        'resources/data/patches_3rdparty',
    ]
    
    presets_downloaded = 0
    
    for preset_path in preset_paths:
        print(f"\nScanning {preset_path}...")
        
        try:
            files = list_github_directory(SURGE_API_BASE, preset_path)
            fxp_files = [f for f in files if f['name'].endswith('.fxp')]
            
            print(f"Found {len(fxp_files)} preset files")
            
            for file_info in fxp_files:
                file_path = file_info['path']
                file_name = file_info['name']
                download_url = file_info.get('download_url') or f"{SURGE_RAW_BASE}/{file_path}"
                
                print(f"  Downloading: {file_name}...", end=' ', flush=True)
                
                data = download_file(download_url)
                if not data:
                    print("FAILED")
                    continue
                
                preset = parse_surge_fxp_preset(data, file_path)
                if preset:
                    insert_preset(conn, preset)
                    presets_downloaded += 1
                    print("OK")
                else:
                    print("PARSE ERROR")
                    
        except Exception as e:
            print(f"Error scanning {preset_path}: {e}")
    
    conn.commit()
    print(f"\nTotal Surge presets: {presets_downloaded}")
    
    return wavetables_downloaded, presets_downloaded

def download_vital_assets(conn: sqlite3.Connection, output_dir: Path):
    """Download Vital factory presets and community presets."""
    print("\n=== Downloading Vital Assets ===")
    
    presets_downloaded = 0
    wavetables_downloaded = 0
    
    # Vital factory presets (from main repo)
    vital_preset_paths = [
        'presets',
    ]
    
    for preset_path in vital_preset_paths:
        print(f"\nScanning Vital {preset_path}...")
        
        try:
            files = list_github_directory(VITAL_API_BASE, preset_path)
            vital_files = [f for f in files if f['name'].endswith('.vital')]
            
            print(f"Found {len(vital_files)} preset files")
            
            for file_info in vital_files:
                file_path = file_info['path']
                file_name = file_info['name']
                download_url = file_info.get('download_url') or f"{VITAL_RAW_BASE}/{file_path}"
                
                print(f"  Downloading: {file_name}...", end=' ', flush=True)
                
                data = download_file(download_url)
                if not data:
                    print("FAILED")
                    continue
                
                preset = parse_vital_preset(data, file_path)
                if preset:
                    insert_preset(conn, preset)
                    presets_downloaded += 1
                    print("OK")
                else:
                    print("PARSE ERROR")
                    
        except Exception as e:
            print(f"Error scanning {preset_path}: {e}")
    
    # Community presets repo
    print(f"\nScanning community presets from {VITAL_PRESETS_REPO}...")
    
    try:
        community_api = f"https://api.github.com/repos/{VITAL_PRESETS_REPO}/contents"
        files = list_github_directory(community_api, '')
        vital_files = [f for f in files if f['name'].endswith('.vital')]
        
        print(f"Found {len(vital_files)} community preset files")
        
        for file_info in vital_files:
            file_path = file_info['path']
            file_name = file_info['name']
            download_url = file_info.get('download_url')
            
            if not download_url:
                continue
            
            print(f"  Downloading: {file_name}...", end=' ', flush=True)
            
            data = download_file(download_url)
            if not data:
                print("FAILED")
                continue
            
            preset = parse_vital_preset(data, f"community/{file_path}")
            if preset:
                insert_preset(conn, preset)
                presets_downloaded += 1
                print("OK")
            else:
                print("PARSE ERROR")
                
    except Exception as e:
        print(f"Error scanning community presets: {e}")
    
    conn.commit()
    print(f"\nTotal Vital presets: {presets_downloaded}")
    print(f"Total Vital wavetables: {wavetables_downloaded}")
    
    return wavetables_downloaded, presets_downloaded

def generate_typescript_types(output_path: Path):
    """Generate TypeScript type definitions."""
    ts_code = '''/**
 * @fileoverview TypeScript types and utilities for synth asset database.
 * Auto-generated by synth-asset-downloader.py
 */

import * as sqlite3 from 'better-sqlite3';

// ============================================================================
// TYPES
// ============================================================================

export interface WavetableRecord {
  id: string;
  name: string;
  source: 'surge' | 'vital';
  category: string;
  path: string;
  frame_count: number;
  frame_size: number;
  sample_rate: number;
  bit_depth: number;
  is_third_party: boolean;
  contributor: string | null;
  /** Base64-encoded Float32Array of all samples */
  data_b64: string | null;
  sha256: string | null;
  file_size: number;
  created_at: string;
}

export interface OscillatorSettings {
  index: number;
  osc_type: number;
  osc_type_name: string;
  wavetable_name: string | null;
  wavetable_position: number;
  level: number;
  pan: number;
  tune_semitones: number;
  tune_cents: number;
  unison_voices: number;
  unison_detune: number;
  unison_blend: number;
  phase: number;
  phase_randomize: number;
  distortion: number;
  fm_depth: number;
  extra_params: Record<string, unknown>;
}

export interface FilterSettings {
  index: number;
  filter_type: number;
  filter_type_name: string;
  cutoff: number;
  resonance: number;
  drive: number;
  mix: number;
  keytrack: number;
  env_depth: number;
  extra_params: Record<string, unknown>;
}

export interface EnvelopeSettings {
  name: string;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  attack_curve: number;
  decay_curve: number;
  release_curve: number;
}

export interface LFOSettings {
  index: number;
  waveform: number;
  waveform_name: string;
  rate: number;
  sync: boolean;
  sync_rate: string;
  depth: number;
  phase: number;
  delay: number;
  fade_in: number;
}

export interface ModulationSettings {
  source: string;
  destination: string;
  amount: number;
  bipolar: boolean;
}

export interface EffectSettings {
  effect_type: string;
  enabled: boolean;
  mix: number;
  params: Record<string, unknown>;
}

export interface PresetRecord {
  id: string;
  name: string;
  source: 'surge' | 'vital';
  category: string;
  path: string;
  author: string | null;
  description: string | null;
  tags: string[];
  oscillators: OscillatorSettings[];
  filters: FilterSettings[];
  envelopes: EnvelopeSettings[];
  lfos: LFOSettings[];
  modulations: ModulationSettings[];
  effects: EffectSettings[];
  master_volume: number;
  master_tune: number;
  polyphony: number;
  portamento: number;
  raw_data: string | null;
  sha256: string | null;
  file_size: number;
  created_at: string;
}

// ============================================================================
// DATABASE ACCESS
// ============================================================================

export class SynthAssetDatabase {
  private db: sqlite3.Database;
  
  constructor(dbPath: string) {
    this.db = new sqlite3(dbPath, { readonly: true });
  }
  
  close(): void {
    this.db.close();
  }
  
  // Wavetable queries
  
  getAllWavetables(): WavetableRecord[] {
    return this.db.prepare('SELECT * FROM wavetables ORDER BY source, category, name').all() as WavetableRecord[];
  }
  
  getWavetableById(id: string): WavetableRecord | undefined {
    return this.db.prepare('SELECT * FROM wavetables WHERE id = ?').get(id) as WavetableRecord | undefined;
  }
  
  getWavetablesBySource(source: 'surge' | 'vital'): WavetableRecord[] {
    return this.db.prepare('SELECT * FROM wavetables WHERE source = ? ORDER BY category, name').all(source) as WavetableRecord[];
  }
  
  getWavetablesByCategory(category: string): WavetableRecord[] {
    return this.db.prepare('SELECT * FROM wavetables WHERE category = ? ORDER BY name').all(category) as WavetableRecord[];
  }
  
  searchWavetables(query: string): WavetableRecord[] {
    return this.db.prepare('SELECT * FROM wavetables WHERE name LIKE ? OR category LIKE ? ORDER BY name').all(`%${query}%`, `%${query}%`) as WavetableRecord[];
  }
  
  getWavetableCategories(): string[] {
    const rows = this.db.prepare('SELECT DISTINCT category FROM wavetables ORDER BY category').all() as { category: string }[];
    return rows.map(r => r.category);
  }
  
  getWavetableData(id: string): Float32Array | null {
    const wt = this.getWavetableById(id);
    if (!wt?.data_b64) return null;
    
    const buffer = Buffer.from(wt.data_b64, 'base64');
    return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  }
  
  // Preset queries
  
  getAllPresets(): PresetRecord[] {
    const rows = this.db.prepare('SELECT * FROM presets ORDER BY source, category, name').all() as any[];
    return rows.map(this.parsePresetRow);
  }
  
  getPresetById(id: string): PresetRecord | undefined {
    const row = this.db.prepare('SELECT * FROM presets WHERE id = ?').get(id);
    return row ? this.parsePresetRow(row) : undefined;
  }
  
  getPresetsBySource(source: 'surge' | 'vital'): PresetRecord[] {
    const rows = this.db.prepare('SELECT * FROM presets WHERE source = ? ORDER BY category, name').all(source) as any[];
    return rows.map(this.parsePresetRow);
  }
  
  getPresetsByCategory(category: string): PresetRecord[] {
    const rows = this.db.prepare('SELECT * FROM presets WHERE category = ? ORDER BY name').all(category) as any[];
    return rows.map(this.parsePresetRow);
  }
  
  getPresetsByAuthor(author: string): PresetRecord[] {
    const rows = this.db.prepare('SELECT * FROM presets WHERE author = ? ORDER BY name').all(author) as any[];
    return rows.map(this.parsePresetRow);
  }
  
  searchPresets(query: string): PresetRecord[] {
    const rows = this.db.prepare('SELECT * FROM presets WHERE name LIKE ? OR category LIKE ? OR author LIKE ? ORDER BY name')
      .all(`%${query}%`, `%${query}%`, `%${query}%`) as any[];
    return rows.map(this.parsePresetRow);
  }
  
  getPresetCategories(): string[] {
    const rows = this.db.prepare('SELECT DISTINCT category FROM presets ORDER BY category').all() as { category: string }[];
    return rows.map(r => r.category);
  }
  
  getPresetAuthors(): string[] {
    const rows = this.db.prepare('SELECT DISTINCT author FROM presets WHERE author IS NOT NULL ORDER BY author').all() as { author: string }[];
    return rows.map(r => r.author);
  }
  
  // Find presets using a specific wavetable
  getPresetsUsingWavetable(wavetableName: string): PresetRecord[] {
    const rows = this.db.prepare('SELECT * FROM presets WHERE oscillators LIKE ? ORDER BY name')
      .all(`%"wavetable_name":"${wavetableName}"%`) as any[];
    return rows.map(this.parsePresetRow);
  }
  
  // Statistics
  
  getStats(): { wavetables: number; presets: number; surgeWavetables: number; vitalWavetables: number; surgePresets: number; vitalPresets: number } {
    const wavetables = (this.db.prepare('SELECT COUNT(*) as count FROM wavetables').get() as { count: number }).count;
    const presets = (this.db.prepare('SELECT COUNT(*) as count FROM presets').get() as { count: number }).count;
    const surgeWavetables = (this.db.prepare('SELECT COUNT(*) as count FROM wavetables WHERE source = ?').get('surge') as { count: number }).count;
    const vitalWavetables = (this.db.prepare('SELECT COUNT(*) as count FROM wavetables WHERE source = ?').get('vital') as { count: number }).count;
    const surgePresets = (this.db.prepare('SELECT COUNT(*) as count FROM presets WHERE source = ?').get('surge') as { count: number }).count;
    const vitalPresets = (this.db.prepare('SELECT COUNT(*) as count FROM presets WHERE source = ?').get('vital') as { count: number }).count;
    
    return { wavetables, presets, surgeWavetables, vitalWavetables, surgePresets, vitalPresets };
  }
  
  private parsePresetRow(row: any): PresetRecord {
    return {
      ...row,
      is_third_party: Boolean(row.is_third_party),
      tags: JSON.parse(row.tags || '[]'),
      oscillators: JSON.parse(row.oscillators || '[]'),
      filters: JSON.parse(row.filters || '[]'),
      envelopes: JSON.parse(row.envelopes || '[]'),
      lfos: JSON.parse(row.lfos || '[]'),
      modulations: JSON.parse(row.modulations || '[]'),
      effects: JSON.parse(row.effects || '[]'),
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Decode base64 wavetable data to Float32Array.
 */
export function decodeWavetableData(data_b64: string): Float32Array {
  const buffer = Buffer.from(data_b64, 'base64');
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
}

/**
 * Extract a single frame from wavetable data.
 */
export function extractWavetableFrame(data: Float32Array, frameIndex: number, frameSize: number): Float32Array {
  const start = frameIndex * frameSize;
  return data.slice(start, start + frameSize);
}

/**
 * Get wavetable frame at fractional position (with interpolation).
 */
export function interpolateWavetableFrame(
  data: Float32Array, 
  position: number, 
  frameCount: number, 
  frameSize: number
): Float32Array {
  const pos = position * (frameCount - 1);
  const frame0 = Math.floor(pos);
  const frame1 = Math.min(frame0 + 1, frameCount - 1);
  const frac = pos - frame0;
  
  const f0 = extractWavetableFrame(data, frame0, frameSize);
  const f1 = extractWavetableFrame(data, frame1, frameSize);
  
  const result = new Float32Array(frameSize);
  for (let i = 0; i < frameSize; i++) {
    result[i] = f0[i]! * (1 - frac) + f1[i]! * frac;
  }
  
  return result;
}
'''
    
    output_path.write_text(ts_code)
    print(f"Generated TypeScript types: {output_path}")

def main():
    parser = argparse.ArgumentParser(description='Download and parse synth assets')
    parser.add_argument('--output-dir', type=str, default='./assets', help='Output directory for downloads')
    parser.add_argument('--db-path', type=str, default='./synth-assets.db', help='SQLite database path')
    parser.add_argument('--ts-output', type=str, default='./synth-asset-db.ts', help='TypeScript output path')
    parser.add_argument('--surge-only', action='store_true', help='Only download Surge assets')
    parser.add_argument('--vital-only', action='store_true', help='Only download Vital assets')
    
    args = parser.parse_args()
    
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    db_path = Path(args.db_path)
    ts_output = Path(args.ts_output)
    
    print("=" * 60)
    print("Synth Asset Downloader")
    print("=" * 60)
    print(f"Output directory: {output_dir}")
    print(f"Database path: {db_path}")
    print(f"TypeScript output: {ts_output}")
    
    # Create database
    conn = create_database(str(db_path))
    
    total_wt = 0
    total_presets = 0
    
    try:
        if not args.vital_only:
            surge_wt, surge_presets = download_surge_assets(conn, output_dir)
            total_wt += surge_wt
            total_presets += surge_presets
        
        if not args.surge_only:
            vital_wt, vital_presets = download_vital_assets(conn, output_dir)
            total_wt += vital_wt
            total_presets += vital_presets
        
        # Store metadata
        cursor = conn.cursor()
        cursor.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', 
                      ('last_updated', datetime.datetime.now().isoformat()))
        cursor.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
                      ('version', '1.0.0'))
        cursor.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
                      ('total_wavetables', str(total_wt)))
        cursor.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
                      ('total_presets', str(total_presets)))
        conn.commit()
        
    finally:
        conn.close()
    
    # Generate TypeScript
    generate_typescript_types(ts_output)
    
    print("\n" + "=" * 60)
    print("COMPLETE")
    print("=" * 60)
    print(f"Total wavetables: {total_wt}")
    print(f"Total presets: {total_presets}")
    print(f"Database: {db_path}")
    print(f"TypeScript: {ts_output}")

import datetime

if __name__ == '__main__':
    main()
