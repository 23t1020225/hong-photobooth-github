// Keep face tracking available on browsers without worker WebGL/OffscreenCanvas.
const faceFallbackRoot = new URL('../', document.currentScript.src);
let faceVisionPromise;
function loadFaceVision() {
    if (faceVisionPromise) return faceVisionPromise;
    faceVisionPromise = new Promise((resolve, reject) => {
        const previous = window.exports;
        const hadExports = Object.prototype.hasOwnProperty.call(window, 'exports');
        const api = {};
        window.exports = api;
        const script = document.createElement('script');
        script.src = new URL('vendor/mediapipe/vision_bundle.js', faceFallbackRoot).href;
        function restore() {
            if (hadExports) window.exports = previous;
            else delete window.exports;
            script.remove();
        }
        script.onload = () => { restore(); resolve(api); };
        script.onerror = () => { restore(); reject(new Error('Không tải được bộ nhận diện khuôn mặt.')); };
        document.head.appendChild(script);
    }).catch(error => { faceVisionPromise = null; throw error; });
    return faceVisionPromise;
}
function createMainFaceTrackerWorker() {
    let tracker, stopped = false;
    const adapter = {
        onmessage: null, onerror: null,
        terminate() { stopped = true; tracker?.close(); tracker = null; },
        postMessage(message) {
            Promise.resolve().then(async () => {
                if (stopped) { message.bitmap?.close(); return; }
                try {
                    if (message.type === 'init') {
                        const { FaceLandmarker, FilesetResolver } = await loadFaceVision();
                        if (stopped) return;
                        const files = await FilesetResolver.forVisionTasks(new URL('vendor/mediapipe/wasm', faceFallbackRoot).href);
                        tracker = await FaceLandmarker.createFromOptions(files, {
                            canvas: document.createElement('canvas'),
                            baseOptions: { modelAssetPath: new URL('models/face_landmarker.task', faceFallbackRoot).href, delegate: 'CPU' },
                            runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true,
                            minFaceDetectionConfidence: .55, minFacePresenceConfidence: .55, minTrackingConfidence: .55
                        });
                        if (stopped) { tracker.close(); tracker = null; return; }
                        adapter.onmessage?.({ data: { type: 'ready' } });
                    } else if (message.type === 'frame') {
                        const result = tracker.detectForVideo(message.bitmap.source || message.bitmap, message.timestamp);
                        const points = result.faceLandmarks[0] || null;
                        const smile = (result.faceBlendshapes?.[0]?.categories || [])
                            .filter(item => item.categoryName === 'mouthSmileLeft' || item.categoryName === 'mouthSmileRight')
                            .reduce((sum, item) => sum + item.score, 0) / 2;
                        adapter.onmessage?.({ data: { type: 'result', id: message.id, points, smile } });
                    }
                } catch (error) {
                    if (!stopped) adapter.onmessage?.({ data: { type: 'error', id: message.id, detail: String(error) } });
                } finally { message.bitmap?.close(); }
            });
        }
    };
    return adapter;
}
