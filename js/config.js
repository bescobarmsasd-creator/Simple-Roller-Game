/* =====================================================================
   config.js  --  ALL THE NUMBERS.

   This is the first file to open if you want to change how the game
   FEELS. Every number here is safe to change. Change one at a time and
   play the game after each change.
   ===================================================================== */

var CONFIG = {

  // --- the world grid -------------------------------------------------
  TILE: 40,           // how many pixels wide and tall one grid square is
  ROWS: 10,           // how many rows tall every level piece is
  PIECE_COLS: 8,      // how many columns wide every level piece is

  // --- the screen -----------------------------------------------------
  CANVAS_W: 800,
  CANVAS_H: 400,

  // --- how the player moves -------------------------------------------
  MOVE_SPEED: 3,      // pixels per frame left and right
  JUMP_POWER: 16,     // how hard the jump pushes UP. bigger = higher
  DOUBLE_JUMP_POWER: 12,
  GRAVITY: 0.9,       // how hard the world pulls DOWN. bigger = heavier
  MAX_FALL: 16,       // fastest the player is allowed to fall
  DOUBLE_JUMP_COOLDOWN: 90,

  // --- shooting --------------------------------------------------------
  SHOOT_COOLDOWN: 8,  // frames between shots
  BULLET_SPEED: 10,   // pixels per frame
  BULLET_SIZE: 6,     // bullet diameter
  BULLET_LIFE: 90,    // how long a bullet stays alive before disappearing

  // --- the player's size ----------------------------------------------
  PLAYER_SIZE: 24,    // the player collides as a 24x24 box
  PLAYER_RADIUS: 12,  // ...but is DRAWN as a circle this big

  // --- drawing --------------------------------------------------------
  LINE_WIDTH: 3,      // thickness of every black outline
  DOT_DISTANCE: 0.55, // how far the off-center dot sits from the middle
                      // 0 = dead center, 1 = right on the edge

  // --- rules ----------------------------------------------------------
  START_LEVEL: 0      // which level in data/levels.json to load first
};
