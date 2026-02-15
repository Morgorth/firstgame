// Audio system: procedural music & SFX via Web Audio API.
// Music matches the current theme, accelerates as enemies approach the deadline,
// stops when a wave is cleared, and restarts when the next wave spawns.

const audioSystem = (() => {
    let ctx = null;          // AudioContext
    let masterGain = null;
    let musicGain = null;
    let sfxGain = null;

    // Music state
    let musicPlaying = false;
    let musicTimer = null;
    let currentStep = 0;
    let bpm = 120;           // base BPM
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

    // ── Theme definitions ────────────────────────────────────────────

    // Unicorn theme: whimsical, sparkly, major-key arpeggios in C major / F major
    const unicornSequence = {
        // Melody notes (C major pentatonic, octave 5 and 4)
        melody: [
            { n: 'C', o: 5 }, { n: 'E', o: 5 }, { n: 'G', o: 5 }, { n: 'A', o: 5 },
            { n: 'G', o: 5 }, { n: 'E', o: 5 }, { n: 'D', o: 5 }, { n: 'C', o: 5 },
            { n: 'D', o: 5 }, { n: 'E', o: 5 }, { n: 'G', o: 5 }, { n: 'E', o: 5 },
            { n: 'A', o: 5 }, { n: 'G', o: 5 }, { n: 'E', o: 5 }, { n: 'D', o: 5 },
        ],
        // Bass pattern (root notes)
        bass: [
            { n: 'C', o: 3 }, { n: 'C', o: 3 }, { n: 'F', o: 3 }, { n: 'F', o: 3 },
            { n: 'G', o: 3 }, { n: 'G', o: 3 }, { n: 'C', o: 3 }, { n: 'C', o: 3 },
            { n: 'A', o: 2 }, { n: 'A', o: 2 }, { n: 'F', o: 3 }, { n: 'F', o: 3 },
            { n: 'G', o: 3 }, { n: 'G', o: 3 }, { n: 'C', o: 3 }, { n: 'C', o: 3 },
        ],
        // Sparkle arpeggios (high register twinkles)
        sparkle: [
            { n: 'E', o: 6 }, null, { n: 'G', o: 6 }, null,
            { n: 'A', o: 6 }, null, { n: 'G', o: 6 }, null,
            null, { n: 'C', o: 7 }, null, { n: 'B', o: 6 },
            { n: 'A', o: 6 }, null, { n: 'G', o: 6 }, null,
        ]
    };

    // Space theme: darker, minor-key, more driving electronic feel
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
            null, null, { n: 'E', o: 6 }, null,
            null, null, null, { n: 'A', o: 5 },
        ]
    };

    function getSequence() {
        return (typeof gameTheme !== 'undefined' && gameTheme === 'unicorn')
            ? unicornSequence : spaceSequence;
    }

    // ── Music playback ───────────────────────────────────────────────

    function playStep() {
        if (!musicPlaying || !ctx) return;

        const seq = getSequence();
        const isUnicorn = typeof gameTheme !== 'undefined' && gameTheme === 'unicorn';
        const stepDuration = 60 / bpm;     // seconds per beat
        const idx = currentStep % seq.melody.length;

        // Melody — single oscillator per step (was 2, halved for performance)
        const mel = seq.melody[idx];
        if (mel) {
            const freq = noteFreq(mel.n, mel.o);
            if (isUnicorn) {
                playTone(freq, stepDuration * 0.8, 'triangle', musicGain, 0.25, 0);
            } else {
                playTone(freq, stepDuration * 0.7, 'sawtooth', musicGain, 0.15, 0);
            }
        }

        // Bass — single oscillator (was 1-2)
        const bas = seq.bass[idx];
        if (bas) {
            const freq = noteFreq(bas.n, bas.o);
            playTone(freq, stepDuration * 0.7, isUnicorn ? 'sine' : 'square', musicGain, 0.2, 0);
        }

        // Sparkle — single oscillator, only when present
        const spk = seq.sparkle[idx];
        if (spk) {
            const freq = noteFreq(spk.n, spk.o);
            playTone(freq, stepDuration * 0.25, 'sine', musicGain, 0.1, 0);
        }

        // Percussion: kick on beats 0,4,8,12 and hi-hat on every other step
        if (idx % 4 === 0) {
            playKick();
        }
        if (idx % 2 === 1) {
            playHiHat(isUnicorn);
        }

        currentStep++;

        // Smoothly approach target BPM
        bpm += (targetBpm - bpm) * 0.15;

        // Schedule next step
        const nextDelay = (60 / bpm) * 1000;
        musicTimer = setTimeout(playStep, nextDelay);
    }

    function playKick() {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
        g.gain.setValueAtTime(0.35, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(g);
        g.connect(musicGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        // Disconnect when done
        osc.onended = () => { osc.disconnect(); g.disconnect(); };
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

    // ── SFX ──────────────────────────────────────────────────────────

    function playExplosion() {
        if (!ensureContext()) return;
        const isUnicorn = typeof gameTheme !== 'undefined' && gameTheme === 'unicorn';

        // Low rumble
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isUnicorn ? 200 : 120, ctx.currentTime);
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

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = isUnicorn ? 2000 : 800;

        nSrc.connect(lp);
        lp.connect(nGain);
        nGain.connect(sfxGain);
        nSrc.start(ctx.currentTime);
        nSrc.onended = () => { nSrc.disconnect(); lp.disconnect(); nGain.disconnect(); };

        if (isUnicorn) {
            // Sad descending chime
            playTone(noteFreq('E', 5), 0.3, 'triangle', sfxGain, 0.2, 0);
            setTimeout(() => playTone(noteFreq('C', 5), 0.3, 'triangle', sfxGain, 0.15, 0), 100);
            setTimeout(() => playTone(noteFreq('A', 4), 0.5, 'triangle', sfxGain, 0.1, 0), 200);
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
        const isUnicorn = typeof gameTheme !== 'undefined' && gameTheme === 'unicorn';
        if (isUnicorn) {
            playTone(noteFreq('C', 6), 0.1, 'triangle', sfxGain, 0.15, 0);
        } else {
            playTone(300, 0.08, 'square', sfxGain, 0.12, 0);
        }
    }

    function playGameOver() {
        if (!ensureContext()) return;
        const isUnicorn = typeof gameTheme !== 'undefined' && gameTheme === 'unicorn';
        if (isUnicorn) {
            playTone(noteFreq('E', 5), 0.4, 'triangle', sfxGain, 0.25, 0);
            setTimeout(() => playTone(noteFreq('C', 5), 0.4, 'triangle', sfxGain, 0.2, 0), 300);
            setTimeout(() => playTone(noteFreq('A', 4), 0.4, 'triangle', sfxGain, 0.2, 0), 600);
            setTimeout(() => playTone(noteFreq('F', 4), 0.8, 'triangle', sfxGain, 0.25, 0), 900);
        } else {
            playTone(noteFreq('A', 4), 0.3, 'sawtooth', sfxGain, 0.2, 0);
            setTimeout(() => playTone(noteFreq('F', 4), 0.3, 'sawtooth', sfxGain, 0.2, 0), 250);
            setTimeout(() => playTone(noteFreq('D', 4), 0.3, 'sawtooth', sfxGain, 0.2, 0), 500);
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

        // Map closestRatio to BPM: 0→120, 1→240
        const baseBpm = 120;
        const maxBpm = 240;
        targetBpm = baseBpm + (maxBpm - baseBpm) * Math.pow(closestRatio, 1.5);
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
            bpm = 120;
            targetBpm = 120;
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
            setTimeout(() => playTone(783.99, 0.1, 'sine', sfxGain, 0.35, 0), 120);
            setTimeout(() => playTone(1046.5, 0.25, 'triangle', sfxGain, 0.4, 0), 200);
        },

        // Convenience: check if playing
        get isPlaying() { return musicPlaying; }
    };
})();
