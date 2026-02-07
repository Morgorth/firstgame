#!/usr/bin/env node
// Test runner for Wave Assault.
// Tests: syntax validation, integration loading, unit tests for core logic.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const JS_FILES = [
    'js/config.js', 'js/state.js', 'js/entities.js', 'js/input.js',
    'js/webcam.js', 'js/game.js', 'js/render.js', 'js/ui.js', 'js/main.js'
];

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  \x1b[32m✓\x1b[0m ${name}`);
        passed++;
    } catch (e) {
        console.log(`  \x1b[31m✗\x1b[0m ${name}`);
        console.log(`    ${e.message}`);
        failed++;
    }
}

function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertClose(a, b, tolerance, msg) {
    if (Math.abs(a - b) > tolerance) throw new Error(msg || `Expected ${a} ≈ ${b} (±${tolerance})`);
}

// ═══════════════════════════════════════════════════════════
console.log('\n\x1b[1m1. Syntax Validation\x1b[0m');
// ═══════════════════════════════════════════════════════════

for (const file of JS_FILES) {
    test(`${file} has valid syntax`, () => {
        execSync(`node --check ${path.join(ROOT, file)}`, { stdio: 'pipe' });
    });
}

test('styles.css exists and is non-empty', () => {
    const stat = fs.statSync(path.join(ROOT, 'styles.css'));
    assert(stat.size > 100, 'styles.css is too small');
});

test('index.html references all JS files', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    for (const file of JS_FILES) {
        assert(html.includes(`src="${file}"`), `Missing script tag for ${file}`);
    }
});

test('index.html loads scripts in correct order', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    let lastIndex = -1;
    for (const file of JS_FILES) {
        const idx = html.indexOf(`src="${file}"`);
        assert(idx > lastIndex, `${file} is out of order (at ${idx}, expected after ${lastIndex})`);
        lastIndex = idx;
    }
});

// ═══════════════════════════════════════════════════════════
console.log('\n\x1b[1m2. Integration: All Files Load Together\x1b[0m');
// ═══════════════════════════════════════════════════════════

// Load DOM mocks then eval all game files as one combined script
// (mirrors how the browser loads them sequentially in one global scope)
require('./dom-mock');

const vm = require('vm');

const combinedCode = JS_FILES
    .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8'))
    .join('\n;\n');

test('All JS files load together without error', () => {
    vm.runInThisContext(combinedCode, { filename: 'combined.js' });
});

// ═══════════════════════════════════════════════════════════
console.log('\n\x1b[1m3. CONFIG Tests\x1b[0m');
// ═══════════════════════════════════════════════════════════

test('CONFIG.player has required fields', () => {
    assert(CONFIG.player.width > 0);
    assert(CONFIG.player.height > 0);
    assert(CONFIG.player.speed > 0);
    assert(CONFIG.player.maxCrowd > 0);
    assert(CONFIG.player.startCrowd > 0);
    assert(CONFIG.player.fireRate > 0);
});

test('CONFIG.enemy has all three types', () => {
    for (const type of ['basic', 'fast', 'tank']) {
        assert(CONFIG.enemy[type], `Missing enemy type: ${type}`);
        assert(CONFIG.enemy[type].width > 0);
        assert(CONFIG.enemy[type].health > 0);
        assert(CONFIG.enemy[type].speed > 0);
        assert(CONFIG.enemy[type].points > 0);
    }
});

test('CONFIG.waveGesture has all tuning fields', () => {
    const wg = CONFIG.waveGesture;
    assert(wg.wristMinConfidence > 0, 'wristMinConfidence');
    assert(wg.historyWindowMs > 0, 'historyWindowMs');
    assert(wg.directionChangePx > 0, 'directionChangePx');
    assert(wg.strongMotion > wg.mediumMotion, 'strongMotion > mediumMotion');
    assert(wg.mediumMotion > wg.weakMotion, 'mediumMotion > weakMotion');
    assert(wg.framesToConfirm > 0, 'framesToConfirm');
    assert(wg.decayRate > 0, 'decayRate');
});

test('SKELETON_CONNECTIONS is non-empty array of pairs', () => {
    assert(Array.isArray(SKELETON_CONNECTIONS));
    assert(SKELETON_CONNECTIONS.length >= 5);
    SKELETON_CONNECTIONS.forEach(pair => {
        assert(pair.length === 2, 'Each connection must be a pair');
        assert(typeof pair[0] === 'string');
        assert(typeof pair[1] === 'string');
    });
});

test('PLAYER_COLORS has entries for 2 players', () => {
    assert(PLAYER_COLORS.length >= 2);
    assert(PLAYER_COLORS[0].primary);
    assert(PLAYER_COLORS[1].primary);
    assert(PLAYER_COLORS[0].primary !== PLAYER_COLORS[1].primary);
});

// ═══════════════════════════════════════════════════════════
console.log('\n\x1b[1m4. Entity Factory Tests\x1b[0m');
// ═══════════════════════════════════════════════════════════

test('createPlayer returns position object', () => {
    const p = createPlayer();
    assert(typeof p.x === 'number' && p.x > 0);
    assert(typeof p.y === 'number' && p.y > 0);
});

test('createBullet returns active bullet with owner', () => {
    const b = createBullet(100, 200, 1);
    assert(b.x === 100 && b.y === 200);
    assert(b.active === true);
    assert(b.owner === 1);
});

test('createBullet defaults owner to 0', () => {
    assert(createBullet(0, 0).owner === 0);
});

test('createEnemy copies stats from CONFIG', () => {
    const e = createEnemy('basic', 50, 60);
    assert(e.type === 'basic');
    assert(e.x === 50 && e.y === 60);
    assert(e.health === CONFIG.enemy.basic.health);
    assert(e.maxHealth === CONFIG.enemy.basic.health);
    assert(e.speed === CONFIG.enemy.basic.speed);
    assert(e.width === CONFIG.enemy.basic.width);
});

test('createEnemy works for all types', () => {
    for (const type of ['basic', 'fast', 'tank']) {
        const e = createEnemy(type, 0, 0);
        assert(e.type === type);
        assert(e.health > 0);
    }
});

test('createPowerup returns active with health', () => {
    const p = createPowerup(10, 20);
    assert(p.active === true);
    assert(p.health === 20 && p.maxHealth === 20);
    assert(p.x === 10 && p.y === 20);
});

test('createParticle has velocity and life', () => {
    const p = createParticle(10, 20, '#ff0000');
    assert(typeof p.vx === 'number');
    assert(typeof p.vy === 'number');
    assert(p.life === 30 && p.maxLife === 30);
    assert(p.color === '#ff0000');
});

test('createStars returns 200 stars', () => {
    const stars = createStars();
    assert(stars.length === 200);
    stars.forEach(s => {
        assert(typeof s.x === 'number');
        assert(typeof s.y === 'number');
        assert(s.size >= 0 && s.size <= 2);
        assert(s.speed > 0);
    });
});

// ═══════════════════════════════════════════════════════════
console.log('\n\x1b[1m5. getCrowdPositions Tests\x1b[0m');
// ═══════════════════════════════════════════════════════════

test('getCrowdPositions returns correct count for single player', () => {
    // Setup single-player state
    gameState.playerCount = 1;
    gameState.player = { x: 500, y: 800 };
    gameState.crowdSize = 5;
    const positions = getCrowdPositions(0);
    assert(positions.length === 5, `Expected 5 positions, got ${positions.length}`);
});

test('getCrowdPositions returns correct count for multi-player', () => {
    gameState.playerCount = 2;
    gameState.players[0] = { active: true, x: 300, y: 800, crowdSize: 3 };
    gameState.players[1] = { active: true, x: 700, y: 800, crowdSize: 4 };
    assert(getCrowdPositions(0).length === 3);
    assert(getCrowdPositions(1).length === 4);
});

test('getCrowdPositions returns [] for inactive player', () => {
    gameState.playerCount = 2;
    gameState.players[1] = { active: false, x: 0, y: 0, crowdSize: 5 };
    assert(getCrowdPositions(1).length === 0);
});

test('getCrowdPositions centers around player position', () => {
    gameState.playerCount = 1;
    gameState.player = { x: 500, y: 800 };
    gameState.crowdSize = 1;
    const positions = getCrowdPositions(0);
    assert(positions[0].x === 500 && positions[0].y === 800);
});

// ═══════════════════════════════════════════════════════════
console.log('\n\x1b[1m6. Collision Detection Tests\x1b[0m');
// ═══════════════════════════════════════════════════════════

test('checkCollision detects overlapping rects', () => {
    assert(checkCollision({ x: 0, y: 0 }, { x: 5, y: 5 }, 10, 10, 10, 10) === true);
});

test('checkCollision rejects non-overlapping rects', () => {
    assert(checkCollision({ x: 0, y: 0 }, { x: 20, y: 20 }, 10, 10, 10, 10) === false);
});

test('checkCollision handles edge-touching (not colliding)', () => {
    assert(checkCollision({ x: 0, y: 0 }, { x: 10, y: 0 }, 10, 10, 10, 10) === false);
});

test('checkCollision handles one-pixel overlap', () => {
    assert(checkCollision({ x: 0, y: 0 }, { x: 9, y: 0 }, 10, 10, 10, 10) === true);
});

// ═══════════════════════════════════════════════════════════
console.log('\n\x1b[1m7. Wave Detection Tests\x1b[0m');
// ═══════════════════════════════════════════════════════════

test('getWrists filters by confidence threshold', () => {
    const pose = {
        keypoints: [
            { name: 'left_wrist', x: 100, y: 200, score: 0.5 },
            { name: 'right_wrist', x: 300, y: 200, score: 0.1 }
        ]
    };
    const result = getWrists(pose);
    assert(result.left !== null, 'left wrist should pass at 0.5');
    assert(result.right === null, 'right wrist should fail at 0.1');
});

test('getWrists returns both when both pass', () => {
    const pose = {
        keypoints: [
            { name: 'left_wrist', x: 100, y: 200, score: 0.8 },
            { name: 'right_wrist', x: 300, y: 200, score: 0.6 }
        ]
    };
    const result = getWrists(pose);
    assert(result.left !== null);
    assert(result.right !== null);
});

test('getWrists returns both null when neither passes', () => {
    const pose = {
        keypoints: [
            { name: 'left_wrist', x: 100, y: 200, score: 0.05 },
            { name: 'right_wrist', x: 300, y: 200, score: 0.2 }
        ]
    };
    const result = getWrists(pose);
    assert(result.left === null);
    assert(result.right === null);
});

test('scoreWristHistory returns 0 for too few samples', () => {
    const history = [
        { x: 10, y: 10, time: Date.now() },
        { x: 20, y: 20, time: Date.now() }
    ];
    assert(scoreWristHistory(history) === 0);
});

test('scoreWristHistory returns 0 for stale samples', () => {
    const staleTime = Date.now() - 5000; // 5s ago, outside 1.5s window
    const history = [];
    for (let i = 0; i < 10; i++) {
        history.push({ x: i * 20, y: 100, time: staleTime + i * 10 });
    }
    assert(scoreWristHistory(history) === 0);
});

test('scoreWristHistory detects strong wave motion', () => {
    const now = Date.now();
    const history = [];
    // Simulate vigorous back-and-forth waving
    for (let i = 0; i < 15; i++) {
        const x = (i % 2 === 0) ? 100 : 250; // 150px swings
        history.push({ x, y: 200, time: now - (15 - i) * 80 });
    }
    const score = scoreWristHistory(history);
    assert(score >= 0.7, `Expected strong score, got ${score}`);
});

test('scoreWristHistory returns low score for minimal motion', () => {
    const now = Date.now();
    const history = [];
    for (let i = 0; i < 10; i++) {
        history.push({ x: 100 + i * 0.5, y: 200, time: now - (10 - i) * 80 });
    }
    const score = scoreWristHistory(history);
    assert(score === 0, `Expected 0 for tiny motion, got ${score}`);
});

test('updateWaveDetection tracks both wrists', () => {
    const wristHistories = { left: [], right: [] };
    const pose = {
        keypoints: [
            { name: 'left_wrist', x: 100, y: 200, score: 0.8 },
            { name: 'right_wrist', x: 300, y: 200, score: 0.6 }
        ]
    };
    updateWaveDetection(pose, wristHistories);
    assert(wristHistories.left.length === 1, 'Should have 1 left entry');
    assert(wristHistories.right.length === 1, 'Should have 1 right entry');
});

test('updateWaveDetection ignores low-confidence wrists', () => {
    const wristHistories = { left: [], right: [] };
    const pose = {
        keypoints: [
            { name: 'left_wrist', x: 100, y: 200, score: 0.1 },
            { name: 'right_wrist', x: 300, y: 200, score: 0.05 }
        ]
    };
    updateWaveDetection(pose, wristHistories);
    assert(wristHistories.left.length === 0, 'Should ignore low-confidence left');
    assert(wristHistories.right.length === 0, 'Should ignore low-confidence right');
});

test('updateWaveDetection prunes old entries', () => {
    const wristHistories = {
        left: [{ x: 10, y: 10, time: Date.now() - 5000 }],
        right: []
    };
    const pose = {
        keypoints: [
            { name: 'left_wrist', x: 100, y: 200, score: 0.8 },
            { name: 'right_wrist', x: 300, y: 200, score: 0.1 }
        ]
    };
    updateWaveDetection(pose, wristHistories);
    // Old entry should be pruned, new one added
    assert(wristHistories.left.length === 1, `Expected 1, got ${wristHistories.left.length}`);
    assert(wristHistories.left[0].x === 100, 'Should be the new entry');
});

test('updateWaveDetection returns best score from either wrist', () => {
    const now = Date.now();
    const wristHistories = {
        left: [],
        right: []
    };
    // Only right wrist is waving vigorously
    for (let i = 0; i < 12; i++) {
        const x = (i % 2 === 0) ? 100 : 250;
        wristHistories.right.push({ x, y: 200, time: now - (12 - i) * 80 });
    }
    // Left wrist is still
    for (let i = 0; i < 12; i++) {
        wristHistories.left.push({ x: 100, y: 200, time: now - (12 - i) * 80 });
    }

    const pose = {
        keypoints: [
            { name: 'left_wrist', x: 100, y: 200, score: 0.8 },
            { name: 'right_wrist', x: 250, y: 200, score: 0.8 }
        ]
    };
    const score = updateWaveDetection(pose, wristHistories);
    assert(score >= 0.7, `Right wrist waving should yield high score, got ${score}`);
});

// ═══════════════════════════════════════════════════════════
console.log('\n\x1b[1m8. pruneByTime Tests\x1b[0m');
// ═══════════════════════════════════════════════════════════

test('pruneByTime removes old entries in place', () => {
    const arr = [
        { time: 100 },
        { time: 200 },
        { time: 300 },
        { time: 400 }
    ];
    pruneByTime(arr, 250);
    assert(arr.length === 2);
    assert(arr[0].time === 300);
});

test('pruneByTime keeps all entries if none are old', () => {
    const arr = [{ time: 500 }, { time: 600 }];
    pruneByTime(arr, 100);
    assert(arr.length === 2);
});

test('pruneByTime removes all if all are old', () => {
    const arr = [{ time: 10 }, { time: 20 }];
    pruneByTime(arr, 100);
    assert(arr.length === 0);
});

test('pruneByTime handles empty array', () => {
    const arr = [];
    pruneByTime(arr, 100);
    assert(arr.length === 0);
});

// ═══════════════════════════════════════════════════════════
console.log('\n\x1b[1m9. Wave Spawning Tests\x1b[0m');
// ═══════════════════════════════════════════════════════════

test('spawnWave creates enemies for wave 1', () => {
    gameState.wave = 1;
    gameState.enemies = [];
    gameState.playerCount = 1;
    gameState.lanePositions = [PLAY_AREA.width * 0.33, PLAY_AREA.width * 0.5, PLAY_AREA.width * 0.67];
    spawnWave();
    assert(gameState.enemies.length === 3, `Wave 1 should have 3 enemies, got ${gameState.enemies.length}`);
    assert(gameState.enemiesInWave === 3);
});

test('spawnWave scales up for wave 5', () => {
    gameState.wave = 5;
    gameState.enemies = [];
    gameState.playerCount = 1;
    spawnWave();
    assert(gameState.enemies.length === 11, `Wave 5 should have 11 enemies, got ${gameState.enemies.length}`);
});

test('spawnWave increases count for 2 players', () => {
    gameState.wave = 1;
    gameState.enemies = [];
    gameState.playerCount = 2;
    gameState.lanePositions = [100, 200, 300, 400, 500];
    spawnWave();
    assert(gameState.enemies.length === 4, `2P wave 1 should have ceil(3*1.3)=4, got ${gameState.enemies.length}`);
});

test('spawnWave caps at 50 enemies', () => {
    gameState.wave = 100;
    gameState.enemies = [];
    gameState.playerCount = 2;
    spawnWave();
    assert(gameState.enemies.length <= 50, `Should cap at 50, got ${gameState.enemies.length}`);
});

test('spawnWave enemies have correct types for early waves', () => {
    gameState.wave = 1;
    gameState.enemies = [];
    gameState.playerCount = 1;
    gameState.lanePositions = [PLAY_AREA.width * 0.33, PLAY_AREA.width * 0.5, PLAY_AREA.width * 0.67];
    spawnWave();
    assert(gameState.enemies.every(e => e.type === 'basic'), 'Wave 1 should only have basic enemies');
});

// ═══════════════════════════════════════════════════════════
console.log('\n\x1b[1m10. Game State Tests\x1b[0m');
// ═══════════════════════════════════════════════════════════

test('webcamState.wristHistories has correct structure', () => {
    assert(Array.isArray(webcamState.wristHistories.left));
    assert(Array.isArray(webcamState.wristHistories.right));
});

test('webcamState.registeredPlayers have wristHistories', () => {
    webcamState.registeredPlayers.forEach((p, i) => {
        assert(Array.isArray(p.wristHistories.left), `Player ${i} missing wristHistories.left`);
        assert(Array.isArray(p.wristHistories.right), `Player ${i} missing wristHistories.right`);
    });
});

test('PLAYER_COLORS defines cyan for P1 and magenta for P2', () => {
    assert(PLAYER_COLORS[0].primary === '#00ffff', 'P1 should be cyan');
    assert(PLAYER_COLORS[1].primary === '#ff00ff', 'P2 should be magenta');
});

// ═══════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════

console.log(`\n\x1b[1m${passed + failed} tests, \x1b[32m${passed} passed\x1b[0m, \x1b[${failed > 0 ? '31' : '32'}m${failed} failed\x1b[0m\n`);
process.exit(failed > 0 ? 1 : 0);
