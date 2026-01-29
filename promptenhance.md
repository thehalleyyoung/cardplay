# Automated Task Completion Prompt (Infinite Enhancement Loop)

You are working on the Cardplay music production application. Your task is to continuously enhance the system by completing tasks and generating new ones. This is an infinite loop—there is always more to improve.

## Instructions

### Step 1: Find Uncompleted Items

Open `currentsteps.md` and search for uncompleted items (lines starting with `- [ ]` - find the first such line and read it).  **Do not** assume that the line after the last ` - [x] ` box is the correct one - the system may have accidentally skipped ahead in the past, in which case you will be looking for earlier skipped items to complete.

**If uncompleted items exist**: Complete the next 10 consecutive uncompleted items (proceed to Step 2).  Note that there may be gaps in what is completed - always start with the **first** incomplete item, and continue from there, trying to 'fill' any such 'holes' in the completed implementation.

**If ALL items are completed** (no `- [ ]` remains): Skip to Step 4 to generate new tasks.

### Step 2: Implement Each Item

For each of the 10 items:

1. **Understand** what the step requires by reading its description
2. **Check** if related code/tests already exist (search the codebase)
3. **Implement** the feature, fix, test, or documentation as completely as possible
4. **Follow** the coding style in `cardplay/docs/coding-style.md`
5. **Test** - ensure `npm run check` passes in cardplay/

**Documentation hierarchy**:
- Primary theory: `cardplay.md`
- Implementation docs (override theory): `docs/`

**Make sure all implementations are as rigorous and adherent to the type-theoretic foundations of cardplay given in the document as possible, not simple hacks that on the surface create good music/ui but are not usable by a pro.  Make sure all audio interactions are designed to be real-time and super low-latency.**

### Step 3: Mark Items Complete

After successfully implementing each item, edit `currentsteps.md` to change `- [ ]` to `- [x]` for that line.

If blocked, mark as: `- [ ] 1234: Description <!-- BLOCKED: reason -->`


# SUPER IMPORTANT NOTICE
Note that every item should be complete not just as a one-off, but as a general purpose solution which is maximally all-encompassing of a solution from the point of view of the type theory described in cardplay.md and in the docs.  For instance, if you're designing a "bassline card", don't make it a single static string of notes and a sine wave; make it have the type that leads to it actually being used in the way an "ableton midi effect" or "rapidnote phrase generator" would be used in those systems, and in a maximally useful way with a maximal number of presets and automatable/modulatable parameters.  If it seems like a previous superficial attempt was attempted, remove that attempt and *do it right*.

### Step 3.5: Visual Verification (Batch Validation)

After completing the 10 items, verify the work by simulating a user journey:

1. **Launch the app using playwright** and, using playwright, perform actions that exercise the newly implemented features
2. **Capture screenshots** at key UI states (use the screenshots/ folder)
3. **Generate spectrograms** for any audio-related changes (use the spectrograms/ folder)
4. **Analyze the visual sequence**: Review the screenshots and spectrograms to confirm:
   - UI elements appear correctly positioned and styled
   - Audio waveforms/spectrograms show expected frequency content
   - No visual glitches, missing elements, or rendering errors
   - User flow makes logical sense from state to state
5. **If something looks wrong**: Debug and fix before marking the item complete

This visual verification catches issues that unit tests miss—layout problems, audio artifacts, UX flow issues, and rendering bugs.

### Step 4: Generate New Tasks (When All Complete)

When no unchecked items remain, analyze the enhanced system and determine the **next 500 improvements** that would benefit the application. Consider:

- **Missing features** users would expect in a music production app
- **Performance optimizations** (audio latency, rendering, memory)
- **Test coverage gaps** (unit tests, integration tests, e2e tests)
- **Documentation improvements** (API docs, tutorials, examples)
- **Accessibility** (keyboard navigation, screen readers, high contrast)
- **UX polish** (animations, feedback, error handling)
- **Code quality** (refactoring, removing duplication, better abstractions)
- **New instruments/effects** (synthesizers, effects, modulators)
- **Export/import formats** (MIDI, stems, project files)
- **Collaboration features** (sharing, real-time editing)
- **Plugin system** (extensibility, custom cards)
- **Mobile/touch support**
- **Undo/redo improvements**
- **Preset/template system**
- **Audio analysis and visualization**
- **MIDI controller support**
- **Automation curves**
- **Time signature and tempo changes**
- **Low latency Audio effects (reverb, delay, compression, EQ)**
- **Low latency Sampler enhancements (slicing, layering, round-robin)**

**Format for new tasks**:
```
- [ ] NNNN: Clear, actionable description of what to implement
```

Where NNNN continues from the last item number in the file.

**Append** these 500 new tasks to the end of `currentsteps.md`, then proceed to complete the first 10 of them.

### Step 5: Quality Bar

- All code must pass `npm run check` (typecheck + lint + test + build)
- Follow existing patterns in the codebase
- Add inline comments for complex logic
- Prefer small, focused changes over large refactors
- Add tests where appropriate

### Step 6: Summary

After each batch, briefly report:
- Items completed (numbers)
- Items blocked and why
- If new tasks were generated, confirm how many were added

## Key Files

- Checklist: `currentsteps.md`
- Theory: `cardplay.md`
- Implementation docs: `docs/`
- Source code: `src/`

## Start Now

Begin by reading currentsteps.md to find uncompleted items. If none exist, generate 500 new tasks and append them. Then complete the next 10.

## Freesound

Note: to access freesound samples, use curl "https://freesound.org/apiv2/search/text/\
?query={name}\
&filter=license:"Creative Commons 0"\
&fields=id,name,tags,previews,url,username\
&token=YOUR_API_KEY
 
where YOUR_API_KEY = "V7fHSA9OZ83ldrhvUqWwN2Pqs15mE34ndBPHS1td";

**Note that everything should be done maximally and both maximally generally and so the 'default' is as great as possible.  Aim for low latency always.  If you can't get through 10 tasks in the time given, only focus on ones you can do well.**

**Do everything possible using WASM and other low-latency web tools**.