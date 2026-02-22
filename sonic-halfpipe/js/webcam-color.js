// webcam-color.js — Torso colour-signature sampling and matching.
// Used by gameplay pose matching and player registration.
// Depends on: webcam-core.js (getKeypoint, CONFIG)

function sampleTorsoColor(pose, video, cx, canvas) {
    const cfg = CONFIG.colorTracking;
    const ls = getKeypoint(pose, 'left_shoulder');
    const rs = getKeypoint(pose, 'right_shoulder');
    const lh = getKeypoint(pose, 'left_hip');
    const rh = getKeypoint(pose, 'right_hip');
    if (!ls || !rs || ls.score < 0.3 || rs.score < 0.3) return null;

    const sx = (ls.x + rs.x) / 2;
    const sy = (ls.y + rs.y) / 2;
    let hx, hy;
    if (lh && rh && lh.score > 0.2 && rh.score > 0.2) {
        hx = (lh.x + rh.x) / 2;
        hy = (lh.y + rh.y) / 2;
    } else {
        hx = sx;
        hy = sy + Math.abs(rs.x - ls.x) * 1.2;
    }

    const centerX = sx + (hx - sx) * 0.4;
    const centerY = sy + (hy - sy) * 0.4;
    const halfW = Math.abs(rs.x - ls.x) * 0.4;
    const halfH = Math.abs(hy - sy) * 0.25;

    const x0 = Math.max(0, Math.round(centerX - halfW));
    const y0 = Math.max(0, Math.round(centerY - halfH));
    const x1 = Math.min(video.videoWidth,  Math.round(centerX + halfW));
    const y1 = Math.min(video.videoHeight, Math.round(centerY + halfH));

    if (x1 - x0 < 4 || y1 - y0 < 4) return null;

    cx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const scaleX = canvas.width  / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;
    const px0 = Math.round(x0 * scaleX);
    const py0 = Math.round(y0 * scaleY);
    const pw  = Math.round((x1 - x0) * scaleX);
    const ph  = Math.round((y1 - y0) * scaleY);
    if (pw < 2 || ph < 2) return null;

    const imageData = cx.getImageData(px0, py0, pw, ph);
    const data = imageData.data;
    const step = cfg.pixelStep;
    const bins = new Float32Array(cfg.hueBins);
    let count = 0;

    for (let py = 0; py < ph; py += step) {
        for (let px = 0; px < pw; px += step) {
            const idx = (py * pw + px) * 4;
            const r = data[idx]     / 255;
            const g = data[idx + 1] / 255;
            const b = data[idx + 2] / 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            const sat = max > 0 ? delta / max : 0;
            if (sat < cfg.minSaturation || max < cfg.minValue || max > cfg.maxValue) continue;

            let hue;
            if (delta === 0) { hue = 0; }
            else if (max === r) { hue = 60 * (((g - b) / delta) % 6); }
            else if (max === g) { hue = 60 * (((b - r) / delta) + 2); }
            else                { hue = 60 * (((r - g) / delta) + 4); }
            if (hue < 0) hue += 360;

            const bin = Math.min(cfg.hueBins - 1, Math.floor(hue / (360 / cfg.hueBins)));
            bins[bin]++;
            count++;
        }
    }
    if (count < cfg.minPixels) return null;
    for (let i = 0; i < bins.length; i++) bins[i] /= count;
    return bins;
}

function compareColorSignatures(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += Math.min(a[i], b[i]);
    return sum;
}

function updateColorSignature(stored, current, alpha) {
    if (!stored || !current || stored.length !== current.length) return current;
    const result = new Float32Array(stored.length);
    let sum = 0;
    for (let i = 0; i < stored.length; i++) {
        result[i] = stored[i] * (1 - alpha) + current[i] * alpha;
        sum += result[i];
    }
    if (sum > 0) { for (let i = 0; i < result.length; i++) result[i] /= sum; }
    return result;
}
