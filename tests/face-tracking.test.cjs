const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const tick = () => new Promise(setImmediate);

function fixture(search = '') {
    let now = 1000;
    const elements = new Map(), events = {}, workers = [], timers = new Map();
    let nextTimer = 0, bitmapClosed = 0;
    function element(selector) {
        if (!elements.has(selector)) elements.set(selector, {
            checked: true, textContent: '', hidden: false, style: {}, listeners: {},
            addEventListener(name, handler) { this.listeners[name] = handler; }
        });
        return elements.get(selector);
    }
    class Worker {
        constructor(url) { this.url = url; this.messages = []; workers.push(this); }
        postMessage(message) { this.messages.push(message); }
        terminate() { this.terminated = true; }
        send(data) { this.onmessage({ data }); }
    }
    const context = vm.createContext({
        URL, Worker, demo: false, stream: {}, stickerState: { type: 'cat' },
        updateStickerInteraction() {},
        document: {
            currentScript: { src: 'https://example.test/hong/assets/js/face-tracker.js' + search },
            querySelector: element, addEventListener: (name, callback) => events[name] = callback,
            hidden: false
        },
        window: { Worker, createImageBitmap() {}, addEventListener: (name, callback) => events[name] = callback },
        createImageBitmap: async () => ({ close() { bitmapClosed++; } }),
        performance: { now: () => now },
        setTimeout: (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
        clearTimeout: id => timers.delete(id)
    });
    vm.runInContext(read('assets/js/face-tracker.js'), context);
    return {
        context, element, workers, events, timers,
        state: () => vm.runInContext('faceTracking', context),
        advance: value => now += value,
        closed: () => bitmapClosed,
        source: { videoWidth: 1280, videoHeight: 720, currentTime: 1, readyState: 2, srcObject: {} }
    };
}
const landmarks = {
    33: { x: .3, y: .4 }, 263: { x: .6, y: .45 },
    1: { x: .46, y: .56 }, 10: { x: .44, y: .2 }
};
const geometry = { videoWidth: 1280, videoHeight: 720, width: 800, height: 600, mirror: false };

test('published scripts and face worker use the same release version to avoid stale effects', () => {
    const html = read('index.html');
    const sources = [...html.matchAll(/(?:src|href)="(assets\/(?:js|css)\/[^\"]+)"/g)].map(match => match[1]);
    assert.ok(sources.length > 5);
    assert.ok(sources.every(source => source.includes('?v=20261022-king-1')));
    const f = fixture('?v=20261022-king-1');
    f.events['camera-ready']();
    assert.equal(f.workers[0].url.search, '?v=20261022-king-1');
});

test('pose matches center crop, mirror and face roll for landscape and portrait camera', () => {
    const { context } = fixture();
    for (const videoSize of [[1280, 720], [720, 1280]]) {
        const g = { ...geometry, videoWidth: videoSize[0], videoHeight: videoSize[1] };
        const normal = context.facePoseFromLandmarks(landmarks, g);
        const mirrored = context.facePoseFromLandmarks(landmarks, { ...g, mirror: true });
        assert.ok(Math.abs(normal.x + mirrored.x - 800) < 1e-8);
        assert.ok(Math.abs(normal.y - mirrored.y) < 1e-8);
        assert.ok(Math.abs(normal.angle + mirrored.angle) < 1e-8);
        assert.equal(normal.scaleX, mirrored.scaleX);
        // The drawing's nose (0,48) must land on the actual detected nose.
        const fit = Math.max(800 / g.videoWidth, 600 / g.videoHeight);
        const noseX = landmarks[1].x * g.videoWidth * fit + (800 - g.videoWidth * fit) / 2;
        const noseY = landmarks[1].y * g.videoHeight * fit + (600 - g.videoHeight * fit) / 2;
        assert.ok(Math.abs(normal.x - Math.sin(normal.angle) * 48 * normal.scaleY - noseX) < 1e-8);
        assert.ok(Math.abs(normal.y + Math.cos(normal.angle) * 48 * normal.scaleY - noseY) < 1e-8);
    }
    assert.equal(context.facePoseFromLandmarks({}, geometry), null);
    assert.equal(context.facePoseFromLandmarks({ ...landmarks, 1: { x: NaN, y: .5 } }, geometry), null);
});

test('initializes once, limits in-flight frames, tracks and clears a missing face', async () => {
    const f = fixture(), c = f.context;
    f.events['camera-ready'](); f.events['camera-ready']();
    assert.equal(f.workers.length, 1);
    const worker = f.workers[0];
    assert.equal(worker.url.href, 'https://example.test/hong/assets/js/face-tracker-worker.js');
    worker.send({ type: 'ready' });
    c.updateFaceTracking(f.source, 800, 600, false, false);
    c.updateFaceTracking(f.source, 800, 600, false, false);
    await tick();
    assert.equal(worker.messages.filter(m => m.type === 'frame').length, 1);
    worker.send({ type: 'result', id: f.state().request.id, points: landmarks });
    assert.ok(c.getTrackedStickerPose());
    f.advance(100); f.source.currentTime++;
    c.updateFaceTracking(f.source, 800, 600, false, false); await tick();
    worker.send({ type: 'result', id: f.state().request.id, points: null });
    assert.equal(c.getTrackedStickerPose(), null);
    assert.match(f.element('#face-tracking-status').textContent, /Chưa thấy/);
});

test('eye corners and face outline map consistently when the camera is mirrored', () => {
    const { context } = fixture();
    const points = Object.fromEntries(Array.from({ length: 478 }, (_, i) => [i, { x: .5 + Math.sin(i) * .1, y: .5 + Math.cos(i) * .15 }]));
    Object.assign(points, landmarks, { 133: { x: .39, y: .42 }, 362: { x: .51, y: .43 } });
    const normal = context.facePoseFromLandmarks(points, geometry);
    const mirrored = context.facePoseFromLandmarks(points, { ...geometry, mirror: true });
    assert.equal(normal.outline.length, 36); assert.equal(normal.eyes.length, 2);
    normal.eyes.forEach((eye, i) => {
        assert.ok(Math.abs(eye.x + mirrored.eyes[i].x - 800) < 1e-8);
        assert.ok(Math.abs(eye.width - mirrored.eyes[i].width) < 1e-8);
    });
    normal.outline.forEach((p, i) => assert.ok(Math.abs(p.x + mirrored.outline[i].x - 800) < 1e-8));
});

test('camera/mirror changes reject old coordinates and expired poses are hidden', async () => {
    const f = fixture(), c = f.context;
    f.events['camera-ready'](); const worker = f.workers[0]; worker.send({ type: 'ready' });
    c.updateFaceTracking(f.source, 800, 600, false, false); await tick();
    const oldId = f.state().request.id;
    f.advance(100); f.source.currentTime++;
    c.updateFaceTracking(f.source, 800, 600, true, false);
    worker.send({ type: 'result', id: oldId, points: landmarks });
    assert.equal(c.getTrackedStickerPose(), null);
    c.updateFaceTracking(f.source, 800, 600, true, false); await tick();
    worker.send({ type: 'result', id: f.state().request.id, points: landmarks });
    assert.ok(c.getTrackedStickerPose());
    f.advance(701);
    c.updateFaceTracking(f.source, 800, 600, true, false);
    assert.equal(c.getTrackedStickerPose(), null);
});

test('load errors/timeouts fall back to manual; retry and teardown release resources', () => {
    const f = fixture(), c = f.context;
    f.events['camera-ready'](); const worker = f.workers[0];
    worker.send({ type: 'error' });
    assert.equal(worker.terminated, true);
    assert.equal(c.getTrackedStickerPose().manual, true);
    assert.equal(f.element('#face-tracking-retry').hidden, false);
    f.element('#face-tracking-retry').listeners.click();
    assert.equal(f.workers.length, 2);
    [...f.timers.values()].find(timer => timer.delay === 45000).callback();
    assert.equal(f.state().state, 'failed');
    f.events.pagehide();
    assert.equal(f.state().worker, null);
    f.element('#face-follow').checked = false;
    assert.equal(c.getTrackedStickerPose().manual, true);
    c.demo = true;
    assert.equal(c.getTrackedStickerPose().manual, true);
});

test('bitmap failures never escape into the render loop or stop a newer camera session', async () => {
    const f = fixture(), c = f.context;
    f.events['camera-ready'](); f.workers[0].send({ type: 'ready' });
    c.createImageBitmap = () => { throw new Error('Camera frame not readable'); };
    assert.doesNotThrow(() => c.updateFaceTracking(f.source, 800, 600, false, false));
    await tick();
    assert.equal(f.state().state, 'failed');
    f.element('#face-tracking-retry').listeners.click();
    const worker = f.workers[1]; worker.send({ type: 'ready' });
    let rejectBitmap;
    c.createImageBitmap = () => new Promise((_, reject) => rejectBitmap = reject);
    f.advance(100); f.source.currentTime++;
    c.updateFaceTracking(f.source, 800, 600, false, false); await tick();
    f.events['camera-ready']();
    rejectBitmap(new Error('Old camera stopped')); await tick();
    assert.equal(f.state().state, 'ready');
    assert.equal(worker.terminated, undefined);
    assert.equal(f.state().request, null);
});

test('all character effects use the tracked transform, including forehead anchor, or hide without a face', () => {
    const calls = [], buttons = [], elements = new Map();
    const get = key => {
        if (!elements.has(key)) elements.set(key, { style: {}, addEventListener() {} });
        return elements.get(key);
    };
    let pose = { x: 310, y: 260, scaleX: 1.2, scaleY: 1.1, angle: .2, foreheadX: 300, foreheadY: 100 };
    const c = vm.createContext({ document: { querySelector: get, querySelectorAll: () => buttons }, getTrackedStickerPose: () => pose });
    vm.runInContext(read('assets/js/cute-filters.js'), c);
    vm.runInContext(read('assets/js/face-look.js'), c);
    vm.runInContext(read('assets/js/king-filter.js'), c);
    vm.runInContext(read('assets/js/sticker-filter.js'), c);
    const drawing = new Proxy({ canvas: null, createLinearGradient: () => ({ addColorStop() {} }) }, { get: (object, method) => method in object ? object[method] : (...args) => calls.push([method, ...args]) });
    const types = [...read('index.html').matchAll(/data-sticker="([^"]+)"/g)].map(match => match[1]);
    for (const type of types.filter(type => type !== 'none')) {
        vm.runInContext(`stickerState.type = '${type}'`, c);
        calls.length = 0; c.drawStickerFilter(drawing, 800, 600);
        assert.deepEqual(calls.find(call => call[0] === 'translate'), type === 'roach' ? ['translate', 300, 100] : ['translate', 310, 260]);
        assert.deepEqual(calls.find(call => call[0] === 'rotate'), ['rotate', .2]);
        assert.deepEqual(calls.find(call => call[0] === 'scale'), ['scale', 1.2, 1.1]);
    }
    pose = null; calls.length = 0; c.drawStickerFilter(drawing, 800, 600); assert.equal(calls.length, 0);
    pose = { manual: true }; c.drawStickerFilter(drawing, 800, 600);
    assert.ok(calls.some(call => call[0] === 'translate' && call[1] === 400));
});

test('worker closes transferred bitmaps and sends only the positioning landmarks', async () => {
    const messages = []; let closed = 0, options;
    const sandbox = { URL, location: { href: 'https://example.test/assets/js/face-tracker-worker.js' }, postMessage: m => messages.push(m) };
    sandbox.self = sandbox;
    const workerContext = vm.createContext(sandbox);
    sandbox.importScripts = () => {
        sandbox.exports = {
            FilesetResolver: { forVisionTasks: async url => ({ url }) },
            FaceLandmarker: { createFromOptions: async (_, value) => {
                options = value;
                return { detectForVideo: () => ({
                    faceLandmarks: [Array.from({ length: 478 }, () => ({ x: .4, y: .5, z: .1 }))],
                    faceBlendshapes: [{ categories: [{ categoryName: 'mouthSmileLeft', score: .7 }, { categoryName: 'mouthSmileRight', score: .9 }] }]
                }) };
            } }
        };
    };
    vm.runInContext(read('assets/js/face-tracker-worker.js'), workerContext);
    await sandbox.onmessage({ data: { type: 'init' } });
    assert.equal(messages[0].type, 'ready');
    assert.equal(options.runningMode, 'VIDEO'); assert.equal(options.numFaces, 1);
    assert.equal(options.outputFaceBlendshapes, true);
    await sandbox.onmessage({ data: { type: 'frame', id: 7, timestamp: 100, bitmap: { close() { closed++; } } } });
    assert.equal(closed, 1); assert.equal(messages[1].id, 7);
    for (const index of [1, 10, 33, 133, 362, 263, 152, 234, 454]) assert.ok(messages[1].points[index]);
    assert.equal(messages[1].points[1].z, undefined);
    assert.equal(messages[1].smile, .8);
});

test('bundled runtime exposes required APIs, WASM is valid and model is present', async () => {
    const sandbox = { exports: {} }; sandbox.self = sandbox;
    vm.runInNewContext(read('assets/vendor/mediapipe/vision_bundle.js'), sandbox);
    assert.equal(typeof sandbox.exports.FaceLandmarker.createFromOptions, 'function');
    assert.equal(typeof sandbox.exports.FilesetResolver.forVisionTasks, 'function');
    for (const filename of ['vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.wasm']) {
        const binary = fs.readFileSync(path.join(root, 'assets/vendor/mediapipe/wasm', filename));
        assert.ok(await WebAssembly.compile(binary));
    }
    const model = fs.readFileSync(path.join(root, 'assets/models/face_landmarker.task'));
    assert.ok(model.length > 3000000);
    assert.ok(model.includes(Buffer.from('face_landmarks_detector.tflite')));
});
