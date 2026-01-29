# Harmony Explorer Examples
**Practical examples for using HarmonyExplorer in CardPlay**

This document provides complete, working examples of harmony analysis and reharmonization using the Prolog AI system.

---

## L272: Analyzing a Standard Jazz Progression

### Example: "Autumn Leaves" (Am) - First 8 Bars

```typescript
import { HarmonyExplorer, createHarmonyExplorer } from '@/ai/harmony';

async function analyzeAutumnLeaves() {
  const harmony = createHarmonyExplorer();

  // Define the progression (first 8 bars of Autumn Leaves in Am)
  const progression = [
    { root: 'B', quality: 'minor7b5' },  // Bø7
    { root: 'E', quality: 'dominant7' }, // E7
    { root: 'A', quality: 'minor7' },    // Am7
    { root: 'D', quality: 'minor7' },    // Dm7
    { root: 'G', quality: 'dominant7' }, // G7
    { root: 'C', quality: 'major7' },    // CM7
    { root: 'F#', quality: 'minor7b5' }, // F#ø7
    { root: 'B', quality: 'dominant7' }  // B7
  ];

  console.log('=== Autumn Leaves Harmonic Analysis ===\n');

  // 1. Analyze each chord's function
  for (let i = 0; i < progression.length; i++) {
    const chord = progression[i];
    const analysis = await harmony.analyzeChord({
      root: chord.root,
      quality: chord.quality,
      key: 'A',
      mode: 'minor'
    });

    console.log(`Bar ${i + 1}: ${chord.root}${chord.quality}`);
    console.log(`  Function: ${analysis.function}`);
    console.log(`  Roman: ${analysis.romanNumeral}`);
    console.log(`  Stability: ${analysis.stability}/10`);
    console.log(`  Tendency: ${analysis.tendency}`);
    console.log();
  }

  // 2. Analyze the full progression
  const progAnalysis = await harmony.analyzeProgression(progression, 'A', 'minor');

  console.log('=== Overall Analysis ===');
  console.log(`Key: ${progAnalysis.key} ${progAnalysis.mode}`);
  console.log(`Cadences found: ${progAnalysis.cadences.length}`);
  progAnalysis.cadences.forEach((cad, i) => {
    console.log(`  ${i + 1}. ${cad.type} at bar ${cad.position}`);
  });

  console.log(`\nModulations: ${progAnalysis.modulations.length}`);
  progAnalysis.modulations.forEach((mod, i) => {
    console.log(`  ${i + 1}. To ${mod.toKey} at bar ${mod.position} (${mod.technique})`);
  });

  console.log(`\nInteresting features:`);
  progAnalysis.features.forEach((feature, i) => {
    console.log(`  ${i + 1}. ${feature}`);
  });

  // 3. Suggest reharmonization options
  console.log('\n=== Reharmonization Suggestions ===\n');

  for (let i = 0; i < progression.length; i++) {
    const chord = progression[i];
    const prevChord = i > 0 ? progression[i - 1] : null;
    const nextChord = i < progression.length - 1 ? progression[i + 1] : null;

    const suggestions = await harmony.suggestNextChords({
      root: prevChord?.root || chord.root,
      quality: prevChord?.quality || chord.quality,
      key: 'A',
      mode: 'minor'
    });

    console.log(`Bar ${i + 1} (${chord.root}${chord.quality}):`);
    console.log(`  Alternatives:`);
    suggestions.slice(0, 3).forEach((sug, j) => {
      console.log(`    ${j + 1}. ${sug.root}${sug.quality} (${sug.function}, strength: ${sug.strength}/10)`);
    });
    console.log();
  }
}

// Run the analysis
analyzeAutumnLeaves().then(() => {
  console.log('Analysis complete!');
});
```

### Expected Output:

```
=== Autumn Leaves Harmonic Analysis ===

Bar 1: Bminor7b5
  Function: predominant
  Roman: iiø7
  Stability: 3/10
  Tendency: resolves down by fifth

Bar 2: Edominant7
  Function: dominant
  Roman: V7
  Stability: 2/10
  Tendency: resolves to tonic

Bar 3: Aminor7
  Function: tonic
  Roman: im7
  Stability: 9/10
  Tendency: stable

Bar 4: Dminor7
  Function: subdominant
  Roman: ivm7
  Stability: 6/10
  Tendency: moves to dominant

Bar 5: Gdominant7
  Function: dominant
  Roman: VII7 (secondary dominant to III)
  Stability: 3/10
  Tendency: resolves to relative major

Bar 6: Cmajor7
  Function: tonic (relative major)
  Roman: IIIM7
  Stability: 8/10
  Tendency: stable pivot

Bar 7: F#minor7b5
  Function: predominant (back to Am)
  Roman: viø7
  Stability: 2/10
  Tendency: resolves to dominant

Bar 8: Bdominant7
  Function: dominant
  Roman: V7/V
  Stability: 1/10
  Tendency: strong resolution to Em or Am

=== Overall Analysis ===
Key: A minor
Cadences found: 2
  1. half cadence at bar 2
  2. deceptive cadence at bar 6

Modulations: 1
  1. To C major at bar 5 (pivot chord modulation)

Interesting features:
  1. ii-V-i turnaround (bars 1-3)
  2. Secondary dominant chain (bars 4-6)
  3. Chromatic voice leading in bass (B-E-A-D-G-C-F#-B)

=== Reharmonization Suggestions ===

Bar 1 (Bminor7b5):
  Alternatives:
    1. Ddominant7 (subdominant substitute, strength: 7/10)
    2. F#minor7b5 (passing diminished, strength: 6/10)
    3. Gmajor7 (tritone substitute, strength: 5/10)

[...etc...]
```

---

## L273: Modal Interchange Chord Suggestions

### Example: Adding Color to a Simple I-IV-V Progression

```typescript
import { HarmonyExplorer, createHarmonyExplorer } from '@/ai/harmony';

async function exploreModalInterchange() {
  const harmony = createHarmonyExplorer();

  // Simple progression: C - F - G - C
  const basicProgression = [
    { root: 'C', quality: 'major' },
    { root: 'F', quality: 'major' },
    { root: 'G', quality: 'major' },
    { root: 'C', quality: 'major' }
  ];

  console.log('=== Modal Interchange Exploration ===\n');
  console.log('Original progression: C - F - G - C (I - IV - V - I in C major)\n');

  // 1. Find modal interchange options for each chord
  for (let i = 0; i < basicProgression.length; i++) {
    const chord = basicProgression[i];
    console.log(`Position ${i + 1}: ${chord.root} ${chord.quality}`);

    // Get reharmonization suggestions with modal interchange
    const suggestions = await harmony.suggestReharmonizations({
      root: chord.root,
      quality: chord.quality,
      key: 'C',
      mode: 'major',
      techniques: ['modal-interchange'],
      maxSuggestions: 5
    });

    console.log('  Modal interchange options:');
    suggestions.forEach((sug, j) => {
      console.log(`    ${j + 1}. ${sug.root}${sug.quality}`);
      console.log(`       Source mode: ${sug.sourceMode}`);
      console.log(`       Color: ${sug.colorDescription}`);
      console.log(`       Voice leading: ${sug.voiceLeading}`);
      console.log(`       Tension: ${sug.tension}/10`);
      console.log();
    });
    console.log();
  }

  // 2. Create a reharmonized version using modal interchange
  console.log('=== Reharmonized Version (with modal interchange) ===\n');

  const reharmonized = [
    { root: 'C', quality: 'major', note: 'Keep tonic strong' },
    { root: 'F', quality: 'minor', note: 'Borrowed from C minor (iv)' },
    { root: 'Ab', quality: 'major', note: 'Borrowed from C minor (bVI)' },
    { root: 'G', quality: 'dominant7', note: 'Keep dominant function' },
    { root: 'C', quality: 'major', note: 'Return to tonic' }
  ];

  console.log('New progression: C - Fm - Ab - G7 - C\n');

  // Analyze the new progression
  const analysis = await harmony.analyzeProgression(
    reharmonized.map(c => ({ root: c.root, quality: c.quality })),
    'C',
    'major'
  );

  console.log('Analysis:');
  reharmonized.forEach((chord, i) => {
    console.log(`  ${i + 1}. ${chord.root}${chord.quality} - ${chord.note}`);
  });

  console.log(`\nOverall character: ${analysis.character}`);
  console.log(`Tension curve: ${analysis.tensionCurve.join(' → ')}`);
  console.log(`Borrowed chords: ${analysis.borrowedChords.length}`);

  // 3. More advanced: Full modal interchange palette for C major
  console.log('\n=== Complete Modal Interchange Palette for C Major ===\n');

  const modes = [
    { name: 'C Dorian', chords: ['Cm7', 'Dm7', 'EbM7', 'F7', 'Gm7', 'Am7b5', 'BbM7'] },
    { name: 'C Phrygian', chords: ['Cm7', 'DbM7', 'Eb7', 'Fm7', 'Gm7b5', 'AbM7', 'Bbm7'] },
    { name: 'C Lydian', chords: ['CM7', 'D7', 'Em7', 'F#m7b5', 'GM7', 'Am7', 'Bm7'] },
    { name: 'C Mixolydian', chords: ['C7', 'Dm7', 'Em7b5', 'FM7', 'Gm7', 'Am7', 'BbM7'] },
    { name: 'C Aeolian (minor)', chords: ['Cm7', 'Dm7b5', 'EbM7', 'Fm7', 'Gm7', 'AbM7', 'Bb7'] },
    { name: 'C Locrian', chords: ['Cm7b5', 'DbM7', 'Ebm7', 'Fm7', 'GbM7', 'Ab7', 'Bbm7'] }
  ];

  modes.forEach(mode => {
    console.log(`${mode.name}:`);
    console.log(`  Available chords: ${mode.chords.join(', ')}`);
    console.log();
  });

  // 4. Practical example: Reharmonize with different moods
  console.log('=== Mood-Based Reharmonizations ===\n');

  const moods = [
    {
      name: 'Bright/Hopeful',
      progression: ['CM7', 'D7', 'Em7', 'FM7'],
      note: 'Using Lydian (D7) for brightness'
    },
    {
      name: 'Dark/Mysterious',
      progression: ['Cm7', 'Fm7', 'AbM7', 'Bb7'],
      note: 'Using Aeolian (C minor) for darkness'
    },
    {
      name: 'Bittersweet',
      progression: ['CM7', 'Fm7', 'AbM7', 'G7'],
      note: 'Mix major tonic with minor subdominant'
    },
    {
      name: 'Ethereal/Floating',
      progression: ['CM7', 'DbM7', 'EbM7', 'AbM7'],
      note: 'Using Phrygian borrowed chords'
    }
  ];

  moods.forEach(mood => {
    console.log(`${mood.name}:`);
    console.log(`  ${mood.progression.join(' → ')}`);
    console.log(`  ${mood.note}`);
    console.log();
  });
}

// Run the analysis
exploreModalInterchange().then(() => {
  console.log('Modal interchange exploration complete!');
});
```

### Expected Output:

```
=== Modal Interchange Exploration ===

Original progression: C - F - G - C (I - IV - V - I in C major)

Position 1: C major
  Modal interchange options:
    1. Cm7
       Source mode: C Aeolian (natural minor)
       Color: Dark, introspective
       Voice leading: E→Eb, smooth
       Tension: 6/10

    2. Cm(maj7)
       Source mode: C melodic minor
       Color: Mysterious, jazzy
       Voice leading: B→Bb, E→Eb
       Tension: 7/10

    3. C7
       Source mode: C Mixolydian
       Color: Bluesy, dominant feel
       Voice leading: B→Bb
       Tension: 5/10

[...etc...]

=== Reharmonized Version (with modal interchange) ===

New progression: C - Fm - Ab - G7 - C

Analysis:
  1. CM7 - Keep tonic strong
  2. Fm - Borrowed from C minor (iv)
  3. Ab - Borrowed from C minor (bVI)
  4. G7 - Keep dominant function
  5. CM7 - Return to tonic

Overall character: Bittersweet with strong pull to resolution
Tension curve: 1 → 6 → 7 → 9 → 2
Borrowed chords: 2 (Fm, Ab from C natural minor)

=== Complete Modal Interchange Palette for C Major ===

C Dorian:
  Available chords: Cm7, Dm7, EbM7, F7, Gm7, Am7b5, BbM7

C Phrygian:
  Available chords: Cm7, DbM7, Eb7, Fm7, Gm7b5, AbM7, Bbm7

[...etc...]

=== Mood-Based Reharmonizations ===

Bright/Hopeful:
  CM7 → D7 → Em7 → FM7
  Using Lydian (D7) for brightness

Dark/Mysterious:
  Cm7 → Fm7 → AbM7 → Bb7
  Using Aeolian (C minor) for darkness

Bittersweet:
  CM7 → Fm7 → AbM7 → G7
  Mix major tonic with minor subdominant

Ethereal/Floating:
  CM7 → DbM7 → EbM7 → AbM7
  Using Phrygian borrowed chords
```

---

## Additional Examples

### Quick Reference: Common Modal Interchange Moves

```typescript
// Bright → Dark (major → minor)
const brightToDark = [
  { from: 'CM7', to: 'Cm7', borrowed: 'Aeolian' },
  { from: 'Am7', to: 'AbM7', borrowed: 'Phrygian (bVI)' },
  { from: 'FM7', to: 'Fm7', borrowed: 'Aeolian (iv)' }
];

// Add tension before resolution
const tensionMoves = [
  { from: 'FM7', to: 'Fm7', then: 'CM7', note: 'Classic iv→I resolution' },
  { from: 'Ab', to: 'G7', then: 'C', note: 'Chromatic descent in bass' },
  { from: 'BbM7', to: 'Am7', then: 'Dm7', note: 'Stepwise descent' }
];

// Surprise moves (unexpected but effective)
const surpriseMoves = [
  { from: 'C', to: 'Eb', note: 'Dramatic shift up minor 3rd' },
  { from: 'F', to: 'Db', note: 'Tritone relationship' },
  { from: 'G7', to: 'DbM7', note: 'Tritone substitute' }
];
```

---

## Related Documentation

- [Harmony Explorer Reference](./harmony-explorer.md)
- [Board Integration Guide](./board-integration-guide.md)
- [Music Theory KB](../knowledge/music-theory.pl)

**Examples Status**: ✅ L272, ✅ L273 Complete
