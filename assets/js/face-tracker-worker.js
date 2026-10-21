// A classic worker lets MediaPipe's WASM loader use importScripts.
self.exports = {};
let faceLandmarker = null;
const trackedFaceIndices = [...new Set([
    1, 10, 33, 133, 362, 263,
    338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400,
    377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
])];
self.onmessage = async event => {
    const message = event.data;
    if (message.type === 'init') {
        try {
            importScripts('../vendor/mediapipe/vision_bundle.js');
            const { FaceLandmarker, FilesetResolver } = self.exports;
            const files = await FilesetResolver.forVisionTasks(new URL('../vendor/mediapipe/wasm', self.location.href).href);
            faceLandmarker = await FaceLandmarker.createFromOptions(files, {
                baseOptions: { modelAssetPath: new URL('../models/face_landmarker.task', self.location.href).href, delegate: 'CPU' },
                runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true,
                minFaceDetectionConfidence: .55, minFacePresenceConfidence: .55, minTrackingConfidence: .55
            });
            self.postMessage({ type: 'ready' });
        } catch { self.postMessage({ type: 'error' }); }
        return;
    }
    if (message.type !== 'frame') return;
    try {
        if (!faceLandmarker) throw new Error('Face tracker is not ready.');
        const result = faceLandmarker.detectForVideo(message.bitmap, message.timestamp);
        const face = result.faceLandmarks[0];
        const points = face ? Object.fromEntries(trackedFaceIndices.map(index => [index, { x: face[index].x, y: face[index].y }])) : null;
        const categories = result.faceBlendshapes?.[0]?.categories || [];
        const smile = categories.filter(item => item.categoryName === 'mouthSmileLeft' || item.categoryName === 'mouthSmileRight')
            .reduce((sum, item) => sum + item.score, 0) / 2;
        self.postMessage({ type: 'result', id: message.id, points, smile });
    } catch { self.postMessage({ type: 'error', id: message.id }); }
    finally { message.bitmap.close(); }
};
