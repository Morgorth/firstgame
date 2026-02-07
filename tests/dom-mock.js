// Minimal DOM/browser mock so the game JS files can load in Node.js.
// Only stubs what the scripts actually touch at parse/init time.

const elements = {};

function createElement(tag) {
    const el = {
        tagName: tag.toUpperCase(),
        className: '',
        classList: {
            _classes: new Set(),
            add(c) { this._classes.add(c); },
            remove(c) { this._classes.delete(c); },
            toggle(c, force) { force ? this._classes.add(c) : this._classes.delete(c); },
            contains(c) { return this._classes.has(c); }
        },
        style: {},
        innerHTML: '',
        textContent: '',
        src: '',
        children: [],
        width: 640,
        height: 480,
        readyState: 4,
        HAVE_ENOUGH_DATA: 4,
        videoWidth: 640,
        videoHeight: 480,
        appendChild(child) { this.children.push(child); },
        addEventListener(ev, fn) { /* noop */ },
        getContext(type, opts) {
            return {
                drawImage() {},
                getImageData(x, y, w, h) {
                    return { data: new Uint8ClampedArray(w * h * 4) };
                },
                fillRect() {},
                strokeRect() {},
                beginPath() {},
                closePath() {},
                moveTo() {},
                lineTo() {},
                arc() {},
                ellipse() {},
                fill() {},
                stroke() {},
                clip() {},
                save() {},
                restore() {},
                translate() {},
                scale() {},
                setLineDash() {},
                fillText() {},
                strokeText() {},
                createLinearGradient() {
                    return { addColorStop() {} };
                },
                set fillStyle(v) {},
                get fillStyle() { return '#000'; },
                set strokeStyle(v) {},
                get strokeStyle() { return '#000'; },
                set shadowBlur(v) {},
                set shadowColor(v) {},
                set lineWidth(v) {},
                set font(v) {},
                set textAlign(v) {},
                set textBaseline(v) {}
            };
        }
    };
    return el;
}

// Pre-populate elements referenced by getElementById
const knownIds = [
    'gameCanvas', 'ui', 'score', 'wave', 'crowdSize', 'crowdIndicator',
    'singlePlayerHud', 'multiPlayerHud', 'p1Hud', 'p2Hud',
    'p1HudFace', 'p2HudFace', 'p1Fleet', 'p2Fleet',
    'startScreen', 'gameOverScreen', 'playerSetupScreen',
    'gameTitle', 'gameSubtitle', 'gameContainer',
    'startBtn', 'restartBtn', 'setupStartBtn',
    'keyboardModeBtn', 'cameraModeBtn',
    'onePlayerBtn', 'twoPlayerBtn',
    'spaceThemeBtn', 'unicornThemeBtn',
    'cameraStatus', 'instructions', 'armsUpIndicator',
    'playerCountContainer',
    'webcamContainer', 'webcamVideo', 'webcamCanvas', 'webcamLabel',
    'positionIndicator', 'positionMarker',
    'setupCanvas', 'setupTitle', 'setupInstruction', 'setupWebcam',
    'setupWaveIndicator', 'playersReadyContainer',
    'p1ReadyCard', 'p2ReadyCard',
    'p1FacePreview', 'p2FacePreview',
    'p1FacePlaceholder', 'p2FacePlaceholder',
    'p1ReadyStatus', 'p2ReadyStatus',
    'finalScore', 'finalWave'
];

for (const id of knownIds) {
    elements[id] = createElement('div');
    elements[id].id = id;
}
// gameCanvas needs a real-ish getContext
elements['gameCanvas'] = createElement('canvas');
elements['gameCanvas'].id = 'gameCanvas';

global.document = {
    getElementById(id) { return elements[id] || createElement('div'); },
    createElement(tag) { return createElement(tag); },
    body: { style: {} }
};

global.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener(ev, fn) { /* noop */ },
    requestAnimationFrame(fn) { /* noop - don't start loops */ }
};

global.navigator = {
    mediaDevices: {
        getUserMedia() { return Promise.reject(new Error('no camera in tests')); }
    }
};

global.requestAnimationFrame = function(fn) { /* noop */ };
global.Image = class { set src(v) {} };

// Stub TensorFlow / poseDetection (not loaded in tests)
global.tf = {
    ready() { return Promise.resolve(); },
    getBackend() { return 'cpu'; }
};
global.poseDetection = {
    SupportedModels: { MoveNet: 'MoveNet' },
    movenet: { modelType: { MULTIPOSE_LIGHTNING: 'MultiPose.Lightning' } },
    TrackerType: { BoundingBox: 'BoundingBox' },
    createDetector() { return Promise.resolve({ estimatePoses() { return []; } }); }
};

module.exports = { elements, createElement };
