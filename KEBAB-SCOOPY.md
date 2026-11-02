# Kebab and Red Scoopy

Created with the built-in image_gen tool from the user's photo (person on the right) and Sero's blonde chibi reference.

Final asset: `dist/assets/kebab-scoopy.png`

Atlas columns: down, left, right, up.
Rows: male chibi; empty red scooter; Sero riding pillion with Kebab; alternate riding frame.
Actual image dimensions: 1254 × 1254. Nonuniform row and column crop boundaries are declared in `dist/config.js`. Connected-component bounds keep adjacent-frame fragments out of the displayed sprite.

Skill: 5 seconds riding, then 10 seconds cooldown after dismount. Q or touch button activates. Steering uses existing controls. Road dust and exhaust puffs originate behind the moving vehicle, fade, and stop emitting when stationary.

## Generation prompt

Create a production PIXEL ART GAME ASSET SHEET on a SQUARE transparent canvas, strict uniform 4 columns x 4 rows, 16 separate sprites, one centered fully visible sprite per square cell, generous clear transparent gutters, no labels or grid lines. Reference image 1: use ONLY the young man on the RIGHT (no glasses, medium warm tan skin, short wavy center-parted black hair, clean-shaven smiling face) for the new male chibi character. Dress him in plain BLACK SHORT-SLEEVED T-SHIRT and BLACK WIDE-LEG LONG PANTS, casual cream sneakers. Reference image 2: Sero's EXACT chibi design and pixel style: golden blonde twin braids, cream crochet bonnet, pink flower, cream off-shoulder graphic shirt with leopard camisole underneath, blue baggy below-knee jorts. Match reference 2 thick dark plum stepped outlines, charming big-head tiny-body proportions, limited flat pastel pixel shading. All 4 columns represent directions in this EXACT order: COLUMN 1 facing DOWN/front towards viewer; COLUMN 2 LEFT-facing profile; COLUMN 3 RIGHT-facing profile; COLUMN 4 UP/back away from viewer. ROW 1: the male chibi alone standing full-body in the four directions. ROW 2: a RED HONDA SCOOPY-style rounded retro scooter ALONE WITHOUT RIDERS in the four directions: red rounded body panels, round cream headlamp, small dark wheels, black seat, cream/chrome trim, handlebar mirrors. ROW 3: the young man DRIVING that red scooter with BOTH hands on handlebars, and Sero seated BEHIND him riding pillion, BOTH characters together on the SAME bike in four directions. Be clear they are riding together, Sero holding onto him; front view shows his face and her bonnet peeking behind, side views show both distinct heads and bodies, back view shows Sero's bonnet and both riders facing away. ROW 4: same TWO PEOPLE riding red scooter in the same four directions, with slightly changed hair sway, subtle wheel positions and small happy lean for a second riding animation frame. Rider pair must stay identical in scale between rows 3 and 4. All sprites have crisp square pixels, clean silhouette, full real alpha transparency. Avoid any stray pixels, red matte halos, noise, blurred gradients, floor shadows, photo backgrounds, text, or extra people. Precisely aligned 4x4 grid.

