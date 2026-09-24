/* =====================================================================
   draw.js  --  EVERYTHING YOU CAN SEE.

   Nothing in this file changes the game. It only puts pixels on screen.
   If you want to change how the game LOOKS, this is the only file you
   need. If you want to change how it BEHAVES, this is the wrong file.

   The whole game is black and white on purpose. That is your room to
   work in.
   ===================================================================== */

var Draw = {
  canvas: null,
  ctx: null,
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

  // 1. wipe the screen white
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

  // 2. shift everything left so the camera looks like it moved right
  ctx.save();
  ctx.translate(-Draw.cameraX, 0);

  Draw.world();
  Draw.enemies();
  Draw.bots();
  Draw.projectiles();
  Draw.player();

  ctx.restore();
  Draw.doubleJumpBar();
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

// A solid block: white inside, black outline.
Draw.block = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = CONFIG.LINE_WIDTH;
  ctx.strokeRect(x + CONFIG.LINE_WIDTH / 2,
                 y + CONFIG.LINE_WIDTH / 2,
                 size - CONFIG.LINE_WIDTH,
                 size - CONFIG.LINE_WIDTH);
};

// A spike: a solid black triangle pointing up.
Draw.spike = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size / 2, y);
  ctx.lineTo(x + size, y + size);
  ctx.closePath();
  ctx.fill();
};

// A downward-facing spike hanging from the ceiling.
Draw.spikeDown = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size / 2, y + size);
  ctx.closePath();
  ctx.fill();
};

// Lava is a bright, visibly dangerous floor tile.
Draw.lava = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#ff5a1f";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = CONFIG.LINE_WIDTH;
  ctx.strokeRect(x + CONFIG.LINE_WIDTH / 2,
                 y + CONFIG.LINE_WIDTH / 2,
                 size - CONFIG.LINE_WIDTH,
                 size - CONFIG.LINE_WIDTH);
  ctx.fillStyle = "#000000";
  ctx.fillRect(x + 8, y + 12, 8, 3);
  ctx.fillRect(x + 24, y + 22, 8, 3);
};

// The finish: a black pole with a flag on it.
Draw.finish = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#000000";
  ctx.fillRect(x + size / 2 - 2, y, 4, size);
  ctx.beginPath();
  ctx.moveTo(x + size / 2 + 2, y + 4);
  ctx.lineTo(x + size - 4,     y + 12);
  ctx.lineTo(x + size / 2 + 2, y + 20);
  ctx.closePath();
  ctx.fill();
};

// Enemies are little black squares with a glowing eye on them.
Draw.enemies = function () {
  for (var i = 0; i < Level.enemies.length; i++) {
    var enemy = Level.enemies[i];
    var x = enemy.x;
    var y = enemy.y;
    var size = Math.min(enemy.w, enemy.h);

    Draw.ctx.fillStyle = "#000000";
    Draw.ctx.fillRect(x, y, size, size);
    Draw.ctx.fillStyle = "#ffffff";
    Draw.ctx.fillRect(x + 6, y + 8, 6, 6);
    Draw.ctx.fillRect(x + size - 12, y + 8, 6, 6);
  }
};

Draw.projectiles = function () {
  for (var i = 0; i < Player.projectiles.length; i++) {
    var b = Player.projectiles[i];
    Draw.ctx.fillStyle = "#000000";
    Draw.ctx.beginPath();
    Draw.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    Draw.ctx.fill();
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
    ctx.fillStyle = "#000000";
    ctx.fillRect(bot.x - 3, bot.y + bot.h - 5, bot.w + 6, 8);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bot.x + 2, bot.y + bot.h - 3, 5, 4);
    ctx.fillRect(bot.x + bot.w - 7, bot.y + bot.h - 3, 5, 4);

    // tank body and turret
    ctx.fillStyle = "#000000";
    ctx.fillRect(bot.x, bot.y + 5, bot.w, bot.h - 7);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bot.x + 5, bot.y + 9, 5, 4);
    ctx.fillRect(bot.x + bot.w - 10, bot.y + 9, 5, 4);
    ctx.beginPath();
    ctx.arc(centerX, bot.y + 7, 8, 0, Math.PI * 2);
    ctx.fill();

    // cannon points toward the player.
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(centerX, bot.y + 7);
    ctx.lineTo(centerX + aimX / aimLength * 22, bot.y + 7 + aimY / aimLength * 22);
    ctx.stroke();
  }

  for (var j = 0; j < Player.botProjectiles.length; j++) {
    var shot = Player.botProjectiles[j];
    Draw.ctx.fillStyle = "#ff5a1f";
    Draw.ctx.beginPath();
    Draw.ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
    Draw.ctx.fill();
    Draw.ctx.strokeStyle = "#000000";
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
  var ready = Player.doubleJumpCooldown <= 0 ? 1 : 1 - Player.doubleJumpCooldown / CONFIG.DOUBLE_JUMP_COOLDOWN;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  ctx.fillStyle = "#000000";
  ctx.fillRect(x + 3, y + 3, (w - 6) * ready, h - 6);

  ctx.fillStyle = "#000000";
  ctx.font = "12px sans-serif";
  ctx.fillText("Double Jump", x + 2, y - 5);
};

// The player tank, drawn over the same collision box as the old circle.
Draw.player = function () {
  var ctx = Draw.ctx;
  var centerX = Player.x + CONFIG.PLAYER_SIZE / 2;
  var centerY = Player.y + CONFIG.PLAYER_SIZE / 2;

  // tracks and wheels
  ctx.fillStyle = "#000000";
  ctx.fillRect(Player.x - 2, Player.y + 15, CONFIG.PLAYER_SIZE + 4, 8);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(Player.x + 2, Player.y + 17, 5, 4);
  ctx.fillRect(Player.x + CONFIG.PLAYER_SIZE - 7, Player.y + 17, 5, 4);

  // tank body
  ctx.fillStyle = "#5f756b";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = CONFIG.LINE_WIDTH;
  ctx.fillRect(Player.x, Player.y + 5, CONFIG.PLAYER_SIZE, 13);
  ctx.strokeRect(
    Player.x + CONFIG.LINE_WIDTH / 2,
    Player.y + 5 + CONFIG.LINE_WIDTH / 2,
    CONFIG.PLAYER_SIZE - CONFIG.LINE_WIDTH,
    13 - CONFIG.LINE_WIDTH
  );

  // turret
  ctx.fillStyle = "#83998e";
  ctx.beginPath();
  ctx.arc(centerX, Player.y + 7, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // cannon
  var gunLength = 18;
  var gunWidth = 7;
  var gunX = centerX + Player.facing * 7;
  var gunY = centerY;
  var muzzleX = gunX + Player.facing * gunLength;
  var muzzleY = gunY;

  ctx.fillStyle = "#000000";
  ctx.fillRect(
    Player.facing > 0 ? centerX + 10 : centerX - 10 - gunLength,
    gunY - gunWidth / 2,
    gunLength,
    gunWidth
  );

  for (var i = 0; i < Player.smokePuffs.length; i++) {
    var puff = Player.smokePuffs[i];
    var progress = puff.life / puff.maxLife;
    ctx.fillStyle = "rgba(110, 110, 110, " + (1 - progress) * 0.7 + ")";
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
  if (Player.fireCooldown > 0 && Player.fireCooldown < CONFIG.SHOOT_COOLDOWN - 2) {
    ctx.fillStyle = "#ffcf5a";
    ctx.beginPath();
    ctx.arc(muzzleX, muzzleY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

};
