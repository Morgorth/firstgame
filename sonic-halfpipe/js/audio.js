// Web Audio API sound effects for Sonic Half-Pipe.
// All sounds are synthesised procedurally – no external assets required.

const audioSystem = (() => {
    let ctx = null;
    let masterGain = null;
    let enabled = true;

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
