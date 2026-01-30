/**
 * @fileoverview Theory-Driven Levers for GOFAI Planning
 * 
 * Step 268 [Sem] — Define "theory-driven levers" that depend on analysis
 * (e.g., tension increase via chromatic mediants if harmony permits).
 * 
 * This module implements sophisticated musical transformations that are informed by
 * harmonic analysis and music theory. Unlike simple perceptual levers (brightness, width),
 * theory-driven levers:
 * 
 * 1. Require harmonic analysis of the current material
 * 2. Generate transformations based on functional relationships
 * 3. Respect voice leading and harmonic syntax
 * 4. Provide theoretical explanations for their suggestions
 * 5. Validate transformations against style constraints
 * 
 * Categories of theory-driven levers:
 * - Harmonic substitution (tritone sub, modal interchange, etc.)
 * - Voice leading optimization
 * - Tension modulation (approach chords, suspensions, extensions)
 * - Modal transformation (mode mixture, modal modulation)
 * - Functional reharmonization (secondary dominants, cadential enrichment)
 * - Chromatic mediant relationships
 * - Neo-Riemannian transformations
 * - Contrapuntal devices (contrary motion, parallel motion control)
 * 
 * @module @cardplay/gofai/planning/theory-driven-levers
 */

import type { ChordSymbol, ScaleDegree, KeySignature } from '../../ai/theory/music-spec';
import type { PrologQueryLayer } from './prolog-query-layer';
import type { Provenance } from '../pipeline/types';
import type { Opcode } from './plan-types';

// ============================================================================
// TYPES - Analysis Results
// ============================================================================

/**
 * Harmonic analysis of a section
 */
export interface HarmonicAnalysis {
  readonly key: KeySignature;
  readonly chords: readonly AnalyzedChord[];
  readonly cadences: readonly CadenceLocation[];
  readonly modulations: readonly Modulation[];
  readonly functionalStructure: readonly FunctionalSegment[];
  readonly tensionProfile: readonly number[];
  readonly confidence: number;
}

/**
 * Analyzed chord with contextual information
 */
export interface AnalyzedChord {
  readonly symbol: ChordSymbol;
  readonly onset: number;
  readonly duration: number;
  readonly scaleDegree: ScaleDegree;
  readonly function: 'tonic' | 'subdominant' | 'dominant' | 'pre_dominant' | 'auxiliary';
  readonly tension: number;
  readonly dissonance: number;
  readonly voicing?: string;
  readonly inversion?: number;
}

/**
 * Cadence location and type
 */
export interface CadenceLocation {
  readonly type: 'authentic' | 'plagal' | 'deceptive' | 'half' | 'phrygian';
  readonly onset: number;
  readonly strength: number;
  readonly chords: readonly ChordSymbol[];
}

/**
 * Modulation point
 */
export interface Modulation {
  readonly fromKey: KeySignature;
  readonly toKey: KeySignature;
  readonly onset: number;
  readonly type: 'direct' | 'pivot' | 'chromatic' | 'modal';
  readonly pivotChord?: ChordSymbol;
}

/**
 * Functional segment
 */
export interface FunctionalSegment {
  readonly function: string;
  readonly startOnset: number;
  readonly endOnset: number;
  readonly chords: readonly ChordSymbol[];
}

// ============================================================================
// TYPES - Lever Inputs and Outputs
// ============================================================================

/**
 * Input for theory-driven lever generation
 */
export interface TheoryLeverInput {
  readonly analysis: HarmonicAnalysis;
  readonly goal: TensionGoal | HarmonicGoal | VoiceLeadingGoal;
  readonly constraints: TheoryConstraints;
  readonly style?: 'jazz' | 'classical' | 'pop' | 'modal' | 'chromatic';
}

/**
 * Tension manipulation goal
 */
export interface TensionGoal {
  readonly type: 'tension';
  readonly delta: number;
  readonly method?: 'harmonic' | 'melodic' | 'rhythmic' | 'combined';
  readonly targetSections?: readonly number[];
}

/**
 * Harmonic goal
 */
export interface HarmonicGoal {
  readonly type: 'harmonic';
  readonly target: 'richer' | 'simpler' | 'darker' | 'brighter' | 'more_dissonant' | 'more_consonant';
  readonly intensity: number;
}

/**
 * Voice leading goal
 */
export interface VoiceLeadingGoal {
  readonly type: 'voice_leading';
  readonly target: 'smoother' | 'more_contrary' | 'more_parallel' | 'wider_range' | 'narrower_range';
  readonly maxLeap?: number;
}

/**
 * Theory constraints
 */
export interface TheoryConstraints {
  readonly preserveFunction?: boolean;
  readonly preserveScaleDegrees?: readonly ScaleDegree[];
  readonly allowBorrowedChords?: boolean;
  readonly allowSecondaryDominants?: boolean;
  readonly allowChromaticMediants?: boolean;
  readonly allowModalMixture?: boolean;
  readonly maxTensionIncrease?: number;
  readonly voiceLeadingStyle?: 'strict' | 'moderate' | 'free';
}

/**
 * Theory-driven lever output
 */
export interface TheoryLever {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly theoreticalBasis: string;
  readonly opcodes: readonly Opcode[];
  readonly expectedEffect: {
    readonly tensionDelta: number;
    readonly complexityDelta: number;
    readonly functionalChange: boolean;
  };
  readonly confidence: number;
  readonly provenance: Provenance;
}

// ============================================================================
// THEORY-DRIVEN LEVER GENERATOR
// ============================================================================

/**
 * Generates theory-informed musical transformation levers
 */
export class TheoryDrivenLeverGenerator {
  private prologLayer: PrologQueryLayer;

  constructor(prologLayer: PrologQueryLayer) {
    this.prologLayer = prologLayer;
  }

  /**
   * Generate levers based on analysis and goal
   */
  async generateLevers(input: TheoryLeverInput): Promise<readonly TheoryLever[]> {
    const levers: TheoryLever[] = [];

    // Select appropriate lever generation strategies based on goal type
    if (input.goal.type === 'tension') {
      levers.push(...await this.generateTensionLevers(input));
    } else if (input.goal.type === 'harmonic') {
      levers.push(...await this.generateHarmonicLevers(input));
    } else if (input.goal.type === 'voice_leading') {
      levers.push(...await this.generateVoiceLeadingLevers(input));
    }

    // Filter by constraints
    return this.filterByConstraints(levers, input.constraints);
  }

  // ============================================================================
  // TENSION LEVERS
  // ============================================================================

  /**
   * Generate levers for tension manipulation
   */
  private async generateTensionLevers(input: TheoryLeverInput): Promise<readonly TheoryLever[]> {
    const goal = input.goal as TensionGoal;
    const levers: TheoryLever[] = [];

    if (goal.delta > 0) {
      // Increase tension
      levers.push(...await this.generateTensionIncreaseLevers(input));
    } else {
      // Decrease tension
      levers.push(...await this.generateTensionDecreaseLevers(input));
    }

    return levers;
  }

  /**
   * Generate tension increase levers
   */
  private async generateTensionIncreaseLevers(input: TheoryLeverInput): Promise<readonly TheoryLever[]> {
    const levers: TheoryLever[] = [];
    const { analysis, constraints } = input;

    // 1. Chromatic mediant substitutions
    if (constraints.allowChromaticMediants !== false) {
      for (const chord of analysis.chords) {
        if (chord.function === 'tonic' || chord.function === 'subdominant') {
          const mediants = await this.findChromaticMediants(chord.symbol, analysis.key);
          for (const mediant of mediants) {
            levers.push({
              id: `chromatic_mediant_${chord.onset}`,
              name: 'Chromatic Mediant Substitution',
              description: `Replace ${chord.symbol} with ${mediant.substitute} (chromatic mediant relationship)`,
              theoreticalBasis: 'Chromatic mediant provides unexpected harmonic color while maintaining some common tones',
              opcodes: [{
                type: 'substitute_chord',
                scope: { onset: chord.onset, duration: chord.duration },
                params: {
                  originalChord: chord.symbol,
                  newChord: mediant.substitute
                },
                reason: `Chromatic mediant to increase harmonic tension`,
                cost: 0.7,
                provenance: {
                  source: 'theory_driven_lever',
                  rule: 'chromatic_mediant',
                  timestamp: Date.now(),
                  confidence: mediant.confidence
                }
              }],
              expectedEffect: {
                tensionDelta: 0.4,
                complexityDelta: 0.3,
                functionalChange: false
              },
              confidence: mediant.confidence,
              provenance: {
                source: 'theory_driven_lever',
                rule: 'chromatic_mediant',
                timestamp: Date.now(),
                confidence: mediant.confidence
              }
            });
          }
        }
      }
    }

    // 2. Secondary dominant insertion
    if (constraints.allowSecondaryDominants !== false) {
      for (let i = 0; i < analysis.chords.length - 1; i++) {
        const current = analysis.chords[i];
        const next = analysis.chords[i + 1];
        
        if (next.function !== 'dominant') {
          const secondaryDom = await this.findSecondaryDominant(next.symbol, analysis.key);
          if (secondaryDom) {
            levers.push({
              id: `secondary_dominant_${current.onset}`,
              name: 'Secondary Dominant Insertion',
              description: `Insert ${secondaryDom} before ${next.symbol}`,
              theoreticalBasis: 'Secondary dominant creates temporary tonicization and increases forward motion',
              opcodes: [{
                type: 'insert_chord',
                scope: { onset: current.onset + current.duration * 0.5, duration: current.duration * 0.5 },
                params: {
                  chord: secondaryDom,
                  voicing: 'dominant'
                },
                reason: 'Secondary dominant to increase tension',
                cost: 0.5,
                provenance: {
                  source: 'theory_driven_lever',
                  rule: 'secondary_dominant',
                  timestamp: Date.now(),
                  confidence: 0.8
                }
              }],
              expectedEffect: {
                tensionDelta: 0.3,
                complexityDelta: 0.2,
                functionalChange: false
              },
              confidence: 0.8,
              provenance: {
                source: 'theory_driven_lever',
                rule: 'secondary_dominant',
                timestamp: Date.now(),
                confidence: 0.8
              }
            });
          }
        }
      }
    }

    // 3. Add chord extensions
    for (const chord of analysis.chords) {
      if (chord.function === 'dominant') {
        const extensions = this.suggestDominantExtensions(chord.symbol);
        for (const ext of extensions) {
          levers.push({
            id: `add_extension_${chord.onset}`,
            name: 'Add Chord Extension',
            description: `Enrich ${chord.symbol} with ${ext.extensionName}`,
            theoreticalBasis: `${ext.theoreticalBasis}`,
            opcodes: [{
              type: 'modify_chord_quality',
              scope: { onset: chord.onset, duration: chord.duration },
              params: {
                chord: chord.symbol,
                extensions: ext.extensions
              },
              reason: 'Add tension through extensions',
              cost: 0.3,
              provenance: {
                source: 'theory_driven_lever',
                rule: 'chord_extension',
                timestamp: Date.now(),
                confidence: 0.9
              }
            }],
            expectedEffect: {
              tensionDelta: ext.tensionIncrease,
              complexityDelta: 0.1,
              functionalChange: false
            },
            confidence: 0.9,
            provenance: {
              source: 'theory_driven_lever',
              rule: 'chord_extension',
              timestamp: Date.now(),
              confidence: 0.9
            }
          });
        }
      }
    }

    // 4. Modal mixture (borrowed chords)
    if (constraints.allowModalMixture !== false) {
      for (const chord of analysis.chords) {
        const borrowed = await this.findBorrowedChords(chord.symbol, analysis.key);
        for (const borrowing of borrowed) {
          levers.push({
            id: `modal_mixture_${chord.onset}`,
            name: 'Modal Mixture',
            description: `Replace ${chord.symbol} with ${borrowing.substitute} from parallel ${borrowing.sourceMode}`,
            theoreticalBasis: `Borrowed chord from parallel ${borrowing.sourceMode} mode creates coloristic tension`,
            opcodes: [{
              type: 'substitute_chord',
              scope: { onset: chord.onset, duration: chord.duration },
              params: {
                originalChord: chord.symbol,
                newChord: borrowing.substitute
              },
              reason: 'Modal mixture for harmonic color',
              cost: 0.6,
              provenance: {
                source: 'theory_driven_lever',
                rule: 'modal_mixture',
                timestamp: Date.now(),
                confidence: borrowing.confidence
              }
            }],
            expectedEffect: {
              tensionDelta: 0.35,
              complexityDelta: 0.25,
              functionalChange: false
            },
            confidence: borrowing.confidence,
            provenance: {
              source: 'theory_driven_lever',
              rule: 'modal_mixture',
              timestamp: Date.now(),
              confidence: borrowing.confidence
            }
          });
        }
      }
    }

    // 5. Tritone substitution
    for (const chord of analysis.chords) {
      if (chord.function === 'dominant') {
        const tritoneSub = this.computeTritoneSubstitution(chord.symbol);
        if (tritoneSub) {
          levers.push({
            id: `tritone_sub_${chord.onset}`,
            name: 'Tritone Substitution',
            description: `Replace ${chord.symbol} with ${tritoneSub}`,
            theoreticalBasis: 'Tritone substitution shares tritone interval and common resolution tendencies',
            opcodes: [{
              type: 'substitute_chord',
              scope: { onset: chord.onset, duration: chord.duration },
              params: {
                originalChord: chord.symbol,
                newChord: tritoneSub
              },
              reason: 'Tritone substitution for chromatic color',
              cost: 0.55,
              provenance: {
                source: 'theory_driven_lever',
                rule: 'tritone_substitution',
                timestamp: Date.now(),
                confidence: 0.85
              }
            }],
            expectedEffect: {
              tensionDelta: 0.25,
              complexityDelta: 0.2,
              functionalChange: false
            },
            confidence: 0.85,
            provenance: {
              source: 'theory_driven_lever',
              rule: 'tritone_substitution',
              timestamp: Date.now(),
              confidence: 0.85
            }
          });
        }
      }
    }

    return levers;
  }

  /**
   * Generate tension decrease levers
   */
  private async generateTensionDecreaseLevers(input: TheoryLeverInput): Promise<readonly TheoryLever[]> {
    const levers: TheoryLever[] = [];
    const { analysis } = input;

    // 1. Remove extensions
    for (const chord of analysis.chords) {
      if (this.hasExtensions(chord.symbol)) {
        levers.push({
          id: `remove_extensions_${chord.onset}`,
          name: 'Simplify Chord Quality',
          description: `Simplify ${chord.symbol} to basic triad`,
          theoreticalBasis: 'Remove upper extensions to reduce harmonic complexity',
          opcodes: [{
            type: 'modify_chord_quality',
            scope: { onset: chord.onset, duration: chord.duration },
            params: {
              chord: chord.symbol,
              extensions: []
            },
            reason: 'Simplify to reduce tension',
            cost: 0.2,
            provenance: {
              source: 'theory_driven_lever',
              rule: 'simplify_chord',
              timestamp: Date.now(),
              confidence: 0.95
            }
          }],
          expectedEffect: {
            tensionDelta: -0.2,
            complexityDelta: -0.3,
            functionalChange: false
          },
          confidence: 0.95,
          provenance: {
            source: 'theory_driven_lever',
            rule: 'simplify_chord',
            timestamp: Date.now(),
            confidence: 0.95
          }
        });
      }
    }

    // 2. Diatonic substitutions for chromatic chords
    for (const chord of analysis.chords) {
      if (this.isChromaticToKey(chord.symbol, analysis.key)) {
        const diatonic = await this.findDiatonicSubstitute(chord.symbol, analysis.key);
        if (diatonic) {
          levers.push({
            id: `diatonic_sub_${chord.onset}`,
            name: 'Diatonic Substitution',
            description: `Replace ${chord.symbol} with diatonic ${diatonic}`,
            theoreticalBasis: 'Replace chromatic chord with diatonic equivalent',
            opcodes: [{
              type: 'substitute_chord',
              scope: { onset: chord.onset, duration: chord.duration },
              params: {
                originalChord: chord.symbol,
                newChord: diatonic
              },
              reason: 'Diatonic substitution to reduce tension',
              cost: 0.4,
              provenance: {
                source: 'theory_driven_lever',
                rule: 'diatonic_substitution',
                timestamp: Date.now(),
                confidence: 0.8
              }
            }],
            expectedEffect: {
              tensionDelta: -0.3,
              complexityDelta: -0.2,
              functionalChange: false
            },
            confidence: 0.8,
            provenance: {
              source: 'theory_driven_lever',
              rule: 'diatonic_substitution',
              timestamp: Date.now(),
              confidence: 0.8
            }
          });
        }
      }
    }

    return levers;
  }

  // ============================================================================
  // HARMONIC LEVERS
  // ============================================================================

  /**
   * Generate levers for harmonic transformation
   */
  private async generateHarmonicLevers(input: TheoryLeverInput): Promise<readonly TheoryLever[]> {
    const goal = input.goal as HarmonicGoal;
    const levers: TheoryLever[] = [];

    switch (goal.target) {
      case 'richer':
        levers.push(...await this.generateEnrichmentLevers(input));
        break;
      case 'simpler':
        levers.push(...await this.generateSimplificationLevers(input));
        break;
      case 'darker':
        levers.push(...await this.generateDarkerHarmonyLevers(input));
        break;
      case 'brighter':
        levers.push(...await this.generateBrighterHarmonyLevers(input));
        break;
      case 'more_dissonant':
        levers.push(...await this.generateDissonanceLevers(input));
        break;
      case 'more_consonant':
        levers.push(...await this.generateConsonanceLevers(input));
        break;
    }

    return levers;
  }

  /**
   * Generate harmonic enrichment levers
   */
  private async generateEnrichmentLevers(input: TheoryLeverInput): Promise<readonly TheoryLever[]> {
    const levers: TheoryLever[] = [];
    const { analysis } = input;

    // Add passing chords
    for (let i = 0; i < analysis.chords.length - 1; i++) {
      const current = analysis.chords[i];
      const next = analysis.chords[i + 1];
      
      const passingChord = await this.findPassingChord(current.symbol, next.symbol, analysis.key);
      if (passingChord) {
        levers.push({
          id: `passing_chord_${current.onset}`,
          name: 'Insert Passing Chord',
          description: `Insert ${passingChord} between ${current.symbol} and ${next.symbol}`,
          theoreticalBasis: 'Passing chord creates smoother harmonic motion',
          opcodes: [{
            type: 'insert_chord',
            scope: { onset: current.onset + current.duration * 0.75, duration: current.duration * 0.25 },
            params: {
              chord: passingChord,
              voicing: 'passing'
            },
            reason: 'Enrich harmony with passing motion',
            cost: 0.4,
            provenance: {
              source: 'theory_driven_lever',
              rule: 'passing_chord',
              timestamp: Date.now(),
              confidence: 0.75
            }
          }],
          expectedEffect: {
            tensionDelta: 0.1,
            complexityDelta: 0.3,
            functionalChange: false
          },
          confidence: 0.75,
          provenance: {
            source: 'theory_driven_lever',
            rule: 'passing_chord',
            timestamp: Date.now(),
            confidence: 0.75
          }
        });
      }
    }

    return levers;
  }

  /**
   * Generate simplification levers
   */
  private async generateSimplificationLevers(input: TheoryLeverInput): Promise<readonly TheoryLever[]> {
    const levers: TheoryLever[] = [];
    const { analysis } = input;

    // Remove passing chords
    for (let i = 1; i < analysis.chords.length - 1; i++) {
      const prev = analysis.chords[i - 1];
      const current = analysis.chords[i];
      const next = analysis.chords[i + 1];

      if (this.isPassingChord(prev.symbol, current.symbol, next.symbol)) {
        levers.push({
          id: `remove_passing_${current.onset}`,
          name: 'Remove Passing Chord',
          description: `Remove ${current.symbol} (passing function)`,
          theoreticalBasis: 'Simplify harmonic rhythm by removing passing motion',
          opcodes: [{
            type: 'remove_chord',
            scope: { onset: current.onset, duration: current.duration },
            params: {
              chord: current.symbol
            },
            reason: 'Simplify harmonic structure',
            cost: 0.3,
            provenance: {
              source: 'theory_driven_lever',
              rule: 'remove_passing',
              timestamp: Date.now(),
              confidence: 0.8
            }
          }],
          expectedEffect: {
            tensionDelta: -0.05,
            complexityDelta: -0.3,
            functionalChange: false
          },
          confidence: 0.8,
          provenance: {
            source: 'theory_driven_lever',
            rule: 'remove_passing',
            timestamp: Date.now(),
            confidence: 0.8
          }
        });
      }
    }

    return levers;
  }

  /**
   * Generate darker harmony levers
   */
  private async generateDarkerHarmonyLevers(input: TheoryLeverInput): Promise<readonly TheoryLever[]> {
    const levers: TheoryLever[] = [];
    const { analysis } = input;

    // Convert major to minor
    for (const chord of analysis.chords) {
      if (this.isMajorTriad(chord.symbol)) {
        const minorVersion = this.convertToMinor(chord.symbol);
        levers.push({
          id: `darken_${chord.onset}`,
          name: 'Convert to Minor',
          description: `Convert ${chord.symbol} to ${minorVersion}`,
          theoreticalBasis: 'Minor quality creates darker harmonic color',
          opcodes: [{
            type: 'modify_chord_quality',
            scope: { onset: chord.onset, duration: chord.duration },
            params: {
              chord: chord.symbol,
              quality: 'minor'
            },
            reason: 'Darken harmony',
            cost: 0.35,
            provenance: {
              source: 'theory_driven_lever',
              rule: 'major_to_minor',
              timestamp: Date.now(),
              confidence: 0.9
            }
          }],
          expectedEffect: {
            tensionDelta: 0.15,
            complexityDelta: 0,
            functionalChange: false
          },
          confidence: 0.9,
          provenance: {
            source: 'theory_driven_lever',
            rule: 'major_to_minor',
            timestamp: Date.now(),
            confidence: 0.9
          }
        });
      }
    }

    return levers;
  }

  /**
   * Generate brighter harmony levers
   */
  private async generateBrighterHarmonyLevers(input: TheoryLeverInput): Promise<readonly TheoryLever[]> {
    const levers: TheoryLever[] = [];
    const { analysis } = input;

    // Add Lydian color (raised 4th)
    for (const chord of analysis.chords) {
      if (chord.function === 'subdominant' || chord.scaleDegree === 4) {
        levers.push({
          id: `lydian_color_${chord.onset}`,
          name: 'Add Lydian Color',
          description: `Add raised 4th to ${chord.symbol} for Lydian brightness`,
          theoreticalBasis: 'Lydian mode (#4) creates bright, uplifting quality',
          opcodes: [{
            type: 'modify_chord_quality',
            scope: { onset: chord.onset, duration: chord.duration },
            params: {
              chord: chord.symbol,
              alterations: ['#11']
            },
            reason: 'Brighten harmony with Lydian color',
            cost: 0.4,
            provenance: {
              source: 'theory_driven_lever',
              rule: 'lydian_color',
              timestamp: Date.now(),
              confidence: 0.75
            }
          }],
          expectedEffect: {
            tensionDelta: 0.2,
            complexityDelta: 0.1,
            functionalChange: false
          },
          confidence: 0.75,
          provenance: {
            source: 'theory_driven_lever',
            rule: 'lydian_color',
            timestamp: Date.now(),
            confidence: 0.75
          }
        });
      }
    }

    return levers;
  }

  /**
   * Generate dissonance levers
   */
  private async generateDissonanceLevers(input: TheoryLeverInput): Promise<readonly TheoryLever[]> {
    const levers: TheoryLever[] = [];
    const { analysis } = input;

    // Add cluster voicings
    for (const chord of analysis.chords) {
      levers.push({
        id: `cluster_${chord.onset}`,
        name: 'Add Cluster Voicing',
        description: `Voice ${chord.symbol} with adjacent tones`,
        theoreticalBasis: 'Cluster voicing (adjacent scale degrees) creates controlled dissonance',
        opcodes: [{
          type: 'modify_voicing',
          scope: { onset: chord.onset, duration: chord.duration },
          params: {
            chord: chord.symbol,
            voicing: 'cluster'
          },
          reason: 'Increase dissonance through cluster voicing',
          cost: 0.5,
          provenance: {
            source: 'theory_driven_lever',
            rule: 'cluster_voicing',
            timestamp: Date.now(),
            confidence: 0.7
          }
        }],
        expectedEffect: {
          tensionDelta: 0.4,
          complexityDelta: 0.2,
          functionalChange: false
        },
        confidence: 0.7,
        provenance: {
          source: 'theory_driven_lever',
          rule: 'cluster_voicing',
          timestamp: Date.now(),
          confidence: 0.7
        }
      });
    }

    return levers;
  }

  /**
   * Generate consonance levers
   */
  private async generateConsonanceLevers(input: TheoryLeverInput): Promise<readonly TheoryLever[]> {
    const levers: TheoryLever[] = [];
    const { analysis } = input;

    // Use open voicings
    for (const chord of analysis.chords) {
      levers.push({
        id: `open_voicing_${chord.onset}`,
        name: 'Open Voicing',
        description: `Voice ${chord.symbol} with wider spacing`,
        theoreticalBasis: 'Open voicing (wide spacing) reduces perceived dissonance',
        opcodes: [{
          type: 'modify_voicing',
          scope: { onset: chord.onset, duration: chord.duration },
          params: {
            chord: chord.symbol,
            voicing: 'open'
          },
          reason: 'Increase consonance through open voicing',
          cost: 0.3,
          provenance: {
            source: 'theory_driven_lever',
            rule: 'open_voicing',
            timestamp: Date.now(),
            confidence: 0.85
          }
        }],
        expectedEffect: {
          tensionDelta: -0.2,
          complexityDelta: 0,
          functionalChange: false
        },
        confidence: 0.85,
        provenance: {
          source: 'theory_driven_lever',
          rule: 'open_voicing',
          timestamp: Date.now(),
          confidence: 0.85
        }
      });
    }

    return levers;
  }

  // ============================================================================
  // VOICE LEADING LEVERS
  // ============================================================================

  /**
   * Generate voice leading optimization levers
   */
  private async generateVoiceLeadingLevers(input: TheoryLeverInput): Promise<readonly TheoryLever[]> {
    const goal = input.goal as VoiceLeadingGoal;
    const levers: TheoryLever[] = [];

    // Analyze current voice leading
    const { analysis } = input;
    for (let i = 0; i < analysis.chords.length - 1; i++) {
      const current = analysis.chords[i];
      const next = analysis.chords[i + 1];

      const vlAnalysis = await this.prologLayer.validateVoiceLeading({
        fromChord: current.symbol,
        toChord: next.symbol,
        voicing: current.voicing
      });

      if (!vlAnalysis.valid || vlAnalysis.cost > 0.5) {
        // Suggest improvements
        for (const suggestion of vlAnalysis.suggestions) {
          levers.push({
            id: `vl_improve_${current.onset}`,
            name: 'Improve Voice Leading',
            description: `${suggestion.improvement} between ${current.symbol} and ${next.symbol}`,
            theoreticalBasis: 'Optimize voice leading to minimize motion and avoid parallels',
            opcodes: [{
              type: 'modify_voicing',
              scope: { onset: current.onset, duration: current.duration },
              params: {
                chord: current.symbol,
                voicing: suggestion.voicing
              },
              reason: 'Improve voice leading smoothness',
              cost: suggestion.cost,
              provenance: {
                source: 'theory_driven_lever',
                rule: 'voice_leading_optimization',
                timestamp: Date.now(),
                confidence: 0.8
              }
            }],
            expectedEffect: {
              tensionDelta: 0,
              complexityDelta: 0,
              functionalChange: false
            },
            confidence: 0.8,
            provenance: {
              source: 'theory_driven_lever',
              rule: 'voice_leading_optimization',
              timestamp: Date.now(),
              confidence: 0.8
            }
          });
        }
      }
    }

    return levers;
  }

  // ============================================================================
  // HELPER METHODS - Prolog Queries
  // ============================================================================

  private async findChromaticMediants(
    chord: ChordSymbol,
    key: KeySignature
  ): Promise<readonly { substitute: ChordSymbol; confidence: number }[]> {
    // Query Prolog for chromatic mediant relationships
    const results = await this.prologLayer.queryChordSubstitution({
      chord,
      context: { key },
      constraints: {}
    });

    return results
      .filter(r => r.reason.includes('chromatic mediant'))
      .map(r => ({ substitute: r.substitute, confidence: r.confidence }));
  }

  private async findSecondaryDominant(
    targetChord: ChordSymbol,
    key: KeySignature
  ): Promise<ChordSymbol | undefined> {
    // Compute V7 of target chord
    const root = this.extractRoot(targetChord);
    const dominantRoot = this.transposeByFifth(root);
    return `${dominantRoot}7` as ChordSymbol;
  }

  private async findBorrowedChords(
    chord: ChordSymbol,
    key: KeySignature
  ): Promise<readonly { substitute: ChordSymbol; sourceMode: string; confidence: number }[]> {
    // Query for modal mixture possibilities
    // This would use Prolog to find chords from parallel modes
    return [];
  }

  private async findPassingChord(
    from: ChordSymbol,
    to: ChordSymbol,
    key: KeySignature
  ): Promise<ChordSymbol | undefined> {
    // Find a chord that smoothly connects two chords
    return undefined;
  }

  private async findDiatonicSubstitute(
    chord: ChordSymbol,
    key: KeySignature
  ): Promise<ChordSymbol | undefined> {
    // Find diatonic equivalent
    return undefined;
  }

  // ============================================================================
  // HELPER METHODS - Chord Analysis
  // ============================================================================

  private suggestDominantExtensions(chord: ChordSymbol): readonly {
    extensionName: string;
    extensions: readonly string[];
    tensionIncrease: number;
    theoreticalBasis: string;
  }[] {
    return [
      {
        extensionName: 'altered dominant (b9, #9, #11, b13)',
        extensions: ['b9', '#9', '#11', 'b13'],
        tensionIncrease: 0.5,
        theoreticalBasis: 'Altered scale provides maximum tension before resolution'
      },
      {
        extensionName: '9th',
        extensions: ['9'],
        tensionIncrease: 0.15,
        theoreticalBasis: 'Major 9th adds color without disrupting dominant function'
      },
      {
        extensionName: '13th',
        extensions: ['13'],
        tensionIncrease: 0.2,
        theoreticalBasis: 'Major 13th brightens the dominant sonority'
      }
    ];
  }

  private computeTritoneSubstitution(chord: ChordSymbol): ChordSymbol | undefined {
    const root = this.extractRoot(chord);
    const tritoneRoot = this.transposeBytritone(root);
    return `${tritoneRoot}7` as ChordSymbol;
  }

  private hasExtensions(chord: ChordSymbol): boolean {
    return /\d/.test(chord) && !chord.match(/^[A-G][b#]?$/);
  }

  private isChromaticToKey(chord: ChordSymbol, key: KeySignature): boolean {
    // Simple heuristic - would use proper scale degree analysis
    return chord.includes('b') || chord.includes('#');
  }

  private isPassingChord(prev: ChordSymbol, current: ChordSymbol, next: ChordSymbol): boolean {
    // Simplified - would use proper voice leading analysis
    return false;
  }

  private isMajorTriad(chord: ChordSymbol): boolean {
    return !chord.includes('m') && !chord.includes('dim') && !chord.includes('aug');
  }

  private convertToMinor(chord: ChordSymbol): ChordSymbol {
    const root = this.extractRoot(chord);
    return `${root}m` as ChordSymbol;
  }

  private extractRoot(chord: ChordSymbol): string {
    const match = chord.match(/^([A-G][b#]?)/);
    return match ? match[1] : 'C';
  }

  private transposeByFifth(root: string): string {
    const circle = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
    const index = circle.indexOf(root);
    return index >= 0 ? circle[(index + 1) % 12] : root;
  }

  private transposeBytritone(root: string): string {
    const chromaticMap: Record<string, string> = {
      'C': 'F#', 'C#': 'G', 'Db': 'G', 'D': 'Ab', 'D#': 'A', 'Eb': 'A',
      'E': 'Bb', 'F': 'B', 'F#': 'C', 'Gb': 'C', 'G': 'Db', 'G#': 'D',
      'Ab': 'D', 'A': 'Eb', 'A#': 'E', 'Bb': 'E', 'B': 'F'
    };
    return chromaticMap[root] || root;
  }

  // ============================================================================
  // CONSTRAINT FILTERING
  // ============================================================================

  private filterByConstraints(
    levers: readonly TheoryLever[],
    constraints: TheoryConstraints
  ): readonly TheoryLever[] {
    return levers.filter(lever => {
      // Check tension limits
      if (constraints.maxTensionIncrease !== undefined) {
        if (lever.expectedEffect.tensionDelta > constraints.maxTensionIncrease) {
          return false;
        }
      }

      // Check functional preservation
      if (constraints.preserveFunction && lever.expectedEffect.functionalChange) {
        return false;
      }

      return true;
    });
  }
}

/**
 * Create a theory-driven lever generator
 */
export function createTheoryDrivenLeverGenerator(
  prologLayer: PrologQueryLayer
): TheoryDrivenLeverGenerator {
  return new TheoryDrivenLeverGenerator(prologLayer);
}
