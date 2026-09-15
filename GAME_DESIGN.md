# Game Design

## One-Sentence Pitch

A browser rhythm game where Jitsu students survive a grading by matching instructor callouts to timed evasions, guards, turns, and throws while Steve and Gareth judge from the table.

## Player Experience

The player should feel the pressure and silliness of a grading. Each exchange is short, readable, and rhythmic. The instructor's advice appears as spoken callouts and input prompts. Correct inputs convert pressure into crisp movement. Misses are funny, not cruel: a big "THWACK", a stumble, a ruffled gi, and dry examiner feedback.

## Game Loop

1. The attacker prepares an attack.
2. The technique is tested through three Jitsu phases: Tsukuri, Kuzushi, and Kake.
3. Each phase uses the same playhead and timing-tile language, but changes camera framing, input feel, and animation emphasis.
4. Steve gives phase-appropriate advice. Gareth adds a short line rarely.
5. Score, combo, and wisdom meter update.

## Technique Phases

Tsukuri:
- Movement and throw entry.
- The student must move out of the way of the attack at the right moment.
- Instructor phrases include "move your feet" and "get off the line".
- Prototype camera: exaggerated manga close-up of uke's punch coming towards tori's face.
- Prototype mechanic: one fast playhead pass over one input tile, with a relatively large GOOD window so the player can learn the rhythm.
- Bad timing fails the technique immediately and tori gets punched in the face.

Kuzushi:
- Breaking balance.
- The student uses movement and/or atemi to disrupt uke before the throw.
- Instructor phrases include "use your atemi" and "take balance".
- Prototype camera for osoto gari: exaggerated manga close-up of tori's hand pushing under uke's chin, forcing uke's head back.
- Prototype mechanic: a short button-mashing burst where the player alternates a random pair of inputs quickly while the playhead shows time remaining.
- The lane can use hotter, more frantic "on fire" visuals to signal pressure.
- Failing to reach the target fails the technique immediately and tori fails to throw or gets punched.

Kake:
- Execution of the throw.
- The student completes the demonstrated technique, such as osoto gari, also called major outer reap.
- Instructor phrases include "bend your knees", "turn your hips", and "posture".
- Prototype camera: return to the main dojo view for the full throw.
- Prototype mechanic: the standard multi-button playhead sequence.
- Bad timing affects throw quality. Good timing produces a successful throw; perfect timing adds exaggerated anime or fighting-game impact graphics.

## Controls

Initial keyboard controls:

- Left arrow: move left or evade.
- Down arrow: lower stance or duck.
- Right arrow: turn or redirect.
- X: guard, strike, or decisive technique beat.
- Space: spend wisdom meter when available.
- Esc: reset the prototype for testing.

Local two-player split-screen should eventually map player two to a separate key cluster or gamepad. The v0.1 code keeps the split-screen layout concept explicit.

## Prototype Patterns

The v0.1 ladder has one attacker per belt grade. The student's belt colour, playhead speed, timing windows, mash target, and Kake sequence difficulty are driven by the current grading. Novice grading uses white belts, slower timing, and a shorter Kake combination; yellow grading uses yellow belts; later grades continue through the full grade ladder.

| Phase | Input | Instructor Callout | Intended Result |
| --- | --- | --- | --- |
| Tsukuri | One timed Left | GET OFF THE LINE! | Evade the incoming punch |
| Kuzushi | Alternate a random two-button pair rapidly | TAKE BALANCE! USE YOUR ATEMI! | Break uke's posture |
| Kake | Direction sequence plus X | BEND YOUR KNEES! POSTURE! | Execute osoto gari |

## Timing Judgement

- PERFECT: close to the beat; maximum score and meter.
- GOOD: acceptable timing; technique succeeds.
- LATE: input arrives after the window; partial success.
- MISS: wrong input or missing beat; comedic hit.

The production rhythm system should be driven by the audio clock. The v0.1 scaffold isolates timing logic in `RhythmJudge` so it can later be wired to Phaser sound timing.

Readability rules:
- Each exchange begins with a deliberately overblown countdown.
- The play marker starts moving before the first required input so the player can feel the tempo.
- The play marker should run smoothly from start to finish, independent from scoring and other scene reactions.
- Inputs should be pressed when the play marker crosses the centre of the button tile.
- Button tiles should always remain readable. Timing feedback should use border colour and border thickness for approach, GOOD, and PERFECT windows.
- Directional icons/buttons should be visually separate from the playhead lane.
- The playhead lane should show timing zones directly: a wider transparent GOOD box and a sharper PERFECT line/box.
- Timing zones should be solid boxes inside the white play-lane boundary, not outlines, and should never spill outside the lane.
- The PERFECT zone should stay very narrow across all grades; difficulty changes mainly by tightening the judgement window.
- The playhead should feel like a chunky volume-slider handle: thicker than a line, but only slightly taller than the play lane.
- Once the playhead has passed a directional icon, that icon can change to the result symbol: X for miss, tick for good, fire for perfect.
- Each player should have their own boxed playhead panel, even while Player 2 is still placeholder-only in v0.1.
- Tsukuri should feel fast but forgiving: one decisive input, broad GOOD window, tight PERFECT window.
- Kuzushi should feel frantic: alternate the displayed random two-button pair as many times as possible before the playhead reaches the end.
- Kake should feel like the core rhythm sequence: multiple distinct inputs, judged independently in junior-grade prototype gradings.
- Show Tsukuri, Kuzushi, and Kake as constant per-player round overlays: Player 1 in a vertical list under the top-left player area, Player 2 mirrored on the top right.
- Completed phases display their result with icon language: red X for failed, green tick for good, and flaming tick for perfect.
- When a phase finishes, splash the result across the whole screen, then scale and move it into its row in the phase overlay. The overlay resets when a new attacker starts.
- Each grading opens with huge fighting-game-style notices once before Tsukuri starts: the grading name, then "YOI", then "YOSHIN". Do not show Tsukuri, Kuzushi, or Kake as big centre-screen phase notices.
- Early prototype difficulty should come from tightening the accuracy windows, not from making the marker too fast to read.
- Junior grades should allow recovery after misses so later buttons in the same sequence are still hittable. Higher grades can optionally make an early miss break the sequence.
- Prototype test runs should contain one grading per belt, then stop and reset only when Esc is pressed.

## Wisdom Meter

The wisdom meter represents absorbed advice, composure, and grading-room instinct.

Build meter through:

- PERFECT inputs.
- Clean completed patterns.
- Maintaining combo.

Spend meter for:

- A slow-motion correction window.
- A special throw flourish.
- A Steve callout that previews the next rhythm.

The v0.1 scaffold exposes the meter and a placeholder special trigger.

## Examiner Behaviour

Steve:
- Talks a lot.
- Gives energetic, specific, slightly comic feedback.
- Comments on timing, movement, posture, and commitment.

Gareth:
- Says very little.
- Uses short, dry comments.
- His feedback should feel rare enough to become a small event.

## Visual Direction

The game is set in a grading hall with mats, a table, examiners, an instructor, students, and attackers. The art should be warm, clear, and readable at game speed. It should prioritise instantly recognisable silhouettes, belt colours, and the right-shoulder badge rule.

The production presentation should lean into a classic 1990s arcade fighting-game style: chunky framed HUD panels, strong blue neon outlines, bold pixel-style typography, and clear player ownership of UI. The current mock screenshot is the visual reference. The v0.1 code uses a generated empty Westminster/university dojo plate based on that mock, with all people and live HUD elements removed. Future backdrop variants could include other dojos, such as one with Mount Fuji visible in the background.

UI presentation rules:
- Use one classic arcade font family consistently across all in-game labels.
- The preferred font reference is the "Ninja Gaiden (Tecmo)" bitmap atlas from Photon Storm's Arcade Font Writer. It is stored locally as `public/fonts/ninja-gaiden-tecmo.png`; using it across the UI requires a Phaser bitmap-text pass rather than a CSS font swap.
- Use single-pixel black outlines and slightly rounded edges for sprite art and UI graphic elements.
- Avoid redundant labels once the layout itself communicates meaning: no central "TJJF 40th Anniversary" title during play, and no large boxed "PLAYER 1" or "PLAYER 2" headings.
- Keep grading text in the bottom HUD near the belt ladder.
- Belt icons can be cropped directly from the mock screenshot when they are clearer than placeholders.
- The selected belt should use a yellow selection box that visually replaces the normal blue outline.
- Tori belt colour should be driven by a palette region, mask, or dedicated authored sprite region in the character art, not by duplicating every body animation frame for each grade. A plain rectangle overlay is not acceptable for production art.

Every character:
- Has exactly one square Jitsu badge.
- Badge appears on the wearer's right shoulder only.
- If the character faces the camera, the badge appears on the viewer's left.
- If the character faces away from the camera, the badge appears on the viewer's right.

Badge colours:
- Grading panel: red badge, white writing.
- Sensei Marianne: white badge, black writing.
- Sensei Garvey: red badge, white writing.
- Other instructors: white badge, red writing unless specified otherwise.
- Students: white badge, black writing.

Wardrobe:
- Grading-panel examiners Steve and Gareth wear white judogi, closed black waistcoat including black sleeves, black hakama, and a single square red badge with white writing on the wearer's right shoulder. When facing the camera, that badge appears on the viewer's left shoulder.
- Steve and Gareth sit at the grading desk and should look scary/intimidating.
- Sensei Marianne is a brown-belt instructor. She wears a white judogi, brown belt, black hakama, and no black waistcoat in the current placeholder direction.
- Sensei Garvey is a 4th dan. He wears a white judogi, black belt, black hakama, and a black sleeveless waistcoat.
- Instructors should look towards their students, with hands in front of their mouths as if shouting advice.
- Other instructors wear white judogi, black waistcoat, black hakama unless specified otherwise.
- Students wear white judogi with grade belt.

Player layout:
- One-player mode should show only Player 1 UI and icons.
- In one-player mode, centralise the HUD, play lane, student, attacker, and active instructor.
- Player 2 UI, icons, play lane, phase list, and instructor sprite should appear only when local two-player mode is active.

Diversity:
- Students and attackers should mix genders, skin colours, hair colours, body shapes, and sizes.

## Grade Ladder

| Grade | Belt Colour |
| --- | --- |
| White | White |
| Yellow | Yellow |
| Orange | Orange |
| Green | Green |
| Purple | Purple |
| Light blue | Light blue |
| Dark blue | Dark blue |
| Brown | Brown |
| Black | Black |

## Browser-First Deployment

The game should run first in the browser. Phaser + Vite gives fast iteration locally and a straightforward path to static hosting. Keep assets web-friendly, avoid platform-specific assumptions, and make the vertical slice playable with keyboard input before adding richer device support.
