/* =====================================================================
   level.js  --  BUILDING THE WORLD OUT OF PIECES.

   A level is a list of piece names. A piece is a little 8-wide,
   10-tall picture. This file glues the pictures together, left to
   right, into one big grid.

   The pictures live in data/pieces.json.
   The lists of names live in data/levels.json.
   ===================================================================== */

var Level = {
  pieces: null,     // every piece picture, loaded from pieces.json
  levels: null,     // every level list, loaded from levels.json
  grid: [],         // the finished world. grid[row][col] is one character
  cols: 0,          // how many columns wide the finished world is
  name: "",
  startX: 0,        // where the player begins, in pixels
  startY: 0,
  enemies: [],      // all enemy targets placed in the current level
  bots: [],         // hostile bots that move and attack
  boss: null,      // the optional final boss for the level
  fallingSpikes: [],
  powerUps: []
};

// --- STEP 1: read the two data files ----------------------------------
Level.loadData = function (whenDone) {
  fetch("data/pieces.json")
    .then(function (r) { return r.json(); })
    .then(function (piecesFile) {
      Level.pieces = piecesFile;
      return fetch("data/levels.json");
    })
    .then(function (r) { return r.json(); })
    .then(function (levelsFile) {
      Level.levels = levelsFile.levels;
      whenDone();
    })
    .catch(function (error) {
      document.getElementById("message").textContent =
        "Could not load the level files. Check data/pieces.json and data/levels.json.";
      console.error(error);
    });
};

// --- STEP 2: glue the pieces together ---------------------------------
Level.build = function (levelNumber) {
  var level = Level.levels[levelNumber];
  Level.name = level.name;
  Level.grid = [];
  Level.cols = level.pieces.length * CONFIG.PIECE_COLS;
  Level.enemies = [];
  Level.bots = [];
  Level.boss = null;
  Level.fallingSpikes = [];
  Level.powerUps = [];

  // start with 10 empty rows
  for (var row = 0; row < CONFIG.ROWS; row++) {
    Level.grid.push("");
  }

  // add each piece onto the end of every row
  for (var p = 0; p < level.pieces.length; p++) {
    var pieceName = level.pieces[p];
    var piece = Level.pieces[pieceName];

    if (!piece) {
      console.error("No piece named '" + pieceName + "' in data/pieces.json");
      piece = Level.pieces["flat"];
    }

    for (var row = 0; row < CONFIG.ROWS; row++) {
      Level.grid[row] = Level.grid[row] + piece[row];
    }
  }

  Level.findStart();
  Level.findEnemies();
  Level.findFallingSpikes();
  Level.spawnPowerUps();
  Level.spawnBots();
};

// --- STEP 3: find the S and remember where it is ----------------------
Level.findStart = function () {
  for (var row = 0; row < CONFIG.ROWS; row++) {
    for (var col = 0; col < Level.cols; col++) {
      if (Level.charAt(col, row) === "S") {
        Level.startX = col * CONFIG.TILE;
        Level.startY = row * CONFIG.TILE;
        return;
      }
    }
  }
  // no S found anywhere, so just start at the top left
  Level.startX = 0;
  Level.startY = 0;
};

Level.findEnemies = function () {
  var enemyMap = {
    E: "scout",
    T: "turret",
    Z: "zigzag",
    F: "flanker"
  };

  for (var row = 0; row < CONFIG.ROWS; row++) {
    for (var col = 0; col < Level.cols; col++) {
      var tile = Level.charAt(col, row);
      if (enemyMap[tile]) {
        Level.enemies.push({
          x: col * CONFIG.TILE + 4,
          y: row * CONFIG.TILE + 2,
          w: CONFIG.TILE - 8,
          h: CONFIG.TILE - 8,
          marker: tile,
          type: enemyMap[tile]
        });
      }
    }
  }
};

Level.findFallingSpikes = function () {
  for (var row = 0; row < CONFIG.ROWS; row++) {
    for (var col = 0; col < Level.cols; col++) {
      if (Level.charAt(col, row) === "!") {
        Level.fallingSpikes.push({
          x: col * CONFIG.TILE + 6,
          y: row * CONFIG.TILE + 2,
          w: 18,
          h: 18,
          vy: 0,
          triggerX: col * CONFIG.TILE,
          triggered: false,
          baseY: row * CONFIG.TILE + 2
        });
        Level.grid[row] = Level.grid[row].slice(0, col) + "." + Level.grid[row].slice(col + 1);
      }
    }
  }
};

Level.updateFallingSpikes = function () {
  for (var i = 0; i < Level.fallingSpikes.length; i++) {
    var spike = Level.fallingSpikes[i];
    if (!spike.triggered) {
      if (Math.abs(Player.x - spike.x) < 240) {
        spike.triggered = true;
        spike.vy = 1;
      }
      continue;
    }

    spike.vy = spike.vy + 0.6;
    spike.y = spike.y + spike.vy;

    if (spike.y > CONFIG.CANVAS_H + 50) {
      spike.y = spike.baseY;
      spike.vy = 0;
      spike.triggered = false;
    }
  }
};

Level.spawnPowerUps = function () {
  var laneX = Math.max(180, Math.min(Level.pixelWidth() * 0.45, Level.pixelWidth() - 220));
  var laneY = 120;
  Level.powerUps = [
    {
      x: laneX,
      y: laneY,
      w: 18,
      h: 18,
      pulse: 0,
      type: "gun"
    },
    {
      x: laneX + 120,
      y: laneY + 30,
      w: 16,
      h: 16,
      pulse: 0,
      type: "ammo"
    }
  ];
};

Level.spawnBots = function () {
  var typeMap = {
    E: "scout",
    T: "turret",
    Z: "zigzag",
    F: "flanker"
  };

  for (var i = 0; i < Level.enemies.length; i++) {
    var enemy = Level.enemies[i];
    var type = typeMap[enemy.marker] || "scout";
    var bot = {
      x: enemy.x + (type === "turret" ? 4 : -4),
      y: enemy.y - 8,
      w: type === "turret" ? 26 : 22,
      h: type === "turret" ? 22 : 18,
      dir: 1,
      speed: type === "scout" ? 1.15 : type === "zigzag" ? 1.3 : type === "flanker" ? 1.45 : 0.55,
      oxid: Math.random() * 1000,
      fireCooldown: type === "turret" ? 24 : 36 + (i % 3) * 12,
      alive: true,
      isBoss: false,
      type: type,
      phase: i * 17,
      shotSpeed: type === "turret" ? 5.5 : type === "flanker" ? 4.2 : 4,
      shotRate: type === "turret" ? 48 : type === "zigzag" ? 60 : 80,
      drift: type === "zigzag" ? 1.2 : type === "flanker" ? 0.8 : 0.2
    };

    Level.bots.push(bot);
  }

  // A final boss lurks near the end of the stage.
  var bossX = Math.max(200, Level.pixelWidth() - 200);
  var bossY = 70;
  Level.boss = {
    x: bossX,
    y: bossY,
    w: 54,
    h: 38,
    dir: 1,
    speed: 1.2,
    oxid: Math.random() * 1000,
    fireCooldown: 14,
    alive: true,
    isBoss: true,
    hp: 12,
    maxHp: 12,
    type: "boss"
  };
  Level.bots.push(Level.boss);
};

// --- ASKING THE WORLD QUESTIONS ---------------------------------------
// What character is at this grid square?
Level.charAt = function (col, row) {
  if (row < 0 || row >= CONFIG.ROWS) { return "."; }
  if (col < 0 || col >= Level.cols)  { return "."; }
  return Level.grid[row].charAt(col);
};

Level.isSolid  = function (col, row) { return Level.charAt(col, row) === "#"; };
Level.isEnemy  = function (col, row) { return Level.charAt(col, row) === "E"; };
Level.isSpike  = function (col, row) {
  var tile = Level.charAt(col, row);
  return tile === "^" || tile === "v" || tile === "!";
};
Level.isLava   = function (col, row) { return Level.charAt(col, row) === "~"; };
Level.isFinish = function (col, row) { return Level.charAt(col, row) === "F"; };

// How wide is the whole world, in pixels?
Level.pixelWidth = function () { return Level.cols * CONFIG.TILE; };
