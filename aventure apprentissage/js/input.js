// input.js — Gestion des entrées clavier

const inputSystem = {
  keys: {},

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

  isKeyPressed(code) {
    return !!this.keys[code];
  },
};
