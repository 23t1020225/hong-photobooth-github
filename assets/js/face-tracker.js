const faceFollow = document.querySelector('#face-follow');
const faceTrackingStatus = document.querySelector('#face-tracking-status');
const faceTrackingRetry = document.querySelector('#face-tracking-retry');
const faceWorkerUrl = new URL('face-tracker-worker.js', document.currentScript.src);
faceWorkerUrl.search = new URL(document.currentScript.src).search;
const faceTracking = {
    worker: null, state: 'idle', pose: null, context: null,
    request: null, serial: 0, generation: 0, timer: null,
    lastFrameTime: -1, lastRequestAt: -Infinity, lastSeenAt: 0
};
function setFaceTrackingStatus(text) {
    if (faceTrackingStatus.textContent !== text) faceTrackingStatus.textContent = text;
}
function clearFaceTrackingPose() {
    faceTracking.generation++;
    faceTracking.pose = null;
    faceTracking.context = null;
    faceTracking.lastSeenAt = 0;
    faceTracking.lastFrameTime = -1;
}
function failFaceTracking() {
    clearTimeout(faceTracking.timer);
    faceTracking.worker?.terminate();
    faceTracking.worker = null;
    faceTracking.request = null;
    faceTracking.state = 'failed';
    clearFaceTrackingPose();
    faceTrackingRetry.hidden = false;
    setFaceTrackingStatus('Chưa bật được bám mặt. Bạn có thể kéo filter thủ công hoặc bấm thử lại.');
    if (typeof updateStickerInteraction === 'function') updateStickerInteraction();
}
function startFaceTracking() {
    if (!faceFollow.checked || ['loading', 'ready', 'failed'].includes(faceTracking.state)) return;
    if (!window.Worker || !window.createImageBitmap) { failFaceTracking(); return; }
    faceTracking.state = 'loading';
    faceTrackingRetry.hidden = true;
    setFaceTrackingStatus('Đang chuẩn bị bám khuôn mặt…');
    try {
        const worker = new Worker(faceWorkerUrl);
        faceTracking.worker = worker;
        faceTracking.timer = setTimeout(failFaceTracking, 45000);
        worker.onerror = event => { event.preventDefault(); if (faceTracking.worker === worker) failFaceTracking(); };
        worker.onmessageerror = () => { if (faceTracking.worker === worker) failFaceTracking(); };
        worker.onmessage = event => {
            if (faceTracking.worker !== worker) return;
            const message = event.data;
            if (message.type === 'ready') {
                clearTimeout(faceTracking.timer);
                faceTracking.state = 'ready';
                setFaceTrackingStatus(faceFollow.checked ? 'Đưa khuôn mặt vào camera để filter tự bám.' : 'Đang chỉnh filter thủ công.');
                return;
            }
            if (message.type === 'error' && message.id === undefined) { failFaceTracking(); return; }
            const request = faceTracking.request;
            if (!request || message.id !== request.id) return;
            clearTimeout(faceTracking.timer);
            faceTracking.request = null;
            if (request.generation !== faceTracking.generation) return;
            if (message.type === 'error') { failFaceTracking(); return; }
            if (message.type !== 'result') return;
            const pose = message.points && facePoseFromLandmarks(message.points, request.context);
            if (!pose) {
                faceTracking.pose = null;
                setFaceTrackingStatus('Chưa thấy khuôn mặt. Nhìn thẳng camera ở nơi đủ sáng nhé.');
                return;
            }
            pose.smile = Number.isFinite(message.smile) ? Math.max(0, Math.min(1, message.smile)) : 0;
            const previous = faceTracking.pose;
            if (previous) for (const key of ['x', 'y', 'scaleX', 'scaleY', 'foreheadX', 'foreheadY', 'smile']) {
                pose[key] = previous[key] + (pose[key] - previous[key]) * .65;
            }
            faceTracking.pose = pose;
            faceTracking.lastSeenAt = performance.now();
            setFaceTrackingStatus('Đã bám khuôn mặt · filter tự đi theo bạn.');
        };
        worker.postMessage({ type: 'init' });
    } catch { failFaceTracking(); }
}
// Use the exact center crop and mirror applied by app.js, including portrait video.
function facePoseFromLandmarks(points, geometry) {
    const { videoWidth, videoHeight, width, height, mirror } = geometry;
    if (!videoWidth || !videoHeight) return null;
    const fit = Math.max(width / videoWidth, height / videoHeight);
    function point(index) {
        const landmark = points[index];
        if (!landmark || !Number.isFinite(landmark.x) || !Number.isFinite(landmark.y)) return null;
        const x = landmark.x * videoWidth * fit + (width - videoWidth * fit) / 2;
        return { x: mirror ? width - x : x, y: landmark.y * videoHeight * fit + (height - videoHeight * fit) / 2 };
    }
    const eyes = [point(33), point(263)], nose = point(1), forehead = point(10);
    if (!eyes[0] || !eyes[1] || !nose || !forehead) return null;
    eyes.sort((a, b) => a.x - b.x);
    const dx = eyes[1].x - eyes[0].x, dy = eyes[1].y - eyes[0].y, distance = Math.hypot(dx, dy);
    if (distance < 12) return null;
    const angle = Math.atan2(dy, dx), scaleX = distance / 140;
    const eyeX = (eyes[0].x + eyes[1].x) / 2, eyeY = (eyes[0].y + eyes[1].y) / 2;
    const noseOffset = -(nose.x - eyeX) * Math.sin(angle) + (nose.y - eyeY) * Math.cos(angle);
    const scaleY = Math.max(scaleX * .65, Math.min(scaleX * 1.45, noseOffset / 64));
    const outline = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109].map(point);
    const trackedEyes = [[33, 133], [362, 263]].map(([outer, inner]) => {
        const a = point(outer), b = point(inner);
        return a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, width: Math.hypot(b.x - a.x, b.y - a.y) } : null;
    });
    return {
        x: nose.x + Math.sin(angle) * 48 * scaleY, y: nose.y - Math.cos(angle) * 48 * scaleY,
        scaleX, scaleY, angle,
        foreheadX: forehead.x - Math.sin(angle) * 18 * scaleY, foreheadY: forehead.y + Math.cos(angle) * 18 * scaleY,
        outline: outline.every(Boolean) ? outline : [],
        eyes: trackedEyes.every(Boolean) ? trackedEyes : []
    };
}
function updateFaceTracking(source, width, height, mirror, isDemo) {
    if (isDemo) { setFaceTrackingStatus('Ảnh mẫu: kéo filter để thử. Bám mặt hoạt động khi bật camera.'); return; }
    if (!faceFollow.checked) { setFaceTrackingStatus('Đang chỉnh filter thủ công.'); return; }
    if (source.readyState < 2 || !source.srcObject) return;
    startFaceTracking();
    if (faceTracking.state !== 'ready' || stickerState.type === 'none') return;
    const context = { videoWidth: source.videoWidth, videoHeight: source.videoHeight, width, height, mirror };
    const signature = JSON.stringify(context);
    if (faceTracking.context !== signature) { clearFaceTrackingPose(); faceTracking.context = signature; }
    const now = performance.now();
    if (faceTracking.pose && now - faceTracking.lastSeenAt > 700) {
        faceTracking.pose = null; setFaceTrackingStatus('Đang tìm lại khuôn mặt…');
    }
    // One frame in flight and at most 12 detections per second; rendering is independent.
    if (document.hidden || faceTracking.request || now - faceTracking.lastRequestAt < 83 || source.currentTime === faceTracking.lastFrameTime) return;
    const request = { id: ++faceTracking.serial, generation: faceTracking.generation, context };
    faceTracking.request = request;
    faceTracking.lastFrameTime = source.currentTime;
    faceTracking.lastRequestAt = now;
    faceTracking.timer = setTimeout(failFaceTracking, 10000);
    Promise.resolve().then(() => createImageBitmap(source)).then(bitmap => {
        if (faceTracking.request !== request || request.generation !== faceTracking.generation) {
            bitmap.close();
            if (faceTracking.request === request) { clearTimeout(faceTracking.timer); faceTracking.request = null; }
            return;
        }
        try { faceTracking.worker.postMessage({ type: 'frame', id: request.id, timestamp: now, bitmap }, [bitmap]); }
        catch { bitmap.close(); failFaceTracking(); }
    }).catch(() => {
        if (faceTracking.request !== request) return;
        if (request.generation === faceTracking.generation) failFaceTracking();
        else { clearTimeout(faceTracking.timer); faceTracking.request = null; }
    });
}
function getTrackedStickerPose() {
    if (demo || !faceFollow.checked || faceTracking.state === 'failed') return { manual: true };
    return faceTracking.pose;
}
faceFollow.addEventListener('change', () => {
    clearFaceTrackingPose();
    if (faceFollow.checked) {
        if (faceTracking.state === 'failed') faceTracking.state = 'idle';
        if (stream && !demo) startFaceTracking();
    } else setFaceTrackingStatus('Đang chỉnh filter thủ công.');
    updateStickerInteraction();
});
faceTrackingRetry.addEventListener('click', () => {
    faceTracking.state = 'idle';
    if (stream && !demo) startFaceTracking();
    updateStickerInteraction();
});
document.addEventListener('camera-ready', () => { clearFaceTrackingPose(); startFaceTracking(); updateStickerInteraction(); });
document.addEventListener('camera-demo', () => { clearFaceTrackingPose(); updateStickerInteraction(); });
window.addEventListener('pagehide', () => {
    clearTimeout(faceTracking.timer); faceTracking.worker?.terminate();
    faceTracking.worker = null; faceTracking.request = null; faceTracking.state = 'idle'; clearFaceTrackingPose();
});
