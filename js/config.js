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
  DASH_SPEED: 12,     // burst speed when dashing
  DASH_TIME: 12,      // how many frames the dash lasts
  DASH_COOLDOWN: 45,  // frames until the dash can be used again

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
    DASH_SPEED: 12,
    DASH_TIME: 12,
    DASH_COOLDOWN: 45,
    SHOOT_COOLDOWN: 8
  },
  turbo: {
    label: "Turbo",
    MOVE_SPEED: 4,
    JUMP_POWER: 18,
    DOUBLE_JUMP_POWER: 20,
    GRAVITY: 0.8,
    MAX_FALL: 17,
    DASH_SPEED: 15,
    DASH_TIME: 14,
    DASH_COOLDOWN: 35,
    SHOOT_COOLDOWN: 6
  },
  moon: {
    label: "Moon",
    MOVE_SPEED: 2.5,
    JUMP_POWER: 14,
    DOUBLE_JUMP_POWER: 16,
    GRAVITY: 0.55,
    MAX_FALL: 12,
    DASH_SPEED: 10,
    DASH_TIME: 12,
    DASH_COOLDOWN: 55,
    SHOOT_COOLDOWN: 10
  },
  heavy: {
    label: "Heavy",
    MOVE_SPEED: 2.5,
    JUMP_POWER: 15,
    DOUBLE_JUMP_POWER: 17,
    GRAVITY: 1.2,
    MAX_FALL: 18,
    DASH_SPEED: 11,
    DASH_TIME: 10,
    DASH_COOLDOWN: 60,
    SHOOT_COOLDOWN: 10
  },
  comet: {
    label: "Comet",
    MOVE_SPEED: 4.5,
    JUMP_POWER: 19,
    DOUBLE_JUMP_POWER: 21,
    GRAVITY: 0.7,
    MAX_FALL: 18,
    DASH_SPEED: 18,
    DASH_TIME: 15,
    DASH_COOLDOWN: 30,
    SHOOT_COOLDOWN: 5
  },
  drift: {
    label: "Drift",
    MOVE_SPEED: 3.5,
    JUMP_POWER: 17,
    DOUBLE_JUMP_POWER: 19,
    GRAVITY: 0.75,
    MAX_FALL: 15,
    DASH_SPEED: 16,
    DASH_TIME: 16,
    DASH_COOLDOWN: 28,
    SHOOT_COOLDOWN: 7
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

CONFIG.GUN_PRESETS = {
  blaster: {
    label: "Blaster",
    cooldown: 8,
    bulletSpeed: 10,
    bulletSize: 6,
    bulletLife: 90,
    pellets: 1,
    spread: 0,
    damage: 1,
    color: "#ffd166"
  },
  rifle: {
    label: "Rifle",
    cooldown: 6,
    bulletSpeed: 12,
    bulletSize: 5,
    bulletLife: 90,
    pellets: 1,
    spread: 0.03,
    damage: 2,
    color: "#70e000",
    magazine: 12,
    reserve: 48,
    reloadTime: 34
  },
  grenade: {
    label: "Grenade",
    cooldown: 26,
    bulletSpeed: 7,
    bulletSize: 7,
    bulletLife: 120,
    pellets: 1,
    spread: 0,
    damage: 3,
    color: "#ff7b00",
    magazine: 3,
    reserve: 12,
    reloadTime: 28,
    type: "grenade",
    blastRadius: 42,
    fuse: 48
  },
  scatter: {
    label: "Scatter",
    cooldown: 12,
    bulletSpeed: 8,
    bulletSize: 5,
    bulletLife: 68,
    pellets: 3,
    spread: 0.28,
    damage: 1,
    color: "#a2d2ff"
  },
  plasma: {
    label: "Plasma",
    cooldown: 16,
    bulletSpeed: 12,
    bulletSize: 8,
    bulletLife: 110,
    pellets: 1,
    spread: 0,
    damage: 2,
    color: "#ff7b00"
  },
  burst: {
    label: "Burst",
    cooldown: 10,
    bulletSpeed: 11,
    bulletSize: 5,
    bulletLife: 75,
    pellets: 2,
    spread: 0.12,
    damage: 1,
    color: "#90be6d"
  },
  pulse: {
    label: "Pulse",
    cooldown: 6,
    bulletSpeed: 9,
    bulletSize: 4,
    bulletLife: 58,
    pellets: 2,
    spread: 0.08,
    damage: 1,
    color: "#7bdff2",
    accent: "#d9f99d"
  },
  nova: {
    label: "Nova",
    cooldown: 14,
    bulletSpeed: 10,
    bulletSize: 5,
    bulletLife: 82,
    pellets: 5,
    spread: 0.34,
    damage: 1,
    color: "#c084fc",
    accent: "#f9c74f"
  },
  cannon: {
    label: "Cannon",
    cooldown: 18,
    bulletSpeed: 14,
    bulletSize: 9,
    bulletLife: 125,
    pellets: 1,
    spread: 0,
    damage: 3,
    color: "#f94144",
    accent: "#ffd166"
  },
  rail: {
    label: "Rail",
    cooldown: 20,
    bulletSpeed: 18,
    bulletSize: 4,
    bulletLife: 140,
    pellets: 1,
    spread: 0,
    damage: 4,
    color: "#b7e4c7",
    accent: "#c7f9cc"
  }
};

CONFIG.applyMod("classic");
