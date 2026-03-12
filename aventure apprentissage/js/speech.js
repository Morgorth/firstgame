// speech.js — Interface Web Speech API (STT) fr-FR et en-US

const speechSystem = {
  recognition: null,
  listening: false,
  lang: 'fr-FR',
  _onResult: null,
  _onEnd: null,

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API non disponible dans ce navigateur.');
      this.available = false;
      return;
    }
    this.available = true;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous    = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event) => {
      const results = [];
      for (let i = 0; i < event.results[0].length; i++) {
        results.push(event.results[0][i].transcript);
      }
      const text = results[0] || '';
      const normalized = this.normalize(text);
      if (this._onResult) this._onResult(normalized, results.map(r => this.normalize(r)));
    };

    this.recognition.onend = () => {
      this.listening = false;
      if (this._onEnd) this._onEnd();
    };

    this.recognition.onerror = (event) => {
      console.warn('STT error:', event.error);
      this.listening = false;
      if (this._onEnd) this._onEnd();
    };
  },

  startListening(lang, onResult, onEnd) {
    if (!this.available || !this.recognition) {
      // Fallback si STT indisponible — simuler une fin sans résultat
      setTimeout(() => { if (onEnd) onEnd(); }, 2000);
      return;
    }
    if (this.listening) {
      try { this.recognition.stop(); } catch (e) {}
    }
    this.lang = lang || 'fr-FR';
    this.recognition.lang = this.lang;
    this._onResult = onResult;
    this._onEnd = onEnd;
    try {
      this.recognition.start();
      this.listening = true;
    } catch (e) {
      console.warn('STT start error:', e);
      setTimeout(() => { if (onEnd) onEnd(); }, 100);
    }
  },

  stopListening() {
    if (this.recognition && this.listening) {
      try { this.recognition.stop(); } catch (e) {}
    }
    this.listening = false;
  },

  // Normalise le texte : supprime accents, lowercase, trim, convertit nombres écrits
  normalize(text) {
    if (!text) return '';
    let t = text.toLowerCase().trim();

    // Convertit d'abord les nombres en mots
    t = this._replaceSpokenNumbers(t);

    // Supprime la ponctuation sauf les espaces
    t = t.replace(/[.,!?;:'"«»\-]/g, ' ');

    // Supprime les accents
    t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Collapse whitespace
    t = t.replace(/\s+/g, ' ').trim();

    return t;
  },

  // Remplace les nombres écrits en lettres par leur valeur numérique
  _replaceSpokenNumbers(text) {
    const map = [
      // Composés 21-99
      [/vingt[- ]et[- ]un(e)?/g, '21'],
      [/vingt[- ]deux/g, '22'],
      [/vingt[- ]trois/g, '23'],
      [/vingt[- ]quatre/g, '24'],
      [/vingt[- ]cinq/g, '25'],
      [/vingt[- ]six/g, '26'],
      [/vingt[- ]sept/g, '27'],
      [/vingt[- ]huit/g, '28'],
      [/vingt[- ]neuf/g, '29'],
      [/trente[- ]et[- ]un(e)?/g, '31'],
      [/trente[- ]deux/g, '32'],
      [/trente[- ]trois/g, '33'],
      [/trente[- ]quatre/g, '34'],
      [/trente[- ]cinq/g, '35'],
      [/trente[- ]six/g, '36'],
      [/trente[- ]sept/g, '37'],
      [/trente[- ]huit/g, '38'],
      [/trente[- ]neuf/g, '39'],
      [/quarante[- ]et[- ]un(e)?/g, '41'],
      [/quarante[- ]deux/g, '42'],
      [/quarante[- ]trois/g, '43'],
      [/quarante[- ]quatre/g, '44'],
      [/quarante[- ]cinq/g, '45'],
      [/quarante[- ]six/g, '46'],
      [/quarante[- ]sept/g, '47'],
      [/quarante[- ]huit/g, '48'],
      [/quarante[- ]neuf/g, '49'],
      [/cinquante[- ]et[- ]un(e)?/g, '51'],
      [/cinquante[- ]deux/g, '52'],
      [/cinquante[- ]trois/g, '53'],
      [/cinquante[- ]quatre/g, '54'],
      [/cinquante[- ]cinq/g, '55'],
      [/cinquante[- ]six/g, '56'],
      [/cinquante[- ]sept/g, '57'],
      [/cinquante[- ]huit/g, '58'],
      [/cinquante[- ]neuf/g, '59'],
      [/soixante[- ]et[- ]un(e)?/g, '61'],
      [/soixante[- ]deux/g, '62'],
      [/soixante[- ]trois/g, '63'],
      [/soixante[- ]quatre/g, '64'],
      [/soixante[- ]cinq/g, '65'],
      [/soixante[- ]six/g, '66'],
      [/soixante[- ]sept/g, '67'],
      [/soixante[- ]huit/g, '68'],
      [/soixante[- ]neuf/g, '69'],
      [/soixante[- ]dix[- ]sept/g, '77'],
      [/soixante[- ]dix[- ]huit/g, '78'],
      [/soixante[- ]dix[- ]neuf/g, '79'],
      [/soixante[- ]et[- ]onze/g, '71'],
      [/soixante[- ]douze/g, '72'],
      [/soixante[- ]treize/g, '73'],
      [/soixante[- ]quatorze/g, '74'],
      [/soixante[- ]quinze/g, '75'],
      [/soixante[- ]seize/g, '76'],
      [/soixante[- ]dix/g, '70'],
      [/quatre[- ]vingt[- ]dix[- ]sept/g, '97'],
      [/quatre[- ]vingt[- ]dix[- ]huit/g, '98'],
      [/quatre[- ]vingt[- ]dix[- ]neuf/g, '99'],
      [/quatre[- ]vingt[- ]dix[- ]un(e)?/g, '91'],
      [/quatre[- ]vingt[- ]onze/g, '91'],
      [/quatre[- ]vingt[- ]douze/g, '92'],
      [/quatre[- ]vingt[- ]treize/g, '93'],
      [/quatre[- ]vingt[- ]quatorze/g, '94'],
      [/quatre[- ]vingt[- ]quinze/g, '95'],
      [/quatre[- ]vingt[- ]seize/g, '96'],
      [/quatre[- ]vingt[- ]dix/g, '90'],
      [/quatre[- ]vingt[- ]un(e)?/g, '81'],
      [/quatre[- ]vingt[- ]deux/g, '82'],
      [/quatre[- ]vingt[- ]trois/g, '83'],
      [/quatre[- ]vingt[- ]quatre/g, '84'],
      [/quatre[- ]vingt[- ]cinq/g, '85'],
      [/quatre[- ]vingt[- ]six/g, '86'],
      [/quatre[- ]vingt[- ]sept/g, '87'],
      [/quatre[- ]vingt[- ]huit/g, '88'],
      [/quatre[- ]vingt[- ]neuf/g, '89'],
      [/quatre[- ]vingts?/g, '80'],
      // Dizaines
      [/\btrente\b/g, '30'],
      [/\bquarante\b/g, '40'],
      [/\bcinquante\b/g, '50'],
      [/\bsoixante\b/g, '60'],
      // Unités et petits nombres
      [/\bdix[- ]neuf\b/g, '19'],
      [/\bdix[- ]huit\b/g, '18'],
      [/\bdix[- ]sept\b/g, '17'],
      [/\bseize\b/g, '16'],
      [/\bquinze\b/g, '15'],
      [/\bquatorze\b/g, '14'],
      [/\btreize\b/g, '13'],
      [/\bdouze\b/g, '12'],
      [/\bonze\b/g, '11'],
      [/\bvingt\b/g, '20'],
      [/\bdix\b/g, '10'],
      [/\bneuf\b/g, '9'],
      [/\bhuit\b/g, '8'],
      [/\bsept\b/g, '7'],
      [/\bsix\b/g, '6'],
      [/\bcinq\b/g, '5'],
      [/\bquatre\b/g, '4'],
      [/\btrois\b/g, '3'],
      [/\bdeux\b/g, '2'],
      [/\bune?\b/g, '1'],
      [/\bzéro\b/g, '0'],
      [/\bzero\b/g, '0'],
    ];
    let t = text;
    for (const [regex, replacement] of map) {
      t = t.replace(regex, replacement);
    }
    return t;
  },

  // Convertit un texte contenant un nombre en integer
  wordToNumber(text) {
    const normalized = this._replaceSpokenNumbers(text.toLowerCase().trim());
    const match = normalized.match(/\d+/);
    if (match) return parseInt(match[0], 10);
    return null;
  },

  // ── Synthèse vocale (TTS) ────────────────────────────────────────

  speak(text, lang, onEnd) {
    if (!window.speechSynthesis) { if (onEnd) onEnd(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang   = lang || 'fr-FR';
    u.rate   = 0.88;
    u.pitch  = 1.1;
    u.volume = 1;
    u.onend  = () => { if (onEnd) onEnd(); };
    u.onerror = () => { if (onEnd) onEnd(); };
    window.speechSynthesis.speak(u);
  },

  cancelSpeak() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  },

  // Vérifie si le texte prononcé correspond à une des réponses attendues
  matches(spoken, expectedArray) {
    if (!spoken || !expectedArray) return false;
    const normSpoken = this.normalize(spoken);
    for (const exp of expectedArray) {
      const normExp = this.normalize(exp);
      if (normSpoken === normExp) return true;
      if (normSpoken.includes(normExp)) return true;
      if (normExp.includes(normSpoken)) return true;
    }
    return false;
  },
};
