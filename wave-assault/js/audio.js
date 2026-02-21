// Audio system: procedural music & SFX via Web Audio API.
// Music matches the current theme, accelerates as enemies approach the deadline,
// stops when a wave is cleared, and restarts when the next wave spawns.
//
// Theme designs:
//   space      — dark minor-key electronic (original)
//   unicorn    — bright G-major pop-fantasy inspired by Unicorn Academy
//   pacificrim — heavy E-minor industrial march inspired by Ramin Djawadi's main title
//   dragon     — sweeping A-minor orchestral inspired by Howard Shore's LOTR score

const audioSystem = (() => {
    let ctx = null;          // AudioContext
    let masterGain = null;
    let musicGain = null;
    let sfxGain = null;

    // Music state
    let musicPlaying = false;
    let musicTimer = null;
    let currentStep = 0;
    let bpm = 120;
    let targetBpm = 120;
    let activeSources = [];  // track live oscillators so we can stop them

    // SFX throttle: limit enemy-kill sounds per frame
    let _lastKillFrame = 0;
    let _killsThisFrame = 0;
    const MAX_KILLS_PER_FRAME = 3;

    // Ensure AudioContext is created on user gesture
    function ensureContext() {
        if (ctx) return true;
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = ctx.createGain();
            masterGain.gain.value = 0.35;
            masterGain.connect(ctx.destination);

            musicGain = ctx.createGain();
            musicGain.gain.value = 0.5;
            musicGain.connect(masterGain);

            sfxGain = ctx.createGain();
            sfxGain.gain.value = 0.7;
            sfxGain.connect(masterGain);

            return true;
        } catch (_) {
            return false;
        }
    }

    // ── Utility ──────────────────────────────────────────────────────

    function noteFreq(note, octave) {
        const notes = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
        return 440 * Math.pow(2, ((notes[note] || 0) - 9) / 12 + (octave - 4));
    }

    // Create a tone and DISCONNECT all nodes when done to prevent audio graph bloat
    function playTone(freq, duration, type, gainNode, volume, detune) {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        if (detune) osc.detune.value = detune;
        g.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(g);
        g.connect(gainNode || musicGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
        activeSources.push(osc);
        osc.onended = () => {
            osc.disconnect();
            g.disconnect();
            const idx = activeSources.indexOf(osc);
            if (idx !== -1) activeSources.splice(idx, 1);
        };
    }

    // ── Theme helpers ─────────────────────────────────────────────────

    function getTheme() {
        return typeof gameTheme !== 'undefined' ? gameTheme : 'space';
    }

    // Per-theme base BPM (scales up as enemies approach)
    function getBaseBpm() {
        switch (getTheme()) {
            case 'pacificrim': return 135;   // driving march tempo
            case 'dragon':     return 100;   // stately orchestral tempo
            case 'unicorn':    return 125;   // upbeat pop tempo
            default:           return 120;   // space
        }
    }

    // ── Theme sequence definitions ────────────────────────────────────

    // Unicorn Academy: bright, poppy, magical — G major with sparkly high register.
    // Captures the catchy, upbeat pop-fantasy feel of the Unicorn Academy series.
    const unicornSequence = {
        // G major arpeggio-based melody — catchy ascending hook
        melody: [
            { n: 'G', o: 5 }, { n: 'B', o: 5 }, { n: 'D', o: 6 }, { n: 'B', o: 5 },
            { n: 'A', o: 5 }, { n: 'G', o: 5 }, { n: 'E', o: 5 }, { n: 'G', o: 5 },
            { n: 'B', o: 5 }, { n: 'D', o: 6 }, { n: 'E', o: 6 }, { n: 'D', o: 6 },
            { n: 'B', o: 5 }, { n: 'A', o: 5 }, { n: 'G', o: 5 }, { n: 'A', o: 5 },
        ],
        // I–IV–vi–iii pop chord progression (G–C–Am–Em)
        bass: [
            { n: 'G', o: 3 }, { n: 'G', o: 3 }, { n: 'C', o: 4 }, { n: 'C', o: 4 },
            { n: 'A', o: 3 }, { n: 'A', o: 3 }, { n: 'E', o: 3 }, { n: 'E', o: 3 },
            { n: 'G', o: 3 }, { n: 'G', o: 3 }, { n: 'D', o: 4 }, { n: 'D', o: 4 },
            { n: 'C', o: 4 }, { n: 'C', o: 4 }, { n: 'G', o: 3 }, { n: 'G', o: 3 },
        ],
        // High glittery chimes — the "sparkle" of Unicorn Academy
        sparkle: [
            { n: 'G', o: 6 }, null,           { n: 'B', o: 6 }, null,
            { n: 'A', o: 6 }, null,           { n: 'G', o: 6 }, null,
            null,             { n: 'D', o: 7 }, null,            { n: 'B', o: 6 },
            { n: 'A', o: 6 }, null,           { n: 'G', o: 6 }, null,
        ]
    };

    // Space theme: darker, minor-key, driving electronic feel
    const spaceSequence = {
        melody: [
            { n: 'A', o: 4 }, { n: 'C', o: 5 }, { n: 'E', o: 5 }, { n: 'C', o: 5 },
            { n: 'D', o: 5 }, { n: 'C', o: 5 }, { n: 'A', o: 4 }, { n: 'G#', o: 4 },
            { n: 'A', o: 4 }, { n: 'E', o: 5 }, { n: 'D', o: 5 }, { n: 'C', o: 5 },
            { n: 'A', o: 4 }, { n: 'G#', o: 4 }, { n: 'A', o: 4 }, { n: 'C', o: 5 },
        ],
        bass: [
            { n: 'A', o: 2 }, { n: 'A', o: 2 }, { n: 'A', o: 2 }, { n: 'A', o: 2 },
            { n: 'F', o: 2 }, { n: 'F', o: 2 }, { n: 'G', o: 2 }, { n: 'G', o: 2 },
            { n: 'A', o: 2 }, { n: 'A', o: 2 }, { n: 'A', o: 2 }, { n: 'A', o: 2 },
            { n: 'D', o: 2 }, { n: 'D', o: 2 }, { n: 'E', o: 2 }, { n: 'E', o: 2 },
        ],
        sparkle: [
            null, { n: 'E', o: 6 }, null, null,
            null, { n: 'D', o: 6 }, null, null,
            null, null,             { n: 'E', o: 6 }, null,
            null, null,             null,             { n: 'A', o: 5 },
        ]
    };

    // Pacific Rim: heavy, industrial, E minor.
    // Inspired by Ramin Djawadi's iconic main title — the famous 4-note ascending
    // motif (E–G–A–B), stomping march rhythm, heavy sawtooth "guitar" texture.
    const pacificRimSequence = {
        melody: [
            { n: 'E', o: 4 }, { n: 'G', o: 4 }, { n: 'A', o: 4 }, { n: 'B', o: 4 },
            { n: 'A', o: 4 }, { n: 'G', o: 4 }, { n: 'E', o: 4 }, { n: 'D', o: 4 },
            { n: 'B', o: 3 }, { n: 'D', o: 4 }, { n: 'E', o: 4 }, { n: 'G', o: 4 },
            { n: 'E', o: 4 }, { n: 'D', o: 4 }, { n: 'B', o: 3 }, { n: 'A', o: 3 },
        ],
        // Deep pulsing bass — E minor power-chord foundation
        bass: [
            { n: 'E', o: 2 }, { n: 'E', o: 2 }, { n: 'E', o: 2 }, { n: 'E', o: 2 },
            { n: 'A', o: 2 }, { n: 'A', o: 2 }, { n: 'G', o: 2 }, { n: 'G', o: 2 },
            { n: 'E', o: 2 }, { n: 'E', o: 2 }, { n: 'D', o: 2 }, { n: 'D', o: 2 },
            { n: 'A', o: 2 }, { n: 'A', o: 2 }, { n: 'E', o: 2 }, { n: 'E', o: 2 },
        ],
        // Power-chord stabs on off-beats for industrial punch
        sparkle: [
            null, null, { n: 'E', o: 4 }, null,
            null, null, { n: 'B', o: 4 }, null,
            null, null, { n: 'D', o: 4 }, null,
            null, null, { n: 'G', o: 4 }, null,
        ]
    };

    // Dragon: orchestral, sweeping, A minor.
    // Inspired by Howard Shore's LOTR score — flowing Am pentatonic phrases
    // (A–C–D–E–G) that rise and fall in the style of the Fellowship theme,
    // warm sine bass, and resonant timpani on downbeats.
    const dragonSequence = {
        melody: [
            { n: 'A', o: 4 }, { n: 'C', o: 5 }, { n: 'D', o: 5 }, { n: 'E', o: 5 },
            { n: 'G', o: 5 }, { n: 'E', o: 5 }, { n: 'D', o: 5 }, { n: 'C', o: 5 },
            { n: 'A', o: 4 }, { n: 'E', o: 5 }, { n: 'D', o: 5 }, { n: 'C', o: 5 },
            { n: 'D', o: 5 }, { n: 'C', o: 5 }, { n: 'A', o: 4 }, { n: 'G', o: 4 },
        ],
        // Deep, resonant orchestral bass (Am – Dm – C – G – Am)
        bass: [
            { n: 'A', o: 2 }, { n: 'A', o: 2 }, { n: 'D', o: 3 }, { n: 'D', o: 3 },
            { n: 'C', o: 3 }, { n: 'C', o: 3 }, { n: 'G', o: 2 }, { n: 'G', o: 2 },
            { n: 'A', o: 2 }, { n: 'A', o: 2 }, { n: 'F', o: 3 }, { n: 'F', o: 3 },
            { n: 'G', o: 2 }, { n: 'G', o: 2 }, { n: 'A', o: 2 }, { n: 'A', o: 2 },
        ],
        // Orchestral high swells on downbeats
        sparkle: [
            { n: 'A', o: 5 }, null, null, { n: 'E', o: 5 },
            { n: 'G', o: 5 }, null, null, null,
            { n: 'A', o: 5 }, null, null, null,
            { n: 'D', o: 5 }, null, null, null,
        ]
    };

    function getSequence() {
        switch (getTheme()) {
            case 'unicorn':    return unicornSequence;
            case 'pacificrim': return pacificRimSequence;
            case 'dragon':     return dragonSequence;
            default:           return spaceSequence;
        }
    }

    // ── Percussion ───────────────────────────────────────────────────

    function playKick(theme) {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        // Pacific Rim gets a harder, heavier kick
        const startFreq = theme === 'pacificrim' ? 180 : 150;
        const endFreq   = theme === 'pacificrim' ? 25  : 30;
        const dur       = theme === 'pacificrim' ? 0.25 : 0.2;
        const vol       = theme === 'pacificrim' ? 0.5  : 0.35;
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + dur);
        g.gain.setValueAtTime(vol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.connect(g);
        g.connect(musicGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + dur);
        osc.onended = () => { osc.disconnect(); g.disconnect(); };
    }

    // Resonant timpani hit for the Dragon/LOTR orchestral feel
    function playTimpani() {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.5);
        g.gain.setValueAtTime(0.4, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(g);
        g.connect(musicGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
        osc.onended = () => { osc.disconnect(); g.disconnect(); };
    }

    // Snare crack for Pacific Rim's industrial march
    function playSnare() {
        if (!ctx) return;
        const bufLen = Math.floor(ctx.sampleRate * 0.08);
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 3000;
        bp.Q.value = 0.8;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.25, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        src.connect(bp);
        bp.connect(g);
        g.connect(musicGain);
        src.start(ctx.currentTime);
        src.onended = () => { src.disconnect(); bp.disconnect(); g.disconnect(); };
    }

    let _hiHatBuffer = null;

    function playHiHat(soft) {
        if (!ctx) return;
        // Reuse pre-generated noise buffer
        if (!_hiHatBuffer || _hiHatBuffer.sampleRate !== ctx.sampleRate) {
            const bufferSize = Math.floor(ctx.sampleRate * 0.05);
            _hiHatBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = _hiHatBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        }
        const src = ctx.createBufferSource();
        src.buffer = _hiHatBuffer;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = soft ? 8000 : 10000;
        bandpass.Q.value = 1;

        const g = ctx.createGain();
        g.gain.setValueAtTime(soft ? 0.06 : 0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        src.connect(bandpass);
        bandpass.connect(g);
        g.connect(musicGain);
        src.start(ctx.currentTime);
        // Disconnect all 3 nodes when done
        src.onended = () => { src.disconnect(); bandpass.disconnect(); g.disconnect(); };
    }

    // ── Music playback ───────────────────────────────────────────────

    function playStep() {
        if (!musicPlaying || !ctx) return;

        const theme = getTheme();
        const seq = getSequence();
        const stepDuration = 60 / bpm;     // seconds per beat
        const idx = currentStep % seq.melody.length;

        // ── Melody layer — oscillator choice per theme ──
        const mel = seq.melody[idx];
        if (mel) {
            const freq = noteFreq(mel.n, mel.o);
            switch (theme) {
                case 'unicorn':
                    // Warm triangle — the bright, clean sound of Unicorn Academy
                    playTone(freq, stepDuration * 0.8, 'triangle', musicGain, 0.22, 0);
                    break;
                case 'pacificrim':
                    // Heavy sawtooth doubled with slight detune — electric guitar texture
                    playTone(freq, stepDuration * 0.6, 'sawtooth', musicGain, 0.20, 0);
                    playTone(freq, stepDuration * 0.6, 'sawtooth', musicGain, 0.08, 12);
                    break;
                case 'dragon':
                    // Triangle (woodwind/strings) + sub-octave sine for orchestral warmth
                    playTone(freq,       stepDuration * 0.9, 'triangle', musicGain, 0.18, 0);
                    playTone(freq * 0.5, stepDuration * 0.9, 'sine',     musicGain, 0.08, 0);
                    break;
                default: // space
                    playTone(freq, stepDuration * 0.7, 'sawtooth', musicGain, 0.15, 0);
            }
        }

        // ── Bass layer ──
        const bas = seq.bass[idx];
        if (bas) {
            const freq = noteFreq(bas.n, bas.o);
            switch (theme) {
                case 'unicorn':
                    playTone(freq, stepDuration * 0.7, 'sine',     musicGain, 0.20, 0);
                    break;
                case 'pacificrim':
                    // Heavy sawtooth bass — thundering beneath the riff
                    playTone(freq, stepDuration * 0.8, 'sawtooth', musicGain, 0.28, 0);
                    break;
                case 'dragon':
                    // Long, resonant sine — orchestral double-bass/cello
                    playTone(freq, stepDuration * 0.95, 'sine',    musicGain, 0.22, 0);
                    break;
                default:
                    playTone(freq, stepDuration * 0.7, 'square',   musicGain, 0.20, 0);
            }
        }

        // ── High layer (sparkle / chord stabs / orchestral swells) ──
        const spk = seq.sparkle[idx];
        if (spk) {
            const freq = noteFreq(spk.n, spk.o);
            switch (theme) {
                case 'unicorn':
                    // Bright bell-like chime
                    playTone(freq, stepDuration * 0.25, 'sine',     musicGain, 0.10, 0);
                    break;
                case 'pacificrim':
                    // Short punchy power-chord stab
                    playTone(freq, stepDuration * 0.3,  'sawtooth', musicGain, 0.18, 0);
                    break;
                case 'dragon':
                    // Sustained orchestral swell
                    playTone(freq, stepDuration * 0.7,  'triangle', musicGain, 0.12, 0);
                    break;
                default:
                    playTone(freq, stepDuration * 0.25, 'sine',     musicGain, 0.10, 0);
            }
        }

        // ── Percussion — theme-specific patterns ──
        switch (theme) {
            case 'pacificrim':
                // Stomping march: kick on every half-beat, snare on beats 2 & 4
                if (idx % 2 === 0)             playKick('pacificrim');
                if (idx === 4 || idx === 12)   playSnare();
                if (idx % 4 === 3)             playHiHat(false); // sparse open hat
                break;
            case 'dragon':
                // Stately orchestral: timpani on downbeats, no hi-hat
                if (idx % 8 === 0)             playTimpani();
                if (idx % 8 === 4)             playTimpani();
                break;
            case 'unicorn':
                // Pop feel: kick on 1 & 3, soft hi-hat on every other step
                if (idx % 4 === 0)             playKick('unicorn');
                if (idx % 2 === 1)             playHiHat(true);
                break;
            default: // space
                if (idx % 4 === 0)             playKick('space');
                if (idx % 2 === 1)             playHiHat(false);
        }

        currentStep++;

        // Smoothly approach target BPM
        bpm += (targetBpm - bpm) * 0.15;

        // Schedule next step
        const nextDelay = (60 / bpm) * 1000;
        musicTimer = setTimeout(playStep, nextDelay);
    }

    // ── SFX ──────────────────────────────────────────────────────────

    function playExplosion() {
        if (!ensureContext()) return;
        const theme = getTheme();

        // Low rumble oscillator
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        const startFreqMap = { unicorn: 200, pacificrim: 90, dragon: 100, space: 120 };
        osc.frequency.setValueAtTime(startFreqMap[theme] || 120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.6);
        g.gain.setValueAtTime(0.5, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(g);
        g.connect(sfxGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
        osc.onended = () => { osc.disconnect(); g.disconnect(); };

        // Noise burst
        const bufLen = Math.floor(ctx.sampleRate * 0.4);
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
        const nSrc = ctx.createBufferSource();
        nSrc.buffer = buf;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.3, ctx.currentTime);
        nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        const lpFreqMap = { unicorn: 2000, pacificrim: 600, dragon: 500, space: 800 };
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = lpFreqMap[theme] || 800;

        nSrc.connect(lp);
        lp.connect(nGain);
        nGain.connect(sfxGain);
        nSrc.start(ctx.currentTime);
        nSrc.onended = () => { nSrc.disconnect(); lp.disconnect(); nGain.disconnect(); };

        // Theme-specific extra layer
        if (theme === 'unicorn') {
            // Sad descending chime
            playTone(noteFreq('E', 5), 0.3, 'triangle', sfxGain, 0.20, 0);
            setTimeout(() => playTone(noteFreq('C', 5), 0.3, 'triangle', sfxGain, 0.15, 0), 100);
            setTimeout(() => playTone(noteFreq('A', 4), 0.5, 'triangle', sfxGain, 0.10, 0), 200);
        } else if (theme === 'pacificrim') {
            // Metallic impact clang
            playTone(200, 0.15, 'sawtooth', sfxGain, 0.3, 0);
            setTimeout(() => playTone(150, 0.2, 'sawtooth', sfxGain, 0.2, 0), 80);
        } else if (theme === 'dragon') {
            // Dramatic orchestral hit
            playTone(noteFreq('A', 2), 0.6, 'sine',     sfxGain, 0.30, 0);
            playTone(noteFreq('E', 3), 0.4, 'triangle', sfxGain, 0.15, 0);
        }
    }

    function playEnemyKill() {
        if (!ensureContext()) return;
        // Throttle: max 3 kill sounds per game frame to prevent audio flood
        const frame = typeof gameState !== 'undefined' ? gameState.frameCount : 0;
        if (frame === _lastKillFrame) {
            if (++_killsThisFrame > MAX_KILLS_PER_FRAME) return;
        } else {
            _lastKillFrame = frame;
            _killsThisFrame = 1;
        }
        const theme = getTheme();
        switch (theme) {
            case 'unicorn':
                // Bright chime pop
                playTone(noteFreq('C', 6), 0.10, 'triangle', sfxGain, 0.15, 0);
                break;
            case 'pacificrim':
                // Metallic clang / impact hit
                playTone(400, 0.05, 'sawtooth', sfxGain, 0.18, 0);
                playTone(600, 0.04, 'sawtooth', sfxGain, 0.10, 0);
                break;
            case 'dragon':
                // Magical arrow/spell hit — two ascending triangle pings
                playTone(noteFreq('E', 5), 0.08, 'triangle', sfxGain, 0.12, 0);
                playTone(noteFreq('A', 5), 0.06, 'triangle', sfxGain, 0.08, 0);
                break;
            default: // space
                playTone(300, 0.08, 'square', sfxGain, 0.12, 0);
        }
    }

    function playGameOver() {
        if (!ensureContext()) return;
        const theme = getTheme();
        switch (theme) {
            case 'unicorn':
                // Gentle descending triangle lament
                playTone(noteFreq('E', 5), 0.4, 'triangle', sfxGain, 0.25, 0);
                setTimeout(() => playTone(noteFreq('C', 5), 0.4, 'triangle', sfxGain, 0.20, 0), 300);
                setTimeout(() => playTone(noteFreq('A', 4), 0.4, 'triangle', sfxGain, 0.20, 0), 600);
                setTimeout(() => playTone(noteFreq('F', 4), 0.8, 'triangle', sfxGain, 0.25, 0), 900);
                break;
            case 'pacificrim':
                // Heavy industrial descent — E minor falling phrase
                playTone(noteFreq('E', 4), 0.4, 'sawtooth', sfxGain, 0.25, 0);
                setTimeout(() => playTone(noteFreq('D', 4), 0.4, 'sawtooth', sfxGain, 0.22, 0), 300);
                setTimeout(() => playTone(noteFreq('B', 3), 0.4, 'sawtooth', sfxGain, 0.20, 0), 600);
                setTimeout(() => playTone(noteFreq('E', 3), 0.9, 'sawtooth', sfxGain, 0.28, 0), 900);
                break;
            case 'dragon':
                // LOTR-style doom — slow orchestral descent with low sine resolution
                playTone(noteFreq('A', 4), 0.5, 'triangle', sfxGain, 0.25, 0);
                setTimeout(() => playTone(noteFreq('G', 4), 0.5, 'triangle', sfxGain, 0.20, 0), 350);
                setTimeout(() => playTone(noteFreq('E', 4), 0.5, 'triangle', sfxGain, 0.20, 0), 700);
                setTimeout(() => playTone(noteFreq('A', 3), 1.0, 'sine',     sfxGain, 0.30, 0), 1050);
                break;
            default: // space
                playTone(noteFreq('A', 4), 0.3, 'sawtooth', sfxGain, 0.20, 0);
                setTimeout(() => playTone(noteFreq('F', 4), 0.3, 'sawtooth', sfxGain, 0.20, 0), 250);
                setTimeout(() => playTone(noteFreq('D', 4), 0.3, 'sawtooth', sfxGain, 0.20, 0), 500);
                setTimeout(() => playTone(noteFreq('A', 3), 0.8, 'sawtooth', sfxGain, 0.25, 0), 750);
        }
    }

    // ── Tempo control ────────────────────────────────────────────────

    // Called every frame from update(). Calculates how close the nearest
    // enemy is to the bottom of the play area and scales BPM accordingly.
    function updateTempo(enemies, playAreaHeight) {
        if (!musicPlaying) return;
        if (!enemies || enemies.length === 0) return;

        let closestRatio = 0; // 0 = top of screen, 1 = at the deadline
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e.health <= 0) continue;
            const ratio = Math.max(0, e.y) / playAreaHeight;
            if (ratio > closestRatio) closestRatio = ratio;
        }

        // Map closestRatio to BPM: base → base+120 at full intensity
        const base = getBaseBpm();
        targetBpm = base + 120 * Math.pow(closestRatio, 1.5);
    }

    // ── Public API ───────────────────────────────────────────────────

    return {
        // Call once on first user interaction to unlock audio
        init() {
            ensureContext();
            if (ctx && ctx.state === 'suspended') ctx.resume();
        },

        startMusic() {
            if (!ensureContext()) return;
            if (ctx.state === 'suspended') ctx.resume();
            if (musicPlaying) return;
            musicPlaying = true;
            currentStep = 0;
            bpm = getBaseBpm();
            targetBpm = getBaseBpm();
            playStep();
        },

        stopMusic() {
            musicPlaying = false;
            if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
            // Stop and disconnect any active sources
            activeSources.forEach(s => {
                try { s.stop(); } catch (_) {}
                try { s.disconnect(); } catch (_) {}
            });
            activeSources = [];
        },

        updateTempo,

        playSuperWeapon() {
            if (!ensureContext()) return;
            const theme = getTheme();

            if (theme === 'unicorn') {
                // Ascending G-major arpeggio sparkle burst
                const notes = [
                    { n: 'G', o: 5, t: 0    },
                    { n: 'B', o: 5, t: 0.08 },
                    { n: 'D', o: 6, t: 0.16 },
                    { n: 'G', o: 6, t: 0.24 },
                    { n: 'B', o: 6, t: 0.32 }
                ];
                notes.forEach(({ n, o, t }) => {
                    setTimeout(() => playTone(noteFreq(n, o), 0.3, 'triangle', sfxGain, 0.25, 0), t * 1000);
                });
                // Glitter burst
                setTimeout(() => {
                    for (let i = 0; i < 6; i++) {
                        setTimeout(() => playTone(2000 + Math.random() * 2000, 0.05, 'sine', sfxGain, 0.10, 0), i * 30);
                    }
                }, 400);

            } else if (theme === 'pacificrim') {
                // Massive industrial sweep — low-to-high sawtooth + sub-bass drop
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(60, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.5);
                g.gain.setValueAtTime(0.4, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                osc.connect(g); g.connect(sfxGain);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.6);
                osc.onended = () => { osc.disconnect(); g.disconnect(); };

                // Sub-bass drop
                const bass = ctx.createOscillator();
                const bg = ctx.createGain();
                bass.type = 'sine';
                bass.frequency.setValueAtTime(60, ctx.currentTime + 0.1);
                bass.frequency.exponentialRampToValueAtTime(15, ctx.currentTime + 0.7);
                bg.gain.setValueAtTime(0.5, ctx.currentTime + 0.1);
                bg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
                bass.connect(bg); bg.connect(sfxGain);
                bass.start(ctx.currentTime + 0.1);
                bass.stop(ctx.currentTime + 0.7);
                bass.onended = () => { bass.disconnect(); bg.disconnect(); };

                // Rising metal impact notes
                setTimeout(() => playTone(noteFreq('E', 3), 0.3, 'sawtooth', sfxGain, 0.30, 0), 100);
                setTimeout(() => playTone(noteFreq('B', 3), 0.3, 'sawtooth', sfxGain, 0.25, 0), 220);
                setTimeout(() => playTone(noteFreq('E', 4), 0.5, 'sawtooth', sfxGain, 0.30, 0), 340);

            } else if (theme === 'dragon') {
                // Epic LOTR-style horn fanfare — ascending Am arpeggio
                const notes = [
                    { n: 'A', o: 3, t: 0.00 },
                    { n: 'E', o: 4, t: 0.10 },
                    { n: 'A', o: 4, t: 0.20 },
                    { n: 'C', o: 5, t: 0.30 },
                    { n: 'E', o: 5, t: 0.40 }
                ];
                notes.forEach(({ n, o, t }) => {
                    setTimeout(() => {
                        playTone(noteFreq(n, o),       0.5, 'triangle', sfxGain, 0.28, 0);
                        playTone(noteFreq(n, o) * 0.5, 0.6, 'sine',     sfxGain, 0.15, 0);
                    }, t * 1000);
                });
                // Timpani rumble underpinning
                setTimeout(() => {
                    const rosc = ctx.createOscillator();
                    const rg = ctx.createGain();
                    rosc.type = 'sine';
                    rosc.frequency.setValueAtTime(55, ctx.currentTime);
                    rosc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.8);
                    rg.gain.setValueAtTime(0.35, ctx.currentTime);
                    rg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                    rosc.connect(rg); rg.connect(sfxGain);
                    rosc.start(ctx.currentTime);
                    rosc.stop(ctx.currentTime + 0.8);
                    rosc.onended = () => { rosc.disconnect(); rg.disconnect(); };
                }, 100);

            } else {
                // Space: ascending sawtooth sweep + bass drop
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.4);
                g.gain.setValueAtTime(0.3, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                osc.connect(g); g.connect(sfxGain);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.5);
                osc.onended = () => { osc.disconnect(); g.disconnect(); };

                // Bass drop
                const bass = ctx.createOscillator();
                const bg = ctx.createGain();
                bass.type = 'sine';
                bass.frequency.setValueAtTime(80, ctx.currentTime + 0.1);
                bass.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.6);
                bg.gain.setValueAtTime(0.4, ctx.currentTime + 0.1);
                bg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                bass.connect(bg); bg.connect(sfxGain);
                bass.start(ctx.currentTime + 0.1);
                bass.stop(ctx.currentTime + 0.6);
                bass.onended = () => { bass.disconnect(); bg.disconnect(); };
            }
        },

        playExplosion,
        playEnemyKill,
        playGameOver,

        // Voice synthesis for countdown
        speakText(text) {
            try {
                if (!('speechSynthesis' in window)) return;
                if (speechSynthesis.speaking) speechSynthesis.cancel();
                const utt = new SpeechSynthesisUtterance(text);
                utt.rate = 1.15;
                utt.pitch = 1.1;
                utt.volume = 0.9;
                speechSynthesis.speak(utt);
            } catch (_) { /* TTS unavailable */ }
        },

        // Countdown tick (for 3, 2, 1)
        playCountdownTick() {
            if (!ensureContext()) return;
            playTone(880, 0.12, 'sine', sfxGain, 0.35, 0);
        },

        // Countdown GO sound (ascending fanfare)
        playCountdownGo() {
            if (!ensureContext()) return;
            playTone(523.25, 0.08, 'sine', sfxGain, 0.3, 0);
            setTimeout(() => playTone(659.25, 0.08, 'sine', sfxGain, 0.3, 0), 60);
            setTimeout(() => playTone(783.99, 0.1,  'sine', sfxGain, 0.35, 0), 120);
            setTimeout(() => playTone(1046.5, 0.25, 'triangle', sfxGain, 0.4, 0), 200);
        },

        // Convenience: check if playing
        get isPlaying() { return musicPlaying; }
    };
})();
