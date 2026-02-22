// webcam-registration.js — Player registration flow and registration UI helpers.
// Depends on: webcam-core.js (getKeypoint, pruneByTime, getWrists),
//             webcam-color.js (sampleTorsoColor),
//             webcam-gestures.js (scoreWristHistory)

// ── Registration flow ────────────────────────────────────────────────

function startPlayerRegistration(playerCount) {
    webcamState.playerCount      = playerCount;
    webcamState.registrationPhase = 'registering';
    webcamState.currentRegisteringPlayer = 0;
    webcamState.registeredPlayers.forEach(r => {
        r.ready           = false;
        r.faceImage       = null;
        r.poseId          = null;
        r.colorSignature  = null;
        r.waveFrames      = 0;
        r.wristHistories  = { left: [], right: [] };
        r.motionScore     = 0;
        r.jumpHoldFrames  = 0;
        r.jumpCooldown    = 0;
        r.crouchHoldFrames = 0;
        r.crouchCooldown  = 0;
        r.baselineShoulderY = null;
    });
    updateRegistrationUI();
}

function handleRegistrationPoseTracking(sortedPoses, video) {
    const cx     = webcamState.ctx;
    const canvas = webcamState.canvas;
    const idx    = webcamState.currentRegisteringPlayer;
    const reg    = webcamState.registeredPlayers[idx];

    // Pick the pose most central to this player's expected side
    let pose = null;
    if (webcamState.playerCount === 2) {
        const halfW = video.videoWidth / 2;
        const candidates = sortedPoses.filter(p => {
            const x = getPoseCenterX(p);
            return idx === 0 ? x < halfW : x >= halfW;
        });
        pose = candidates[0] || null;
    } else {
        pose = sortedPoses[0] || null;
    }
    if (!pose) return;

    // Track wrist wave gesture for confirmation
    const { left, right } = getWrists(pose);
    const now = Date.now();
    if (left)  reg.wristHistories.left.push({ x: left.x,  y: left.y,  time: now });
    if (right) reg.wristHistories.right.push({ x: right.x, y: right.y, time: now });

    const cutoff = now - CONFIG.waveGesture.historyWindowMs - 100;
    pruneByTime(reg.wristHistories.left,  cutoff);
    pruneByTime(reg.wristHistories.right, cutoff);

    const lScore = scoreWristHistory(reg.wristHistories.left);
    const rScore = scoreWristHistory(reg.wristHistories.right);
    reg.motionScore = Math.max(lScore, rScore);

    if (reg.motionScore > 0.3) {
        reg.waveFrames++;
    } else {
        reg.waveFrames = Math.max(0, reg.waveFrames - 1);
    }

    updateRegistrationWaveIndicator(reg.waveFrames, CONFIG.waveGesture.holdFrames);

    if (reg.waveFrames >= CONFIG.waveGesture.holdFrames) {
        // sampleTorsoColor draws the video frame to canvas as a side effect;
        // capture face from the live video element directly.
        reg.colorSignature = sampleTorsoColor(pose, video, cx, canvas);
        captureFaceImage(pose, video, idx);
        reg.poseId = pose.id;

        // Calibrate crouch baseline from current shoulder Y
        const ls = getKeypoint(pose, 'left_shoulder');
        const rs = getKeypoint(pose, 'right_shoulder');
        if (ls && rs && ls.score > 0.3 && rs.score > 0.3) {
            reg.baselineShoulderY = (ls.y + rs.y) / 2;
        }

        reg.ready      = true;
        reg.waveFrames = 0;
        onPlayerRegistered(idx);
    }
}

function captureFaceImage(pose, video, playerIndex) {
    const nose = getKeypoint(pose, 'nose');
    const ls   = getKeypoint(pose, 'left_shoulder');
    const rs   = getKeypoint(pose, 'right_shoulder');
    if (!nose || nose.score < 0.3) return;

    const shoulderWidth = (ls && rs) ? Math.abs(rs.x - ls.x) : 80;
    const faceSize = Math.max(40, shoulderWidth * 0.8);
    const fx = nose.x - faceSize / 2;
    const fy = nose.y - faceSize * 0.7;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width  = 60;
    tempCanvas.height = 60;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw from the live video element (not the overlay canvas) so we always
    // get the actual camera frame regardless of draw order.
    tempCtx.save();
    tempCtx.scale(-1, 1);     // mirror to match CSS scaleX(-1) on the canvas
    tempCtx.translate(-60, 0);
    tempCtx.drawImage(
        video,
        fx, fy, faceSize, faceSize, // source: video-space coords
        0,  0,  60, 60              // dest: 60×60 thumbnail
    );
    tempCtx.restore();

    const img = new Image();
    img.src = tempCanvas.toDataURL();
    webcamState.registeredPlayers[playerIndex].faceImage = img;
    gameState.players[playerIndex].faceImage = img;
}

function onPlayerRegistered(playerIndex) {
    const reg = webcamState.registeredPlayers[playerIndex];
    updateRegistrationPlayerCard(playerIndex, reg.faceImage);

    const nextIdx = playerIndex + 1;
    if (nextIdx < webcamState.playerCount) {
        webcamState.currentRegisteringPlayer = nextIdx;
        updateRegistrationUI();
    } else {
        webcamState.registrationPhase = 'ready';
        document.getElementById('setupStartBtn').classList.remove('hidden');
    }
}

// ── Registration UI helpers ──────────────────────────────────────────

function updateRegistrationUI() {
    const idx  = webcamState.currentRegisteringPlayer;
    const isP2 = idx === 1;
    document.getElementById('setupTitle').textContent = isP2
        ? 'PLAYER 2 - GET READY!'
        : 'PLAYER 1 - GET READY!';
    document.getElementById('setupTitle').className = `player-setup-title ${isP2 ? 'p2' : 'p1'}`;
    document.getElementById('setupInstruction').textContent = isP2
        ? 'Stand on the RIGHT side and wave your hand'
        : 'Stand on the LEFT side and wave your hand';
    if (webcamState.playerCount === 2) {
        document.getElementById('p2ReadyCard').classList.remove('hidden');
    }
}

function updateRegistrationWaveIndicator(frames, maxFrames) {
    const el  = document.getElementById('setupWaveIndicator');
    const pct = Math.min(1, frames / maxFrames);
    if (pct > 0.1) {
        el.textContent = `WAVING… ${Math.round(pct * 100)}%`;
        el.style.color = pct > 0.7 ? '#00ff00' : '#ffff00';
    } else {
        el.textContent = 'WAVE YOUR HAND!';
        el.style.color = '#ffffff';
    }
}

function updateRegistrationPlayerCard(playerIndex, faceImage) {
    const cardId        = playerIndex === 0 ? 'p1ReadyCard'       : 'p2ReadyCard';
    const faceId        = playerIndex === 0 ? 'p1FacePreview'     : 'p2FacePreview';
    const placeholderId = playerIndex === 0 ? 'p1FacePlaceholder' : 'p2FacePlaceholder';
    const statusId      = playerIndex === 0 ? 'p1ReadyStatus'     : 'p2ReadyStatus';

    document.getElementById(statusId).textContent  = 'READY!';
    document.getElementById(statusId).style.color  = '#00ff00';
    if (faceImage) {
        const faceEl = document.getElementById(faceId);
        faceEl.src          = faceImage.src;
        faceEl.style.display = 'block';
        document.getElementById(placeholderId).style.display = 'none';
    }
}
