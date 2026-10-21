// A classic worker lets MediaPipe's WASM loader use importScripts.
self.exports = {};
let faceLandmarker = null;
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
        const points = face ? Object.fromEntries([1, 10, 33, 263].map(index => [index, { x: face[index].x, y: face[index].y }])) : null;
        const categories = result.faceBlendshapes?.[0]?.categories || [];
        const smile = categories.filter(item => item.categoryName === 'mouthSmileLeft' || item.categoryName === 'mouthSmileRight')
            .reduce((sum, item) => sum + item.score, 0) / 2;
        self.postMessage({ type: 'result', id: message.id, points, smile });
    } catch { self.postMessage({ type: 'error', id: message.id }); }
    finally { message.bitmap.close(); }
};
