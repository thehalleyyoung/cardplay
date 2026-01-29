/**
 * @fileoverview Board-Specific AI Query Handlers
 *
 * Implements persona-specific AI queries that are aware of the active
 * board type and route to the appropriate Prolog KB predicates.
 *
 * Roadmap items:
 *   - M046-M048: Notation board AI queries
 *   - M110-M112: Tracker board AI queries
 *   - M189-M191: Sound designer board AI queries
 *   - M269-M271: Producer board AI queries
 *
 * @module @cardplay/ai/advisor/board-specific-queries
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { loadPersonaKB, type PersonaId } from '../knowledge/persona-loader';
import type { AdvisorAnswer, HostAction, FollowUp } from './advisor-interface';

// =============================================================================
// Types
// =============================================================================

/** Board-specific query context. */
export interface BoardQueryContext {
  /** Active persona/board type */
  readonly persona: PersonaId;
  /** Additional context parameters */
  readonly params?: Record<string, string | number>;
}

// =============================================================================
// Internal helpers
// =============================================================================

async function ensurePersonaLoaded(
  persona: PersonaId,
  adapter: PrologAdapter,
): Promise<void> {
  await loadPersonaKB(persona, adapter);
}

function answer(
  text: string,
  opts: {
    confidence?: number;
    source?: string;
    actions?: HostAction[];
    followUps?: FollowUp[];
    explanation?: string;
  } = {},
): AdvisorAnswer {
  return {
    text,
    confidence: opts.confidence ?? 80,
    canAnswer: true,
    source: opts.source ?? 'persona-kb',
    ...(opts.actions && { actions: opts.actions }),
    ...(opts.followUps && { followUps: opts.followUps }),
    ...(opts.explanation && { explanation: opts.explanation }),
  };
}

// =============================================================================
// M046–M048: Notation Board AI Queries
// =============================================================================

/**
 * M046: "How should I lay out this score?"
 */
export async function queryScoreLayout(
  instruments: string[],
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer> {
  await ensurePersonaLoaded('notation-composer', adapter);

  const guidelines: Array<{ instrument: string; range: string; difficulty: string }> = [];
  for (const inst of instruments) {
    const results = await adapter.queryAll(
      `orchestration_guideline(${inst}, range(Low, High), Difficulty)`,
    );
    for (const r of results) {
      guidelines.push({
        instrument: inst,
        range: `MIDI ${r.Low}–${r.High}`,
        difficulty: String(r.Difficulty),
      });
    }
  }

  // Query engraving rules
  const engravingRules = await adapter.queryAll('engraving_rule(Id, Desc)');
  const topRules = engravingRules.slice(0, 3).map((r) => String(r.Desc));

  const instList = guidelines
    .map((g) => `${g.instrument} (${g.range}, ${g.difficulty})`)
    .join('; ');

  return answer(
    `For a score with ${instruments.join(', ')}:\n` +
      `• Instrument ranges: ${instList || 'no range data available'}\n` +
      `• Key engraving rules: ${topRules.join('. ') || 'follow standard notation practice'}.\n` +
      `Use orchestral order (winds, brass, percussion, strings) from top to bottom.`,
    {
      confidence: 85,
      source: 'notation-composer-kb',
      followUps: [
        { question: 'What are common doublings for this instrumentation?', category: 'expand' },
        { question: 'Where should I place page breaks?', category: 'related' },
      ],
    },
  );
}

/**
 * M047: "What are common doublings for this instrumentation?"
 */
export async function queryDoublings(
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer> {
  await ensurePersonaLoaded('notation-composer', adapter);

  const doublings = await adapter.queryAll('doubling_rule(Id, Description)');
  const spacings = await adapter.queryAll('spacing_rule(Id, Description)');

  const doublingText = doublings
    .map((r) => `• ${String(r.Id)}: ${String(r.Description)}`)
    .join('\n');
  const spacingText = spacings
    .map((r) => `• ${String(r.Id)}: ${String(r.Description)}`)
    .join('\n');

  return answer(
    `Common doubling techniques:\n${doublingText}\n\nVoicing/spacing options:\n${spacingText}`,
    {
      confidence: 90,
      source: 'notation-composer-kb',
      followUps: [
        { question: 'How should I lay out this score?', category: 'related' },
        { question: 'What counterpoint rules should I follow?', category: 'expand' },
      ],
    },
  );
}

/**
 * M048: "Where should I place page breaks?"
 */
export async function queryPageBreaks(
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer> {
  await ensurePersonaLoaded('notation-composer', adapter);

  const sysRules = await adapter.queryAll('system_break_rule(Id, Description)');
  const pageRules = await adapter.queryAll('page_turn_rule(Id, Description)');

  const sysText = sysRules.map((r) => `• ${String(r.Description)}`).join('\n');
  const pageText = pageRules.map((r) => `• ${String(r.Description)}`).join('\n');

  return answer(
    `System break guidelines:\n${sysText}\n\nPage turn guidelines:\n${pageText}`,
    {
      confidence: 90,
      source: 'notation-composer-kb',
      followUps: [
        { question: 'How should I lay out this score?', category: 'related' },
      ],
    },
  );
}

// =============================================================================
// M110–M112: Tracker Board AI Queries
// =============================================================================

/**
 * M110: "What pattern length should I use?"
 */
export async function queryPatternLength(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer> {
  await ensurePersonaLoaded('tracker-user', adapter);

  const results = await adapter.queryAll(
    `pattern_length_convention(${genre}, Length)`,
  );
  const lengths = results.map((r) => Number(r.Length));

  if (lengths.length > 0) {
    return answer(
      `For ${genre}, typical pattern lengths are ${lengths.join(' or ')} rows. ` +
        `Shorter patterns (${Math.min(...lengths)}) work well for quick loops; ` +
        `longer ones (${Math.max(...lengths)}) allow more variation.`,
      {
        confidence: 90,
        source: 'tracker-user-kb',
        actions: [{
          type: 'setParam',
          target: 'pattern-editor',
          params: { patternLength: lengths[0]! },
          description: `Set pattern length to ${lengths[0]} rows`,
        }],
        followUps: [
          { question: 'Which samples work for this genre?', category: 'related' },
          { question: 'How do I create swing in tracker?', category: 'related' },
        ],
      },
    );
  }

  return answer(
    `I don't have specific pattern length data for "${genre}". ` +
      `Common defaults are 64 rows (4/4 time at 1 row per 16th note) or 128 rows for longer phrases.`,
    { confidence: 60, source: 'tracker-user-kb' },
  );
}

/**
 * M111: "Which samples work for techno kick?" (or any genre/type combo)
 */
export async function querySampleSuggestion(
  genre: string,
  trackType: string,
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer> {
  await ensurePersonaLoaded('tracker-user', adapter);

  // Get effect chain presets for the track type
  const effectResults = await adapter.queryAll(
    `effect_chain_preset(${trackType}, Style, Effects)`,
  );
  const chains = effectResults.map((r) => ({
    style: String(r.Style),
    effects: Array.isArray(r.Effects) ? r.Effects.map(String) : [String(r.Effects)],
  }));

  if (chains.length > 0) {
    const chainText = chains
      .map((c) => `• ${c.style}: ${c.effects.join(' → ')}`)
      .join('\n');

    return answer(
      `For ${genre} ${trackType} samples, look for sounds that work with these processing chains:\n${chainText}\n\n` +
        `Browse by type in the sample browser for "${trackType}" sounds.`,
      {
        confidence: 80,
        source: 'tracker-user-kb',
        actions: [{
          type: 'navigate',
          params: { deck: 'sample-browser', filter: trackType },
          description: `Open sample browser filtered to ${trackType}`,
        }],
        followUps: [
          { question: 'What effect chain should I use?', category: 'expand' },
          { question: 'What pattern length should I use?', category: 'related' },
        ],
      },
    );
  }

  return answer(
    `For ${trackType} sounds in ${genre}, browse samples by type. ` +
      `Layer multiple samples for a unique character.`,
    { confidence: 60, source: 'tracker-user-kb' },
  );
}

/**
 * M112: "How do I create swing in tracker?"
 */
export async function querySwingInTracker(
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer> {
  await ensurePersonaLoaded('tracker-user', adapter);

  const templates = await adapter.queryAll('groove_template(Id, Offsets)');
  const humanization = await adapter.queryAll('humanization_amount(Genre, Amount)');

  const templateText = templates
    .map((r) => `• ${String(r.Id)}: offsets ${JSON.stringify(r.Offsets)}`)
    .join('\n');
  const humanText = humanization
    .slice(0, 4)
    .map((r) => `${String(r.Genre)}: ${r.Amount} ticks`)
    .join(', ');

  return answer(
    `To create swing in a tracker:\n` +
      `1. Apply a groove template to shift timing of off-beat notes.\n` +
      `2. Use humanization to add subtle random offsets.\n\n` +
      `Available groove templates:\n${templateText}\n\n` +
      `Humanization amounts by genre: ${humanText}.`,
    {
      confidence: 90,
      source: 'tracker-user-kb',
      followUps: [
        { question: 'What pattern length should I use?', category: 'related' },
        { question: 'Which samples work for this genre?', category: 'related' },
      ],
    },
  );
}

// =============================================================================
// M189–M191: Sound Designer Board AI Queries
// =============================================================================

/**
 * M189: "How do I create a lush pad?"
 */
export async function queryCreateSound(
  soundType: string,
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer> {
  await ensurePersonaLoaded('sound-designer', adapter);

  // Get synthesis techniques
  const synthResults = await adapter.queryAll(
    `synthesis_for_sound_type(${soundType}, Technique)`,
  );
  const techniques = synthResults.map((r) => String(r.Technique));

  // Get effect chains
  const fxResults = await adapter.queryAll(
    `effect_chain_for_sound_type(${soundType}, Style, Effects)`,
  );
  const chains = fxResults.map((r) => ({
    style: String(r.Style),
    effects: Array.isArray(r.Effects) ? r.Effects.map(String) : [String(r.Effects)],
  }));

  const synthText = techniques.length > 0
    ? `Recommended synthesis: ${techniques.join(', ')}`
    : `No specific synthesis data for "${soundType}"`;

  const fxText = chains.length > 0
    ? chains.map((c) => `• ${c.style}: ${c.effects.join(' → ')}`).join('\n')
    : 'Standard FX chain: reverb → delay → EQ';

  return answer(
    `To create a ${soundType} sound:\n` +
      `${synthText}.\n\nEffect chains:\n${fxText}`,
    {
      confidence: techniques.length > 0 ? 85 : 60,
      source: 'sound-designer-kb',
      followUps: [
        { question: 'What modulation creates movement?', category: 'expand' },
        { question: 'How to layer sounds effectively?', category: 'related' },
      ],
    },
  );
}

/**
 * M190: "What modulation creates wobble bass?"
 */
export async function queryModulationForEffect(
  character: string,
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer> {
  await ensurePersonaLoaded('sound-designer', adapter);

  const results = await adapter.queryAll(
    `modulation_routing_pattern(${character}, Source, Targets)`,
  );

  if (results.length > 0) {
    const routings = results.map((r) => {
      const targets = Array.isArray(r.Targets) ? r.Targets.map(String) : [String(r.Targets)];
      return `• Source: ${String(r.Source)} → Targets: ${targets.join(', ')}`;
    });

    return answer(
      `Modulation routing for "${character}" effect:\n${routings.join('\n')}`,
      {
        confidence: 85,
        source: 'sound-designer-kb',
        followUps: [
          { question: 'How do I create a lush pad?', category: 'related' },
          { question: 'How to layer sounds effectively?', category: 'related' },
        ],
      },
    );
  }

  // Fall back to all modulation patterns
  const allResults = await adapter.queryAll(
    'modulation_routing_pattern(Name, Source, Targets)',
  );
  const availableNames = [...new Set(allResults.map((r) => String(r.Name)))];

  return answer(
    `I don't have a specific routing for "${character}". ` +
      `Available modulation patterns: ${availableNames.join(', ')}.`,
    { confidence: 50, source: 'sound-designer-kb' },
  );
}

/**
 * M191: "How to layer sounds effectively?"
 */
export async function queryLayering(
  targetCharacter: string,
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer> {
  await ensurePersonaLoaded('sound-designer', adapter);

  const result = await adapter.querySingle(
    `layering_rule(${targetCharacter}, Roles, Notes)`,
  );

  if (result) {
    const roles = Array.isArray(result.Roles) ? result.Roles.map(String) : [String(result.Roles)];
    return answer(
      `Layering for "${targetCharacter}":\n` +
        `• Layers: ${roles.join(', ')}\n` +
        `• Notes: ${String(result.Notes)}`,
      {
        confidence: 85,
        source: 'sound-designer-kb',
        followUps: [
          { question: 'How do I create a lush pad?', category: 'related' },
          { question: 'What modulation creates movement?', category: 'related' },
        ],
      },
    );
  }

  // Fall back to all layering rules
  const allResults = await adapter.queryAll('layering_rule(Character, Roles, Notes)');
  const characters = allResults.map((r) => String(r.Character));

  return answer(
    `I don't have specific layering data for "${targetCharacter}". ` +
      `Available layering templates: ${characters.join(', ')}.`,
    { confidence: 50, source: 'sound-designer-kb' },
  );
}

// =============================================================================
// M269–M271: Producer Board AI Queries
// =============================================================================

/**
 * M269: "How do I structure a house track?"
 */
export async function queryTrackStructure(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer> {
  await ensurePersonaLoaded('producer', adapter);

  const result = await adapter.querySingle(
    `arrangement_structure(${genre}, Sections)`,
  );

  if (result) {
    const sections = Array.isArray(result.Sections)
      ? result.Sections.map(String)
      : [String(result.Sections)];

    return answer(
      `Typical ${genre} track structure:\n` +
        sections.map((s, i) => `${i + 1}. ${s}`).join('\n'),
      {
        confidence: 90,
        source: 'producer-kb',
        followUps: [
          { question: 'What mix balance should I aim for?', category: 'related' },
          { question: 'Is my master too loud?', category: 'related' },
        ],
      },
    );
  }

  return answer(
    `I don't have a specific structure template for "${genre}". ` +
      `A common structure is: intro → verse → chorus → verse → chorus → bridge → chorus → outro.`,
    { confidence: 60, source: 'producer-kb' },
  );
}

/**
 * M270: "What's a good lofi hip hop mix balance?"
 */
export async function queryMixBalance(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer> {
  await ensurePersonaLoaded('producer', adapter);

  // Get mixing checklist
  const checklistResult = await adapter.querySingle(
    `suggest_mix_checklist(${genre}, Checklist)`,
  );

  // Get track organization
  const orgResult = await adapter.querySingle(
    `track_organization(${genre}, Groups)`,
  );

  let text = `Mix balance guidance for ${genre}:\n`;

  if (checklistResult) {
    const steps = Array.isArray(checklistResult.Checklist)
      ? checklistResult.Checklist.map(String)
      : [String(checklistResult.Checklist)];
    text += `\nMixing checklist:\n${steps.map((s) => `• ${s}`).join('\n')}`;
  }

  if (orgResult) {
    const groups = Array.isArray(orgResult.Groups) ? orgResult.Groups : [];
    if (groups.length > 0) {
      text += `\n\nTrack organization:`;
      for (const g of groups) {
        if (typeof g === 'object' && g !== null && 'args' in g) {
          const args = (g as { args: unknown[] }).args;
          const tracks = Array.isArray(args[1]) ? args[1].map(String).join(', ') : String(args[1]);
          text += `\n• ${String(args[0])}: ${tracks}`;
        }
      }
    }
  }

  return answer(text, {
    confidence: checklistResult ? 85 : 60,
    source: 'producer-kb',
    followUps: [
      { question: 'How do I structure this track?', category: 'related' },
      { question: 'Is my master too loud?', category: 'related' },
    ],
  });
}

/**
 * M271: "Is my master too loud?"
 */
export async function queryMasteringLoudness(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer> {
  await ensurePersonaLoaded('producer', adapter);

  const result = await adapter.querySingle(
    `mastering_target(${genre}, LUFS, DR)`,
  );

  // Also get loudness rules
  const loudnessRules = await adapter.queryAll(
    'loudness_analysis_rule(Context, Target)',
  );

  if (result) {
    const lufs = Number(result.LUFS);
    const dr = Number(result.DR);

    let rulesText = '';
    if (loudnessRules.length > 0) {
      rulesText = '\n\nPlatform targets:\n' +
        loudnessRules.map((r) => `• ${String(r.Context)}: ${String(r.Target)}`).join('\n');
    }

    return answer(
      `Mastering targets for ${genre}:\n` +
        `• Target loudness: ${lufs} LUFS\n` +
        `• Dynamic range: ${dr} dB\n` +
        `If your master exceeds ${lufs + 2} LUFS, it may sound over-compressed.` +
        rulesText,
      {
        confidence: 90,
        source: 'producer-kb',
        followUps: [
          { question: 'What mix balance should I aim for?', category: 'related' },
          { question: 'How do I structure this track?', category: 'related' },
        ],
      },
    );
  }

  return answer(
    `I don't have specific mastering targets for "${genre}". ` +
      `General guidance: aim for -14 LUFS for streaming platforms, ` +
      `-10 to -8 LUFS for club music, and -18 to -16 LUFS for classical/film.`,
    { confidence: 65, source: 'producer-kb' },
  );
}

// =============================================================================
// Router: dispatch board-specific question by persona
// =============================================================================

/**
 * Route a board-specific AI question to the appropriate persona handler.
 * This is the main entry point for board-aware queries.
 */
export async function handleBoardSpecificQuery(
  question: string,
  context: BoardQueryContext,
  adapter: PrologAdapter = getPrologAdapter(),
): Promise<AdvisorAnswer | null> {
  const q = question.toLowerCase();

  switch (context.persona) {
    case 'notation-composer': {
      if (/lay\s?out|score.*layout|arrange.*staves/i.test(q)) {
        const instruments = (context.params?.instruments as unknown as string)?.split(',') ?? [];
        return queryScoreLayout(instruments, adapter);
      }
      if (/doubling|double/i.test(q)) return queryDoublings(adapter);
      if (/page.?break|page.?turn/i.test(q)) return queryPageBreaks(adapter);
      break;
    }
    case 'tracker-user': {
      if (/pattern.*length|how.*long.*pattern/i.test(q)) {
        const genre = String(context.params?.genre ?? 'techno');
        return queryPatternLength(genre, adapter);
      }
      if (/sample|which.*sound/i.test(q)) {
        const genre = String(context.params?.genre ?? 'techno');
        const trackType = String(context.params?.trackType ?? 'kick');
        return querySampleSuggestion(genre, trackType, adapter);
      }
      if (/swing|groove|humaniz/i.test(q)) return querySwingInTracker(adapter);
      break;
    }
    case 'sound-designer': {
      if (/create.*(?:pad|lead|bass|string|key)|how.*(?:make|design)/i.test(q)) {
        const soundType = String(context.params?.soundType ?? 'pad');
        return queryCreateSound(soundType, adapter);
      }
      if (/modulation|wobble|vibrato|tremolo/i.test(q)) {
        const character = String(context.params?.character ?? 'vibrato');
        return queryModulationForEffect(character, adapter);
      }
      if (/layer/i.test(q)) {
        const target = String(context.params?.targetCharacter ?? 'thick_pad');
        return queryLayering(target, adapter);
      }
      break;
    }
    case 'producer': {
      if (/structure|arrange/i.test(q)) {
        const genre = String(context.params?.genre ?? 'house');
        return queryTrackStructure(genre, adapter);
      }
      if (/mix.*balance|level|volume/i.test(q)) {
        const genre = String(context.params?.genre ?? 'electronic');
        return queryMixBalance(genre, adapter);
      }
      if (/master.*loud|lufs|loudness|too.*loud/i.test(q)) {
        const genre = String(context.params?.genre ?? 'pop');
        return queryMasteringLoudness(genre, adapter);
      }
      break;
    }
  }

  return null; // No match — fall through to general advisor
}
