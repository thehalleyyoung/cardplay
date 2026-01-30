/**
 * Built-in Sample Packs
 */

import type { SamplePack } from './types';

export const lofiDrumsPack: SamplePack = {
  id: 'builtin-lofi-drums',
  name: 'Lofi Drums',
  description: 'Warm, dusty drum samples perfect for lofi hip hop and chill beats',
  category: 'drums',
  difficulty: 'beginner',
  tags: ['lofi', 'hip-hop', 'drums', 'chill', 'vintage'],
  author: 'CardPlay Team',
  version: '1.0.0',
  icon: 'lofi-drums.svg',
  samples: [
    { id: 'lofi-kick-01', name: 'Kick 01', path: 'samples/lofi-drums/kick-01.wav', category: 'drums', tags: ['kick', 'lofi'], bpm: 85, duration: 0.5, size: 24000 },
    { id: 'lofi-kick-02', name: 'Kick 02', path: 'samples/lofi-drums/kick-02.wav', category: 'drums', tags: ['kick', 'lofi'], bpm: 85, duration: 0.6, size: 25000 },
    { id: 'lofi-snare-01', name: 'Snare 01', path: 'samples/lofi-drums/snare-01.wav', category: 'drums', tags: ['snare', 'lofi'], duration: 0.4, size: 20000 },
    { id: 'lofi-snare-02', name: 'Snare 02', path: 'samples/lofi-drums/snare-02.wav', category: 'drums', tags: ['snare', 'lofi'], duration: 0.45, size: 21000 },
    { id: 'lofi-hat-closed', name: 'Closed Hi-Hat', path: 'samples/lofi-drums/hat-closed.wav', category: 'drums', tags: ['hihat', 'closed', 'lofi'], duration: 0.15, size: 8000 },
    { id: 'lofi-hat-open', name: 'Open Hi-Hat', path: 'samples/lofi-drums/hat-open.wav', category: 'drums', tags: ['hihat', 'open', 'lofi'], duration: 0.8, size: 35000 },
    { id: 'lofi-clap', name: 'Clap', path: 'samples/lofi-drums/clap.wav', category: 'percussion', tags: ['clap', 'lofi'], duration: 0.3, size: 15000 },
    { id: 'lofi-rim', name: 'Rimshot', path: 'samples/lofi-drums/rim.wav', category: 'percussion', tags: ['rim', 'lofi'], duration: 0.2, size: 10000 },
  ],
  totalSize: 158000,
  createdAt: '2026-01-29T00:00:00Z',
  updatedAt: '2026-01-29T00:00:00Z',
};

export const synthOneShotsPack: SamplePack = {
  id: 'builtin-synth-oneshots',
  name: 'Synth One-Shots',
  description: 'Essential synthesizer one-shots: basses, leads, and pads',
  category: 'bass',
  difficulty: 'intermediate',
  tags: ['synth', 'bass', 'leads', 'pads', 'electronic'],
  author: 'CardPlay Team',
  version: '1.0.0',
  icon: 'synth-oneshots.svg',
  samples: [
    { id: 'synth-bass-01', name: 'Sub Bass C', path: 'samples/synth/bass-c.wav', category: 'bass', tags: ['bass', 'sub', 'synth'], key: 'C', duration: 2.0, size: 96000 },
    { id: 'synth-bass-02', name: 'Reese Bass C', path: 'samples/synth/reese-c.wav', category: 'bass', tags: ['bass', 'reese', 'synth'], key: 'C', duration: 2.0, size: 96000 },
    { id: 'synth-lead-01', name: 'Square Lead C', path: 'samples/synth/lead-square-c.wav', category: 'leads', tags: ['lead', 'square', 'synth'], key: 'C', duration: 1.5, size: 72000 },
    { id: 'synth-lead-02', name: 'Saw Lead C', path: 'samples/synth/lead-saw-c.wav', category: 'leads', tags: ['lead', 'saw', 'synth'], key: 'C', duration: 1.5, size: 72000 },
    { id: 'synth-pad-01', name: 'Warm Pad C', path: 'samples/synth/pad-warm-c.wav', category: 'pads', tags: ['pad', 'warm', 'synth'], key: 'C', duration: 4.0, size: 192000 },
    { id: 'synth-pad-02', name: 'Bright Pad C', path: 'samples/synth/pad-bright-c.wav', category: 'pads', tags: ['pad', 'bright', 'synth'], key: 'C', duration: 4.0, size: 192000 },
  ],
  totalSize: 720000,
  createdAt: '2026-01-29T00:00:00Z',
  updatedAt: '2026-01-29T00:00:00Z',
};

export const orchestralSamplesPack: SamplePack = {
  id: 'builtin-orchestral',
  name: 'Orchestral Samples',
  description: 'Basic orchestral samples: strings, brass, and woodwinds',
  category: 'orchestral',
  difficulty: 'advanced',
  tags: ['orchestral', 'strings', 'brass', 'woodwinds', 'classical'],
  author: 'CardPlay Team',
  version: '1.0.0',
  icon: 'orchestral.svg',
  samples: [
    { id: 'orch-violin-c4', name: 'Violin C4', path: 'samples/orchestral/violin-c4.wav', category: 'orchestral', tags: ['violin', 'strings'], key: 'C4', duration: 2.5, size: 120000 },
    { id: 'orch-viola-c3', name: 'Viola C3', path: 'samples/orchestral/viola-c3.wav', category: 'orchestral', tags: ['viola', 'strings'], key: 'C3', duration: 2.5, size: 120000 },
    { id: 'orch-cello-c2', name: 'Cello C2', path: 'samples/orchestral/cello-c2.wav', category: 'orchestral', tags: ['cello', 'strings'], key: 'C2', duration: 3.0, size: 144000 },
    { id: 'orch-contrabass-c1', name: 'Contrabass C1', path: 'samples/orchestral/bass-c1.wav', category: 'orchestral', tags: ['contrabass', 'strings'], key: 'C1', duration: 3.0, size: 144000 },
    { id: 'orch-trumpet-c4', name: 'Trumpet C4', path: 'samples/orchestral/trumpet-c4.wav', category: 'orchestral', tags: ['trumpet', 'brass'], key: 'C4', duration: 2.0, size: 96000 },
    { id: 'orch-trombone-c2', name: 'Trombone C2', path: 'samples/orchestral/trombone-c2.wav', category: 'orchestral', tags: ['trombone', 'brass'], key: 'C2', duration: 2.5, size: 120000 },
    { id: 'orch-flute-c5', name: 'Flute C5', path: 'samples/orchestral/flute-c5.wav', category: 'orchestral', tags: ['flute', 'woodwinds'], key: 'C5', duration: 2.0, size: 96000 },
    { id: 'orch-clarinet-c4', name: 'Clarinet C4', path: 'samples/orchestral/clarinet-c4.wav', category: 'orchestral', tags: ['clarinet', 'woodwinds'], key: 'C4', duration: 2.5, size: 120000 },
  ],
  totalSize: 960000,
  createdAt: '2026-01-29T00:00:00Z',
  updatedAt: '2026-01-29T00:00:00Z',
};

export const builtinSamplePacks: SamplePack[] = [
  lofiDrumsPack,
  synthOneShotsPack,
  orchestralSamplesPack,
];
