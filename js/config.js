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
  DOUBLE_JUMP_POWER: 18,
  GRAVITY: 0.9,       // how hard the world pulls DOWN. bigger = heavier
  MAX_FALL: 16,       // fastest the player is allowed to fall
  DOUBLE_JUMP_COOLDOWN: 90,
  DASH_SPEED: 9,      // burst speed when dashing
  DASH_TIME: 8,       // how many frames the dash lasts
  DASH_COOLDOWN: 60,  // frames until the dash can be used again

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

CONFIG.MOD_PRESETS = {
  classic: {
    label: "Classic",
    MOVE_SPEED: 3,
    JUMP_POWER: 16,
    DOUBLE_JUMP_POWER: 18,
    GRAVITY: 0.9,
    MAX_FALL: 16,
    DASH_SPEED: 9,
    DASH_TIME: 8,
    DASH_COOLDOWN: 60,
    SHOOT_COOLDOWN: 8
  },
  turbo: {
    label: "Turbo",
    MOVE_SPEED: 4,
    JUMP_POWER: 18,
    DOUBLE_JUMP_POWER: 20,
    GRAVITY: 0.8,
    MAX_FALL: 17,
    DASH_SPEED: 12,
    DASH_TIME: 10,
    DASH_COOLDOWN: 45,
    SHOOT_COOLDOWN: 6
  },
  moon: {
    label: "Moon",
    MOVE_SPEED: 2.5,
    JUMP_POWER: 14,
    DOUBLE_JUMP_POWER: 16,
    GRAVITY: 0.55,
    MAX_FALL: 12,
    DASH_SPEED: 7,
    DASH_TIME: 9,
    DASH_COOLDOWN: 75,
    SHOOT_COOLDOWN: 10
  },
  heavy: {
    label: "Heavy",
    MOVE_SPEED: 2.5,
    JUMP_POWER: 15,
    DOUBLE_JUMP_POWER: 17,
    GRAVITY: 1.2,
    MAX_FALL: 18,
    DASH_SPEED: 8,
    DASH_TIME: 7,
    DASH_COOLDOWN: 70,
    SHOOT_COOLDOWN: 10
  }
};

CONFIG.applyMod = function (modName) {
  var preset = CONFIG.MOD_PRESETS[modName] || CONFIG.MOD_PRESETS.classic;
  Object.keys(preset).forEach(function (key) {
    if (key !== "label") {
      CONFIG[key] = preset[key];
    }
  });
  return preset.label;
};

CONFIG.applyMod("classic");
