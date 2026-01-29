# CardPlay Tracker System - 1000 Feature Wishlist

A comprehensive feature list combining the best of Renoise with CardPlay's unique card/deck/session/clip/phrase generator architecture.

---

## 1. Core Pattern Editor (1-50)

1. Hexadecimal note display with configurable base (hex/decimal/musical)
2. Variable pattern length per track (polymetric support)
3. Delay column with sub-tick precision (0-FF = 0-255 ticks)
4. Panning column with smooth interpolation
5. Volume column supporting both velocity and expression
6. Per-row instrument column override
7. Effect commands column (unlimited per row)
8. Multi-column effect stacking on single row
9. Note-off with release velocity support
10. Note-cut with configurable cut time
11. Retrigger command with volume decay curve
12. Portamento up/down with logarithmic curve option
13. Glide-to-note with configurable speed
14. Vibrato with depth, speed, and waveform
15. Tremolo with depth, speed, and waveform
16. Arpeggio with configurable chord shapes
17. Sample offset command (start position)
18. Sample reverse command
19. Sample slice playback trigger
20. Pattern break with destination row
21. Pattern jump with loop count
22. Row repeat command
23. Track delay compensation display
24. Phase-locked editing (snap to musical grid)
25. Free-form editing (any tick position)
26. Ghost rows showing events from other tracks
27. Collapsed track view (show only active rows)
28. Expanded track view (show all subdivisions)
29. Track grouping with collapsible headers
30. Send track integration with pre/post fader
31. Master track with global effects
32. Track color coding with saturation indicator
33. Track icons for quick identification
34. Track naming with auto-abbreviation
35. Track locking to prevent accidental edits
36. Track freezing for CPU optimization
37. Track mute/solo with exclusive mode
38. Track arm for recording
39. Track monitoring (input through effects)
40. Track phase invert toggle
41. Track mono/stereo conversion
42. Track gain staging meter
43. Track clipping indicator with peak hold
44. Track latency display
45. Track automation arm
46. Track MIDI output routing
47. Track audio output routing
48. Track sidechain input assignment
49. Track modulation matrix slot
50. Track macro control binding

## 2. Navigation & Selection (51-100)

51. Cursor movement with wrap-around option
52. Page up/down by configurable amount
53. Jump to pattern start/end
54. Jump to next/previous note
55. Jump to next/previous instrument change
56. Jump to next/previous effect command
57. Column-wise navigation (skip empty)
58. Track-wise navigation with skip option
59. Pattern-wise navigation with preview
60. Selection by dragging with snap
61. Selection by shift-click range
62. Selection by double-click word
63. Selection by triple-click row
64. Selection by column (entire column)
65. Selection by track (entire track)
66. Selection by pattern (entire pattern)
67. Selection by instrument (all notes with instrument)
68. Selection by pitch (all notes with pitch)
69. Selection by velocity range
70. Selection by effect command type
71. Selection expansion (grow by one in each direction)
72. Selection contraction (shrink by one)
73. Selection invert (all unselected becomes selected)
74. Multi-cursor editing (multiple cursors)
75. Block selection (rectangular region)
76. Sparse selection (non-contiguous cells)
77. Selection to clipboard with metadata
78. Selection bookmarking (save/recall)
79. Selection history (undo selection changes)
80. Selection preview (highlight without committing)
81. Search and select (find notes matching criteria)
82. Select similar (notes with same properties)
83. Select connected (notes in same phrase)
84. Select automation points in range
85. Select all notes in scale
86. Select all notes in chord
87. Select all notes in octave
88. Selection statistics display
89. Selection transform preview
90. Selection to new pattern
91. Selection to new track
92. Selection to new instrument
93. Selection duplicate to cursor
94. Selection move to cursor
95. Selection swap with clipboard
96. Selection lock (protect from edits)
97. Selection mask (edit only selection)
98. Selection ripple mode (push/pull surrounding)
99. Selection interpolation preview
100. Selection quantize preview

## 3. Editing Operations (101-150)

101. Cut with fill option (leave notes/rests)
102. Copy with relative/absolute timing
103. Paste with merge/replace modes
104. Paste special (notes only, effects only, etc.)
105. Delete with ripple (close gaps)
106. Insert with ripple (push down)
107. Transpose by semitones
108. Transpose by scale degrees
109. Transpose by chord inversion
110. Transpose octave up/down
111. Velocity scale (multiply)
112. Velocity offset (add/subtract)
113. Velocity humanize (random variation)
114. Velocity compress (reduce dynamic range)
115. Velocity expand (increase dynamic range)
116. Velocity curve (apply envelope)
117. Timing quantize (snap to grid)
118. Timing humanize (add variation)
119. Timing swing (adjust off-beats)
120. Timing stretch (scale duration)
121. Timing compress (reduce duration)
122. Duration quantize
123. Duration stretch/compress
124. Duration legato (extend to next note)
125. Duration staccato (shorten by percentage)
126. Instrument change (replace instrument)
127. Instrument random (from selection)
128. Effect command add
129. Effect command remove
130. Effect command modify
131. Note split (one note to chord)
132. Note merge (chord to one note)
133. Note flip (invert pitch around axis)
134. Note reverse (reverse order)
135. Note shuffle (randomize order)
136. Note rotate (shift left/right)
137. Note thin (remove every Nth)
138. Note double (repeat each)
139. Note echo (add delayed copies)
140. Note arpeggiate (spread chord over time)
141. Note strum (offset chord notes)
142. Note crescendo (gradual velocity)
143. Note decrescendo (gradual velocity down)
144. Note accent pattern (apply rhythm)
145. Clear row
146. Clear column
147. Clear track
148. Clear pattern
149. Fill with note
150. Fill with pattern

## 4. Pattern Management (151-200)

151. Create new pattern (empty)
152. Create new pattern (from template)
153. Create new pattern (from selection)
154. Duplicate pattern
155. Clone pattern (linked copy)
156. Unclone pattern (make independent)
157. Delete pattern
158. Delete unused patterns
159. Pattern length change (resize)
160. Pattern length double
161. Pattern length halve
162. Pattern split (divide into multiple)
163. Pattern merge (combine into one)
164. Pattern swap (exchange positions)
165. Pattern move (reorder in sequence)
166. Pattern rename
167. Pattern color assign
168. Pattern tags/labels
169. Pattern notes/comments
170. Pattern loop region
171. Pattern markers (cue points)
172. Pattern tempo change
173. Pattern time signature change
174. Pattern groove template
175. Pattern swing amount
176. Pattern follow action (what plays next)
177. Pattern trigger quantization
178. Pattern launch mode (toggle/gate/etc.)
179. Pattern legato mode (overlap handling)
180. Pattern alias (reference another)
181. Pattern variation (A/B/C/D versions)
182. Pattern probability (chance to play)
183. Pattern condition (play if condition met)
184. Pattern MIDI trigger note
185. Pattern keyboard shortcut
186. Pattern group membership
187. Pattern folder organization
188. Pattern search/filter
189. Pattern sort by various criteria
190. Pattern comparison view
191. Pattern diff view (show differences)
192. Pattern merge tool
193. Pattern export (individual)
194. Pattern import (from file)
195. Pattern render to audio
196. Pattern render to MIDI
197. Pattern template save
198. Pattern template library
199. Pattern auto-save version
200. Pattern version history

## 5. Track Types (201-250)

201. Note track (standard melodic)
202. Drum track (percussion grid)
203. Automation track
204. Chord track (harmony reference)
205. Tempo track (tempo changes)
206. Time signature track
207. Marker track
208. Arrangement track
209. Video track (sync video playback)
210. Text track (lyrics, notes)
211. Send track
212. Master track
213. Group track (bus)
214. Folder track (organization)
215. MIDI track (external output)
216. Audio track (recording)
217. Frozen track (rendered audio)
218. Ghost track (reference display)
219. Guide track (non-playing reference)
220. Click track (metronome)
221. Count-in track
222. Cue track (monitoring mix)
223. CV track (control voltage output)
224. OSC track (OSC message output)
225. Sample track (waveform display)
226. Slice track (sample slices)
227. Phrase track (phrase references)
228. Generator track (algorithmic)
229. Effect track (apply to others)
230. Modulation track (LFO/envelope)
231. Probability track (per-step chance)
232. Condition track (logic gates)
233. Script track (code execution)
234. Data track (arbitrary data stream)
235. Parameter track (plugin params)
236. Macro track (mapped controls)
237. Expression track (MPE data)
238. Aftertouch track
239. Pitch bend track
240. Program change track
241. CC track (continuous controller)
242. NRPN track
243. SysEx track
244. Clock track (sync output)
245. Transport track (play/stop commands)
246. Scene track (session view links)
247. Clip track (clip launchers)
248. Card track (card instance)
249. Deck track (deck state)
250. Event track (system events)

## 6. Instrument Integration (251-300)

251. One instrument per track mode
252. Multiple instruments per track mode
253. Instrument column display toggle
254. Instrument color in note display
255. Instrument layer/velocity switching
256. Instrument keyswitch detection
257. Instrument round-robin indication
258. Instrument sample start display
259. Instrument loop point display
260. Instrument envelope visualization
261. Instrument modulation visualization
262. Instrument preset browser in tracker
263. Instrument quick load from pattern
264. Instrument drag-drop onto notes
265. Instrument learn from input
266. Instrument auto-assign by pitch range
267. Instrument auto-assign by velocity
268. Instrument macro quick edit
269. Instrument parameter lock per row
270. Instrument parameter slide between rows
271. Instrument randomization per note
272. Instrument probability per note
273. Instrument chain per track
274. Instrument split per track
275. Instrument layer per track
276. Instrument MIDI channel per note
277. Instrument output bus per note
278. Instrument transposition per track
279. Instrument velocity curve per track
280. Instrument timing offset per track
281. Instrument articulation column
282. Instrument expression column
283. Instrument breath column
284. Instrument bow pressure column
285. Instrument dynamics column
286. Instrument playing technique column
287. Instrument extended techniques
288. Instrument string selection
289. Instrument fret selection
290. Instrument fingering suggestion
291. Instrument playability analysis
292. Instrument range warning
293. Instrument polyphony warning
294. Instrument legato detection
295. Instrument portamento auto-detect
296. Instrument glide auto-detect
297. Instrument humanization profile
298. Instrument performance mode
299. Instrument step-entry mode
300. Instrument live-play mode

## 7. Effect Commands (301-400)

301. 0xy - Arpeggio (x=semi1, y=semi2)
302. 1xx - Portamento up
303. 2xx - Portamento down
304. 3xx - Tone portamento (glide to note)
305. 4xy - Vibrato (x=speed, y=depth)
306. 5xx - Tone portamento + volume slide
307. 6xx - Vibrato + volume slide
308. 7xy - Tremolo
309. 8xx - Set panning
310. 9xx - Sample offset
311. Axy - Volume slide (x=up, y=down)
312. Bxx - Pattern jump
313. Cxx - Set volume
314. Dxx - Pattern break
315. Exy - Various E commands
316. E0x - Set filter (off/on)
317. E1x - Fine portamento up
318. E2x - Fine portamento down
319. E3x - Set glide control
320. E4x - Set vibrato control
321. E5x - Set finetune
322. E6x - Set loop point
323. E7x - Set tremolo control
324. E8x - Set panning
325. E9x - Retrigger
326. EAx - Fine volume slide up
327. EBx - Fine volume slide down
328. ECx - Note cut
329. EDx - Note delay
330. EEx - Pattern delay
331. EFx - Invert loop
332. Fxx - Set tempo/BPM
333. Gxx - Set global volume
334. Hxy - Global volume slide
335. Ixx - Surround sound toggle
336. Jxx - Channel volume
337. Kxy - Channel volume slide
338. Lxx - Set envelope position
339. Mxx - Channel panning
340. Nxy - Channel panning slide
341. Oxx - Sample offset (high byte)
342. Pxy - Panning slide
343. Qxy - Retrigger with volume change
344. Rxy - Tremor (on/off time)
345. Sxx - Various S commands
346. S0x - Set filter type
347. S1x - Set glissando
348. S2x - Set finetune
349. S3x - Set vibrato waveform
350. S4x - Set tremolo waveform
351. S5x - Set panbrello waveform
352. S6x - Pattern delay (fine)
353. S7x - Instrument control
354. S8x - Set panning
355. S9x - Sound control
356. SAx - High offset
357. SBx - Pattern loop
358. SCx - Note cut (fine)
359. SDx - Note delay (fine)
360. SEx - Pattern delay (rows)
361. SFx - Set active macro
362. Txx - Set tempo
363. Uxy - Fine vibrato
364. Vxx - Set global volume
365. Wxy - Global volume slide
366. Xxy - Extra fine portamento
367. Yxy - Panbrello
368. Zxx - MIDI macro
369. \xx - Probability (chance to play)
370. ^xx - Condition (play if true)
371. #xx - Note repeat count
372. *xx - Note priority
373. @xx - Microtuning offset
374. &xx - Link to next row
375. %xx - Humanize amount
376. $xx - Random seed
377. !xx - Trigger external event
378. ~xx - Modulation wheel
379. `xx - Expression
380. 'xx - Breath controller
381. "xx - Aftertouch
382. [xx - Pitch bend down
383. ]xx - Pitch bend up
384. {xx - Program change
385. }xx - Bank select
386. |xx - Sustain pedal
387. +xx - Add velocity
388. -xx - Subtract velocity
389. <xx - Pan left
390. >xx - Pan right
391. =xx - Volume crossfade
392. _xx - Duration override
393. .xx - Staccato amount
394. :xx - Swing amount
395. ;xx - Groove position
396. ?xx - Random command
397. Custom effect slots (user-defined)
398. Effect command chaining
399. Effect command macros
400. Effect command scripting

## 8. Phrases & Sub-Patterns (401-450)

401. Phrase library per instrument
402. Phrase library global
403. Phrase trigger by note
404. Phrase trigger by velocity range
405. Phrase trigger by keyswitch
406. Phrase loop modes (off/forward/pingpong)
407. Phrase loop count
408. Phrase sync to tempo
409. Phrase stretch to duration
410. Phrase transpose by trigger note
411. Phrase transpose mode (relative/absolute)
412. Phrase velocity scaling
413. Phrase random start position
414. Phrase shuffle mode
415. Phrase probability per note
416. Phrase condition per note
417. Phrase layers (stack multiple)
418. Phrase variations (A/B/C/D)
419. Phrase follow actions
420. Phrase chaining rules
421. Phrase interrupt behavior
422. Phrase legato behavior
423. Phrase polyphonic mode
424. Phrase monophonic mode
425. Phrase voice allocation
426. Phrase generator connection
427. Phrase from generator output
428. Phrase to generator input
429. Phrase edit in popup
430. Phrase edit in place
431. Phrase edit in separate window
432. Phrase import from pattern
433. Phrase export to pattern
434. Phrase import from MIDI
435. Phrase export to MIDI
436. Phrase render to audio
437. Phrase freeze
438. Phrase humanize
439. Phrase quantize
440. Phrase groove apply
441. Phrase scale constrain
442. Phrase chord constrain
443. Phrase octave constrain
444. Phrase range constrain
445. Phrase density control
446. Phrase complexity control
447. Phrase energy/intensity control
448. Phrase templates
449. Phrase presets
450. Phrase sharing between instruments

## 9. Generator Integration (451-500)

451. Generator card embedding in track
452. Generator output to track notes
453. Generator output to track effects
454. Generator output to automation
455. Generator parameter control from tracker
456. Generator trigger from pattern event
457. Generator seed from pattern data
458. Generator scale from chord track
459. Generator rhythm from drum track
460. Generator melody from reference track
461. Generator variation per pattern
462. Generator probability per step
463. Generator condition per step
464. Generator morph between presets
465. Generator evolution over time
466. Generator response to audio input
467. Generator response to MIDI input
468. Generator response to automation
469. Generator response to other generators
470. Generator chain within track
471. Generator split across tracks
472. Generator parallel instances
473. Generator A/B comparison
474. Generator undo/redo state
475. Generator preset morphing
476. Generator macro control
477. Generator lock parameters
478. Generator randomize parameters
479. Generator learn from selection
480. Generator extend selection
481. Generator fill gaps in selection
482. Generator transform selection
483. Generator suggest variations
484. Generator suggest continuation
485. Generator suggest harmony
486. Generator suggest rhythm
487. Generator suggest counterpoint
488. Generator suggest orchestration
489. Generator suggest form
490. Generator suggest dynamics
491. Generator batch generation
492. Generator comparison view
493. Generator history browser
494. Generator favorites
495. Generator recent presets
496. Generator templates
497. Generator scripting API
498. Generator machine learning integration
499. Generator collaborative training
500. Generator export as phrase

## 10. Session/Clip Integration (501-550)

501. Pattern as clip in session view
502. Clip launch from tracker
503. Clip stop from tracker
504. Clip arm from tracker
505. Clip trigger note assignment
506. Clip launch quantization
507. Clip follow action
508. Clip legato mode
509. Clip warp mode
510. Clip time stretch
511. Clip pitch shift
512. Clip gain adjustment
513. Clip color from pattern
514. Clip name from pattern
515. Clip length sync
516. Clip start offset
517. Clip end offset
518. Clip loop region
519. Clip one-shot mode
520. Clip toggle mode
521. Clip gate mode
522. Clip scene membership
523. Clip exclusive group
524. Clip probability
525. Clip condition
526. Clip MIDI trigger range
527. Clip velocity range response
528. Clip aftertouch response
529. Clip modwheel response
530. Clip expression response
531. Scene trigger from tracker
532. Scene follow pattern changes
533. Scene launch quantization
534. Scene tempo change
535. Scene time signature change
536. Scene marker
537. Scene transition
538. Scene auto-advance
539. Session grid in tracker panel
540. Session overview in tracker
541. Session navigation from tracker
542. Session editing from tracker
543. Session clip arrange from tracker
544. Session to arrangement conversion
545. Arrangement to session conversion
546. Session clip variations in tracker
547. Session clip MIDI learn in tracker
548. Session clip OSC control
549. Session clip automation
550. Session global groove

## 11. Deck/Card System (551-600)

551. Track as card instance
552. Card stack per track
553. Card chain per track
554. Card split across tracks
555. Card parameter in effect column
556. Card preset change per row
557. Card morph per row
558. Card bypass per row
559. Card wet/dry per row
560. Card sidechain trigger per row
561. Deck state per pattern
562. Deck configuration per song
563. Deck layout in tracker panel
564. Deck drag-drop to track
565. Card drag-drop to track
566. Card instantiate from tracker
567. Card remove from tracker
568. Card configure from tracker
569. Card preset browse from tracker
570. Card comparison from tracker
571. Card A/B from tracker
572. Card learn from tracker
573. Card freeze from tracker
574. Card render from tracker
575. Card export from tracker
576. Card import from tracker
577. Card duplicate from tracker
578. Card move between tracks
579. Card swap between tracks
580. Card snapshot per pattern
581. Deck snapshot per song section
582. Card event generation
583. Card event consumption
584. Card event routing
585. Card event transformation
586. Card event filtering
587. Card event delay
588. Card event quantization
589. Card event probability
590. Card event condition
591. Card cross-modulation
592. Card serial connection
593. Card parallel connection
594. Card feedback routing
595. Card signal analysis
596. Card machine learning
597. Card AI assistance
598. Card cloud processing
599. Card collaborative editing
600. Card version control

## 12. Event System (601-650)

601. Event emission from tracker note
602. Event emission from tracker effect
603. Event emission from pattern change
604. Event emission from track change
605. Event emission from selection change
606. Event emission from playback position
607. Event emission from loop point
608. Event emission from marker
609. Event emission from tempo change
610. Event emission from signature change
611. Event reception changes note display
612. Event reception changes effect display
613. Event reception changes color
614. Event reception changes visibility
615. Event reception triggers highlight
616. Event reception triggers animation
617. Event routing to specific track
618. Event routing to track group
619. Event routing to pattern
620. Event routing to session clip
621. Event routing to deck
622. Event routing to card
623. Event routing to generator
624. Event routing to instrument
625. Event routing to effect
626. Event routing to automation
627. Event routing to MIDI output
628. Event routing to OSC output
629. Event routing to external app
630. Event routing to script
631. Event filtering by type
632. Event filtering by source
633. Event filtering by destination
634. Event filtering by time
635. Event filtering by value range
636. Event transformation type change
637. Event transformation value scale
638. Event transformation value offset
639. Event transformation value curve
640. Event transformation timing shift
641. Event transformation timing scale
642. Event aggregation (combine multiple)
643. Event splitting (one to many)
644. Event buffering (delay for batch)
645. Event debouncing (ignore rapid)
646. Event throttling (limit rate)
647. Event priority handling
648. Event ordering guarantees
649. Event persistence (save/load)
650. Event history (undo/redo)

## 13. Rendering Effects (651-700)

651. Event-driven note color change
652. Event-driven note brightness
653. Event-driven note saturation
654. Event-driven note opacity
655. Event-driven note size
656. Event-driven note shape
657. Event-driven note icon
658. Event-driven note border
659. Event-driven note shadow
660. Event-driven note glow
661. Event-driven track background
662. Event-driven track border
663. Event-driven track highlight
664. Event-driven track pulse
665. Event-driven pattern background
666. Event-driven pattern border
667. Event-driven pattern glow
668. Event-driven row highlight
669. Event-driven column highlight
670. Event-driven cell highlight
671. Event-driven cursor change
672. Event-driven selection change
673. Event-driven zoom change
674. Event-driven scroll change
675. Event-driven panel show/hide
676. Event-driven split change
677. Event-driven focus change
678. Event-driven mode change
679. Generator-driven visualization
680. Generator-driven particle effects
681. Generator-driven wave animation
682. Generator-driven spectrum display
683. Generator-driven meter response
684. Generator-driven waveform color
685. Analysis-driven beat highlight
686. Analysis-driven transient markers
687. Analysis-driven pitch display
688. Analysis-driven loudness color
689. Analysis-driven density indication
690. MIDI-driven light feedback
691. MIDI-driven motor feedback
692. Audio-driven visual feedback
693. Tempo-driven animation sync
694. Beat-driven pulse effects
695. Bar-driven color cycling
696. Pattern-driven background change
697. Section-driven theme change
698. Energy-driven intensity
699. Complexity-driven detail
700. Performance-driven LOD

## 14. Recording (701-750)

701. Step recording mode
702. Live recording mode
703. Overdub recording mode
704. Replace recording mode
705. Punch in/out recording
706. Loop recording with takes
707. Comping from multiple takes
708. Recording quantization
709. Recording humanization
710. Recording filter (note/velocity/etc)
711. Recording arm per track
712. Recording arm per pattern
713. Recording arm global
714. Recording count-in
715. Recording metronome
716. Recording pre-roll
717. Recording post-roll
718. Recording audio monitoring
719. Recording MIDI monitoring
720. Recording latency compensation
721. Recording buffer size
722. Recording file format
723. Recording bit depth
724. Recording sample rate
725. Recording channel config
726. Recording split by note
727. Recording split by channel
728. Recording split by time
729. Recording merge to track
730. Recording merge to pattern
731. Recording undo
732. Recording redo
733. Recording history
734. Recording backup
735. Recording auto-save
736. Recording recovery
737. Recording cloud sync
738. Recording collaboration
739. Recording version control
740. Recording diff
741. Recording merge
742. Recording branch
743. Recording snapshot
744. Recording rollback
745. Recording compare
746. Recording A/B
747. Recording export
748. Recording import
749. Recording transfer
750. Recording share

## 15. Playback (751-800)

751. Pattern play from start
752. Pattern play from cursor
753. Pattern play from selection
754. Pattern play selection only
755. Pattern play with follow
756. Pattern play without follow
757. Pattern loop range
758. Pattern loop count
759. Pattern loop with variations
760. Track solo playback
761. Track mute playback
762. Track exclusive playback
763. Row-by-row stepping
764. Beat-by-beat stepping
765. Bar-by-bar stepping
766. Pattern-by-pattern stepping
767. Tempo control (master)
768. Tempo control (per track)
769. Tempo tap input
770. Tempo MIDI sync
771. Tempo audio sync
772. Time stretch playback
773. Pitch shift playback
774. Reverse playback
775. Varispeed playback
776. Scrub playback
777. Jog wheel support
778. Transport remote control
779. Transport MIDI mapping
780. Transport OSC mapping
781. Transport HID mapping
782. Cue point jump
783. Marker jump
784. Locator jump
785. Loop point set
786. Loop point jump
787. Punch point set
788. Skip muted sections
789. Skip empty sections
790. Pre-listen (audition)
791. Post-listen (tail)
792. Crossfade playback
793. Gapless playback
794. Low-latency playback
795. High-quality playback
796. Offline render
797. Real-time render
798. Render in place
799. Render stems
800. Render master

## 16. Automation (801-850)

801. Automation lane per track
802. Automation lane per effect
803. Automation lane per instrument
804. Automation lane per send
805. Automation point editing
806. Automation line editing
807. Automation curve editing
808. Automation ramp editing
809. Automation step editing
810. Automation freeform drawing
811. Automation pencil tool
812. Automation line tool
813. Automation curve tool
814. Automation eraser tool
815. Automation copy/paste
816. Automation thin (reduce points)
817. Automation smooth
818. Automation quantize
819. Automation scale
820. Automation offset
821. Automation flip
822. Automation reverse
823. Automation repeat
824. Automation stretch
825. Automation compress
826. Automation normalize
827. Automation random
828. Automation LFO generate
829. Automation envelope generate
830. Automation ADSR generate
831. Automation from audio
832. Automation from MIDI CC
833. Automation from modwheel
834. Automation from pitch bend
835. Automation from aftertouch
836. Automation from expression
837. Automation recording (write)
838. Automation recording (touch)
839. Automation recording (latch)
840. Automation punch in/out
841. Automation read mode
842. Automation bypass mode
843. Automation trim mode
844. Automation relative mode
845. Automation snapshot
846. Automation compare
847. Automation history
848. Automation morph
849. Automation link
850. Automation group

## Summary

This wishlist combines:
- **Renoise heritage**: Effect commands, phrases, pattern matrix, hex display, tracker workflow
- **CardPlay innovation**: Event-driven architecture, card/deck system, generators, clips
- **Unique integration**: Tracker events that affect card rendering, generator-to-tracker feedback loops, session/clip/phrase unification

The goal is a tracker that's not just a pattern editor, but a central hub for algorithmic composition, live performance, and collaborative music creation—while maintaining the speed and precision that makes trackers great.
