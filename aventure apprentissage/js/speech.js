// speech.js — Interface Web Speech API (STT) fr-FR et en-US

const speechSystem = {
  recognition: null,
  listening: false,
  minConfidence: 0.4,      // Seuil de confiance minimum (0-1)
  lang: 'fr-FR',
  _onResult: null,
  _onEnd: null,
  _onInterim: null,

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API non disponible dans ce navigateur.');
      this.available = false;
      return;
    }
    this.available = true;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous    = true;   // Reste ouvert — plus de flash on/off
    this.recognition.interimResults = true;  // Résultats live pour la transcription
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event) => {
      const idx    = event.results.length - 1;
      const result = event.results[idx];

      // Résultat interimaire : affiche le texte en direct
      if (!result.isFinal) {
        if (this._onInterim) this._onInterim(result[0].transcript, false);
        return;
      }

      // Résultat final : vérifie la confiance (seulement si le navigateur la fournit)
      const confidence = result[0].confidence;
      if (this._onInterim) this._onInterim(result[0].transcript, true);

      // confidence === 0 signifie que le navigateur ne supporte pas le score → on accepte
      if (confidence > 0 && confidence < this.minConfidence) {
        console.log('[STT] Confiance trop faible:', confidence.toFixed(2), result[0].transcript);
        return; // ignore, garde la session ouverte
      }

      const texts = [];
      for (let i = 0; i < result.length; i++) texts.push(result[i].transcript);
      const text       = texts[0] || '';
      const normalized = this.normalize(text);

      if (this._onResult) this._onResult(normalized, texts.map(r => this.normalize(r)), confidence, text);
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

  // lang      : 'fr-FR' | 'en-US'
  // onResult  : (normalizedText, alternatives, confidence, rawText) => {}
  // onEnd     : () => {}   — fired on silence timeout or error
  // grammar   : JSGF string | null
  // onInterim : (text, isFinal) => {}
  startListening(lang, onResult, onEnd, grammar, onInterim) {
    if (!this.available || !this.recognition) {
      setTimeout(() => { if (onEnd) onEnd(); }, 2000);
      return;
    }
    if (this.listening) {
      try { this.recognition.stop(); } catch (e) {}
    }
    this.lang = lang || 'fr-FR';
    this.recognition.lang = this.lang;
    this._onResult  = onResult;
    this._onEnd     = onEnd;
    this._onInterim = onInterim || null;

    // Indices grammaticaux (Chrome uniquement — sans effet ailleurs)
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
    if (grammar && SpeechGrammarList) {
      try {
        const gl = new SpeechGrammarList();
        gl.addFromString(grammar, 1);
        this.recognition.grammars = gl;
      } catch (e) { /* navigateur sans support grammaire */ }
    }

    try {
      this.recognition.start();
      this.listening = true;
    } catch (e) {
      console.warn('STT start error:', e);
      setTimeout(() => { if (onEnd) onEnd(); }, 100);
    }
  },

  stopListening() {
    // Nulle les callbacks AVANT d'arrêter pour éviter que onend les déclenche
    this._onResult  = null;
    this._onEnd     = null;
    this._onInterim = null;
    if (this.recognition && this.listening) {
      try { this.recognition.stop(); } catch (e) {}
    }
    this.listening = false;
  },

  // Normalise le texte : supprime accents, lowercase, trim, convertit nombres écrits
  normalize(text) {
    if (!text) return '';
    let t = text.toLowerCase().trim();
    t = this._replaceSpokenNumbers(t);
    t = t.replace(/[.,!?;:'"«»\-]/g, ' ');
    t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    t = t.replace(/\s+/g, ' ').trim();
    return t;
  },

  // Remplace les nombres écrits en lettres par leur valeur numérique
  _replaceSpokenNumbers(text) {
    const map = [
      [/vingt[- ]et[- ]un(e)?/g, '21'],[/vingt[- ]deux/g, '22'],[/vingt[- ]trois/g, '23'],
      [/vingt[- ]quatre/g, '24'],[/vingt[- ]cinq/g, '25'],[/vingt[- ]six/g, '26'],
      [/vingt[- ]sept/g, '27'],[/vingt[- ]huit/g, '28'],[/vingt[- ]neuf/g, '29'],
      [/trente[- ]et[- ]un(e)?/g, '31'],[/trente[- ]deux/g, '32'],[/trente[- ]trois/g, '33'],
      [/trente[- ]quatre/g, '34'],[/trente[- ]cinq/g, '35'],[/trente[- ]six/g, '36'],
      [/trente[- ]sept/g, '37'],[/trente[- ]huit/g, '38'],[/trente[- ]neuf/g, '39'],
      [/quarante[- ]et[- ]un(e)?/g, '41'],[/quarante[- ]deux/g, '42'],[/quarante[- ]trois/g, '43'],
      [/quarante[- ]quatre/g, '44'],[/quarante[- ]cinq/g, '45'],[/quarante[- ]six/g, '46'],
      [/quarante[- ]sept/g, '47'],[/quarante[- ]huit/g, '48'],[/quarante[- ]neuf/g, '49'],
      [/cinquante[- ]et[- ]un(e)?/g, '51'],[/cinquante[- ]deux/g, '52'],[/cinquante[- ]trois/g, '53'],
      [/cinquante[- ]quatre/g, '54'],[/cinquante[- ]cinq/g, '55'],[/cinquante[- ]six/g, '56'],
      [/cinquante[- ]sept/g, '57'],[/cinquante[- ]huit/g, '58'],[/cinquante[- ]neuf/g, '59'],
      [/soixante[- ]et[- ]un(e)?/g, '61'],[/soixante[- ]deux/g, '62'],[/soixante[- ]trois/g, '63'],
      [/soixante[- ]quatre/g, '64'],[/soixante[- ]cinq/g, '65'],[/soixante[- ]six/g, '66'],
      [/soixante[- ]sept/g, '67'],[/soixante[- ]huit/g, '68'],[/soixante[- ]neuf/g, '69'],
      [/soixante[- ]dix[- ]sept/g, '77'],[/soixante[- ]dix[- ]huit/g, '78'],[/soixante[- ]dix[- ]neuf/g, '79'],
      [/soixante[- ]et[- ]onze/g, '71'],[/soixante[- ]douze/g, '72'],[/soixante[- ]treize/g, '73'],
      [/soixante[- ]quatorze/g, '74'],[/soixante[- ]quinze/g, '75'],[/soixante[- ]seize/g, '76'],
      [/soixante[- ]dix/g, '70'],
      [/quatre[- ]vingt[- ]dix[- ]sept/g, '97'],[/quatre[- ]vingt[- ]dix[- ]huit/g, '98'],
      [/quatre[- ]vingt[- ]dix[- ]neuf/g, '99'],[/quatre[- ]vingt[- ]dix[- ]un(e)?/g, '91'],
      [/quatre[- ]vingt[- ]onze/g, '91'],[/quatre[- ]vingt[- ]douze/g, '92'],
      [/quatre[- ]vingt[- ]treize/g, '93'],[/quatre[- ]vingt[- ]quatorze/g, '94'],
      [/quatre[- ]vingt[- ]quinze/g, '95'],[/quatre[- ]vingt[- ]seize/g, '96'],
      [/quatre[- ]vingt[- ]dix/g, '90'],[/quatre[- ]vingt[- ]un(e)?/g, '81'],
      [/quatre[- ]vingt[- ]deux/g, '82'],[/quatre[- ]vingt[- ]trois/g, '83'],
      [/quatre[- ]vingt[- ]quatre/g, '84'],[/quatre[- ]vingt[- ]cinq/g, '85'],
      [/quatre[- ]vingt[- ]six/g, '86'],[/quatre[- ]vingt[- ]sept/g, '87'],
      [/quatre[- ]vingt[- ]huit/g, '88'],[/quatre[- ]vingt[- ]neuf/g, '89'],
      [/quatre[- ]vingts?/g, '80'],
      [/\btrente\b/g, '30'],[/\bquarante\b/g, '40'],[/\bcinquante\b/g, '50'],[/\bsoixante\b/g, '60'],
      [/\bdix[- ]neuf\b/g, '19'],[/\bdix[- ]huit\b/g, '18'],[/\bdix[- ]sept\b/g, '17'],
      [/\bseize\b/g, '16'],[/\bquinze\b/g, '15'],[/\bquatorze\b/g, '14'],[/\btreize\b/g, '13'],
      [/\bdouze\b/g, '12'],[/\bonze\b/g, '11'],[/\bvingt\b/g, '20'],[/\bdix\b/g, '10'],
      [/\bneuf\b/g, '9'],[/\bhuit\b/g, '8'],[/\bsept\b/g, '7'],[/\bsix\b/g, '6'],
      [/\bcinq\b/g, '5'],[/\bquatre\b/g, '4'],[/\btrois\b/g, '3'],[/\bdeux\b/g, '2'],
      [/\bune?\b/g, '1'],[/\bzéro\b/g, '0'],[/\bzero\b/g, '0'],
    ];
    let t = text;
    for (const [regex, replacement] of map) t = t.replace(regex, replacement);
    return t;
  },

  wordToNumber(text) {
    const normalized = this._replaceSpokenNumbers(text.toLowerCase().trim());
    const match = normalized.match(/\d+/);
    if (match) return parseInt(match[0], 10);
    return null;
  },

  // Distance de Levenshtein — nombre de caractères à changer pour passer de a à b
  levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = [];
    for (let i = 0; i <= m; i++) {
      dp[i] = new Array(n + 1).fill(0);
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i-1] === b[j-1]
          ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
      }
    }
    return dp[m][n];
  },

  // Correspondance exacte + sous-chaîne + approximative (Levenshtein)
  matches(spoken, expectedArray) {
    if (!spoken || !expectedArray) return false;
    const normSpoken = this.normalize(spoken);
    for (const exp of expectedArray) {
      const normExp = this.normalize(exp);
      if (normSpoken === normExp) return true;
      if (normSpoken.includes(normExp)) return true;
      if (normExp.includes(normSpoken)) return true;
      // Fuzzy : tolérance 1 pour mots courts (≤4 chars), 2 pour mots longs
      const maxDist = normExp.length <= 4 ? 1 : 2;
      if (this.levenshtein(normSpoken, normExp) <= maxDist) return true;
    }
    return false;
  },

  // ── Synthèse vocale (TTS) ────────────────────────────────────────

  _warmUp() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  },

  // Sélectionne la meilleure voix disponible pour la langue donnée
  _selectVoice(lang) {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    const prefix = lang.split('-')[0];
    return voices.find(v => v.lang === lang && !v.localService)
        || voices.find(v => v.lang === lang)
        || voices.find(v => v.lang.startsWith(prefix) && !v.localService)
        || voices.find(v => v.lang.startsWith(prefix))
        || null;
  },

  _currentUtterance: null,

  speak(text, lang) {
    // TTS is fire-and-forget. Mic start timing is handled by fixed delays in ui.js
    // so that it never depends on onEnd firing (unreliable across browsers).
    if (!window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    this._currentUtterance = null;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    this._currentUtterance = u;
    u.lang   = lang || 'fr-FR';
    u.rate   = 0.88;
    u.pitch  = 1.1;
    u.volume = 1;
    const voice = this._selectVoice(u.lang);
    if (voice) u.voice = voice;
    // resume() un-sticks Chrome's synthesis engine after idle periods (Chrome bug:
    // engine silently pauses after ~5-10s of inactivity, queued utterances never play).
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(u);
  },

  cancelSpeak() {
    // Null before cancel so the safety timer's done() guard fails harmlessly
    this._currentUtterance = null;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  },
};
