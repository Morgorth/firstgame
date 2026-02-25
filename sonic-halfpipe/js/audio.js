// Web Audio API sound effects for Sonic Half-Pipe.
// All sounds are synthesised procedurally – no external assets required.

const audioSystem = (() => {
    let ctx = null;
    let masterGain = null;
    let enabled = true;

    // ── Music state ───────────────────────────────────────────────────
    let _musicEnabled = true;
    let _musicPlaying = false;
    let _musicTimer = null;
    let _musicGainNode = null;
    let _melodyStep = 0;
    let _melodyStepsLeft = 0;
    let _bassStep = 0;
    let _bassStepsLeft = 0;
    let _harmonyStep = 0;
    let _harmonyStepsLeft = 0;
    let _currentMusicTheme = 'default';

    const _MUSIC_BPM = 124;
    const _STEP_MS = (60000 / _MUSIC_BPM) / 2; // 8th-note step ≈ 242 ms

    // ── Unicorn Academy theme: G major, sparkly & magical ────────────
    // Melody: 30 entries, 32 total steps (4 bars of 8th-notes)
    const _UA_MELODY = [
        [783.99, 1, 0.20, 'sine'],   // G5
        [880.00, 1, 0.20, 'sine'],   // A5
        [987.77, 1, 0.22, 'sine'],   // B5
        [1046.50, 1, 0.24, 'sine'],  // C6
        [1174.66, 1, 0.24, 'sine'],  // D6
        [1046.50, 1, 0.20, 'sine'],  // C6
        [987.77, 1, 0.20, 'sine'],   // B5
        [783.99, 1, 0.18, 'sine'],   // G5  — bar 1 (8 steps)
        [880.00, 1, 0.20, 'sine'],   // A5
        [880.00, 1, 0.18, 'sine'],   // A5
        [783.99, 1, 0.18, 'sine'],   // G5
        [659.25, 1, 0.16, 'sine'],   // E5
        [783.99, 1, 0.18, 'sine'],   // G5
        [0,      1, 0,    'sine'],   // rest
        [587.33, 1, 0.16, 'sine'],   // D5
        [659.25, 1, 0.18, 'sine'],   // E5  — bar 2 (8 steps)
        [783.99, 1, 0.20, 'sine'],   // G5
        [880.00, 1, 0.20, 'sine'],   // A5
        [987.77, 1, 0.22, 'sine'],   // B5
        [1174.66, 1, 0.24, 'sine'],  // D6
        [1046.50, 2, 0.26, 'sine'],  // C6 (held 2 steps)
        [987.77, 1, 0.22, 'sine'],   // B5
        [880.00, 1, 0.20, 'sine'],   // A5  — bar 3 (8 steps)
        [783.99, 1, 0.18, 'sine'],   // G5
        [659.25, 1, 0.16, 'sine'],   // E5
        [783.99, 1, 0.18, 'sine'],   // G5
        [880.00, 1, 0.20, 'sine'],   // A5
        [987.77, 1, 0.22, 'sine'],   // B5
        [880.00, 1, 0.20, 'sine'],   // A5
        [783.99, 2, 0.24, 'sine'],   // G5 (held 2 steps)  — bar 4 (8 steps)
    ];

    // Bass: 8 entries × 4 steps = 32 steps  (G–Am–C–D progression)
    const _UA_BASS = [
        [196.00, 4, 0.11, 'sine'],  // G2
        [220.00, 4, 0.10, 'sine'],  // A2
        [261.63, 4, 0.11, 'sine'],  // C3
        [293.66, 4, 0.10, 'sine'],  // D3
        [196.00, 4, 0.11, 'sine'],  // G2
        [220.00, 4, 0.10, 'sine'],  // A2
        [261.63, 4, 0.11, 'sine'],  // C3
        [293.66, 4, 0.10, 'sine'],  // D3
    ];

    // Harmony/sparkle layer: 12 entries, 32 total steps
    const _UA_HARMONY = [
        [1174.66, 2, 0.07, 'triangle'],  // D6
        [1318.51, 2, 0.07, 'triangle'],  // E6
        [1567.98, 2, 0.08, 'triangle'],  // G6
        [1318.51, 2, 0.07, 'triangle'],  // E6  — 8 steps
        [1174.66, 4, 0.07, 'triangle'],  // D6 (held)
        [987.77,  2, 0.07, 'triangle'],  // B5
        [1046.50, 2, 0.07, 'triangle'],  // C6  — 8 steps (16 total)
        [987.77,  4, 0.07, 'triangle'],  // B5 (held)
        [783.99,  2, 0.06, 'triangle'],  // G5
        [880.00,  2, 0.07, 'triangle'],  // A5  — 8 steps (24 total)
        [987.77,  4, 0.07, 'triangle'],  // B5 (held)
        [0,       4, 0,    'triangle'],  // rest  — 8 steps (32 total)
    ];

    // ── Default theme: driving electronic (C minor pentatonic) ───────
    // Melody: 28 entries, 32 total steps
    const _DEF_MELODY = [
        [329.63, 1, 0.14, 'square'],  // E4
        [0,      1, 0,    'square'],  // rest
        [391.99, 1, 0.14, 'square'],  // G4
        [0,      1, 0,    'square'],  // rest
        [440.00, 2, 0.16, 'square'],  // A4 (held)
        [391.99, 1, 0.13, 'square'],  // G4
        [329.63, 1, 0.13, 'square'],  // E4  — bar 1 (8 steps)
        [293.66, 1, 0.14, 'square'],  // D4
        [0,      1, 0,    'square'],  // rest
        [329.63, 1, 0.14, 'square'],  // E4
        [0,      1, 0,    'square'],  // rest
        [391.99, 2, 0.16, 'square'],  // G4 (held)
        [329.63, 1, 0.13, 'square'],  // E4
        [261.63, 1, 0.13, 'square'],  // C4  — bar 2 (8 steps)
        [329.63, 1, 0.14, 'square'],  // E4
        [0,      1, 0,    'square'],  // rest
        [391.99, 1, 0.14, 'square'],  // G4
        [440.00, 1, 0.15, 'square'],  // A4
        [493.88, 2, 0.17, 'square'],  // B4 (held)
        [440.00, 1, 0.14, 'square'],  // A4
        [391.99, 1, 0.14, 'square'],  // G4  — bar 3 (8 steps)
        [0,      1, 0,    'square'],  // rest
        [261.63, 1, 0.14, 'square'],  // C4
        [293.66, 1, 0.14, 'square'],  // D4
        [329.63, 1, 0.14, 'square'],  // E4
        [391.99, 1, 0.16, 'square'],  // G4
        [440.00, 1, 0.16, 'square'],  // A4
        [391.99, 2, 0.17, 'square'],  // G4 (held)  — bar 4 (8 steps)
    ];

    // Bass: 8 entries × 4 steps = 32 steps  (C–Am–F–G progression)
    const _DEF_BASS = [
        [130.81, 4, 0.11, 'sine'],  // C3
        [110.00, 4, 0.10, 'sine'],  // A2
        [87.31,  4, 0.10, 'sine'],  // F2
        [98.00,  4, 0.11, 'sine'],  // G2
        [130.81, 4, 0.11, 'sine'],  // C3
        [110.00, 4, 0.10, 'sine'],  // A2
        [87.31,  4, 0.10, 'sine'],  // F2
        [98.00,  4, 0.11, 'sine'],  // G2
    ];

    function ensureCtx() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(ctx.destination);
    }

    function resumeCtx() {
        if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    function _ensureMusicGain() {
        ensureCtx();
        if (!_musicGainNode) {
            _musicGainNode = ctx.createGain();
            _musicGainNode.gain.value = 0.35;
            _musicGainNode.connect(ctx.destination);
        }
    }

    // Play a single music note through the music gain chain.
    function _playMusicNote(freq, type, duration, gain) {
        if (!freq || duration <= 0) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        const attack = Math.min(0.02, duration * 0.1);
        const release = Math.min(duration * 0.25, 0.08);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(gain, ctx.currentTime + attack);
        g.gain.setValueAtTime(gain, ctx.currentTime + duration - release);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(g);
        g.connect(_musicGainNode);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration + 0.02);
    }

    // One tick of the music sequencer — advances melody, bass, and harmony layers.
    function _musicTick() {
        if (!_musicPlaying) return;
        ensureCtx(); resumeCtx();

        const melody  = _currentMusicTheme === 'unicorn' ? _UA_MELODY  : _DEF_MELODY;
        const bass    = _currentMusicTheme === 'unicorn' ? _UA_BASS    : _DEF_BASS;
        const harmony = _currentMusicTheme === 'unicorn' ? _UA_HARMONY : null;

        // Melody layer
        if (_melodyStepsLeft === 0) {
            const [freq, steps, gain, type] = melody[_melodyStep];
            if (freq > 0) _playMusicNote(freq, type, (_STEP_MS * steps / 1000) * 0.85, gain);
            _melodyStepsLeft = steps;
            _melodyStep = (_melodyStep + 1) % melody.length;
        }
        _melodyStepsLeft--;

        // Bass layer
        if (_bassStepsLeft === 0) {
            const [freq, steps, gain, type] = bass[_bassStep];
            if (freq > 0) _playMusicNote(freq, type, (_STEP_MS * steps / 1000) * 0.90, gain);
            _bassStepsLeft = steps;
            _bassStep = (_bassStep + 1) % bass.length;
        }
        _bassStepsLeft--;

        // Harmony/sparkle layer (unicorn theme only)
        if (harmony) {
            if (_harmonyStepsLeft === 0) {
                const [freq, steps, gain, type] = harmony[_harmonyStep];
                if (freq > 0) _playMusicNote(freq, type, (_STEP_MS * steps / 1000) * 0.80, gain);
                _harmonyStepsLeft = steps;
                _harmonyStep = (_harmonyStep + 1) % harmony.length;
            }
            _harmonyStepsLeft--;
        }

        _musicTimer = setTimeout(_musicTick, _STEP_MS);
    }

    // Generic oscillator helper
    function playTone(freq, type, duration, gainPeak, gainEnd, detune = 0) {
        if (!enabled) return;
        ensureCtx(); resumeCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;
        gain.gain.setValueAtTime(gainPeak, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainEnd), ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration + 0.02);
    }

    function playNoise(duration, gainPeak, lowFreq = 200, highFreq = 800) {
        if (!enabled) return;
        ensureCtx(); resumeCtx();
        const bufSize = Math.ceil(ctx.sampleRate * duration);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = (lowFreq + highFreq) / 2;
        filter.Q.value = 0.5;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(gainPeak, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        src.start(ctx.currentTime);
    }

    return {
        setEnabled(val) { enabled = val; },

        // ── Music controls ────────────────────────────────────────────

        // Start background music for the given theme ('unicorn' | 'default').
        startMusic(theme) {
            if (!_musicEnabled) return;
            // Stop any existing music and cancel fade-out before restarting.
            this.stopMusic();
            ensureCtx(); resumeCtx();
            _ensureMusicGain();
            if (_musicGainNode) {
                _musicGainNode.gain.cancelScheduledValues(ctx.currentTime);
                _musicGainNode.gain.setValueAtTime(0.35, ctx.currentTime);
            }
            _currentMusicTheme = theme || 'default';
            _musicPlaying = true;
            _melodyStep = 0;  _melodyStepsLeft = 0;
            _bassStep = 0;    _bassStepsLeft = 0;
            _harmonyStep = 0; _harmonyStepsLeft = 0;
            _musicTick();
        },

        // Stop background music with a short fade-out.
        stopMusic() {
            _musicPlaying = false;
            if (_musicTimer) { clearTimeout(_musicTimer); _musicTimer = null; }
            if (_musicGainNode && ctx) {
                const now = ctx.currentTime;
                _musicGainNode.gain.cancelScheduledValues(now);
                _musicGainNode.gain.setValueAtTime(_musicGainNode.gain.value, now);
                _musicGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
                setTimeout(() => { if (_musicGainNode) _musicGainNode.gain.value = 0.35; }, 560);
            }
        },

        setMusicEnabled(val) {
            _musicEnabled = val;
            if (!val && _musicPlaying) this.stopMusic();
        },

        isMusicEnabled() { return _musicEnabled; },
        isMusicPlaying() { return _musicPlaying; },

        // Ring collected – cheerful ascending pair
        playRingCollect(volume = 0.6) {
            playTone(880, 'sine', 0.08, volume, 0.01);
            setTimeout(() => playTone(1320, 'sine', 0.12, volume * 0.8, 0.01), 60);
        },

        // All 50 rings – victory fanfare (short)
        playRingsWin() {
            const freqs = [523, 659, 784, 1047];
            freqs.forEach((f, i) => {
                setTimeout(() => playTone(f, 'square', 0.18, 0.5, 0.01), i * 80);
            });
        },

        // Hit obstacle – crunch
        playHit() {
            playNoise(0.25, 0.7, 60, 400);
            playTone(120, 'sawtooth', 0.2, 0.5, 0.01);
        },

        // Game over – descending sad tones
        playGameOver() {
            const freqs = [440, 370, 311, 261];
            freqs.forEach((f, i) => {
                setTimeout(() => playTone(f, 'sine', 0.35, 0.5, 0.05), i * 160);
            });
        },

        // Jump whoosh
        playJump() {
            ensureCtx(); resumeCtx();
            if (!enabled) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
            osc.connect(gain); gain.connect(masterGain);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22);
        },

        // Speed-up jingle – ascending blip pair
        playSpeedUp() {
            playTone(660, 'square', 0.07, 0.4, 0.01);
            setTimeout(() => playTone(990, 'square', 0.07, 0.4, 0.01), 70);
        },

        // Countdown beep
        playCountdownBeep(isFinal) {
            playTone(isFinal ? 880 : 440, 'sine', 0.15, 0.5, 0.01);
        },

        // Start game
        playStart() {
            const freqs = [523, 659, 784];
            freqs.forEach((f, i) => {
                setTimeout(() => playTone(f, 'square', 0.12, 0.4, 0.01), i * 60);
            });
        },
    };
})();
