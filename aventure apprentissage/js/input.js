// input.js — Gestion des entrées clavier + manette

const inputSystem = {
  keys: {},

  // ── Gamepad state ──
  _gamepad: null,
  _gpPrevButtons: [],   // previous frame button states (for edge detection)
  _gpDeadzone: 0.3,
  _gpStick: { dx: 0, dy: 0 },
  _gpButtons: {         // current frame — true while held
    a: false, b: false, x: false, y: false,
    start: false,
    up: false, down: false, left: false, right: false,
  },
  _gpPressed: {         // just-pressed this frame (edge-triggered)
    a: false, b: false, x: false, y: false,
    start: false,
    up: false, down: false, left: false, right: false,
  },

  init() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      // Empêche le scroll de la page avec les flèches
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Gamepad connect / disconnect
    window.addEventListener('gamepadconnected', (e) => {
      console.log('[Input] Manette connectée :', e.gamepad.id);
      this._gamepad = e.gamepad;
    });
    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('[Input] Manette déconnectée :', e.gamepad.id);
      this._gamepad = null;
    });
  },

  // Call once per frame to snapshot gamepad state
  pollGamepad() {
    var gps = navigator.getGamepads ? navigator.getGamepads() : [];
    var gp = null;
    for (var i = 0; i < gps.length; i++) {
      if (gps[i]) { gp = gps[i]; break; }
    }
    if (!gp) {
      // No gamepad — clear everything
      this._gpStick.dx = 0;
      this._gpStick.dy = 0;
      var k;
      for (k in this._gpButtons)  this._gpButtons[k]  = false;
      for (k in this._gpPressed)  this._gpPressed[k]  = false;
      return;
    }

    // Stick (axes 0/1)
    var sx = gp.axes[0] || 0;
    var sy = gp.axes[1] || 0;
    this._gpStick.dx = Math.abs(sx) > this._gpDeadzone ? (sx > 0 ? 1 : -1) : 0;
    this._gpStick.dy = Math.abs(sy) > this._gpDeadzone ? (sy > 0 ? 1 : -1) : 0;

    // Standard mapping: A=0 B=1 X=2 Y=3 Start=9 DUp=12 DDown=13 DLeft=14 DRight=15
    var map = { a:0, b:1, x:2, y:3, start:9, up:12, down:13, left:14, right:15 };
    var prev = this._gpPrevButtons;
    var name;
    for (name in map) {
      var idx = map[name];
      var held = gp.buttons[idx] ? gp.buttons[idx].pressed : false;
      this._gpPressed[name] = held && !prev[idx];
      this._gpButtons[name] = held;
    }

    // Save for next frame
    this._gpPrevButtons = [];
    for (var j = 0; j < gp.buttons.length; j++) {
      this._gpPrevButtons[j] = gp.buttons[j] ? gp.buttons[j].pressed : false;
    }
  },

  // Retourne {dx, dy} normalisé depuis clavier (-1, 0, 1)
  getKeyboardInput() {
    let dx = 0, dy = 0;
    if (this.keys['ArrowLeft']  || this.keys['KeyA'] || this.keys['KeyQ']) dx = -1;
    if (this.keys['ArrowRight'] || this.keys['KeyD'])                       dx =  1;
    if (this.keys['ArrowUp']    || this.keys['KeyW'] || this.keys['KeyZ']) dy = -1;
    if (this.keys['ArrowDown']  || this.keys['KeyS'])                       dy =  1;
    return { dx, dy };
  },

  // Retourne {dx, dy} depuis la manette (stick + d-pad)
  getGamepadInput() {
    var dx = this._gpStick.dx;
    var dy = this._gpStick.dy;
    // D-pad overrides stick
    if (this._gpButtons.left)  dx = -1;
    if (this._gpButtons.right) dx =  1;
    if (this._gpButtons.up)    dy = -1;
    if (this._gpButtons.down)  dy =  1;
    return { dx: dx, dy: dy };
  },

  // Returns true the frame a gamepad button was first pressed
  isGamepadPressed(name) {
    return !!this._gpPressed[name];
  },

  isKeyPressed(code) {
    return !!this.keys[code];
  },
};
