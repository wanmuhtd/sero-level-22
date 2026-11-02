# Directional character asset

Tool: built-in image_gen (no CLI fallback).
Final game asset: dist/assets/character-walk.png
Reference: dist/assets/character-blonde.png
Layout: 4 columns × 4 rows; directions down, left, right, up; 4 walking frames per row.

## Generation prompt

Create a production game WALKING SPRITE SHEET of the exact reference chibi character, preserving her identity and pixel style. OUTPUT: one SQUARE canvas, a STRICT UNIFORM 4 COLUMNS x 4 ROWS GRID, exactly 16 full-body sprites, each centered in its own square cell with identical scale, consistent baseline and generous transparent gutters, no sprites touching or crossing cells. NO labels, NO grid lines. TRUE alpha transparent background. ROW 1: facing DOWN / FRONT toward viewer. ROW 2: facing LEFT in clear left-facing profile. ROW 3: facing RIGHT in clear right-facing profile. ROW 4: facing UP / BACK AWAY from viewer, showing back of bonnet and hair and shirt, absolutely no visible face or front graphic. In EACH ROW the FOUR COLUMNS are walking cycle poses: column 1 neutral standing with feet together, column 2 left leg stepping forward and opposite arm swinging, column 3 passing pose, column 4 right leg stepping forward and opposite arm swinging. Preserve charming oversized head and tiny body proportions in ALL views. Keep the exact light GOLDEN BLONDE twin braids and wispy bangs, cream crocheted bonnet with hanging ties, pink flower on one braid, cream OFF-SHOULDER oversized tee showing leopard-print inner camisole, wide BLUE BAGGY below-knee denim jorts with straight UNFOLDED hems, cream shoes, dark plum pixel outlines. Clothing and hairstyles must have coherent profile and back views. The side rows must actually show the head and nose pointing sideways, not the front face mirrored. Back row has the back of the cream bonnet, golden braids and a plain cream back of the tee. Crisp deliberate chunky pixel art, flat limited pastel shading, no soft blur, consistent pixel scale across all 16 frames. The 4x4 grid fills the square canvas in reading order with no other graphics. This sheet will be sliced into 16 equal square cells by game code.

## Cleanup prompt

Clean up this exact 4x4 sprite sheet for use in a game. REMOVE every stray bright-red speckle, red glow, red halo and all noise between and around sprites. Those pixels are unwanted matte artifacts: replace them with FULL alpha transparency. Keep only the sixteen clean pixel-art characters with their dark burgundy/plum outlines. Preserve their poses, exact 4-column 4-row grid, scale, blonde hair, off-shoulder outfit, and all individual walking frames. Transparent pixels must be fully transparent with no red fringe or fuzzy shadow. Do not add anything or change the layout. Same square transparent sprite sheet, sixteen sprites. No labels, no grid lines, no ground shadows.

