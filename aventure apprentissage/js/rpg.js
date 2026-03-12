// rpg.js — Système RPG cosmétique : stats, XP, cosmétiques

const rpgSystem = {

  AVATAR_ITEMS: [
    { id: 'cape_bleue',   name: 'Cape Bleue',       emoji: '🧥', unlock: { stat: 'lecture', level: 3 } },
    { id: 'baguette',     name: 'Baguette Magique',  emoji: '🪄', unlock: { stat: 'calcul',  level: 3 } },
    { id: 'couronne',     name: 'Couronne',           emoji: '👑', unlock: { stat: 'anglais', level: 3 } },
    { id: 'cape_doree',   name: 'Cape Dorée',         emoji: '✨', unlock: { stat: 'lecture', level: 8 } },
    { id: 'armure',       name: 'Armure Légère',      emoji: '🛡️', unlock: { stat: 'calcul',  level: 8 } },
    { id: 'chapeau_mage', name: 'Chapeau de Mage',    emoji: '🎩', unlock: { stat: 'anglais', level: 8 } },
  ],

  UNICORN_ITEMS: [
    { id: 'selle_rose',   name: 'Selle Rose',          emoji: '🌸', unlock: { stat: 'magie', level: 2 } },
    { id: 'ailes',        name: 'Ailes Magiques',       emoji: '🦋', unlock: { stat: 'magie', level: 5 } },
    { id: 'corne_arc',    name: 'Corne Arc-en-ciel',    emoji: '🌈', unlock: { stat: 'magie', level: 10 } },
  ],

  // XP nécessaire par niveau de stat (1→2 : 50xp, 2→3 : 100xp, etc.)
  xpForLevel(level) {
    return level * 50;
  },

  // Ajoute XP à une compétence et monte le niveau si nécessaire
  addXP(profile, skill, points) {
    if (!profile || !profile.stats) return;
    if (!profile.xp) profile.xp = { lecture: 0, calcul: 0, anglais: 0 };

    profile.xp[skill] = (profile.xp[skill] || 0) + points;

    // Vérifie la montée de niveau
    const needed = this.xpForLevel(profile.stats[skill]);
    if (profile.xp[skill] >= needed) {
      profile.xp[skill] -= needed;
      profile.stats[skill]++;
      console.log(`[RPG] Niveau ${skill} → ${profile.stats[skill]} !`);
    }
  },

  // Magie = moyenne arrondie des 3 stats
  getMagie(profile) {
    if (!profile || !profile.stats) return 1;
    return Math.round(
      (profile.stats.lecture + profile.stats.calcul + profile.stats.anglais) / 3
    );
  },

  // Vérifie les nouveaux cosmétiques débloqués et les ajoute au profil
  checkUnlocks(profile) {
    if (!profile || !profile.cosmetics) return [];
    const newItems = [];
    const magie = this.getMagie(profile);

    const checkList = (items, cosmeticKey) => {
      for (const item of items) {
        if (profile.cosmetics[cosmeticKey].includes(item.id)) continue;
        const statVal = item.unlock.stat === 'magie'
          ? magie
          : (profile.stats[item.unlock.stat] || 1);
        if (statVal >= item.unlock.level) {
          profile.cosmetics[cosmeticKey].push(item.id);
          newItems.push(item);
        }
      }
    };

    checkList(this.AVATAR_ITEMS,   'avatar');
    checkList(this.UNICORN_ITEMS,  'unicorn');
    return newItems;
  },

  // Retourne le nom d'affichage d'un item par son id
  getItemById(id) {
    return [...this.AVATAR_ITEMS, ...this.UNICORN_ITEMS].find((i) => i.id === id) || null;
  },
};
