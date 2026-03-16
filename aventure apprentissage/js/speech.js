// speech.js — Interface Web Speech API (STT) fr-FR et en-US

const speechSystem = {
  recognition: null,
  listening: false,
  minConfidence: 0.55,     // Seuil de confiance minimum (0-1)
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
    this.recognition.maxAlternatives = 6;

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

      const texts = [];
      for (let i = 0; i < result.length; i++) texts.push(result[i].transcript);
      const text       = texts[0] || '';
      const normalized = this.normalize(text);

      // Ignore transcriptions vides — probablement du bruit ambiant
      if (normalized.length === 0) {
        console.log('[STT] Transcription vide, ignorée:', JSON.stringify(text));
        return;
      }

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
      // Homophones courants — le STT confond souvent ces mots avec des nombres
      [/\bsaint\b/g, '5'],[/\bsein\b/g, '5'],[/\bsain\b/g, '5'],  // cinq
      [/\bsi\b/g, '6'],[/\bscie\b/g, '6'],                          // six
      [/\bset\b/g, '7'],[/\bcet(te)?\b/g, '7'],                     // sept
      [/\bvie\b/g, '20'],[/\bvin\b/g, '20'],                        // vingt
      [/\bdis\b/g, '10'],[/\bdi\b/g, '10'],                         // dix
      [/\bde\b/g, '2'],[/\bdieu\b/g, '2'],                          // deux
      [/\bcat\b/g, '4'],[/\bcarte\b/g, '4'],                        // quatre (partial)
      // Child high-pitch voice misrecognitions — STT trained on adult voices
      // confuses these more often with higher fundamental frequencies
      [/\bsuis\b/g, '6'],[/\bsix\b/g, '6'],                        // six (child pitch)
      [/\bvins?\b/g, '20'],[/\bvain\b/g, '20'],                    // vingt
      [/\bsang\b/g, '5'],[/\bsens\b/g, '5'],                       // cinq
      [/\bweet\b/g, '8'],[/\bwheat\b/g, '8'],                      // huit (en→fr confusion)
      [/\boeuf\b/g, '9'],[/\bnoeud\b/g, '9'],                      // neuf
      [/\bcar\b/g, '4'],                                             // quatre
      [/\btoi\b/g, '3'],[/\btoit\b/g, '3'],                         // trois
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

  // Correspondance exacte + sous-chaîne + approximative (Levenshtein) + word-level fuzzy
  matches(spoken, expectedArray) {
    if (!spoken || !expectedArray) return false;
    const normSpoken = this.normalize(spoken);
    for (const exp of expectedArray) {
      const normExp = this.normalize(exp);
      // 1. Exact match
      if (normSpoken === normExp) return true;
      // 2. Spoken contains expected as substring
      if (normSpoken.includes(normExp)) return true;
      // 3. Expected contains spoken (if spoken is substantial — lenient for child voices)
      if (normSpoken.length >= 2 && normSpoken.length >= Math.ceil(normExp.length * 0.5) && normExp.includes(normSpoken)) return true;
      // 4. Full-string Levenshtein (generous for child voices — STT is less accurate)
      if (normSpoken.length >= normExp.length - 2) {
        const maxDist = normExp.length <= 3 ? 1 : normExp.length <= 6 ? 2 : 3;
        if (this.levenshtein(normSpoken, normExp) <= maxDist) return true;
      }
      // 5. Word-level fuzzy: check if all expected words appear among spoken words
      //    Handles duplicates, filler words, and repeated answers in speech
      if (this._wordsMatch(normSpoken, normExp)) return true;
    }
    return false;
  },

  // Check if all words of expected can be found (fuzzy) within spoken words.
  // Each expected word is matched at most once, allowing duplicates in spoken.
  _wordsMatch(normSpoken, normExp) {
    const spokenWords = normSpoken.split(' ').filter(w => w.length > 0);
    const expectedWords = normExp.split(' ').filter(w => w.length > 0);
    if (expectedWords.length === 0 || spokenWords.length === 0) return false;

    // For each expected word, find a fuzzy match among spoken words
    const used = new Array(spokenWords.length).fill(false);
    for (const ew of expectedWords) {
      let found = false;
      for (let i = 0; i < spokenWords.length; i++) {
        if (used[i]) continue;
        const sw = spokenWords[i];
        // Exact word match
        if (sw === ew) { used[i] = true; found = true; break; }
        // Fuzzy word match — generous tolerance for child voices
        const maxDist = ew.length <= 3 ? 1 : ew.length <= 6 ? 2 : 3;
        if (sw.length >= ew.length - 2 && this.levenshtein(sw, ew) <= maxDist) {
          used[i] = true; found = true; break;
        }
      }
      if (!found) return false;
    }
    return true;
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

  // Slow, clear pronunciation for teaching kids (especially English words)
  speakSlow(text, lang) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    this._currentUtterance = null;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    this._currentUtterance = u;
    u.lang   = lang || 'en-US';
    u.rate   = 0.55;   // Very slow for kids to hear each syllable
    u.pitch  = 1.05;
    u.volume = 1;
    const voice = this._selectVoice(u.lang);
    if (voice) u.voice = voice;
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(u);
  },

  cancelSpeak() {
    // Null before cancel so the safety timer's done() guard fails harmlessly
    this._currentUtterance = null;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  },
};
