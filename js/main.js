/* =====================================================================
   main.js  --  THE STARTING LINE.

   This is the smallest file in the project and it runs last. All it
   does is: set up the screen, load the data files, build the first
   level, and start the loop.

   You will almost never need to change this file.
   ===================================================================== */

Draw.setup();

Level.loadData(function () {
  var modSelect = document.getElementById("mod-select");
  if (modSelect) {
    modSelect.value = Game.modName;
    modSelect.addEventListener("change", function () {
      Game.setMod(modSelect.value);
    });
  }

  Game.startLevel(CONFIG.START_LEVEL);
  Game.loop();
});
