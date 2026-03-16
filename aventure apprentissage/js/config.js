// config.js — Configuration globale du jeu Licorne RPG

const CONFIG = {
  canvas: { width: 900, height: 620 },

  player: {
    spawn: { x: 450, y: 555 },
    radius: 18,
    speed: 3,
    color: '#e040fb',
  },

  challenge: {
    triggerRadius: 38,
    maxAttempts: 3,
    gateScore: 5,   // 5/6 épreuves pour ouvrir le portail
  },

  // Zones de challenge — positionnées aux bâtiments du château
  ROOMS: [
    // Tour principale du château (entrée grande arche)
    { x: 400, y: 245, w: 100, h: 60, cx: 450, cy: 278, id: 0 },
    // Aile gauche — Dôme des mathiques
    { x: 50,  y: 240, w: 120, h: 55, cx: 115, cy: 270, id: 1 },
    // Aile droite — Serre des langues (conservatoire)
    { x: 730, y: 240, w: 120, h: 55, cx: 790, cy: 270, id: 2 },
    // Pavillon jardin gauche
    { x: 55,  y: 398, w: 120, h: 55, cx: 120, cy: 432, id: 3 },
    // Fontaine centrale
    { x: 395, y: 405, w: 110, h: 55, cx: 450, cy: 438, id: 4 },
    // Pavillon jardin droit
    { x: 725, y: 398, w: 120, h: 55, cx: 790, cy: 432, id: 5 },
  ],

  // Un seul grand couloir = mouvement libre partout dans les jardins
  CORRIDORS: [
    { x: 18, y: 18, w: 864, h: 550 },
  ],

  EXIT_ZONE:     { x: 415, y: 170, w: 70, h: 60 },
  EXIT_CORRIDOR: { x: 415, y: 170, w: 70, h: 60 },

  // Thèmes visuels par niveaux (legacy — kept for reference)
  THEMES: [
    null,
    // 1-5 : forêt
    { bg: '#e8f5e9', room: '#80cbc4', corridor: '#b2dfdb', wall: '#2e7d32', name: 'Forêt' },
    { bg: '#e8f5e9', room: '#80cbc4', corridor: '#b2dfdb', wall: '#2e7d32', name: 'Forêt' },
    { bg: '#e8f5e9', room: '#80cbc4', corridor: '#b2dfdb', wall: '#2e7d32', name: 'Forêt' },
    { bg: '#e8f5e9', room: '#80cbc4', corridor: '#b2dfdb', wall: '#2e7d32', name: 'Forêt' },
    { bg: '#e8f5e9', room: '#80cbc4', corridor: '#b2dfdb', wall: '#2e7d32', name: 'Forêt' },
    // 6-10 : plage
    { bg: '#e0f7fa', room: '#80deea', corridor: '#b2ebf2', wall: '#00838f', name: 'Plage' },
    { bg: '#e0f7fa', room: '#80deea', corridor: '#b2ebf2', wall: '#00838f', name: 'Plage' },
    { bg: '#e0f7fa', room: '#80deea', corridor: '#b2ebf2', wall: '#00838f', name: 'Plage' },
    { bg: '#e0f7fa', room: '#80deea', corridor: '#b2ebf2', wall: '#00838f', name: 'Plage' },
    { bg: '#e0f7fa', room: '#80deea', corridor: '#b2ebf2', wall: '#00838f', name: 'Plage' },
    // 11-15 : ville
    { bg: '#e3f2fd', room: '#90caf9', corridor: '#bbdefb', wall: '#1565c0', name: 'Ville' },
    { bg: '#e3f2fd', room: '#90caf9', corridor: '#bbdefb', wall: '#1565c0', name: 'Ville' },
    { bg: '#e3f2fd', room: '#90caf9', corridor: '#bbdefb', wall: '#1565c0', name: 'Ville' },
    { bg: '#e3f2fd', room: '#90caf9', corridor: '#bbdefb', wall: '#1565c0', name: 'Ville' },
    { bg: '#e3f2fd', room: '#90caf9', corridor: '#bbdefb', wall: '#1565c0', name: 'Ville' },
    // 16-20 : château
    { bg: '#f3e5f5', room: '#ce93d8', corridor: '#e1bee7', wall: '#7b1fa2', name: 'Château' },
    { bg: '#f3e5f5', room: '#ce93d8', corridor: '#e1bee7', wall: '#7b1fa2', name: 'Château' },
    { bg: '#f3e5f5', room: '#ce93d8', corridor: '#e1bee7', wall: '#7b1fa2', name: 'Château' },
    { bg: '#f3e5f5', room: '#ce93d8', corridor: '#e1bee7', wall: '#7b1fa2', name: 'Château' },
    { bg: '#f3e5f5', room: '#ce93d8', corridor: '#e1bee7', wall: '#7b1fa2', name: 'Château' },
  ],

  // ── World Map — Mario-style worlds ─────────────────────────────
  WORLDS: [
    {
      id: 0, name: 'Forêt Enchantée', emoji: '🌲', levels: [1,2,3,4,5],
      // Map node position on world map canvas
      mapX: 150, mapY: 420,
      // Sky/ground palette for procedural backgrounds
      sky:    { top: '#1A3D1A', mid: '#2E5E2E', bottom: '#4A7A4A', dayTop: '#3A8A3A', dayMid: '#60B060', dayBottom: '#90D890' },
      ground: { dark: [20,40,15], light: [60,140,50] },
      accent: '#2e7d32',
    },
    {
      id: 1, name: 'Plage Magique', emoji: '🏖️', levels: [6,7,8,9,10],
      mapX: 350, mapY: 280,
      sky:    { top: '#0A2A4A', mid: '#104060', bottom: '#186888', dayTop: '#5ABCE0', dayMid: '#80D8F0', dayBottom: '#C8F0FC' },
      ground: { dark: [30,28,18], light: [220,200,140] },
      accent: '#00838f',
    },
    {
      id: 2, name: 'Petite Ville', emoji: '🏘️', levels: [11,12,13,14,15],
      mapX: 550, mapY: 380,
      sky:    { top: '#1A1A3A', mid: '#2A2A55', bottom: '#3A3A70', dayTop: '#6090C0', dayMid: '#88B0D8', dayBottom: '#B0D0F0' },
      ground: { dark: [25,22,20], light: [140,135,125] },
      accent: '#1565c0',
    },
    {
      id: 3, name: 'Château Royal', emoji: '🏰', levels: [16,17,18,19,20],
      mapX: 750, mapY: 240,
      sky:    { top: '#050010', mid: '#0D0825', bottom: '#1A103A', dayTop: '#5BA8E0', dayMid: '#90C8F0', dayBottom: '#C8E8FB' },
      ground: { dark: [8,18,8], light: [72,160,60] },
      accent: '#7b1fa2',
    },
  ],

  // World map path connections (indices into WORLDS)
  WORLD_PATHS: [[0,1],[1,2],[2,3]],

  ROOM_NAMES: [
    '📖 Lecture',
    '➕ Calcul',
    '🇬🇧 Anglais',
    '📖 Lecture',
    '➕ Calcul',
    '🇬🇧 Anglais',
  ],
};

// ── Données des challenges ───────────────────────────────────────────

const LECTURE_SYLLABES = [
  { display: 'ma·man',    expected: ['maman'] },
  { display: 'pa·pa',     expected: ['papa'] },
  { display: 'li·corne',  expected: ['licorne'] },
  { display: 'ma·gie',    expected: ['magie'] },
  { display: 'so·leil',   expected: ['soleil'] },
  { display: 'lu·ne',     expected: ['lune'] },
  { display: 'é·toi·le',  expected: ['étoile', 'etoile'] },
  { display: 'fleur',     expected: ['fleur'] },
  { display: 'che·val',   expected: ['cheval'] },
  { display: 'cou·leur',  expected: ['couleur'] },
  { display: 'ba·teau',   expected: ['bateau'] },
  { display: 'gâ·teau',   expected: ['gâteau', 'gateau'] },
  { display: 'oi·seau',   expected: ['oiseau'] },
  { display: 'prin·cesse',expected: ['princesse'] },
  { display: 'dra·gon',   expected: ['dragon'] },
  { display: 'fé·e',      expected: ['fée', 'fee'] },
];

const LECTURE_MOTS = [
  { display: 'chien',    expected: ['chien'] },
  { display: 'chat',     expected: ['chat'] },
  { display: 'maison',   expected: ['maison'] },
  { display: 'école',    expected: ['école', 'ecole'] },
  { display: 'livre',    expected: ['livre'] },
  { display: 'pomme',    expected: ['pomme'] },
  { display: 'rouge',    expected: ['rouge'] },
  { display: 'grand',    expected: ['grand', 'grande'] },
  { display: 'petit',    expected: ['petit', 'petite'] },
  { display: 'arbre',    expected: ['arbre'] },
  { display: 'porte',    expected: ['porte'] },
  { display: 'table',    expected: ['table'] },
  { display: 'crayon',   expected: ['crayon'] },
  { display: 'cahier',   expected: ['cahier'] },
  { display: 'soleil',   expected: ['soleil'] },
  { display: 'étoile',   expected: ['étoile', 'etoile'] },
];

const LECTURE_PHRASES = [
  { display: 'Le chat dort.',               expected: ['le chat dort'] },
  { display: 'La fleur est belle.',         expected: ['la fleur est belle'] },
  { display: "J'ai un livre.",              expected: ["j'ai un livre", 'jai un livre'] },
  { display: 'Le soleil brille.',           expected: ['le soleil brille'] },
  { display: 'Le chien court vite.',        expected: ['le chien court vite'] },
  { display: 'Maman fait la cuisine.',      expected: ['maman fait la cuisine'] },
  { display: "Je vais à l'école.",          expected: ["je vais à l'école", 'je vais a l ecole'] },
  { display: 'Le dragon vole dans le ciel.',expected: ['le dragon vole dans le ciel'] },
  { display: 'La licorne a une corne magique.', expected: ['la licorne a une corne magique'] },
  { display: 'Les enfants jouent au parc.', expected: ['les enfants jouent au parc'] },
  { display: 'La fée danse sous les étoiles.', expected: ['la fée danse sous les étoiles', 'la fee danse sous les etoiles'] },
  { display: 'Mon cheval court dans la prairie.', expected: ['mon cheval court dans la prairie'] },
];

const ANGLAIS_DATA = [
  { fr: 'un chien',       emoji: '🐕', expected: ['dog', 'a dog', 'the dog', 'dogs'] },
  { fr: 'un chat',        emoji: '🐈', expected: ['cat', 'a cat', 'the cat', 'cats'] },
  { fr: 'rouge',          emoji: '🔴', expected: ['red', 'read', 'red color'] },
  { fr: 'bleu',           emoji: '🔵', expected: ['blue', 'blew'] },
  { fr: 'vert',           emoji: '🟢', expected: ['green'] },
  { fr: 'jaune',          emoji: '🟡', expected: ['yellow'] },
  { fr: 'un oiseau',      emoji: '🐦', expected: ['bird', 'a bird', 'the bird'] },
  { fr: 'un poisson',     emoji: '🐟', expected: ['fish', 'a fish', 'the fish'] },
  { fr: 'une pomme rouge',emoji: '🍎', expected: ['red apple', 'a red apple'] },
  { fr: 'une banane',     emoji: '🍌', expected: ['banana', 'a banana'] },
  { fr: 'un livre',       emoji: '📚', expected: ['book', 'a book'] },
  { fr: 'une maison',     emoji: '🏠', expected: ['house', 'a house'] },
  { fr: 'maman',          emoji: '👩', expected: ['mom', 'mum', 'mother', 'mommy'] },
  { fr: 'papa',           emoji: '👨', expected: ['dad', 'father', 'daddy'] },
  { fr: "C'est un chat.", emoji: '🐈', expected: ['this is a cat', 'it is a cat', "it's a cat"] },
  { fr: "J'aime les fleurs.", emoji: '🌸', expected: ['i like flowers', 'i love flowers'] },
  { fr: "C'est une licorne.", emoji: '🦄', expected: ['this is a unicorn', "it's a unicorn"] },
  { fr: 'Je cours.',      emoji: '🏃', expected: ['i run', "i'm running", 'i am running'] },
  { fr: 'Je saute.',      emoji: '🦘', expected: ['i jump', "i'm jumping"] },
  { fr: 'Je dors.',       emoji: '😴', expected: ['i sleep', "i'm sleeping"] },
  { fr: 'Je suis dans le château.', emoji: '🏰', expected: ['i am in the castle', "i'm in the castle"] },
  { fr: "J'ai une baguette magique.", emoji: '🪄', expected: ['i have a magic wand', 'i have a wand'] },
  { fr: 'Il fait beau.',  emoji: '☀️', expected: ['it is sunny', "it's sunny", 'the weather is nice'] },
  { fr: 'Les étoiles brillent.', emoji: '⭐', expected: ['the stars shine', 'stars shine', 'stars are shining'] },
];

// Génère les valeurs a, b pour un calcul selon le niveau
function generateCalcul(levelNum) {
  let a, b;
  if (levelNum <= 4) {
    a = Math.floor(Math.random() * 10);
    b = Math.floor(Math.random() * 10);
  } else if (levelNum <= 8) {
    do {
      a = 5 + Math.floor(Math.random() * 10);
      b = 5 + Math.floor(Math.random() * 10);
    } while (a + b <= 10);
  } else if (levelNum <= 12) {
    a = 10 + Math.floor(Math.random() * 20);
    b = 1 + Math.floor(Math.random() * 9);
  } else if (levelNum <= 16) {
    // 2 chiffres + 2 chiffres sans retenue
    do {
      a = 10 + Math.floor(Math.random() * 80);
      b = 10 + Math.floor(Math.random() * 80);
    } while ((a % 10) + (b % 10) >= 10 || Math.floor(a / 10) + Math.floor(b / 10) >= 10);
  } else {
    // 2 chiffres + 2 chiffres avec retenue
    do {
      a = 10 + Math.floor(Math.random() * 80);
      b = 10 + Math.floor(Math.random() * 80);
    } while ((a % 10) + (b % 10) < 10);
  }
  return { a, b, answer: a + b };
}

// Construit la liste des 20 niveaux
function buildLevels() {
  const levels = [];
  for (let n = 1; n <= 20; n++) {
    // Types par salle : L, C, A, L, C, A dans l'ordre des rooms
    const challengeTypes = ['lecture', 'calcul', 'anglais', 'lecture', 'calcul', 'anglais'];
    levels.push({ levelNum: n, challengeTypes });
  }
  return levels;
}

const LEVELS = buildLevels();
