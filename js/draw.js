/* =====================================================================
   draw.js  --  EVERYTHING YOU CAN SEE.

   Nothing in this file changes the game. It only puts pixels on screen.
   If you want to change how the game LOOKS, this is the only file you
   need. If you want to change how it BEHAVES, this is the wrong file.

    The game uses a bright arcade palette; visual changes live here.
   ===================================================================== */

var Draw = {
  canvas: null,
  ctx: null,
  colors: {
    sky: "#c7f2eb",
    dark: "#173b45",
    block: "#168f86",
    blockHighlight: "#52c7aa",
    spike: "#ef476f",
    lava: "#ff7438",
    sun: "#ffd166",
    enemy: "#a34f86",
    bot: "#e76f51",
    player: "#28b67a",
    playerHighlight: "#8ef0b5"
  },
  cameraX: 0     // how far the view has scrolled to the right
};

Draw.setup = function () {
  Draw.canvas = document.getElementById("game");
  Draw.ctx = Draw.canvas.getContext("2d");
};

// Follow the player, but never scroll past the ends of the level.
Draw.updateCamera = function () {
  Draw.cameraX = Player.x - CONFIG.CANVAS_W / 2;
  if (Draw.cameraX < 0) { Draw.cameraX = 0; }

  var furthest = Level.pixelWidth() - CONFIG.CANVAS_W;
  if (furthest < 0) { furthest = 0; }   // level narrower than the screen
  if (Draw.cameraX > furthest) { Draw.cameraX = furthest; }
};

// Draw one whole frame.
Draw.everything = function () {
  var ctx = Draw.ctx;

  // 1. paint the sky behind the level
  ctx.fillStyle = Draw.colors.sky;
  ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

  // 2. shift everything left so the camera looks like it moved right
  ctx.save();
  ctx.translate(-Draw.cameraX, 0);

  Draw.world();
  Draw.fallingSpikes();
  Draw.enemies();
  Draw.bots();
  Draw.projectiles();
  Draw.player();
  Draw.explosion();

  ctx.restore();
  Draw.doubleJumpBar();
  Draw.cooldownBar();
};

// Draw every grid square that is currently on screen.
Draw.world = function () {
  var ctx = Draw.ctx;
  var size = CONFIG.TILE;

  // only look at the columns that are actually visible. much faster.
  var firstCol = Math.floor(Draw.cameraX / size) - 1;
  var lastCol  = firstCol + Math.ceil(CONFIG.CANVAS_W / size) + 2;

  for (var row = 0; row < CONFIG.ROWS; row++) {
    for (var col = firstCol; col <= lastCol; col++) {
      var here = Level.charAt(col, row);
      var x = col * size;
      var y = row * size;

      if (here === "#") { Draw.block(x, y, size); }
      if (here === "^") { Draw.spike(x, y, size); }
      if (here === "v") { Draw.spikeDown(x, y, size); }
      if (here === "~") { Draw.lava(x, y, size); }
      if (here === "F") { Draw.finish(x, y, size); }
    }
  }
};

Draw.explosion = function () {
  if (!Player.explosion) { return; }

  var ctx = Draw.ctx;
  var explosion = Player.explosion;
  var progress = explosion.life / explosion.maxLife;
  var fade = 1 - progress;
  var outerRadius = 10 + progress * 30;

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = Draw.colors.lava;
  ctx.beginPath();
  ctx.arc(explosion.x, explosion.y, outerRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = Draw.colors.sun;
  ctx.beginPath();
  ctx.arc(explosion.x, explosion.y, outerRadius * 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = Draw.colors.dark;
  for (var i = 0; i < 8; i++) {
    var angle = i * Math.PI / 4;
    var distance = progress * 42;
    var debrisX = explosion.x + Math.cos(angle) * distance;
    var debrisY = explosion.y + Math.sin(angle) * distance;
    ctx.fillRect(debrisX - 3, debrisY - 3, 6, 6);
  }
  ctx.restore();
};

// A solid block with a bright top edge.
Draw.block = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = Draw.colors.block;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = Draw.colors.dark;
  ctx.lineWidth = CONFIG.LINE_WIDTH;
  ctx.strokeRect(x + CONFIG.LINE_WIDTH / 2,
                 y + CONFIG.LINE_WIDTH / 2,
                 size - CONFIG.LINE_WIDTH,
                 size - CONFIG.LINE_WIDTH);
  ctx.fillStyle = Draw.colors.blockHighlight;
  ctx.fillRect(x + 3, y + 3, size - 6, 3);
};

// A coral hazard triangle pointing up.
Draw.spike = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = Draw.colors.spike;
  ctx.strokeStyle = Draw.colors.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size / 2, y);
  ctx.lineTo(x + size, y + size);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

// A downward-facing spike hanging from the ceiling.
Draw.spikeDown = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = Draw.colors.spike;
  ctx.strokeStyle = Draw.colors.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size / 2, y + size);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

// Lava is a bright, visibly dangerous floor tile.
Draw.lava = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = Draw.colors.lava;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = Draw.colors.dark;
  ctx.lineWidth = CONFIG.LINE_WIDTH;
  ctx.strokeRect(x + CONFIG.LINE_WIDTH / 2,
                 y + CONFIG.LINE_WIDTH / 2,
                 size - CONFIG.LINE_WIDTH,
                 size - CONFIG.LINE_WIDTH);
  ctx.fillStyle = Draw.colors.sun;
  ctx.fillRect(x + 8, y + 12, 8, 3);
  ctx.fillRect(x + 24, y + 22, 8, 3);
};

Draw.fallingSpikes = function () {
  for (var i = 0; i < Level.fallingSpikes.length; i++) {
    var spike = Level.fallingSpikes[i];
    var ctx = Draw.ctx;
    ctx.fillStyle = Draw.colors.spike;
    ctx.strokeStyle = Draw.colors.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(spike.x + spike.w / 2, spike.y);
    ctx.lineTo(spike.x + spike.w, spike.y + spike.h);
    ctx.lineTo(spike.x, spike.y + spike.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
};

// The finish: a dark pole with a golden flag.
Draw.finish = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = Draw.colors.dark;
  ctx.fillRect(x + size / 2 - 2, y, 4, size);
  ctx.fillStyle = Draw.colors.sun;
  ctx.beginPath();
  ctx.moveTo(x + size / 2 + 2, y + 4);
  ctx.lineTo(x + size - 4,     y + 12);
  ctx.lineTo(x + size / 2 + 2, y + 20);
  ctx.closePath();
  ctx.fill();
};

// Enemies are bright squares with golden eyes.
Draw.enemies = function () {
  for (var i = 0; i < Level.enemies.length; i++) {
    var enemy = Level.enemies[i];
    var x = enemy.x;
    var y = enemy.y;
    var size = Math.min(enemy.w, enemy.h);

    Draw.ctx.fillStyle = Draw.colors.enemy;
    Draw.ctx.fillRect(x, y, size, size);
    Draw.ctx.strokeStyle = Draw.colors.dark;
    Draw.ctx.lineWidth = 2;
    Draw.ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    Draw.ctx.fillStyle = Draw.colors.sun;
    Draw.ctx.fillRect(x + 6, y + 8, 6, 6);
    Draw.ctx.fillRect(x + size - 12, y + 8, 6, 6);
  }
};

Draw.projectiles = function () {
  for (var i = 0; i < Player.projectiles.length; i++) {
    var b = Player.projectiles[i];
    Draw.ctx.fillStyle = b.color || Draw.colors.sun;
    Draw.ctx.strokeStyle = Draw.colors.dark;
    Draw.ctx.lineWidth = 1;
    Draw.ctx.beginPath();
    Draw.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    Draw.ctx.fill();
    Draw.ctx.stroke();
  }
};

Draw.bots = function () {
  for (var i = 0; i < Level.bots.length; i++) {
    var bot = Level.bots[i];
    if (!bot.alive) { continue; }
    var ctx = Draw.ctx;
    var centerX = bot.x + bot.w / 2;
    var centerY = bot.y + bot.h / 2;
    var aimX = Player.x + CONFIG.PLAYER_SIZE / 2 - centerX;
    var aimY = Player.y + CONFIG.PLAYER_SIZE / 2 - centerY;
    var aimLength = Math.sqrt(aimX * aimX + aimY * aimY) || 1;

    // tracks
    ctx.fillStyle = Draw.colors.dark;
    ctx.fillRect(bot.x - 3, bot.y + bot.h - 5, bot.w + 6, 8);
    ctx.fillStyle = Draw.colors.playerHighlight;
    ctx.fillRect(bot.x + 2, bot.y + bot.h - 3, 5, 4);
    ctx.fillRect(bot.x + bot.w - 7, bot.y + bot.h - 3, 5, 4);

    // tank body and turret
    if (bot.isBoss) {
      ctx.fillStyle = "#7a2d9d";
      ctx.fillRect(bot.x, bot.y + 7, bot.w, bot.h - 10);
      ctx.strokeStyle = Draw.colors.dark;
      ctx.lineWidth = 3;
      ctx.strokeRect(bot.x + 2, bot.y + 8, bot.w - 4, bot.h - 12);
      ctx.fillStyle = Draw.colors.dark;
      ctx.fillRect(bot.x - 2, bot.y - 14, bot.w + 4, 7);
      ctx.fillStyle = Draw.colors.sun;
      ctx.fillRect(bot.x + 2, bot.y - 12, (bot.w - 4) * (bot.hp / bot.maxHp), 3);
    } else {
      var botColor = bot.type === "turret" ? "#f4a261" : bot.type === "zigzag" ? "#90be6d" : bot.type === "flanker" ? "#48cae4" : Draw.colors.bot;
      ctx.fillStyle = botColor;
      ctx.fillRect(bot.x, bot.y + 5, bot.w, bot.h - 7);
      ctx.strokeStyle = Draw.colors.dark;
      ctx.lineWidth = 2;
      ctx.strokeRect(bot.x + 1, bot.y + 6, bot.w - 2, bot.h - 9);
    }
    ctx.fillStyle = Draw.colors.sun;
    ctx.fillRect(bot.x + 5, bot.y + 9, 5, 4);
    ctx.fillRect(bot.x + bot.w - 10, bot.y + 9, 5, 4);
    ctx.beginPath();
    ctx.arc(centerX, bot.y + 7, 8, 0, Math.PI * 2);
    ctx.fillStyle = bot.isBoss ? Draw.colors.bot : (bot.type === "turret" ? "#f4a261" : bot.type === "zigzag" ? "#90be6d" : bot.type === "flanker" ? "#48cae4" : Draw.colors.bot);
    ctx.fill();

    // cannon points toward the player.
    ctx.strokeStyle = Draw.colors.dark;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(centerX, bot.y + 7);
    ctx.lineTo(centerX + aimX / aimLength * 22, bot.y + 7 + aimY / aimLength * 22);
    ctx.stroke();
  }

  for (var j = 0; j < Player.botProjectiles.length; j++) {
    var shot = Player.botProjectiles[j];
    Draw.ctx.fillStyle = Draw.colors.lava;
    Draw.ctx.beginPath();
    Draw.ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
    Draw.ctx.fill();
    Draw.ctx.strokeStyle = Draw.colors.dark;
    Draw.ctx.lineWidth = 2;
    Draw.ctx.stroke();
  }
};

Draw.doubleJumpBar = function () {
  var ctx = Draw.ctx;
  var x = 20;
  var y = 18;
  var w = 140;
  var h = 12;
  var ready = Player.canDoubleJump ? 1 : 0;

  ctx.fillStyle = "#d9e2dc";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = Draw.colors.dark;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  ctx.fillStyle = Draw.colors.player;
  ctx.fillRect(x + 3, y + 3, (w - 6) * ready, h - 6);

  ctx.fillStyle = Draw.colors.dark;
  ctx.font = "12px sans-serif";
  ctx.fillText("Double Jump", x + 2, y - 5);
};

Draw.cooldownBar = function () {
  var ctx = Draw.ctx;
  var x = 20;
  var y = 42;
  var w = 140;
  var h = 12;
  var ratio = Player.dashCooldown > 0 ? 1 - Player.dashCooldown / CONFIG.DASH_COOLDOWN : 1;
  ratio = Math.max(0, Math.min(1, ratio));

  ctx.fillStyle = "#d9e2dc";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = Draw.colors.dark;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  ctx.fillStyle = Draw.colors.sun;
  ctx.fillRect(x + 3, y + 3, (w - 6) * ratio, h - 6);

  ctx.fillStyle = Draw.colors.dark;
  ctx.font = "12px sans-serif";
  ctx.fillText("Dash", x + 2, y - 5);
};

// The player tank, drawn over the same collision box as the old circle.
Draw.player = function () {
  var ctx = Draw.ctx;
  var centerX = Player.x + CONFIG.PLAYER_SIZE / 2;
  var centerY = Player.y + CONFIG.PLAYER_SIZE / 2;
  var gun = CONFIG.GUN_PRESETS[Player.gun] || CONFIG.GUN_PRESETS.blaster;
  var bodyColor = gun.color || Draw.colors.player;
  var accentColor = gun.label === "Plasma" ? "#ffb703" : gun.label === "Scatter" ? "#90e0ef" : gun.label === "Burst" ? "#c7f9cc" : Draw.colors.playerHighlight;

  // tracks and wheels
  ctx.fillStyle = Draw.colors.dark;
  ctx.fillRect(Player.x - 2, Player.y + 15, CONFIG.PLAYER_SIZE + 4, 8);
  ctx.fillStyle = accentColor;
  ctx.fillRect(Player.x + 2, Player.y + 17, 5, 4);
  ctx.fillRect(Player.x + CONFIG.PLAYER_SIZE - 7, Player.y + 17, 5, 4);

  // tank body
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = Draw.colors.dark;
  ctx.lineWidth = CONFIG.LINE_WIDTH;
  ctx.fillRect(Player.x, Player.y + 5, CONFIG.PLAYER_SIZE, 13);
  ctx.strokeRect(
    Player.x + CONFIG.LINE_WIDTH / 2,
    Player.y + 5 + CONFIG.LINE_WIDTH / 2,
    CONFIG.PLAYER_SIZE - CONFIG.LINE_WIDTH,
    13 - CONFIG.LINE_WIDTH
  );

  // turret
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(centerX, Player.y + 7, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // cannon
  var gunLength = gun.label === "Plasma" ? 22 : gun.label === "Scatter" ? 16 : gun.label === "Burst" ? 18 : 18;
  var gunWidth = gun.label === "Plasma" ? 9 : 7;
  var gunX = centerX + Player.facing * 7;
  var gunY = centerY;
  var muzzleX = gunX + Player.facing * gunLength;
  var muzzleY = gunY;

  ctx.fillStyle = Draw.colors.dark;
  ctx.fillRect(
    Player.facing > 0 ? centerX + 10 : centerX - 10 - gunLength,
    gunY - gunWidth / 2,
    gunLength,
    gunWidth
  );

  if (gun.label === "Scatter") {
    ctx.fillStyle = accentColor;
    ctx.fillRect(
      Player.facing > 0 ? centerX + 10 : centerX - 10 - gunLength,
      gunY - 12,
      gunLength * 0.55,
      4
    );
    ctx.fillRect(
      Player.facing > 0 ? centerX + 10 : centerX - 10 - gunLength,
      gunY + 8,
      gunLength * 0.55,
      4
    );
  }

  if (gun.label === "Burst") {
    ctx.fillStyle = accentColor;
    ctx.fillRect(
      Player.facing > 0 ? centerX + 10 : centerX - 10 - gunLength,
      gunY - 9,
      gunLength * 0.7,
      4
    );
    ctx.fillRect(
      Player.facing > 0 ? centerX + 10 : centerX - 10 - gunLength,
      gunY + 5,
      gunLength * 0.7,
      4
    );
  }

  if (gun.label === "Plasma") {
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(Player.facing > 0 ? centerX + 18 : centerX - 18, gunY, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  for (var i = 0; i < Player.smokePuffs.length; i++) {
    var puff = Player.smokePuffs[i];
    var progress = puff.life / puff.maxLife;
    ctx.fillStyle = "rgba(73, 137, 124, " + (1 - progress) * 0.7 + ")";
    ctx.beginPath();
    ctx.arc(
      puff.x - Player.facing * progress * 10,
      puff.y - progress * 5,
      3 + progress * 7,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // muzzle flash when recently fired
  var currentGun = CONFIG.GUN_PRESETS[Player.gun] || CONFIG.GUN_PRESETS.blaster;
  if (Player.fireCooldown > 0 && Player.fireCooldown < (currentGun.cooldown || CONFIG.SHOOT_COOLDOWN) - 2) {
    ctx.fillStyle = Draw.colors.sun;
    ctx.beginPath();
    ctx.arc(muzzleX, muzzleY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

};
