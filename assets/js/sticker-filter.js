// Draw directly onto the camera canvas so captures and exports keep the filter.
const stickerState = { type: 'none', x: .5, y: .43, scale: 1 };
const stickerCanvas = document.querySelector('#preview');
const stickerButtons = document.querySelectorAll('[data-sticker]');
const stickerSize = document.querySelector('#sticker-size');
let stickerPointer = null;
function updateStickerInteraction() {
    const manual = getTrackedStickerPose()?.manual;
    const draggable = stickerState.type !== 'none' && manual;
    stickerCanvas.style.touchAction = draggable ? 'none' : 'auto';
    stickerCanvas.style.cursor = draggable ? 'move' : '';
}

stickerButtons.forEach(button => button.addEventListener('click', () => {
    if (busy) return;
    stickerState.type = button.dataset.sticker;
    stickerState.x = .5;
    stickerState.y = stickerState.type === 'roach' ? .25 : .43;
    stickerButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#sticker-current').textContent = button.textContent.trim();
    document.querySelector('#sticker-adjustments').hidden = stickerState.type === 'none';
    stickerCanvas.style.touchAction = stickerState.type === 'none' ? 'auto' : 'none';
    stickerCanvas.style.cursor = stickerState.type === 'none' ? '' : 'move';
    updateStickerInteraction();
}));
stickerSize.addEventListener('input', () => {
    if (busy) return;
    stickerState.scale = Number(stickerSize.value) / 100;
    document.querySelector('#sticker-size-value').textContent = stickerSize.value + '%';
});

function moveSticker(event) {
    const bounds = stickerCanvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    stickerState.x = Math.max(.05, Math.min(.95, (event.clientX - bounds.left) / bounds.width));
    stickerState.y = Math.max(.05, Math.min(.95, (event.clientY - bounds.top) / bounds.height));
}
stickerCanvas.addEventListener('pointerdown', event => {
    if (busy || !getTrackedStickerPose()?.manual || stickerState.type === 'none' || (!demo && !stream) ||
        stickerPointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    stickerPointer = event.pointerId;
    stickerCanvas.setPointerCapture(event.pointerId);
    moveSticker(event);
});
stickerCanvas.addEventListener('pointermove', event => {
    if (!busy && getTrackedStickerPose()?.manual && event.pointerId === stickerPointer) moveSticker(event);
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    stickerCanvas.addEventListener(name, event => {
        if (event.pointerId === stickerPointer) stickerPointer = null;
    });
}

function drawStickerFilter(context, width, height) {
    if (stickerState.type === 'none') return;
    const pose = getTrackedStickerPose();
    if (!pose) return;
    if (stickerState.type === 'cute-roach' && !pose.manual) applyCuteRoachFaceLook(context, pose, width, height);
    context.save();
    context.filter = 'none';
    if (pose.manual) {
        context.translate(stickerState.x * width, stickerState.y * height);
        context.scale(width / 800 * stickerState.scale, width / 800 * stickerState.scale);
    } else {
        context.translate(stickerState.type === 'roach' ? pose.foreheadX : pose.x, stickerState.type === 'roach' ? pose.foreheadY : pose.y);
        context.rotate(pose.angle);
        context.scale(pose.scaleX * stickerState.scale, pose.scaleY * stickerState.scale);
    }
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 5;
    const outline = !pose.manual && pose.outline?.length ? pose.outline.map(point => {
        const dx = point.x - pose.x, dy = point.y - pose.y;
        return {
            x: (dx * Math.cos(pose.angle) + dy * Math.sin(pose.angle)) / (pose.scaleX * stickerState.scale),
            y: (-dx * Math.sin(pose.angle) + dy * Math.cos(pose.angle)) / (pose.scaleY * stickerState.scale)
        };
    }) : [];
    drawCharacterSticker(context, stickerState.type, pose.smile || 0, { outline });
    context.restore();
    if (stickerState.type === 'cute-roach') drawCuteRoachMascot(context, width, height);
}

function drawCharacterSticker(context, type, smile = 0, options = {}) {
    if (cuteFilterTypes.has(type)) drawCuteSticker(context, type, smile, options);
    else if (type === 'roach') drawRoachSticker(context);
    else if (['cat', 'bunny'].includes(type)) drawAnimalSticker(context, type);
    else drawSocialSticker(context, type);
}

function drawAnimalSticker(c, type) {
    const bunny = type === 'bunny';
    c.strokeStyle = bunny ? '#b58a9a' : '#725052';
    for (const direction of [-1, 1]) {
        c.save();
        c.translate(direction * 106, -108);
        c.rotate(direction * .2);
        c.fillStyle = bunny ? '#fff8f3' : '#ffd8bd';
        c.beginPath();
        if (bunny) c.ellipse(0, -45, 31, 88, 0, 0, Math.PI * 2);
        else { c.moveTo(-48, 28); c.quadraticCurveTo(-45, -28, 0, -77); c.quadraticCurveTo(42, -29, 47, 28); c.closePath(); }
        c.fill(); c.stroke();
        c.fillStyle = '#f0a5b7';
        c.beginPath();
        if (bunny) c.ellipse(0, -45, 14, 62, 0, 0, Math.PI * 2);
        else { c.moveTo(-25, 10); c.lineTo(0, -47); c.lineTo(25, 10); c.closePath(); }
        c.fill();
        c.restore();
        c.fillStyle = '#ef9bb17a';
        c.beginPath(); c.ellipse(direction * 100, 60, 30, 16, 0, 0, Math.PI * 2); c.fill();
        if (!bunny) {
            c.strokeStyle = '#725052'; c.lineWidth = 4;
            for (const offset of [-14, 7, 28]) {
                c.beginPath(); c.moveTo(direction * 61, 47 + offset / 2); c.lineTo(direction * 145, 47 + offset); c.stroke();
            }
        }
    }
    c.fillStyle = '#d77e95';
    c.beginPath(); c.moveTo(-13, 42); c.quadraticCurveTo(0, 35, 13, 42); c.quadraticCurveTo(8, 53, 0, 57); c.quadraticCurveTo(-8, 53, -13, 42); c.fill();
    c.strokeStyle = '#9b6272'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, 57); c.lineTo(0, 65); c.quadraticCurveTo(-11, 77, -20, 65); c.moveTo(0, 65); c.quadraticCurveTo(11, 77, 20, 65); c.stroke();
}

function drawRoachSticker(c) {
    c.strokeStyle = '#55382c'; c.lineWidth = 4;
    for (const side of [-1, 1]) {
        for (const y of [-24, 0, 24]) {
            c.beginPath(); c.moveTo(side * 20, y); c.lineTo(side * 43, y + 9); c.lineTo(side * 61, y + 29); c.stroke();
        }
        c.beginPath(); c.moveTo(side * 10, -47); c.quadraticCurveTo(side * 20, -85, side * 56, -93); c.stroke();
    }
    c.fillStyle = '#81533a';
    c.beginPath(); c.ellipse(0, 2, 27, 51, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#b78054';
    for (const side of [-1, 1]) {
        c.beginPath(); c.ellipse(side * 11, 8, 10, 36, side * -.13, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#4e342b'; c.beginPath(); c.ellipse(0, -42, 19, 16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff6de';
    for (const side of [-1, 1]) { c.beginPath(); c.arc(side * 8, -46, 3, 0, Math.PI * 2); c.fill(); }
}

// Original canvas artwork inspired by common social-camera effect categories.
// Reference links are recorded in FILTER-SOURCES.md; no platform assets are used.
function drawSocialSticker(c, type) {
    const blush = () => {
        c.fillStyle = '#ed94ab66';
        for (const side of [-1, 1]) {
            c.beginPath(); c.ellipse(side * 96, 54, 37, 20, 0, 0, Math.PI * 2); c.fill();
        }
    };
    if (type === 'puppy' || type === 'bear') {
        const bear = type === 'bear';
        c.strokeStyle = '#725045'; c.fillStyle = bear ? '#c68c61' : '#b67b54';
        for (const side of [-1, 1]) {
            c.save(); c.translate(side * 112, -100); c.rotate(-side * .25);
            c.beginPath(); c.ellipse(0, bear ? -10 : 28, bear ? 43 : 36, bear ? 43 : 82, 0, 0, Math.PI * 2); c.fill(); c.stroke();
            c.fillStyle = bear ? '#edbc9b' : '#e8b296';
            c.beginPath(); c.ellipse(0, bear ? -10 : 28, 22, bear ? 24 : 53, 0, 0, Math.PI * 2); c.fill(); c.restore();
        }
        blush(); c.fillStyle = '#f4d5b5';
        c.beginPath(); c.ellipse(0, 63, 43, 31, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#553b36'; c.beginPath(); c.ellipse(0, 48, 18, 12, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#725045'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, 59); c.lineTo(0, 72); c.moveTo(-18, 73); c.quadraticCurveTo(0, 89, 18, 73); c.stroke();
        if (!bear) { c.fillStyle = '#eb96a7'; c.beginPath(); c.ellipse(8, 90, 12, 17, -.1, 0, Math.PI * 2); c.fill(); }
    } else if (type === 'hearts') {
        blush();
        for (const side of [-1, 1]) for (const [x, y, size] of [[83, 40, 17], [119, 61, 11], [62, 66, 9]]) {
            stickerHeart(c, side * x, y, size, '#df7399');
        }
    } else if (type === 'freckles') {
        blush(); c.fillStyle = '#a46c49b8';
        for (const side of [-1, 1]) for (let i = 0; i < 16; i++) {
            const x = side * (30 + (i * 29) % 94), y = 27 + (i * 17) % 34;
            c.beginPath(); c.arc(x, y, 1.8 + i % 3 * .5, 0, Math.PI * 2); c.fill();
        }
    } else if (type === 'butterflies') {
        blush();
        for (const [x, y, angle, scale] of [[-113, -70, -.4, 1], [106, -103, .4, 1.2], [-90, 52, -.2, .55], [110, 57, .25, .55]]) {
            c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale);
            for (const side of [-1, 1]) {
                c.fillStyle = '#c7a1ed'; c.strokeStyle = '#8b67b5'; c.lineWidth = 2;
                c.beginPath(); c.ellipse(side * 15, -10, 17, 23, side * .5, 0, Math.PI * 2); c.fill(); c.stroke();
                c.fillStyle = '#e8bce5'; c.beginPath(); c.ellipse(side * 11, 15, 12, 15, -side * .5, 0, Math.PI * 2); c.fill();
            }
            c.strokeStyle = '#73588f'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -20); c.lineTo(0, 25); c.stroke(); c.restore();
        }
    } else if (type === 'flowers') {
        c.strokeStyle = '#7d9b68'; c.lineWidth = 9;
        c.beginPath(); c.moveTo(-150, -82); c.quadraticCurveTo(0, -165, 150, -82); c.stroke();
        for (let i = 0; i < 7; i++) {
            const x = (i - 3) * 45, y = -128 + Math.pow((i - 3) / 3, 2) * 40;
            c.save(); c.translate(x, y); c.rotate(i * .4);
            for (let petal = 0; petal < 6; petal++) {
                c.rotate(Math.PI / 3); c.fillStyle = i % 2 ? '#fff8e9' : '#f1b1c8';
                c.beginPath(); c.ellipse(0, -17, 12, 21, 0, 0, Math.PI * 2); c.fill();
            }
            c.fillStyle = '#e7bb59'; c.beginPath(); c.arc(0, 0, 10, 0, Math.PI * 2); c.fill(); c.restore();
        }
    } else if (type === 'glasses') {
        c.strokeStyle = '#543a50'; c.lineWidth = 7;
        c.beginPath(); c.moveTo(-145, -28); c.lineTo(-113, -18); c.moveTo(113, -18); c.lineTo(145, -28); c.moveTo(-25, -20); c.quadraticCurveTo(0, -35, 25, -20); c.stroke();
        for (const side of [-1, 1]) {
            c.fillStyle = '#45364be8'; c.beginPath(); c.ellipse(side * 70, -16, 46, 34, side * -.1, 0, Math.PI * 2); c.fill(); c.stroke();
            c.strokeStyle = '#fce4ef99'; c.lineWidth = 3; c.beginPath(); c.moveTo(side * 85 - 9, -32); c.lineTo(side * 85 + 9, -12); c.stroke();
            c.strokeStyle = '#543a50'; c.lineWidth = 7;
        }
    } else if (type === 'sparkles') {
        blush();
        for (const [x, y, size] of [[-142, -104, 26], [131, -65, 30], [-109, 75, 18], [99, 85, 22], [-31, -150, 17], [59, -133, 12]]) {
            c.fillStyle = '#ffe5a0'; c.strokeStyle = '#fffaf0'; c.lineWidth = 2;
            c.beginPath(); c.moveTo(x, y - size); c.quadraticCurveTo(x + 3, y - 3, x + size * .65, y);
            c.quadraticCurveTo(x + 3, y + 3, x, y + size); c.quadraticCurveTo(x - 3, y + 3, x - size * .65, y);
            c.quadraticCurveTo(x - 3, y - 3, x, y - size); c.fill(); c.stroke();
        }
    }
}

function stickerHeart(c, x, y, size, color) {
    c.save(); c.translate(x, y); c.scale(size / 20, size / 20); c.fillStyle = color;
    c.beginPath(); c.moveTo(0, 16); c.bezierCurveTo(-32, -3, -17, -28, 0, -11);
    c.bezierCurveTo(17, -28, 32, -3, 0, 16); c.fill(); c.restore();
}

const stickerCategories = document.querySelectorAll('[data-sticker-category]');
stickerCategories.forEach(category => category.addEventListener('click', () => {
    stickerCategories.forEach(item => item.setAttribute('aria-pressed', String(item === category)));
    const group = category.dataset.stickerCategory;
    stickerButtons.forEach(button => {
        button.hidden = group !== 'all' && button.dataset.sticker !== 'none' && button.dataset.stickerGroup !== group;
    });
}));

// Preview the same original artwork that will be drawn on the live camera.
stickerButtons.forEach(button => {
    if (button.dataset.sticker === 'none') return;
    const thumbnail = document.createElement('canvas');
    thumbnail.width = thumbnail.height = 180;
    thumbnail.setAttribute('aria-hidden', 'true');
    const c = thumbnail.getContext('2d');
    c.fillStyle = '#f4e6e5'; c.fillRect(0, 0, 180, 180);
    c.translate(90, 94); c.scale(.28, .28);
    cuteEllipse(c, 0, 330, 180, 190, '#c4a5ad');
    cuteEllipse(c, 0, 16, 121, 146, '#f6dece');
    c.strokeStyle = '#805c60'; c.lineWidth = 8; c.lineCap = 'round';
    for (const side of [-1, 1]) cuteEllipse(c, side * 58, -16, 6, 8, '#805c60');
    c.beginPath(); c.arc(0, 64, 22, 0, Math.PI); c.stroke();
    c.lineWidth = 5; c.lineJoin = 'round';
    drawCharacterSticker(c, button.dataset.sticker, .8);
    button.querySelector('span').replaceChildren(thumbnail);
});
