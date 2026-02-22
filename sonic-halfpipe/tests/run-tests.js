/**
 * Sonic Half-Pipe — Node.js test runner.
 *
 * Loads game logic into an isolated vm context (browser globals mocked),
 * then delegates to per-area test modules.
 *
 * Usage:
 *   node tests/run-tests.js          (from sonic-halfpipe/)
 *   npm test                          (from sonic-halfpipe/)
 */

'use strict';

const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────
// Mini test framework
// ─────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

const fw = {
    describe(name, fn) {
        console.log(`\n  ${name}`);
        fn();
    },

    it(name, fn) {
        try {
            fn();
            console.log(`    \u2713 ${name}`);
            passed++;
        } catch (e) {
            console.log(`    \u2717 ${name}`);
            console.log(`      ${e.message}`);
            failed++;
        }
    },

    assert(cond, msg) {
        if (!cond) throw new Error(msg || 'Assertion failed');
    },

    assertEqual(a, b, msg) {
        if (a !== b) throw new Error(
            msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`
        );
    },

    assertApprox(a, b, epsilon, msg) {
        epsilon = (epsilon === undefined) ? 0.001 : epsilon;
        if (Math.abs(a - b) > epsilon) throw new Error(
            msg || `Expected ~${b} (±${epsilon}), got ${a}`
        );
    },

    assertGreater(a, b, msg) {
        if (!(a > b)) throw new Error(msg || `Expected ${a} > ${b}`);
    },

    assertLessOrEqual(a, b, msg) {
        if (!(a <= b)) throw new Error(msg || `Expected ${a} <= ${b}`);
    },
};

// ─────────────────────────────────────────────────────────────────────
// Mock browser environment
// ─────────────────────────────────────────────────────────────────────

const _localStore = {};
const mockLocalStorage = {
    getItem:    k     => (_localStore[k] !== undefined ? _localStore[k] : null),
    setItem:    (k,v) => { _localStore[k] = String(v); },
    removeItem: k     => { delete _localStore[k]; },
    clear:      ()    => { Object.keys(_localStore).forEach(k => delete _localStore[k]); },
};

const mockDocument = {
    getElementById: () => ({
        textContent: '',
        classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
        classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    }),
    addEventListener: () => {},
    querySelectorAll: () => [],
};

// ─────────────────────────────────────────────────────────────────────
// Build shared vm context (one context for all game scripts)
// ─────────────────────────────────────────────────────────────────────

const ctx = vm.createContext({
    // Standard JS
    Math,
    JSON,
    Array,
    Object,
    Number,
    String,
    Boolean,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    console,

    // Browser APIs (mocked)
    document:      mockDocument,
    localStorage:  mockLocalStorage,
    window:        { AudioContext: undefined, webkitAudioContext: undefined },
    setTimeout:    () => 0,
    clearTimeout:  () => {},
    setInterval:   () => 0,
    clearInterval: () => {},

    // Game stubs — will be referenced by game.js, ui.js, audio.js (not loaded)
    audioSystem: {
        playRingCollect:  () => {},
        playHit:          () => {},
        playRingsWin:     () => {},
        playGameOver:     () => {},
        playJump:         () => {},
        playSpeedUp:      () => {},
        playCountdownBeep:() => {},
        playStart:        () => {},
    },
    // ui.js stubs
    updateHUD:     () => {},
    showEndScreen: () => {},
    showScreen:    () => {},
});

// ─────────────────────────────────────────────────────────────────────
// Script loader — makes top-level const/let into var so they
// become properties of the vm context (accessible across scripts)
// ─────────────────────────────────────────────────────────────────────

const GAME_JS = path.join(__dirname, '../js');

function loadScript(filename) {
    let code = fs.readFileSync(path.join(GAME_JS, filename), 'utf8');
    // Only transform declarations at column 0 (top-level scope).
    // Indented const/let inside functions are intentionally left untouched.
    code = code.replace(/^const /gm, 'var ');
    code = code.replace(/^let /gm,   'var ');
    vm.runInContext(code, ctx);
}

// Load in dependency order (skip browser-only files: audio, webcam, render, ui, main)
loadScript('config.js');
loadScript('state.js');
loadScript('input.js');
loadScript('game.js');

// ─────────────────────────────────────────────────────────────────────
// Run test suites
// ─────────────────────────────────────────────────────────────────────

console.log('\nSonic Half-Pipe — Test Suite');
console.log('==============================');

require('./test-config')(ctx, fw);
require('./test-state')(ctx, fw);
require('./test-game')(ctx, fw);
require('./test-input')(ctx, fw);

// ─────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n  ${total} tests: ${passed} passed, ${failed} failed\n`);

if (failed > 0) process.exit(1);
