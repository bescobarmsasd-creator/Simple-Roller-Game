/* =====================================================================
   player.js  --  THE ROLLING CIRCLE.

   This file owns everything about the player: where it is, how fast it
   is going, and what happens when it hits something.

   It does NOT draw anything. Drawing lives in js/draw.js.
   ===================================================================== */

var Player = {
  x: 0,            // position in pixels, left edge of the box
  y: 0,            // position in pixels, top edge of the box
  vx: 0,           // speed left and right
  vy: 0,           // speed up and down
  onGround: false, // is the player standing on something right now?
  angle: 0,        // how far the circle has rolled, for drawing the dot
  facing: 1,       // which way the player is aiming
  gun: "blaster",
  gunOrder: ["blaster", "rifle", "grenade", "scatter", "burst", "plasma", "pulse", "nova", "cannon", "rail"],
  ammo: 0,
  reserveAmmo: 0,
  reloadTimer: 0,
  fireCooldown: 0,  // frames until the next shot can fire
  projectiles: [], // active bullets
  smokePuffs: [],  // short-lived smoke from the player's cannon
  explosion: null,
  botProjectiles: [],
  hitByTankShot: false,
  jumpHeld: false, // was jump held last frame?
  dashHeld: false,
  jumpCount: 0,    // how many jumps have been used in this jump cycle
  canDoubleJump: true,
  doubleJumpCooldown: 0, // how long until another double jump is available
  dashCooldown: 0,
  dashTimer: 0
};

// Put the player back at the level's S square.
Player.reset = function () {
  Player.x = Level.startX;
  Player.y = Level.startY;
  Player.vx = 0;
  Player.vy = 0;
  Player.onGround = false;
  Player.angle = 0;
  Player.facing = 1;
  Player.gun = Player.gun || "blaster";
  Player.ammo = 0;
  Player.reserveAmmo = 0;
  Player.reloadTimer = 0;
  Player.fireCooldown = 0;
  Player.projectiles = [];
  Player.smokePuffs = [];
  Player.explosion = null;
  Player.botProjectiles = [];
  Player.hitByTankShot = false;
  Player.jumpHeld = false;
  Player.dashHeld = false;
  Player.jumpCount = 0;
  Player.canDoubleJump = true;
  Player.doubleJumpCooldown = 0;
  Player.dashCooldown = 0;
  Player.dashTimer = 0;
};

Player.setGun = function (gunName) {
  if (!CONFIG.GUN_PRESETS[gunName]) { return; }
  var gun = CONFIG.GUN_PRESETS[gunName];
  Player.gun = gunName;
  Player.fireCooldown = 0;
  Player.reloadTimer = 0;

  if (gun.magazine) {
    if (Player.ammo <= 0 && Player.reserveAmmo <= 0) {
      Player.ammo = gun.magazine;
      Player.reserveAmmo = gun.reserve || gun.magazine * 3;
    }
  } else {
    Player.ammo = 0;
    Player.reserveAmmo = 0;
  }
};

Player.applyPowerUp = function () {
  var currentIndex = Player.gunOrder.indexOf(Player.gun);
  if (currentIndex === -1) { currentIndex = 0; }
  var nextIndex = (currentIndex + 1) % Player.gunOrder.length;
  Player.setGun(Player.gunOrder[nextIndex]);
  if (Game && Game.showMessage) {
    Game.showMessage("Power up! " + CONFIG.GUN_PRESETS[Player.gun].label + " online.");
  }
};

Player.getAmmo = function () {
  var gun = CONFIG.GUN_PRESETS[Player.gun] || CONFIG.GUN_PRESETS.blaster;
  if (!gun.magazine) {
    if (Game && Game.showMessage) { Game.showMessage("This gun doesn't use ammo."); }
    return;
  }

  Player.reserveAmmo = (Player.reserveAmmo || 0) + (gun.magazine || 6);
  if (Game && Game.showMessage) { Game.showMessage("Ammo +" + (gun.magazine || 6) + " for " + gun.label + "."); }
};

Player.reloadWeapon = function () {
  var gun = CONFIG.GUN_PRESETS[Player.gun] || CONFIG.GUN_PRESETS.blaster;
  if (!gun.magazine || Player.reloadTimer > 0 || Player.ammo >= gun.magazine) { return; }

  if (Player.reserveAmmo <= 0 && Player.ammo <= 0) {
    if (Game && Game.showMessage) { Game.showMessage("Out of ammo."); }
    return;
  }

  Player.reloadTimer = gun.reloadTime || 30;
  if (Game && Game.showMessage) { Game.showMessage(gun.label + " reloading..."); }
};

Player.explode = function (x, y, radius, damage) {
  Player.explosion = {
    x: x,
    y: y,
    life: 0,
    maxLife: 26,
    radius: radius || 36,
    damage: damage || 1,
    blast: true
  };

  for (var i = 0; i < Level.bots.length; i++) {
    var bot = Level.bots[i];
    if (!bot.alive) { continue; }
    var centerX = bot.x + bot.w / 2;
    var centerY = bot.y + bot.h / 2;
    var dist = Math.sqrt((centerX - x) * (centerX - x) + (centerY - y) * (centerY - y));
    if (dist <= radius) {
      if (bot.isBoss) {
        bot.hp = (bot.hp || 1) - 1;
        if (bot.hp <= 0) { bot.alive = false; }
      } else {
        bot.alive = false;
      }
    }
  }
};

Player.shoot = function () {
  var gun = CONFIG.GUN_PRESETS[Player.gun] || CONFIG.GUN_PRESETS.blaster;
  var pelletCount = gun.pellets || 1;
  var spread = gun.spread || 0;

  for (var i = 0; i < pelletCount; i++) {
    var offset = pelletCount === 1 ? 0 : (i - (pelletCount - 1) / 2) * spread;
    var vx = Player.facing * (gun.bulletSpeed || CONFIG.BULLET_SPEED) * Math.cos(offset);
    var vy = (gun.bulletSpeed || CONFIG.BULLET_SPEED) * Math.sin(offset);

    var bullet = {
      x: Player.x + CONFIG.PLAYER_SIZE / 2 - (gun.bulletSize || CONFIG.BULLET_SIZE) / 2 + Player.facing * (CONFIG.PLAYER_SIZE / 2 + 6),
      y: Player.y + CONFIG.PLAYER_SIZE / 2 - (gun.bulletSize || CONFIG.BULLET_SIZE) / 2,
      vx: vx,
      vy: vy,
      radius: (gun.bulletSize || CONFIG.BULLET_SIZE) / 2,
      life: 0,
      maxLife: gun.bulletLife || CONFIG.BULLET_LIFE,
      color: gun.color || "#ffd166",
      damage: gun.damage || 1,
      isGrenade: gun.type === "grenade",
      blastRadius: gun.blastRadius || 36,
      fuse: gun.fuse || 48,
      gravity: gun.type === "grenade" ? 0.18 : 0
    };

    if (gun.type === "grenade") {
      bullet.vy = -3.5;
      bullet.vx = Player.facing * (gun.bulletSpeed || 7);
    }

    Player.projectiles.push(bullet);
    Player.smokePuffs.push({
      x: bullet.x + Player.facing * ((gun.bulletSize || CONFIG.BULLET_SIZE) / 2 + 3),
      y: bullet.y + (gun.bulletSize || CONFIG.BULLET_SIZE) / 2,
      life: 0,
      maxLife: 18
    });
  }
};

Player.updateSmoke = function () {
  for (var i = Player.smokePuffs.length - 1; i >= 0; i--) {
    Player.smokePuffs[i].life = Player.smokePuffs[i].life + 1;
    if (Player.smokePuffs[i].life > Player.smokePuffs[i].maxLife) {
      Player.smokePuffs.splice(i, 1);
    }
  }
};

Player.startExplosion = function () {
  Player.explosion = {
    x: Player.x + CONFIG.PLAYER_SIZE / 2,
    y: Player.y + CONFIG.PLAYER_SIZE / 2,
    life: 0,
    maxLife: 36
  };
};

Player.updateExplosion = function () {
  if (!Player.explosion) { return; }
  Player.explosion.life = Player.explosion.life + 1;
  if (Player.explosion.life > Player.explosion.maxLife) {
    Player.explosion = null;
  }
};

Player.updatePowerUps = function () {
  for (var i = Level.powerUps.length - 1; i >= 0; i--) {
    var pickup = Level.powerUps[i];
    if (Collide.boxesOverlap(
      Player.x,
      Player.y,
      CONFIG.PLAYER_SIZE,
      CONFIG.PLAYER_SIZE,
      pickup.x,
      pickup.y,
      pickup.w,
      pickup.h
    )) {
      if (pickup.type === "ammo") {
        Player.getAmmo();
      } else {
        Player.applyPowerUp();
      }
      Level.powerUps.splice(i, 1);
    }
  }
};

Player.updateProjectiles = function () {
  for (var i = Player.projectiles.length - 1; i >= 0; i--) {
    var bullet = Player.projectiles[i];
    if (bullet.isGrenade) {
      bullet.vy = bullet.vy + bullet.gravity;
      bullet.x = bullet.x + bullet.vx;
      bullet.y = bullet.y + bullet.vy;
      bullet.life = bullet.life + 1;

      if (bullet.life > bullet.fuse || bullet.x < -40 || bullet.x > Level.pixelWidth() + 40 || bullet.y < -40 || bullet.y > CONFIG.CANVAS_H + 40) {
        Player.explode(bullet.x, bullet.y, bullet.blastRadius || 36, bullet.damage || 3);
        Player.projectiles.splice(i, 1);
        continue;
      }

      if (Collide.hitsSolid(bullet.x - bullet.radius, bullet.y - bullet.radius, bullet.radius * 2, bullet.radius * 2)) {
        Player.explode(bullet.x, bullet.y, bullet.blastRadius || 36, bullet.damage || 3);
        Player.projectiles.splice(i, 1);
        continue;
      }

      for (var e = Level.bots.length - 1; e >= 0; e--) {
        var bot = Level.bots[e];
        if (!bot.alive) { continue; }
        if (Collide.boxesOverlap(
          bullet.x - bullet.radius,
          bullet.y - bullet.radius,
          bullet.radius * 2,
          bullet.radius * 2,
          bot.x,
          bot.y,
          bot.w,
          bot.h
        )) {
          Player.explode(bullet.x, bullet.y, bullet.blastRadius || 36, bullet.damage || 3);
          Player.projectiles.splice(i, 1);
          break;
        }
      }
      continue;
    }

    bullet.x = bullet.x + bullet.vx;
    bullet.y = bullet.y + bullet.vy;
    bullet.life = bullet.life + 1;

    if (bullet.life > bullet.maxLife || bullet.x < -40 || bullet.x > Level.pixelWidth() + 40 || bullet.y < -40 || bullet.y > CONFIG.CANVAS_H + 40) {
      Player.projectiles.splice(i, 1);
      continue;
    }

    if (Collide.hitsSolid(bullet.x - bullet.radius, bullet.y - bullet.radius, bullet.radius * 2, bullet.radius * 2)) {
      Player.projectiles.splice(i, 1);
      continue;
    }

    for (var e = Level.bots.length - 1; e >= 0; e--) {
      var bot = Level.bots[e];
      if (!bot.alive) { continue; }
      if (Collide.boxesOverlap(
        bullet.x - bullet.radius,
        bullet.y - bullet.radius,
        bullet.radius * 2,
        bullet.radius * 2,
        bot.x,
        bot.y,
        bot.w,
        bot.h
      )) {
        if (bot.isBoss) {
          bot.hp = (bot.hp || 1) - 1;
          if (bot.hp <= 0) {
            bot.alive = false;
          }
        } else {
          bot.alive = false;
        }
        Player.projectiles.splice(i, 1);
        break;
      }
    }
  }
};

Player.updateBots = function () {
  for (var i = 0; i < Level.bots.length; i++) {
    var bot = Level.bots[i];
    if (!bot.alive) { continue; }

    var dx = Player.x - bot.x;
    var dy = Player.y - bot.y;
    var distX = Math.abs(dx);
    var distY = Math.abs(dy);
    var type = bot.type || "scout";

    if (type === "turret") {
      bot.x = bot.x + Math.sin((Date.now() / 400) + bot.phase) * 0.35;
      bot.y = bot.y + Math.cos((Date.now() / 300) + bot.phase) * 0.45;
    } else if (type === "zigzag") {
      bot.x = bot.x + Math.sign(dx || 1) * bot.speed * 1.2;
      bot.y = bot.y + Math.sin((Date.now() / 150) + bot.phase) * bot.drift;
    } else if (type === "flanker") {
      bot.x = bot.x + Math.sign(dx || 1) * bot.speed * 1.4;
      bot.y = bot.y + Math.cos((Date.now() / 220) + bot.phase) * 0.9;
    } else {
      bot.x = bot.x + Math.sign(dx || 1) * bot.speed;
      bot.y = bot.y + Math.sin((Date.now() / 180) + bot.phase) * 0.7 + Math.sign(dy || 1) * 0.2;
    }

    bot.fireCooldown = (bot.fireCooldown || 0) - 1;
    if (distX < (bot.type === "turret" ? 320 : 260) && distY < (bot.type === "turret" ? 220 : 180) && bot.fireCooldown <= 0) {
      var dirX = dx === 0 ? 1 : dx / Math.sqrt(dx * dx + dy * dy);
      var dirY = dy === 0 ? 0 : dy / Math.sqrt(dx * dx + dy * dy);
      var shotCount = bot.type === "turret" ? 3 : 1;
      var spread = bot.type === "turret" ? 0.22 : 0;

      for (var shotIndex = 0; shotIndex < shotCount; shotIndex++) {
        var angleOffset = shotCount === 1 ? 0 : (shotIndex - 1) * spread;
        var shotDirX = dirX * Math.cos(angleOffset) - dirY * Math.sin(angleOffset);
        var shotDirY = dirX * Math.sin(angleOffset) + dirY * Math.cos(angleOffset);

        Player.botProjectiles.push({
          x: bot.x + bot.w / 2,
          y: bot.y + bot.h / 2,
          vx: shotDirX * (bot.shotSpeed || 4),
          vy: shotDirY * (bot.shotSpeed || 4),
          radius: bot.type === "turret" ? 5 : 4,
          life: 0,
          maxLife: 120
        });
      }

      bot.fireCooldown = bot.shotRate || 80;
    }

    if (bot.x < 0) { bot.x = 0; }
    if (bot.x + bot.w > Level.pixelWidth()) { bot.x = Level.pixelWidth() - bot.w; }
    if (bot.y < 20) { bot.y = 20; }
    if (bot.y + bot.h > CONFIG.CANVAS_H - 20) { bot.y = CONFIG.CANVAS_H - 20 - bot.h; }
  }

  for (var j = Player.botProjectiles.length - 1; j >= 0; j--) {
    var shot = Player.botProjectiles[j];
    shot.x = shot.x + shot.vx;
    shot.y = shot.y + shot.vy;
    shot.life = shot.life + 1;

    if (shot.life > shot.maxLife || shot.x < -20 || shot.x > Level.pixelWidth() + 20 || shot.y < -20 || shot.y > CONFIG.CANVAS_H + 20) {
      Player.botProjectiles.splice(j, 1);
      continue;
    }

    if (Collide.boxesOverlap(
      shot.x - shot.radius,
      shot.y - shot.radius,
      shot.radius * 2,
      shot.radius * 2,
      Player.x,
      Player.y,
      CONFIG.PLAYER_SIZE,
      CONFIG.PLAYER_SIZE
    )) {
      Player.botProjectiles.splice(j, 1);
      Player.hitByTankShot = true;
    }
  }
};

// Run one frame of player movement.
Player.update = function () {
  var size = CONFIG.PLAYER_SIZE;
  var jumpPressedThisFrame = Input.jump && !Player.jumpHeld;
  var dashPressedThisFrame = Input.dash && !Player.dashHeld;

  // --- 1. decide how fast to go sideways ------------------------------
  Player.vx = 0;
  if (Input.left)  {
    Player.vx = -CONFIG.MOVE_SPEED;
    Player.facing = -1;
  }
  if (Input.right) {
    Player.vx = CONFIG.MOVE_SPEED;
    Player.facing = 1;
  }

  var gun = CONFIG.GUN_PRESETS[Player.gun] || CONFIG.GUN_PRESETS.blaster;

  if (Player.reloadTimer > 0) {
    Player.reloadTimer = Player.reloadTimer - 1;
    if (Player.reloadTimer <= 0) {
      var needed = (gun.magazine || 0) - Player.ammo;
      var loaded = Math.min(needed, Player.reserveAmmo);
      Player.ammo = Player.ammo + loaded;
      Player.reserveAmmo = Player.reserveAmmo - loaded;
      if (Game && Game.showMessage) { Game.showMessage(gun.label + ": " + Player.ammo + "/" + (gun.magazine || Player.ammo)); }
    }
  }

  if (Input.reload && Player.reloadTimer <= 0 && gun.magazine && Player.ammo < gun.magazine) {
    Player.reloadWeapon();
  }

  if (Input.fire && Player.fireCooldown <= 0) {
    if (gun.magazine) {
      if (Player.reloadTimer > 0) {
        return;
      }
      if (Player.ammo <= 0) {
        Player.reloadWeapon();
        return;
      }
      Player.ammo = Player.ammo - 1;
    }
    Player.shoot();
    Player.fireCooldown = gun.cooldown || CONFIG.SHOOT_COOLDOWN;
  }
  Player.fireCooldown = Math.max(0, Player.fireCooldown - 1);

  Player.dashCooldown = Math.max(0, Player.dashCooldown - 1);
  if (dashPressedThisFrame && Player.dashCooldown <= 0) {
    Player.dashCooldown = CONFIG.DASH_COOLDOWN;
    Player.dashTimer = CONFIG.DASH_TIME;
    Player.vx = Player.facing * CONFIG.DASH_SPEED;
  }
  if (Player.dashTimer > 0) {
    Player.dashTimer = Player.dashTimer - 1;
    Player.vx = Player.facing * CONFIG.DASH_SPEED;
  }

  if (Player.onGround) {
    Player.jumpCount = 0;
    Player.canDoubleJump = true;
    Player.doubleJumpCooldown = 0;
  }
  // A double jump means exactly two jumps total in one air cycle:
  // one from the ground, then one extra while airborne.
  if (jumpPressedThisFrame && Player.onGround) {
    Player.vy = -CONFIG.JUMP_POWER;   // negative is UP
    Player.onGround = false;
    Player.jumpCount = 1;
    Player.canDoubleJump = true;
    Player.jumpHeld = false;
  } else if (jumpPressedThisFrame && !Player.onGround && Player.canDoubleJump) {
    Player.vy = -CONFIG.DOUBLE_JUMP_POWER;
    Player.jumpCount = 2;
    Player.canDoubleJump = false;
    Player.jumpHeld = false;
  }

  // --- 3. gravity pulls down every single frame -----------------------
  Player.vy = Player.vy + CONFIG.GRAVITY;
  if (Player.vy > CONFIG.MAX_FALL) { Player.vy = CONFIG.MAX_FALL; }

  // --- 4. move sideways, one pixel at a time, stopping at walls -------
  var prevX = Player.x;
  var stepX = 0;
  if (Player.vx > 0) { stepX = 1; }
  if (Player.vx < 0) { stepX = -1; }

  for (var i = 0; i < Math.abs(Player.vx); i++) {
    if (Collide.hitsSolid(Player.x + stepX, Player.y, size, size)) { break; }
    Player.x = Player.x + stepX;
    Player.angle = Player.angle + stepX / CONFIG.PLAYER_RADIUS; // roll it
  }

  if (Collide.hitsSolid(Player.x, Player.y, size, size)) {
    Player.x = prevX;
    Player.vx = 0;
  }

  // --- 5. move up or down, one pixel at a time ------------------------
  var prevY = Player.y;
  var stepY = 0;
  if (Player.vy > 0) { stepY = 1; }
  if (Player.vy < 0) { stepY = -1; }

  Player.onGround = false;

  for (var j = 0; j < Math.abs(Player.vy); j++) {
    if (Collide.hitsSolid(Player.x, Player.y + stepY, size, size)) {
      if (stepY > 0) { Player.onGround = true; }  // we landed on something
      Player.vy = 0;
      break;
    }
    Player.y = Player.y + stepY;
  }

  if (Collide.hitsSolid(Player.x, Player.y, size, size)) {
    Player.y = prevY;
    if (stepY > 0) { Player.onGround = true; }
    Player.vy = 0;
  }

  // --- 6. keep the player inside the left edge of the world -----------
  if (Player.x < 0) { Player.x = 0; }

  if (Player.onGround) {
    Player.jumpCount = 0;
    Player.canDoubleJump = true;
  }

  Player.jumpHeld = Input.jump;
  Player.dashHeld = Input.dash;
  Level.updateFallingSpikes();
  Player.updateProjectiles();
  Player.updateSmoke();
  Player.updateBots();
};

// Did the player just touch something deadly?
Player.isDead = function () {
  var size = CONFIG.PLAYER_SIZE;
  if (Player.hitByTankShot) { return true; }
  if (Collide.hitsSpike(Player.x, Player.y, size, size)) { return true; }
  for (var i = 0; i < Level.fallingSpikes.length; i++) {
    var spike = Level.fallingSpikes[i];
    if (Collide.boxesOverlap(Player.x, Player.y, size, size, spike.x, spike.y, spike.w, spike.h)) {
      return true;
    }
  }
  if (Collide.hitsLava(Player.x, Player.y, size, size)) { return true; }
  if (Player.y > CONFIG.CANVAS_H + 200) { return true; }   // fell off the world
  for (var i = 0; i < Level.bots.length; i++) {
    var bot = Level.bots[i];
    if (!bot.alive) { continue; }
    if (Collide.boxesOverlap(Player.x, Player.y, size, size, bot.x, bot.y, bot.w, bot.h)) {
      return true;
    }
  }
  return false;
};

// Did the player just reach the finish?
Player.hasWon = function () {
  var size = CONFIG.PLAYER_SIZE;
  return Collide.hitsFinish(Player.x, Player.y, size, size);
};
