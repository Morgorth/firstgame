// save.js — Sauvegarde locale via localStorage

const saveSystem = {
  PROFILE_KEY:  'licornerpg_profile',
  PROGRESS_KEY: 'licornerpg_progress',

  defaultProfile() {
    return {
      name: 'Aventurier',
      createdAt: Date.now(),
      stats: { lecture: 1, calcul: 1, anglais: 1 },
      cosmetics: { avatar: [], unicorn: [] },
      equippedAvatar: null,
      equippedUnicorn: null,
    };
  },

  defaultProgress() {
    return {
      currentLevel: 1,
      levels: {},   // { levelNum: { completed: bool, roomsDone: [int], score: int } }
    };
  },

  saveProfile(profile) {
    try {
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('saveProfile failed:', e);
    }
  },

  loadProfile() {
    try {
      const raw = localStorage.getItem(this.PROFILE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        // Assure la compatibilité avec les anciens saves
        if (!p.stats)     p.stats     = { lecture: 1, calcul: 1, anglais: 1 };
        if (!p.cosmetics) p.cosmetics = { avatar: [], unicorn: [] };
        return p;
      }
    } catch (e) {
      console.warn('loadProfile failed:', e);
    }
    return this.defaultProfile();
  },

  saveProgress(progress) {
    try {
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('saveProgress failed:', e);
    }
  },

  loadProgress() {
    try {
      const raw = localStorage.getItem(this.PROGRESS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('loadProgress failed:', e);
    }
    return this.defaultProgress();
  },

  resetAll() {
    localStorage.removeItem(this.PROFILE_KEY);
    localStorage.removeItem(this.PROGRESS_KEY);
  },
};
