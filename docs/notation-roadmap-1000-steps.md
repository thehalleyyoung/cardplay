# Notation Editor Roadmap: 1000 Steps to Dorico-Level Quality

**Integrated with CardPlay's Card System, Phrase Database, and Arranger**

## Architecture: The ScoreNotationCard

All notation functionality lives in a **single `ScoreNotationCard`** that:
- Receives phrase/generator/transform card outputs as input
- Renders professional-quality notation using the existing notation engine
- Provides bidirectional sync: edits in notation update source cards
- Integrates with arranger sections for score structure
- Exposes parameters for display options, not separate feature cards

```
┌─────────────────────────────────────────────────────────────────┐
│                      ScoreNotationCard                          │
├─────────────────────────────────────────────────────────────────┤
│ Inputs:                                                         │
│   • notes: NoteEvent[] (from phrase/generator cards)           │
│   • arrangerSection: ArrangerSection (from arranger)           │
│   • chordTrack: ChordSymbol[] (from chord progression card)    │
│                                                                 │
│ Parameters:                                                     │
│   • displayMode: 'score' | 'leadSheet' | 'parts'               │
│   • staffConfig: StaffConfig (clefs, transposition, etc.)      │
│   • engraving: EngravingPreset                                  │
│   • pageLayout: PageConfig                                      │
│                                                                 │
│ Outputs:                                                        │
│   • notation: RenderedNotation (for display)                   │
│   • editedNotes: NoteEvent[] (back to source cards)            │
│   • extractedPhrases: Phrase[] (to phrase database)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## I. SCORENOTATIONCARD FOUNDATION (Steps 1-100)

### Core Card Implementation (1-25)
1. Create `ScoreNotationCard` class extending Card base
2. Define input ports: notes, arrangerSection, chordTrack, lyrics
3. Define output ports: notation, editedNotes, extractedPhrases
4. Implement card signature with all parameters
5. Create default parameter values for immediate use
6. Wire card to existing notation/index.ts rendering pipeline
7. Implement `process()` method routing to notation engine
8. Add state management for notation view state
9. Create notation update debouncing for real-time input
10. Implement dirty tracking for changed vs unchanged measures
11. Add caching layer for expensive notation calculations
12. Create incremental update for single-note edits
13. Implement full re-render for structural changes
14. Add error boundary for malformed input events
15. Create fallback display for empty/invalid input
16. Implement card serialization for session save
17. Add card deserialization with version migration
18. Create parameter validation with user feedback
19. Implement undo/redo state integration
20. Add card clone with deep state copy
21. Create card factory for preset configurations
22. Implement card preset save/load
23. Add card parameter automation recording
24. Create parameter interpolation for animated changes
25. Implement card bypass mode (pass-through)

### Phrase Input Processing (26-50)
26. Create phrase event to NotationEvent converter
27. Implement real-time update when input phrase changes
28. Add quantization options as card parameters
29. Create voice assignment from channel/track metadata
30. Implement articulation preservation from phrase events
31. Add dynamics extraction from velocity values
32. Create ornament detection from timing patterns
33. Implement tuplet detection from rhythm analysis
34. Add grace note detection from short durations
35. Create chord voicing analysis from polyphonic input
36. Implement slash notation option for rhythm display
37. Add cue-sized option for background voices
38. Create cross-staff notation from register analysis
39. Implement beam grouping from articulation hints
40. Add tie generation from connected notes
41. Create slur suggestions from legato markings
42. Implement pedal notation from sustain events
43. Add breath marks from phrase gaps
44. Create fermata detection from timing stretches
45. Implement tempo markings from tempo events
46. Add rehearsal marks from section boundaries
47. Create bar lines from metric structure
48. Implement pickup measure detection
49. Add anacrusis handling
50. Create multi-voice merging logic

### Generator Card Integration (51-75)
51. Create arpeggiator output rendering in staff
52. Implement sequencer pattern display
53. Add drum machine to percussion staff
54. Create bassline rendering in bass clef
55. Implement melody generator contour display
56. Add chord progression to chord symbols
57. Create counterpoint voice separation
58. Implement preview during parameter tweaking
59. Add "freeze to notation" action
60. Create diff view for generator variations
61. Implement resolution options (beat/bar/phrase)
62. Add playback position indicator
63. Create loop region visualization
64. Implement pattern repetition notation (simile)
65. Add first/second endings from variations
66. Create D.S./D.C. from structure analysis
67. Implement coda from endings
68. Add segno from jump points
69. Create volta brackets from conditionals
70. Implement tremolo from rapid patterns
71. Add roll notation from drum patterns
72. Create measured tremolo from subdivisions
73. Implement unmeasured tremolo from density
74. Add trill from alternating patterns
75. Create mordent/turn from ornamental patterns

### Transform Card Integration (76-100)
76. Create transpose preview in notation
77. Implement invert with pivot display
78. Add retrograde with direction indicators
79. Create augment with duration display
80. Implement diminish with duration display
81. Add quantize showing grid alignment
82. Create humanize showing timing deviation
83. Implement voice lead with crossing warnings
84. Add octave shift with 8va/8vb lines
85. Create articulation map display
86. Implement dynamics map with hairpins
87. Add tempo map with tempo text
88. Create swing with ratio indicator
89. Implement groove with feel description
90. Add split showing voice separation
91. Create merge showing combination
92. Implement filter showing included/excluded
93. Add delay with offset visualization
94. Create echo with diminishing repeats
95. Implement stretch with proportional spacing
96. Add compress with condensed display
97. Create thin showing removed notes
98. Implement thicken showing added notes
99. Add harmonize with harmony lines
100. Create voicings with chord display

---

## II. ARRANGER-NOTATION INTEGRATION (Steps 101-200)

### Section → Notation Mapping (101-125)
101. Create arranger section boundaries as double barlines
102. Implement section names as rehearsal marks
103. Add section colors as notation highlighting
104. Create section duration as bar count display
105. Implement section tempo as tempo markings
106. Add section key as key signature changes
107. Create section meter as time signature changes
108. Implement section dynamics as dynamic markings
109. Add section articulation as articulation regions
110. Create section expression as expression text
111. Implement section markers as coda/segno/fine
112. Add section repeats as repeat barlines
113. Create section endings as volta brackets
114. Implement section jumps as D.S./D.C. markings
115. Add section fades as hairpin endings
116. Create section crossfades as transition notation
117. Implement section fills as fill notation
118. Add section breaks as caesura marks
119. Create section attacca as attacca indication
120. Implement section tacet as tacet multi-rest
121. Add section solo as solo indication
122. Create section tutti as tutti indication
123. Implement section divisi as divisi marking
124. Add section unison as unison marking
125. Create section cue as cue-sized notation

### Variation → Notation Display (126-150)
126. Create variation A/B comparison in notation
127. Implement variation diff highlighting
128. Add variation overlay mode (transparency)
129. Create variation side-by-side view
130. Implement variation animation (morph between)
131. Add variation percentage blend display
132. Create variation parameter annotation
133. Implement variation source tracking
134. Add variation history timeline
135. Create variation branching visualization
136. Implement variation merge preview
137. Add variation conflict resolution UI
138. Create variation naming in notation header
139. Implement variation numbering in bar numbers
140. Add variation color coding in staff
141. Create variation thumbnail in margin
142. Implement variation preview on hover
143. Add variation playback comparison
144. Create variation score side by side
145. Implement variation part comparison
146. Add variation conductor notes
147. Create variation rehearsal suggestions
148. Implement variation difficulty rating
149. Add variation duration comparison
150. Create variation instrumentation comparison

### Arranger Track Notation View (151-175)
151. Create arranger overview as score map
152. Implement arranger lane as notation timeline
153. Add arranger blocks as system blocks
154. Create arranger colors as staff colors
155. Implement arranger labels as system labels
156. Add arranger markers as rehearsal marks
157. Create arranger tempo track as tempo line
158. Implement arranger key track as key regions
159. Add arranger meter track as meter changes
160. Create arranger dynamics track as dynamics lane
161. Implement arranger expression track as expression line
162. Add arranger articulation track as articulation regions
163. Create arranger lyrics track as lyric line
164. Implement arranger chord track as chord symbols
165. Add arranger form track as form letters
166. Create arranger cue track as cue points
167. Implement arranger comment track as annotations
168. Add arranger marker navigation in notation
169. Create arranger section selection in notation
170. Implement arranger drag-reorder in notation view
171. Add arranger copy/paste in notation context
172. Create arranger undo/redo in notation
173. Implement arranger multi-select in notation
174. Add arranger grouping in notation
175. Create arranger locking in notation

### Form Analysis & Display (176-200)
176. Create automatic form detection (AABA, verse-chorus)
177. Implement form letters in notation margins
178. Add form brackets spanning sections
179. Create form color coding across score
180. Implement form statistics (section lengths)
181. Add form comparison to templates
182. Create form suggestions based on genre
183. Implement form modification tools
184. Add form expansion (add bridge, etc.)
185. Create form contraction (remove section)
186. Implement form reordering drag UI
187. Add form duplication with variation
188. Create form symmetry analysis
189. Implement form golden ratio analysis
190. Add form tension curve visualization
191. Create form energy profile display
192. Implement form dynamic arc visualization
193. Add form harmonic rhythm analysis
194. Create form melodic development tracking
195. Implement form thematic return detection
196. Add form motivic analysis
197. Create form cell/phrase/period hierarchy
198. Implement form cadence detection
199. Add form modulation tracking
200. Create form summary report generation

---

## III. PHRASE DATABASE NOTATION (Steps 201-300)

### Phrase Browser Notation Preview (201-225)
201. Create notation thumbnail for each phrase
202. Implement notation zoom in phrase browser
203. Add notation playback sync with preview
204. Create notation pitch highlighting on play
205. Implement notation scroll follow playback
206. Add notation selection in browser
207. Create notation copy from browser
208. Implement notation comparison in browser
209. Add notation filter by notation features
210. Create notation search by melodic contour
211. Implement notation search by rhythmic pattern
212. Add notation search by chord progression
213. Create notation search by interval pattern
214. Implement notation similarity ranking
215. Add notation difficulty filter
216. Create notation range filter
217. Implement notation duration filter
218. Add notation voice count filter
219. Create notation articulation filter
220. Implement notation dynamics filter
221. Add notation tempo filter
222. Create notation key filter
223. Implement notation meter filter
224. Add notation style filter
225. Create notation genre filter

### Phrase-to-Notation Adaptation (226-250)
226. Create automatic key adaptation on phrase insert
227. Implement automatic tempo adaptation on phrase insert
228. Add automatic meter adaptation on phrase insert
229. Create automatic range adaptation (octave shift)
230. Implement automatic voice assignment on insert
231. Add automatic clef selection on insert
232. Create automatic staff assignment on insert
233. Implement automatic beam grouping adaptation
234. Add automatic tie handling at boundaries
235. Create automatic slur continuation
236. Implement automatic dynamics continuation
237. Add automatic hairpin continuation
238. Create automatic articulation propagation
239. Implement automatic expression propagation
240. Add automatic tempo mark handling
241. Create automatic rehearsal mark handling
242. Implement automatic repeat handling
243. Add automatic ending handling
244. Create automatic coda/segno handling
245. Implement automatic pickup measure handling
246. Add automatic anacrusis adjustment
247. Create automatic final bar handling
248. Implement automatic double bar placement
249. Add automatic repeat bar detection
250. Create automatic simile detection

### Notation-Aware Phrase Operations (251-275)
251. Create phrase split at notation barline
252. Implement phrase merge with notation continuity
253. Add phrase loop with notation repeats
254. Create phrase reverse with notation adjustments
255. Implement phrase invert with clef changes
256. Add phrase transpose with accidental handling
257. Create phrase augment with notation duration
258. Implement phrase diminish with notation duration
259. Add phrase quantize with notation grid
260. Create phrase humanize with notation timing
261. Implement phrase swing with notation feel
262. Add phrase groove with notation articulation
263. Create phrase filter with notation rests
264. Implement phrase thin with notation simplification
265. Add phrase thicken with notation voicing
266. Create phrase harmonize with notation harmony
267. Implement phrase counterpoint with notation voices
268. Add phrase orchestrate with notation parts
269. Create phrase reduce with notation reduction
270. Implement phrase expand with notation expansion
271. Add phrase vary with notation variants
272. Create phrase develop with notation development
273. Implement phrase fragment with notation motives
274. Add phrase sequence with notation transposition
275. Create phrase modulate with notation key changes

### Genre-Specific Notation (276-300)
276. Create jazz lead sheet notation style
277. Implement jazz chord symbol rendering
278. Add jazz slash notation for comping
279. Create jazz rhythm section notation
280. Implement jazz big band score layout
281. Add classical chamber notation style
282. Create classical orchestral score layout
283. Implement classical piano notation
284. Add classical vocal score layout
285. Create pop/rock lead sheet style
286. Implement pop chord chart notation
287. Add Nashville number system display
288. Create country fiddle notation style
289. Implement bluegrass tab integration
290. Add folk song notation with verses
291. Create hymnal notation style
292. Implement choral SATB layout
293. Add gospel chord notation
294. Create R&B/soul groove notation
295. Implement hip-hop beat notation
296. Add EDM pattern notation
297. Create film score notation style
298. Implement theatrical score notation
299. Add video game score notation
300. Create adaptive/interactive score notation

---

## IV. ENGRAVING ENGINE (Steps 301-400)

### Spacing Algorithm (301-325)
301. Implement optical note spacing with duration ratios
302. Create configurable spacing tables per style
303. Add minimum note spacing constraints
304. Create maximum note spacing constraints
305. Implement collision detection for all elements
306. Add automatic collision resolution
307. Create manual adjustment overrides
308. Implement spacing inheritance from phrase data
309. Add spacing adaptation from card parameters
310. Create spacing presets (tight, normal, loose)
311. Implement spacing profiles per genre
312. Add spacing profiles per era (baroque, romantic)
313. Create spacing profiles per publisher
314. Implement spacing comparison tools
315. Add spacing batch adjustment
316. Create spacing reset to defaults
317. Implement spacing undo/redo
318. Add spacing copy between systems
319. Create spacing templates
320. Implement spacing export/import
321. Add spacing documentation
322. Create spacing tutorials
323. Implement spacing accessibility options
324. Add spacing zoom independence
325. Create spacing print optimization

### Vertical Layout (326-350)
326. Create automatic staff distance calculation
327. Implement content-based staff spacing
328. Add bracket/brace spacing rules
329. Create system-to-system spacing
330. Implement page fullness optimization
331. Add vertical justification options
332. Create frame spacing for text/graphics
333. Implement lyrics baseline alignment
334. Add chord symbol positioning
335. Create figured bass placement
336. Implement fingering positioning
337. Add dynamics positioning rules
338. Create hairpin vertical placement
339. Implement expression text placement
340. Add tempo text placement
341. Create rehearsal mark placement
342. Implement pedal line placement
343. Add octave line placement
344. Create trill line placement
345. Implement glissando placement
346. Add arpeggio placement
347. Create bracket/brace scaling
348. Implement staff group labels
349. Add instrument names positioning
350. Create system divider placement

### Horizontal Casting (351-375)
351. Implement casting off algorithm
352. Create configurable bars per system
353. Add system fullness optimization
354. Implement break penalty calculation
355. Create forced break support
356. Implement lock layout option
357. Add frame break support
358. Create page break optimization
359. Implement note spacing stretch limits
360. Add minimum bar width
361. Create maximum bar width
362. Implement pickup bar handling
363. Add multi-rest breaking rules
364. Create repeat barline handling
365. Implement volta bracket breaks
366. Add hairpin break handling
367. Create slur break handling
368. Implement ottava break handling
369. Add pedal line break handling
370. Create trill line break handling
371. Implement glissando break handling
372. Add system-spanning elements
373. Create cross-system beaming
374. Implement cross-system slurs
375. Add cross-system hairpins

### SMuFL & Typography (376-400)
376. Complete SMuFL 1.4 glyph coverage
377. Implement stylistic alternates
378. Add ligature support
379. Create font fallback chain
380. Implement glyph scaling per context
381. Add optical size variants
382. Create stem attachment points
383. Implement anchor points
384. Add bounding box overrides
385. Create custom sidebearings
386. Implement text font integration
387. Add font substitution rules
388. Create missing glyph warnings
389. Implement custom symbol library
390. Add SVG glyph import
391. Create composite glyph creation
392. Implement glyph colorization
393. Add glyph opacity control
394. Create glyph rotation support
395. Implement glyph mirroring
396. Add glyph caching
397. Create web font loading
398. Implement offline font bundle
399. Add font preview/comparison
400. Create font documentation

---

## V. INPUT METHODS (Steps 401-500)

### Card-Aware MIDI Input (401-425)
401. Create MIDI input routed through card chain
402. Implement real-time card processing of MIDI
403. Add notation update from card output
404. Create step-time entry through cards
405. Implement re-pitch mode with card processing
406. Add MIDI splits routed to different cards
407. Create velocity→card parameter mapping
408. Implement sustain pedal→card routing
409. Add CC→card parameter mapping
410. Create pitch bend→card routing
411. Implement aftertouch→card routing
412. Add chord detection card integration
413. Create arpeggio detection card integration
414. Implement tuplet detection from card timing
415. Add swing quantization card
416. Create humanize card for MIDI input
417. Implement MIDI learn for card parameters
418. Add MIDI remote for card bypass/enable
419. Create MIDI filter card before notation
420. Implement MIDI transform card chain
421. Add MIDI split card for voice assignment
422. Create MIDI layer card for doubling
423. Implement MIDI echo card with notation
424. Add MIDI delay card with notation
425. Create MIDI harmonize card with notation

### Keyboard Navigation (426-450)
426. Create comprehensive default keymap
427. Implement customizable shortcuts
428. Add context-sensitive shortcuts
429. Create shortcut conflict detection
430. Implement shortcut search
431. Add shortcut cheat sheet overlay
432. Create mode-specific shortcuts
433. Implement jump bar (command palette)
434. Add popover for duration entry
435. Create popover for pitch entry
436. Implement popover for dynamics
437. Add popover for articulations
438. Create popover for ornaments
439. Implement popover for techniques
440. Add popover for tempo marks
441. Create popover for time signatures
442. Implement popover for key signatures
443. Add popover for clefs
444. Create popover for rehearsal marks
445. Implement popover for chord symbols
446. Add popover for lyrics
447. Create popover for figured bass
448. Implement popover for fingering
449. Add popover for card insertion
450. Create popover for phrase search

### Mouse/Touch with Cards (451-475)
451. Implement click-to-place through card chain
452. Add drag-to-adjust with card constraints
453. Create drag phrase card to notation
454. Implement drag notation to phrase browser
455. Add drag between card and notation
456. Create rubber-band selection
457. Implement lasso selection mode
458. Add marquee selection
459. Create multi-select with modifiers
460. Implement double-click to select bar
461. Add triple-click to select system
462. Create context menu with card options
463. Implement drag-and-drop between staves
464. Add drag-and-drop to card slots
465. Create touch gestures (pinch zoom)
466. Implement touch gestures (scroll)
467. Add stylus pressure→card parameter
468. Create stylus tilt→card parameter
469. Implement hover preview
470. Add snap-to-grid during drag
471. Create guide lines during drag
472. Implement magnetic edges
473. Add copy-drag with modifier
474. Create constrained drag
475. Implement multi-object drag

### AI-Assisted Input (476-500)
476. Implement audio transcription card
477. Add pitch detection card
478. Create rhythm detection card
479. Implement chord recognition card
480. Add melody transcription card
481. Create harmony analysis card
482. Implement form detection card
483. Add style recognition card
484. Create genre classification card
485. Implement AI orchestration card
486. Add AI harmony suggestion card
487. Create AI counterpoint card
488. Implement AI voice leading card
489. Add AI range checking card
490. Create AI difficulty rating card
491. Implement AI phrase suggestion card
492. Add AI variation generation card
493. Create AI continuation card
494. Implement AI completion card
495. Add AI arrangement card
496. Create AI reduction card
497. Implement AI expansion card
498. Add natural language commands
499. Create voice command integration
500. Implement gesture recognition

---

## VI. PLAYBACK INTEGRATION (Steps 501-600)

### ScoreNotationCard Playback Features (501-525)
501. Add playback button to ScoreNotationCard toolbar
502. Implement playhead cursor synchronized with audio
503. Create click-to-play from any notation position
504. Add loop region selection in notation view
505. Implement count-in before playback
506. Create metronome click overlay
507. Add tempo marking interaction (click to change)
508. Implement dynamics playback response
509. Create articulation interpretation settings
510. Add ornament realization options
511. Implement trill speed parameter
512. Create grace note timing parameter
513. Add arpeggio speed parameter
514. Implement glissando rendering with playback
515. Create tremolo measured/unmeasured toggle
516. Add fermata duration parameter
517. Implement rubato parameter
518. Create swing percentage parameter
519. Add humanize amount parameter
520. Implement expression curve editing
521. Create tempo curve editing
522. Add dynamics curve editing
523. Implement interpretation preset selector
524. Create A/B interpretation comparison
525. Add interpretation recording (capture performance)

### ScoreNotationCard Sound Routing (526-550)
526. Create instrument assignment per staff
527. Implement sampler integration for playback
528. Add VST/AU instrument selection
529. Create expression map assignment
530. Implement keyswitch automation from notation
531. Add CC automation from dynamics
532. Create pitch bend from ornaments
533. Implement aftertouch from expression
534. Add MPE output for microtonal
535. Create temperament parameter
536. Implement tuning system parameter
537. Add concert pitch toggle
538. Create transposition display parameter
539. Implement mixer channel routing
540. Add effect send controls
541. Create reverb amount per staff
542. Implement delay for timing effects
543. Add EQ for tonal shaping
544. Create compression for dynamics control
545. Implement master output metering
546. Add loudness normalization
547. Create peak metering display
548. Implement spectrum analyzer overlay
549. Add phase correlation display
550. Create VU meter in notation margin

### Rehearsal Mode (551-575)
551. Create rehearsal mode toggle in ScoreNotationCard
552. Implement loop region bracket in notation
553. Add slow-down practice (tempo reduction)
554. Create speed trainer (gradual tempo increase)
555. Implement section navigation from rehearsal marks
556. Add cue point markers
557. Create marker comments/annotations
558. Implement practice journal integration
559. Add session recording to notation
560. Create take management
561. Implement comping interface
562. Add punch-in recording
563. Create overdub layer display
564. Implement layer visibility toggle
565. Add click track with custom pattern
566. Create subdivision options
567. Implement accent pattern editor
568. Add tempo tap feature
569. Create gradual tempo change tool
570. Implement A-B loop with fade
571. Add loop count display
572. Create practice statistics
573. Implement difficulty analysis
574. Add suggested practice regions
575. Create progress tracking

### Collaborative Features (576-600)
576. Create real-time notation sync parameter
577. Implement user cursor sharing
578. Add selection sharing in notation
579. Create change highlighting
580. Implement attribution display
581. Add comment bubbles on notation
582. Create discussion threads per measure
583. Implement @mention in comments
584. Add notification integration
585. Create activity feed
586. Implement version branching
587. Add merge visualization
588. Create pull request workflow
589. Implement review mode overlay
590. Add approval checkmarks
591. Create sign-off tracking
592. Implement change log display
593. Add release notes generation
594. Create milestone tracking
595. Implement deadline reminders
596. Add progress dashboard
597. Create team assignment per section
598. Implement workload distribution
599. Add deadline visualization
600. Create project template system

---

## VII. NOTATION ELEMENTS AS PARAMETERS (Steps 601-700)

All notation elements are parameters/options within the ScoreNotationCard, not separate cards.

### Note Display Parameters (601-625)
601. Add noteheadStyle parameter (standard, diamond, X, slash, etc.)
602. Implement stemDirection parameter (auto, up, down)
603. Add stemLength parameter (normal, short, extended)
604. Create flagStyle parameter (standard, straight)
605. Implement beamStyle parameter (standard, flat, feathered)
606. Add beamAngle parameter (auto, horizontal, custom)
607. Create secondaryBeamBreaking parameter
608. Implement featheredBeam acceleration/deceleration
609. Add crossStaffBeam toggle
610. Create crossVoiceBeam toggle
611. Implement beamGrouping rules parameter
612. Add stemlessNote toggle for specific durations
613. Create noteheadColor parameter per voice/layer
614. Implement noteheadSize parameter (normal, cue, grace)
615. Add noteheadShape override for specific pitches
616. Create parenthesizedNote toggle (optional/editorial)
617. Implement bracketedNote toggle (analytical)
618. Add circledNote toggle (highlights)
619. Create ghostNote style (lighter color/smaller)
620. Implement xNotehead for percussion/dead notes
621. Add diamondNotehead for harmonics
622. Create slashNotehead for rhythm notation
623. Implement shapeNoteheads toggle (Sacred Harp)
624. Add customNotehead glyph override
625. Create noteDisplayPresets (orchestral, jazz, lead sheet)

### Accidental Parameters (626-650)
626. Add accidentalStyle parameter (standard, Gould, jazz)
627. Implement quarterToneDisplay toggle
628. Add sixthToneDisplay toggle
629. Create microtonalSystem parameter (cents, ratio, etc.)
630. Implement accidentalBrackets toggle
631. Add accidentalParentheses toggle
632. Create editorialAccidentals display style
633. Implement cautionaryAccidentals rules
634. Add courtesyAccidentals scope parameter
635. Create accidentalDuration (measure, note, etc.)
636. Implement accidentalStacking rules
637. Add enharmonicSpelling preference
638. Create keyAwareAccidentals toggle
639. Implement modeAwareAccidentals parameter
640. Add jazzAccidentalStyle parameter
641. Create figuredBassAccidentals display
642. Implement historicalAccidentals toggle
643. Add steinZimmermannAccidentals toggle
644. Create tartiniAccidentals toggle
645. Implement customAccidentalGlyphs parameter
646. Add accidentalFont override
647. Create accidentalColor parameter
648. Implement accidentalScale size parameter
649. Add combinedAccidentals display rules
650. Create accidentalPresets (baroque, modern, jazz)

### Articulation Parameters (651-675)
651. Add articulationPlacement rules (above/below)
652. Implement articulationStacking order
653. Create articulationSlurInteraction rules
654. Implement bowingNotation toggle (strings)
655. Add pizzArcoDisplay toggle
656. Create muteNotation style parameter
657. Implement brassTechniques toggle
658. Add windTechniques toggle
659. Create percussionTechniques toggle
660. Implement vocalTechniques toggle
661. Add guitarTechniques toggle
662. Create ornamentDisplay style parameter
663. Implement baroqueOrnaments realization toggle
664. Add romanticOrnaments style
665. Create contemporaryOrnaments style
666. Implement ornamentRealization toggle
667. Add ornamentPreview playback toggle
668. Create ornamentSimplification toggle
669. Implement ornamentExpansion toggle
670. Add customOrnamentGlyphs parameter
671. Create ornamentLine continuation rules
672. Implement graceNoteSequence display rules
673. Add trillAccidental display
674. Create mordentAccidental display
675. Implement turnAccidental display

### Dynamics Parameters (676-700)
676. Add dynamicsPlacement rules (below/above)
677. Implement hairpinStyle parameter (standard, thin, thick)
678. Add nienteHairpin toggle
679. Create hairpinWithText toggle
680. Implement dynamicsAlignment rules
681. Add groupedDynamics display
682. Create dynamicsTransition smoothing
683. Implement subitoDynamics display style
684. Add fpSfp special dynamics display
685. Create dynamicsPlaybackCurve parameter
686. Implement expressionTextFont parameter
687. Add tempoTextStyle parameter
688. Create characterExpression display
689. Implement multilingualExpression toggle
690. Add expressionLineStyle parameter
691. Create expressionArrow style
692. Implement boxedExpression toggle
693. Add circledExpression toggle
694. Create expressionFontFamily parameter
695. Implement expressionFontSize parameter
696. Add systemExpression visibility
697. Create staffExpression visibility
698. Implement expressionVisibility scope
699. Add expressionTrigger playback link
700. Create dynamicsPresets (classical, jazz, pop)

---

## VIII. ADVANCED NOTATION MODES (Steps 701-800)

All advanced notation features are displayMode options or specialized parameter sets in ScoreNotationCard.

### Contemporary Mode Parameters (701-725)
701. Add graphicNotationFrame mode
702. Implement timeSpaceNotation toggle
703. Add proportionalNotation toggle
704. Create measuredTremolo display parameter
705. Implement unmeasuredTremolo display parameter
706. Add bisbigliando notation style
707. Create harmonicsNotation style (circle, diamond)
708. Implement multiphonicsDisplay toggle
709. Add spectralNotation mode
710. Create noiseNotation symbols
711. Implement extendedTechnique glyph set
712. Add actionNotation layer toggle
713. Create theatricalDirections toggle
714. Implement stagingDiagram overlay
715. Add seatingChart view mode
716. Create electronicsNotation cue style
717. Implement tapeCue markers
718. Add videoCue markers
719. Create lightingCue markers
720. Implement clickTrackCue display
721. Add IEMcue display
722. Create conductorVideo sync
723. Implement networkedPerformance indicators
724. Add liveCoding notation mode
725. Create generativeScore parameter controls

### Aleatoric Mode Parameters (726-750)
726. Add boxNotation frame mode
727. Implement mobileForm section display
728. Add cueBasedSection markers
729. Create timeWindow brackets
730. Implement densityBox display
731. Add textureNotation style
732. Create clusterNotation display
733. Implement bandNotation (pitch range)
734. Add contourLine drawing mode
735. Create shapeNote system toggle
736. Implement graphicTimeAxis mode
737. Add freeformDrawing layer
738. Create arrowSystem connection style
739. Implement wavyLine style parameter
740. Add zigzagLine style parameter
741. Create dottedConnection line style
742. Implement stemlessGroup display
743. Add proportionalSection spacing
744. Create frameLayout mode
745. Implement textScore view
746. Add graphicTemplate overlay
747. Create actionScore markers
748. Implement eventScore timeline
749. Add processNotation display
750. Create indeterminateSection markers

### Historical Mode Parameters (751-775)
751. Add mensuralNotation mode toggle
752. Implement medievalNotation mode toggle
753. Add renaissanceNotation style
754. Create luteTablature mode
755. Implement guitarTablature mode
756. Add figuredBass display toggle
757. Create continuoRealization toggle
758. Implement bassoContinuo display
759. Add facsimileView overlay
760. Create originalClef toggle
761. Implement originalNotation preservation
762. Add diplomaticTranscription mode
763. Create criticalEdition annotation layer
764. Implement variantApparatus display
765. Add sourceComparison view
766. Create collation view mode
767. Implement editorialCommentary layer
768. Add footnoteDisplay style
769. Create endnoteDisplay style
770. Implement criticalReport generation
771. Add stemmaticAnalysis display
772. Create watermarkDisplay overlay
773. Implement paperStudy annotations
774. Add provenanceDisplay layer
775. Create bibliographicInfo display

### World Music Mode Parameters (776-800)
776. Add carnaticNotation mode
777. Implement hindustaniNotation mode
778. Add gamelanNotation mode
779. Create jianpuMode (numbered notation)
780. Implement shakuhachiNotation mode
781. Add maqamNotation mode
782. Create makamNotation mode
783. Implement dastgahNotation mode
784. Add africanDrumNotation mode
785. Create steelDrumNotation mode
786. Implement handpanNotation mode
787. Add didgeridooNotation mode
788. Create bagpipeNotation mode
789. Implement accordionNotation mode
790. Add bandoneonNotation mode
791. Create koraNotation mode
792. Implement kalimbaNotation mode
793. Add mbiraNotation mode
794. Create balafonNotation mode
795. Implement marimbaDeChonta notation
796. Add berimbauNotation mode
797. Create taikoNotation mode
798. Implement gamelanGong notation
799. Add ragaPattern display
800. Create talaCycle display

---

## IX. PART & SCORE LAYOUT (Steps 801-900)

Part and score layout are parameters/view modes in ScoreNotationCard.

### Part Extraction Parameters (801-825)
801. Add automaticPartExtraction action
802. Implement manualPartCreation action
803. Add partAssignment per staff parameter
804. Create divisiHandling rules parameter
805. Implement cueNoteExtraction toggle
806. Add cueSourceSelection parameter
807. Create cueInstrumentLabel display
808. Implement cueClefChange handling
809. Add cueTransposition parameter
810. Create rehearsalMarkPropagation rules
811. Implement tempoMarkPropagation rules
812. Add systemTextPropagation rules
813. Create pageTurnOptimization toggle
814. Implement partLayoutOverride per instrument
815. Add partStaffSize parameter
816. Create partPageSize parameter
817. Implement partMargins parameter
818. Add partHeaderFooter content
819. Create partPageNumber style
820. Implement tacetIndication display
821. Add multiRestGeneration rules
822. Create multiRestNumbering style
823. Implement multiRestSplitting rules
824. Add partTitlePage template
825. Create partInstrumentation display

### Conductor Score Parameters (826-850)
826. Add transposingScore toggle
827. Implement concertPitchScore toggle
828. Add condensedScore view mode
829. Create instrumentGrouping brackets
830. Implement subBracket configuration
831. Add barlineGrouping rules
832. Create staffVisibility per staff
833. Implement automaticStaffHiding toggle
834. Add manualStaffHiding overrides
835. Create systemObjectPositioning rules
836. Implement conductorAnnotation layer
837. Add batonBeatPattern overlay
838. Create breathingMark conductor display
839. Implement cueAnnotation layer
840. Add balanceAnnotation markers
841. Create sectionLabel display
842. Implement instrumentLabel format
843. Add pageTurnWarning markers
844. Create attaccaIndicator display
845. Implement segueAnnotation display
846. Add timingAnnotation markers
847. Create durationSummary display
848. Implement movementSeparation markers
849. Add actSceneMarker display
850. Create stagingCue markers

### Print/Export Parameters (851-875)
851. Add bleedSettings parameter
852. Implement cropMarks toggle
853. Add registrationMarks toggle
854. Create colorSeparation preview
855. Implement spotColor definition
856. Add CMYKPreview mode
857. Create overprintPreview mode
858. Implement transparencyFlatten setting
859. Add fontEmbedding parameter
860. Create fontOutlining toggle
861. Implement imageDownsample quality parameter
862. Add pdfXCompliance toggle
863. Create pdfACompliance toggle
864. Implement printerProfile parameter
865. Add paperSizePreset parameter
866. Create customPaperSize parameter
867. Implement orientation parameter
868. Add bookletPrinting layout
869. Create twoUpPrinting layout
870. Implement nUpPrinting layout
871. Add posterPrinting scaling
872. Create bannerPrinting format
873. Implement watermark text/image
874. Add draftFinalMode toggle
875. Create proofAnnotation layer

### Digital Publishing Parameters (876-900)
876. Add musicXMLExport action
877. Implement musicXMLImport action
878. Add meiExport action
879. Create meiImport action
880. Implement enhancedMidiExport action
881. Add mp3Export action with quality settings
882. Create wavExport action with format settings
883. Implement flacExport action
884. Add videoExport action with settings
885. Create animatedSVGExport action
886. Implement html5InteractiveExport action
887. Add webGLRenderer mode
888. Create embeddableWidgetExport action
889. Implement iframeEmbedCode generation
890. Add socialSharing metadata
891. Create qrCodeGeneration action
892. Implement scoreStreaming mode
893. Add collaborativeViewing toggle
894. Create audienceFollowing sync
895. Implement conductorCamSync parameter
896. Add liveAnnotation toggle
897. Create mobileAppExport action
898. Implement appleMusicMetadata parameter
899. Add spotifyCanvas export
900. Create youtubeChapterMarkers export

---

## X. EXTERNAL INTEGRATION (Steps 901-1000)

External integrations connect ScoreNotationCard to other software and services.

### DAW Integration Parameters (901-925)
901. Add aaxPluginHost toggle
902. Implement vst3PluginHost toggle
903. Add auPluginHost toggle (macOS)
904. Create clapPluginHost toggle
905. Implement sidechainRouting parameter
906. Add midiDeviceInput parameter
907. Create controlSurfaceMapping parameter
908. Implement huiProtocol toggle
909. Add mcuProtocol toggle
910. Create oscAddress parameters
911. Implement abletonLinkSync toggle
912. Add reWireClient toggle
913. Create tempoTrackSync toggle
914. Implement timeSignatureSync toggle
915. Add markerSync toggle
916. Create regionSync toggle
917. Implement loopPointSync toggle
918. Add punchPointSync toggle
919. Create clickTrackSync toggle
920. Implement countInSync toggle
921. Add preRollSync toggle
922. Create postRollSync toggle
923. Implement transportSync toggle
924. Add mixerStateSync toggle
925. Create automationSync toggle

### API/Scripting Parameters (926-950)
926. Add javascriptApi access
927. Implement luaScripting engine
928. Add pythonScripting engine
929. Create typeScriptTypes export
930. Implement restApiEndpoints
931. Add graphQlSchema
932. Create webSocketEvents
933. Implement webhookCallbacks
934. Add oauth2Integration
935. Create apiKeyManagement
936. Implement rateLimiting rules
937. Add apiVersioning parameter
938. Create sdkGeneration action
939. Implement codeExamples export
940. Add apiDocumentation generation
941. Create apiExplorer UI
942. Implement sandboxedExecution mode
943. Add scriptMarketplace integration
944. Create pluginArchitecture API
945. Implement pluginSandbox security
946. Add pluginVersioning rules
947. Create pluginDependencies resolver
948. Implement pluginUpdates checker
949. Add pluginLicensing validation
950. Create pluginAnalytics tracking

### Import/Export Parameters (951-975)
951. Add sibeliusImport action
952. Implement finaleImport action
953. Add musescoreImport action
954. Create doricoImport action
955. Implement notionImport action
956. Add noteflightImport action
957. Create flatIoImport action
958. Implement guitarProImport action
959. Add powerTabImport action
960. Create abcNotationImport action
961. Implement lilypondImport action
962. Add capellaImport action
963. Create encoreImport action
964. Implement noteworthyImport action
965. Add sibeliusExport action
966. Create finaleExport action
967. Implement musescoreExport action
968. Add doricoExport action
969. Create lilypondExport action
970. Implement brailleMusicExport action
971. Add largePrintExport action
972. Create tactileGraphicsExport action
973. Implement daisyExport action
974. Add epubExport action
975. Create kindleExport action

### Collaboration Parameters (976-1000)
976. Add realTimeSync parameter
977. Implement conflictResolution strategy
978. Add userPresence display
979. Create cursorSharing toggle
980. Implement selectionSharing toggle
981. Add changeHighlighting toggle
982. Create attributionDisplay parameter
983. Implement commentSystem toggle
984. Add discussionThread per element
985. Create mentionSystem toggle
986. Implement notificationSystem toggle
987. Add activityFeed display
988. Create versionBranching toggle
989. Implement mergePreview display
990. Add pullRequestWorkflow toggle
991. Create reviewMode overlay
992. Implement approvalWorkflow toggle
993. Add signOffTracking display
994. Create changeLogGeneration action
995. Implement releaseNotesGeneration action
996. Add semanticVersioning parameter
997. Create milestoneTracking display
998. Implement deadlineReminder notifications
999. Add progressDashboard display
1000. Create projectTemplate save/load actions

---

## Summary

This roadmap integrates Dorico-level notation quality with CardPlay's architecture using a **single `ScoreNotationCard`**:

| Category | Steps | Implementation |
|----------|-------|----------------|
| ScoreNotationCard Foundation | 1-100 | Core card with phrase/generator/transform input processing |
| Arranger Integration | 101-200 | Section boundaries, variations, form analysis as parameters |
| Phrase Database | 201-300 | Browser preview, adaptation, genre styles as parameters |
| Engraving Engine | 301-400 | Spacing, layout, typography as parameters |
| Input Methods | 401-500 | MIDI routing, keyboard shortcuts, AI assist as parameters |
| Playback Integration | 501-600 | Sound routing, interpretation, rehearsal as parameters |
| Notation Elements | 601-700 | Note/accidental/articulation/dynamics display as parameters |
| Advanced Modes | 701-800 | Contemporary/historical/world music as displayMode parameters |
| Part & Score Layout | 801-900 | Part extraction, conductor score, print/export as parameters |
| External Integration | 901-1000 | DAW, API, import/export, collaboration as parameters |

**Key Architecture Principles:**
- **Single Card**: All notation lives in `ScoreNotationCard` for unified control
- **Parameters over Cards**: Notation features are parameters, not separate cards  
- **Bidirectional Sync**: Notation edits flow back to source phrase/generator cards
- **Arranger Integration**: Section structure from arranger defines score layout
- **Phrase Database**: Browser phrases render through ScoreNotationCard
- **Real-time Processing**: Card chain output updates notation in real-time
