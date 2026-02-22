// render-pipe.js — Half-pipe geometry: build, pool management, and scroll update.
// Depends on: render.js (getTheme, RENDER_THEME), state.js (gameState, CONFIG)

function buildPipeSegment(zOffset) {
    const cfg     = CONFIG.pipe;
    const halfArc = (cfg.arcDegrees / 2) * (Math.PI / 180);
    const radialSegs = 48;
    const lengthSegs = 6;

    const points = [];
    for (let i = 0; i <= radialSegs; i++) {
        const t     = i / radialSegs;
        const angle = -halfArc + t * 2 * halfArc;
        points.push(new THREE.Vector2(
            Math.sin(angle) * cfg.radius,
            -Math.cos(angle) * cfg.radius
        ));
    }

    const shape   = new THREE.BufferGeometry();
    const verts   = [];
    const uvs     = [];
    const indices = [];

    for (let seg = 0; seg <= lengthSegs; seg++) {
        const z = zOffset + (seg / lengthSegs) * cfg.segmentLength;
        for (let i = 0; i <= radialSegs; i++) {
            const p = points[i];
            verts.push(p.x, p.y + cfg.radius, -z);
            uvs.push(i / radialSegs, seg / lengthSegs);
        }
    }

    for (let seg = 0; seg < lengthSegs; seg++) {
        const base = seg * (radialSegs + 1);
        for (let i = 0; i < radialSegs; i++) {
            const a = base + i;
            const b = base + i + 1;
            const c = base + (radialSegs + 1) + i;
            const d = base + (radialSegs + 1) + i + 1;
            indices.push(a, c, b, b, c, d);
        }
    }

    shape.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    shape.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,   2));
    shape.setIndex(indices);
    shape.computeVertexNormals();

    const T   = getTheme();
    const mat = new THREE.MeshStandardMaterial({
        color:     T.theme.pipeColor,
        emissive:  T.theme.pipeEmissive,
        roughness: 0.8,
        metalness: 0.1,
        side:      THREE.BackSide,
        wireframe: false,
    });
    const mesh = new THREE.Mesh(shape, mat);

    // Wireframe overlay for the retro neon-grid look
    const wireMat = new THREE.MeshBasicMaterial({
        color:       T.theme.wireColor,
        wireframe:   true,
        transparent: true,
        opacity:     T.theme.wireOpacity,
    });
    const wire  = new THREE.Mesh(shape.clone(), wireMat);
    const group = new THREE.Group();
    group.add(mesh);
    group.add(wire);
    return group;
}

function buildPipePool() {
    const cfg = CONFIG.pipe;
    gameState.pipeSegments = [];
    for (let i = 0; i < cfg.segmentCount; i++) {
        // All segments share the same geometry (zOffset 0 → −segmentLength).
        // Each segment gets its own position.z so they tile without overlap.
        const seg = buildPipeSegment(0);
        seg.position.z = -i * cfg.segmentLength;
        gameState.scene.add(seg);
        gameState.pipeSegments.push(seg);
    }
}

function updatePipePool() {
    const cfg = CONFIG.pipe;
    const spd = gameState.speed;
    for (const seg of gameState.pipeSegments) {
        seg.position.z += spd;
        // Wrap each segment individually once its front edge clears the camera.
        // Using segmentLength as threshold keeps one full segment of look-ahead.
        if (seg.position.z > cfg.segmentLength) {
            seg.position.z -= cfg.segmentCount * cfg.segmentLength;
        }
    }
}
