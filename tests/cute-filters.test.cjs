const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');

function drawing() {
    const calls = [];
    return new Proxy({ calls, createLinearGradient: () => ({ addColorStop() {} }) }, { get: (object, name) => name in object ? object[name] : (...args) => calls.push([name, ...args]) });
}
class Element {
    constructor() { this.listeners = {}; this.style = {}; this.attrs = {}; this.dataset = {}; this.hidden = false; this.context = drawing(); }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    setAttribute(name, value) { this.attrs[name] = value; }
    querySelector() { return { replaceChildren: child => this.thumbnail = child }; }
    getContext() { return this.context; }
}
function fixture() {
    const elements = new Map(), element = key => {
        if (!elements.has(key)) elements.set(key, new Element());
        return elements.get(key);
    };
    const buttons = [...html.matchAll(/<button[^>]*data-sticker="([^"]+)"([^>]*)><span[^>]*>[^<]*<\/span>([^<]+)<\/button>/g)].map(match => {
        const button = new Element(); button.dataset.sticker = match[1];
        button.dataset.stickerGroup = match[2].match(/data-sticker-group="([^"]+)"/)?.[1];
        button.dataset.reference = match[2].match(/data-reference="([^"]+)"/)?.[1];
        button.textContent = match[3]; return button;
    });
    const categories = [...html.matchAll(/data-sticker-category="([^"]+)"/g)].map(match => {
        const button = new Element(); button.dataset.stickerCategory = match[1]; return button;
    });
    let pose = { x: 400, y: 250, scaleX: 1, scaleY: 1, angle: 0, smile: .8 };
    const context = vm.createContext({
        document: { querySelector: element, querySelectorAll: selector => selector === '[data-sticker]' ? buttons : categories, createElement: () => new Element() },
        getTrackedStickerPose: () => pose, busy: false, demo: true, stream: null
    });
    vm.runInContext(read('assets/js/cute-filters.js'), context);
    vm.runInContext(read('assets/js/face-look.js'), context);
    vm.runInContext(read('assets/js/sticker-filter.js'), context);
    return { context, buttons, categories, element, setPose: value => pose = value };
}

test('all 14 approved styles and the new TikTok reference are available alongside the original 11', () => {
    const f = fixture();
    assert.equal(f.buttons.length, 27); // Includes "Không dùng" and the new TikTok reference.
    assert.equal(new Set(f.buttons.map(button => button.dataset.sticker)).size, 27);
    assert.deepEqual(f.buttons.filter(button => button.dataset.reference).map(button => Number(button.dataset.reference)).sort((a, b) => a - b), Array.from({ length: 14 }, (_, i) => i + 1));
    assert.equal(f.buttons.filter(button => button.thumbnail).length, 26);
    for (const button of f.buttons.filter(button => button.thumbnail)) {
        assert.ok(button.thumbnail.context.calls.some(call => call[0] === 'fill'));
    }
});

test('category switching preserves selection and always keeps the off option accessible', () => {
    const f = fixture(), panda = f.buttons.find(button => button.dataset.sticker === 'panda');
    panda.listeners.click();
    f.categories.find(button => button.dataset.stickerCategory === 'cute').listeners.click();
    assert.equal(panda.hidden, true);
    assert.equal(panda.attrs['aria-pressed'], 'true');
    assert.equal(f.element('#sticker-current').textContent, 'Gấu trúc');
    assert.equal(f.buttons.find(button => button.dataset.sticker === 'none').hidden, false);
    f.categories.find(button => button.dataset.stickerCategory === 'masks').listeners.click();
    assert.equal(panda.hidden, false);
    assert.equal(f.buttons.filter(button => !button.hidden).length, 6);
    f.categories.find(button => button.dataset.stickerCategory === 'all').listeners.click();
    assert.ok(f.buttons.every(button => !button.hidden));
});

test('each selected effect draws into the camera context and hides when face tracking is lost', () => {
    const f = fixture();
    for (const button of f.buttons.filter(button => button.dataset.sticker !== 'none')) {
        button.listeners.click(); const c = drawing();
        f.context.drawStickerFilter(c, 800, 600);
        assert.ok(c.calls.some(call => call[0] === 'fill' || call[0] === 'stroke'), button.dataset.sticker);
        assert.equal(c.calls.filter(call => call[0] === 'save').length, c.calls.filter(call => call[0] === 'restore').length);
        for (const call of c.calls.filter(call => call[0] === 'ellipse')) {
            assert.notEqual(call[6], call[7], 'Ellipse must have a nonzero arc: ' + button.dataset.sticker);
        }
    }
    f.setPose(null); const c = drawing(); f.context.drawStickerFilter(c, 800, 600); assert.equal(c.calls.length, 0);
    f.context.busy = true;
    f.buttons.find(button => button.dataset.sticker === 'none').listeners.click();
    assert.notEqual(vm.runInContext('stickerState.type', f.context), 'none');
});

test('expressive ears respond to smile values and do not alter other filters', () => {
    const f = fixture(), neutral = drawing(), smiling = drawing();
    f.context.drawCuteSticker(neutral, 'expressive-ears', 0);
    f.context.drawCuteSticker(smiling, 'expressive-ears', 1);
    assert.notDeepEqual(neutral.calls.filter(call => call[0] === 'rotate'), smiling.calls.filter(call => call[0] === 'rotate'));
    const a = drawing(), b = drawing();
    f.context.drawCuteSticker(a, 'clouds', 0); f.context.drawCuteSticker(b, 'clouds', 1);
    assert.deepEqual(a.calls, b.calls);
});
