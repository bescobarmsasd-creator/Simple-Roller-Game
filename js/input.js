/* =====================================================================
   input.js  --  READING THE KEYBOARD.

   Nothing in here decides what happens. It only records which keys are
   being held down right now. js/player.js is what reads these values
   and decides to move.
   ===================================================================== */

var Input = {
  left: false,
  right: false,
  jump: false,
  fire: false,
  restart: false
};

// Called whenever a key goes DOWN.
window.addEventListener("keydown", function (event) {
  setKey(event.key, true);
  // stop the arrow keys, space, and fire keys from scrolling the page
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "f", "F", "j", "J", "x", "X"].indexOf(event.key) >= 0) {
    event.preventDefault();
  }
});

// Called whenever a key comes back UP.
window.addEventListener("keyup", function (event) {
  setKey(event.key, false);
});

// One place that decides which key means what.
// WANT TO ADD A KEY? Add a line here.
function setKey(key, isDown) {
  if (key === "ArrowLeft"  || key === "a" || key === "A") { Input.left  = isDown; }
  if (key === "ArrowRight" || key === "d" || key === "D") { Input.right = isDown; }
  if (key === "ArrowUp"    || key === " " || key === "w" || key === "W") { Input.jump = isDown; }
  if (key === "f" || key === "F" || key === "j" || key === "J" || key === "x" || key === "X") { Input.fire = isDown; }
  if (key === "r" || key === "R") { Input.restart = isDown; }
}
