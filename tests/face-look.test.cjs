const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/face-look.js'), 'utf8');

function fixture() {
    const canvases = [];
    function canvas() {
        const item = { width: 0, height: 0 };
        const calls = [], stack = [];
        const context = {
            canvas: item, calls, globalCompositeOperation: 'source-over',
            save() { calls.push(['save']); stack.push(this.globalCompositeOperation); },
            restore() { calls.push(['restore']); this.globalCompositeOperation = stack.pop(); },
            createRadialGradient() { return { addColorStop() {} }; }
        };
        for (const method of ['clearRect', 'drawImage', 'translate', 'scale', 'rotate', 'fillRect']) {
            context[method] = (...args) => calls.push([method, ...args]);
        }
        item.getContext = () => context; return item;
    }
    const context = vm.createContext({ document: { createElement: () => { const item = canvas(); canvases.push(item); return item; } } });
    vm.runInContext(source, context);
    const target = canvas(); target.width = 800; target.height = 600;
    return { context, canvases, target: target.getContext('2d') };
}

test('eye enlargement skips unavailable landmarks and does not allocate buffers', () => {
    const f = fixture();
    f.context.applyCuteRoachFaceLook(f.target, {}, 800, 600);
    assert.equal(f.canvases.length, 0); assert.equal(f.target.calls.length, 0);
});

test('both enlarged eyes use an unmodified frame, feathered edges and reusable buffers', () => {
    const f = fixture();
    const pose = { angle: .3, eyes: [{ x: 320, y: 220, width: 45 }, { x: 475, y: 225, width: 43 }] };
    f.context.applyCuteRoachFaceLook(f.target, pose, 800, 600);
    assert.equal(f.canvases.length, 2);
    const [original, patch] = f.canvases.map(item => item.getContext('2d'));
    assert.equal(original.calls.filter(call => call[0] === 'drawImage').length, 1);
    assert.equal(patch.calls.filter(call => call[0] === 'drawImage').length, 2);
    assert.ok(patch.calls.filter(call => call[0] === 'drawImage').every(call => call[1] === f.canvases[0]));
    assert.equal(f.target.calls.filter(call => call[0] === 'drawImage').length, 2);
    assert.equal(patch.globalCompositeOperation, 'source-over');
    assert.ok(patch.calls.some(call => call[0] === 'scale' && call[1] === 1.22 && call[2] === 1.3));
    f.context.applyCuteRoachFaceLook(f.target, pose, 800, 600);
    assert.equal(f.canvases.length, 2);
    for (const c of [original, patch, f.target]) assert.equal(c.calls.filter(call => call[0] === 'save').length, c.calls.filter(call => call[0] === 'restore').length);
});

test('invalid eye coordinates do not reach image transforms', () => {
    const f = fixture();
    f.context.applyCuteRoachFaceLook(f.target, { angle: 0, eyes: [{ x: NaN, y: 20, width: 40 }, { x: 30, y: 20, width: 1 }] }, 800, 600);
    assert.equal(f.target.calls.length, 0);
});
