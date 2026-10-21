// Original vector artwork for approved references, including TikTok effect 4569305016.
// Coordinates share the face tracker: eye line y=-16, nose y=48.
const cuteFilterTypes = new Set([
    'bunny-hat', 'expressive-ears', 'flower-veil', 'soft-freckles',
    'bunny-cheeks', 'pink-butterflies', 'panda', 'frog-hat',
    'strawberry', 'gummy-bears', 'hair-clips', 'star-blush', 'clouds', 'avocado', 'cute-roach'
]);

function cuteEllipse(c, x, y, rx, ry, color) {
    c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
}
function cuteBlush(c, opacity = '66') {
    for (const side of [-1, 1]) cuteEllipse(c, side * 96, 57, 34, 17, '#ef9fb9' + opacity);
}
function cuteFlower(c, x, y, size, color = '#fff9ec') {
    c.save(); c.translate(x, y); c.scale(size / 24, size / 24);
    for (let i = 0; i < 6; i++) {
        c.rotate(Math.PI / 3); cuteEllipse(c, 0, -13, 8, 14, color);
    }
    cuteEllipse(c, 0, 0, 8, 8, '#edc46b'); c.restore();
}
function cuteStar(c, x, y, size, color) {
    c.save(); c.translate(x, y); c.fillStyle = color; c.beginPath();
    for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? size * .45 : size;
        if (i === 0) c.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
        else c.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
    }
    c.closePath(); c.fill(); c.restore();
}
function cuteBerry(c, x, y, size) {
    c.save(); c.translate(x, y); c.scale(size / 28, size / 28);
    c.fillStyle = '#e87991'; c.beginPath(); c.moveTo(0, -15);
    c.bezierCurveTo(34, -32, 30, 6, 0, 30); c.bezierCurveTo(-30, 6, -34, -32, 0, -15); c.fill();
    c.fillStyle = '#85a673'; c.beginPath(); c.moveTo(0, -8); c.lineTo(-20, -22); c.lineTo(-5, -22);
    c.lineTo(0, -34); c.lineTo(8, -22); c.lineTo(23, -22); c.closePath(); c.fill();
    for (const [a, b] of [[-10, -4], [10, -4], [0, 6], [-6, 13], [7, 14]]) cuteEllipse(c, a, b, 1.5, 3, '#fff1ca');
    c.restore();
}
function cuteHood(c, color, edge, avocado = false) {
    c.fillStyle = color; c.strokeStyle = edge; c.lineWidth = 5;
    c.beginPath(); c.ellipse(0, -5, 168, avocado ? 218 : 183, 0, 0, Math.PI * 2);
    c.moveTo(130, 17); c.ellipse(0, 17, 130, 147, 0, 0, Math.PI * 2); c.fill('evenodd');
    c.beginPath(); c.ellipse(0, -5, 168, avocado ? 218 : 183, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(0, 17, 130, 147, 0, 0, Math.PI * 2); c.stroke();
}
function cuteButterfly(c, x, y, scale, angle) {
    c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale);
    for (const side of [-1, 1]) {
        c.fillStyle = '#efb4d0'; c.strokeStyle = '#c178a1'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(side * 15, -10, 18, 25, side * .45, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = '#f8d6e5'; c.beginPath(); c.ellipse(side * 12, 16, 12, 16, -side * .4, 0, Math.PI * 2); c.fill();
        cuteEllipse(c, side * 18, -14, 4, 5, '#fff5ed');
    }
    c.strokeStyle = '#a35f87'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -21); c.lineTo(0, 28); c.stroke(); c.restore();
}
function cuteBunny(c, x, y, size) {
    c.save(); c.translate(x, y); c.scale(size / 25, size / 25);
    for (const side of [-1, 1]) {
        cuteEllipse(c, side * 9, -20, 7, 20, '#fffaf1');
        cuteEllipse(c, side * 9, -21, 3, 12, '#efb8cf');
    }
    cuteEllipse(c, 0, 4, 23, 21, '#fffaf1');
    for (const side of [-1, 1]) {
        cuteEllipse(c, side * 7, 0, 2, 3, '#765461'); cuteEllipse(c, side * 14, 9, 5, 3, '#f0abc2');
    }
    cuteEllipse(c, 0, 7, 3, 2, '#cf829e'); c.restore();
}
function cuteGummy(c, x, y, size, color) {
    c.save(); c.translate(x, y); c.scale(size / 28, size / 28);
    for (const side of [-1, 1]) {
        cuteEllipse(c, side * 12, -24, 10, 10, color);
        cuteEllipse(c, side * 18, 5, 9, 14, color);
        cuteEllipse(c, side * 11, 26, 10, 12, color);
    }
    cuteEllipse(c, 0, 8, 19, 26, color); cuteEllipse(c, 0, -14, 22, 20, color);
    cuteEllipse(c, -8, -20, 4, 6, '#ffffff88');
    for (const side of [-1, 1]) cuteEllipse(c, side * 7, -16, 2, 2, '#835168');
    cuteEllipse(c, 0, -8, 4, 3, '#a56379'); c.restore();
}
function drawCuteSticker(c, type, smile = 0, options = {}) {
    if (type === 'cute-roach') {
        drawCuteRoachSticker(c, options);
    } else if (type === 'bunny-hat') {
        for (const side of [-1, 1]) {
            c.save(); c.translate(side * 97, -170); c.rotate(side * .14);
            cuteEllipse(c, 0, -50, 33, 94, '#fff9ef'); cuteEllipse(c, 0, -53, 15, 65, '#efbed2'); c.restore();
            cuteEllipse(c, side * 147, 98, 25, 75, '#fff9ef');
            cuteEllipse(c, side * 146, 160, 31, 22, '#f4c7d7');
        }
        cuteHood(c, '#fff9ef', '#e7c6cb'); cuteBlush(c);
        for (const side of [-1, 1]) stickerHeart(c, side * 98, 58, 10, '#df8cab');
    } else if (type === 'expressive-ears') {
        const happiness = Math.max(0, Math.min(1, smile));
        for (const side of [-1, 1]) {
            c.save(); c.translate(side * 103, -106); c.rotate(side * (.65 - happiness * .62));
            c.fillStyle = '#f4c7d9'; c.strokeStyle = '#c78eac'; c.lineWidth = 4;
            c.beginPath(); c.moveTo(-40, 21); c.quadraticCurveTo(-47, -49, 0, -109); c.quadraticCurveTo(48, -46, 40, 21); c.closePath(); c.fill(); c.stroke();
            cuteEllipse(c, 0, -30, 17, 42, '#fff1ec'); c.restore();
        }
        cuteBlush(c); stickerHeart(c, 0, 46, 9, '#db8aa7');
    } else if (type === 'flower-veil') {
        c.fillStyle = '#f3c5ddc9'; c.strokeStyle = '#c98baa'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(-128, 52); c.quadraticCurveTo(0, 81, 128, 52);
        c.quadraticCurveTo(136, 139, 0, 181); c.quadraticCurveTo(-136, 139, -128, 52); c.fill(); c.stroke();
        for (let i = 0; i < 9; i++) {
            const x = -112 + i * 28, y = 63 + 15 * (1 - Math.abs(x) / 112);
            cuteEllipse(c, x, y, 4, 4, '#fff9e5');
        }
        for (const [x, y, s] of [[-94, 103, 14], [-43, 139, 12], [15, 112, 16], [72, 105, 12]]) cuteFlower(c, x, y, s, '#fff0f6');
        for (const side of [-1, 1]) {
            cuteFlower(c, side * 137, 34, 22, '#efb2cc');
            c.strokeStyle = '#d3b368'; c.beginPath(); c.moveTo(side * 137, 54); c.lineTo(side * 142, 130); c.stroke();
            cuteEllipse(c, side * 142, 140, 7, 12, '#e9cc85');
        }
    } else if (type === 'soft-freckles') {
        cuteBlush(c, '44');
        for (const side of [-1, 1]) for (let i = 0; i < 20; i++) {
            cuteEllipse(c, side * (23 + i * 37 % 96), 28 + i * 19 % 36, 1.2 + (i % 3) * .35, 1.3, '#ad795980');
        }
        for (const side of [-1, 1]) cuteStar(c, side * 120, 28, 5, '#fff6dd');
    } else if (type === 'bunny-cheeks') {
        drawCuteSticker(c, 'soft-freckles');
        for (const side of [-1, 1]) cuteBunny(c, side * 93, 53, 21);
    } else if (type === 'pink-butterflies') {
        cuteBlush(c);
        for (const [x, y, scale, angle] of [[-130, -75, 1, -.4], [118, -106, 1.15, .4], [0, 37, .45, -.2], [90, 65, .55, .3]]) cuteButterfly(c, x, y, scale, angle);
    } else if (type === 'panda') {
        for (const side of [-1, 1]) cuteEllipse(c, side * 105, -137, 43, 44, '#51434d');
        c.fillStyle = '#fff9efed'; c.beginPath(); c.ellipse(0, 15, 146, 169, 0, 0, Math.PI * 2);
        for (const side of [-1, 1]) { c.moveTo(side * 70 + 27, -16); c.ellipse(side * 70, -16, 27, 18, 0, 0, Math.PI * 2); }
        c.moveTo(32, 96); c.ellipse(0, 96, 32, 19, 0, 0, Math.PI * 2); c.fill('evenodd');
        for (const side of [-1, 1]) {
            c.save(); c.translate(side * 70, -16); c.rotate(side * .22);
            c.fillStyle = '#51434de6'; c.beginPath(); c.ellipse(0, 0, 46, 37, 0, 0, Math.PI * 2); c.moveTo(27, 0); c.ellipse(0, 0, 27, 18, 0, 0, Math.PI * 2); c.fill('evenodd'); c.restore();
        }
        cuteBlush(c); cuteEllipse(c, 0, 48, 19, 13, '#51434d');
    } else if (type === 'frog-hat') {
        for (const side of [-1, 1]) {
            cuteEllipse(c, side * 94, -162, 49, 48, '#a9c689'); cuteEllipse(c, side * 94, -173, 13, 16, '#4c634e');
            cuteEllipse(c, side * 98 - 4, -178, 4, 5, '#fffcef');
        }
        cuteHood(c, '#b5d196', '#8aa970'); cuteBlush(c); cuteBerry(c, 0, -205, 34);
        for (const side of [-1, 1]) cuteEllipse(c, side * 141, -70, 19, 11, '#edacc0');
    } else if (type === 'strawberry') {
        cuteBlush(c);
        for (const [x, y, s] of [[-120, -92, 24], [95, -128, 29], [-92, 55, 15], [100, 55, 15]]) cuteBerry(c, x, y, s);
        for (const [x, y] of [[-54, -138], [144, -30], [-145, -10]]) cuteFlower(c, x, y, 15);
    } else if (type === 'gummy-bears') {
        cuteBlush(c);
        const colors = ['#eda9bd', '#e5bb79', '#b7cfa7', '#cbb2dd', '#ebada6'];
        [[-130, -83], [-49, -145], [73, -138], [141, -46], [-91, 62], [94, 60]].forEach(([x, y], i) => cuteGummy(c, x, y, i < 4 ? 23 : 15, colors[i % colors.length]));
    } else if (type === 'hair-clips') {
        drawCuteSticker(c, 'soft-freckles');
        for (const side of [-1, 1]) {
            c.save(); c.translate(side * 105, -106); c.rotate(side * -.28);
            c.strokeStyle = side < 0 ? '#d49ab7' : '#a0b3d2'; c.lineWidth = 15;
            c.beginPath(); c.moveTo(-28, 0); c.lineTo(28, 0); c.stroke();
            c.strokeStyle = '#fff2eb'; c.lineWidth = 4; c.beginPath(); c.moveTo(-21, 0); c.lineTo(21, 0); c.stroke();
            cuteFlower(c, 0, -1, 13, side < 0 ? '#f1b9d0' : '#d6e3ed'); c.restore();
        }
    } else if (type === 'star-blush') {
        cuteBlush(c);
        for (const side of [-1, 1]) {
            cuteStar(c, side * 92, 47, 18, '#745368'); cuteStar(c, side * 120, 68, 9, '#e7a6c0');
            cuteEllipse(c, side * 64, 64, 2, 2, '#cf9bb2');
        }
    } else if (type === 'clouds') {
        cuteBlush(c, '33');
        for (const [x, y, s] of [[-99, 48, 1], [-37, 37, .65], [33, 37, .65], [99, 48, 1]]) {
            c.save(); c.translate(x, y); c.scale(s, s);
            cuteEllipse(c, 0, 0, 29, 12, '#fffaf3'); cuteEllipse(c, -13, -9, 13, 13, '#fffaf3'); cuteEllipse(c, 7, -13, 16, 16, '#fffaf3');
            c.strokeStyle = '#e9d9eb'; c.lineWidth = 2; c.beginPath(); c.moveTo(-19, 8); c.quadraticCurveTo(0, 14, 18, 8); c.stroke(); c.restore();
        }
    } else if (type === 'avocado') {
        cuteHood(c, '#d3dc8b', '#769765', true);
        c.strokeStyle = '#91ac69'; c.lineWidth = 12; c.beginPath(); c.ellipse(0, -5, 159, 208, 0, 0, Math.PI * 2); c.stroke();
        cuteEllipse(c, 0, 187, 35, 26, '#b68963'); cuteEllipse(c, -8, 179, 12, 8, '#d1aa7f');
        cuteBlush(c);
    }
}

// Reference: TikTok effect 4569305016 by unique_filter.
// Original 2D reconstruction: antennae, blue roller, dotted mask and aqua cheek trails.
function drawCuteRoachSticker(c, options = {}) {
    // A fixed pattern avoids random flicker between camera frames and photographs.
    c.save(); c.beginPath();
    if (options.outline?.length) {
        options.outline.forEach((point, index) => index ? c.lineTo(point.x, point.y) : c.moveTo(point.x, point.y)); c.closePath();
    } else c.ellipse(0, 20, 123, 154, 0, 0, Math.PI * 2);
    c.clip();
    for (let row = 0; row < 17; row++) for (let column = 0; column < 16; column++) {
        const x = -120 + column * 16 + (row % 2) * 8;
        const y = -96 + row * 16;
        if ((x / 130) ** 2 + ((y - 20) / 161) ** 2 > 1) continue;
        // Keep the eye and mouth openings clear.
        if ((Math.abs(x) - 70) ** 2 / 32 ** 2 + (y + 16) ** 2 / 23 ** 2 < 1 ||
            x ** 2 / 37 ** 2 + (y - 95) ** 2 / 23 ** 2 < 1) continue;
        cuteEllipse(c, x, y, .95, 1.15, '#3d333480');
    }
    c.restore();
    cuteBlush(c, '44');
    for (const side of [-1, 1]) {
        // Long antennae are anchored to the forehead, not a separate floating bug.
        c.strokeStyle = '#211d1c'; c.lineWidth = 2.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(side * 28, -131);
        c.lineTo(side * 48, -199); c.lineTo(side * 82, -263);
        c.quadraticCurveTo(side * 86, -270, side * 95, -263);
        c.bezierCurveTo(side * 193, -209, side * 251, -49, side * 194, 144); c.stroke();
        c.fillStyle = '#211d1c'; c.beginPath(); c.moveTo(side * 21, -130);
        c.quadraticCurveTo(side * 33, -180, side * 48, -199);
        c.lineTo(side * 82, -263); c.lineTo(side * 53, -195); c.lineTo(side * 34, -130); c.closePath(); c.fill();
        // Aqua comic tears extend outwards from both cheeks.
        c.fillStyle = '#e8ffff'; c.strokeStyle = '#4bd0ce'; c.lineWidth = 2.2;
        c.beginPath(); c.moveTo(side * 72, 30);
        c.bezierCurveTo(side * 105, 19, side * 178, 27, side * 247, 67);
        c.quadraticCurveTo(side * 190, 52, side * 142, 43);
        c.quadraticCurveTo(side * 106, 42, side * 74, 37); c.closePath(); c.fill(); c.stroke();
        c.strokeStyle = '#a1efeb'; c.lineWidth = 4;
        c.beginPath(); c.moveTo(side * 91, 35); c.quadraticCurveTo(side * 138, 30, side * 201, 49); c.stroke();
        for (const [x,y] of [[98,29],[126,32],[156,36],[185,46]]) cuteEllipse(c, side * x, y, .8, 1.3, '#3cbdb9');
    }
    // Pale blue hair roller: side caps and fine ridges, drawn into the camera bitmap.
    const roller = c.createLinearGradient(0, -142, 0, -72);
    roller.addColorStop(0, '#d0dcdd'); roller.addColorStop(.35, '#8c989d'); roller.addColorStop(.62, '#67777d'); roller.addColorStop(1, '#d7e7e9');
    c.fillStyle = roller; c.strokeStyle = '#98b7c3'; c.lineWidth = 2;
    c.beginPath(); c.roundRect(-47, -142, 94, 70, 4); c.fill(); c.stroke();
    for (const side of [-1, 1]) {
        c.fillStyle = '#dcf2fa'; c.beginPath(); c.roundRect(side < 0 ? -47 : 28, -143, 19, 72, 3); c.fill();
        c.strokeStyle = '#a9c9d6'; c.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const x = side < 0 ? -43 + i * 4 : 31 + i * 4;
            c.beginPath(); c.moveTo(x, -137); c.lineTo(x, -76); c.stroke();
        }
        for (let y = -131; y < -78; y += 11) cuteEllipse(c, side * 37, y, .9, 1.5, '#819ca9');
    }
    c.strokeStyle = '#35474b99'; c.lineWidth = .8;
    for (let x = -25; x <= 25; x += 3) {
        c.beginPath(); c.moveTo(x, -138); c.quadraticCurveTo(x - 2, -106, x, -75); c.stroke();
    }
}

function drawCuteRoachMascot(context, width, height) {
    context.save(); context.filter = 'none';
    context.translate(width * .84, height * .83);
    const size = Math.min(width, height) / 600 * .72;
    context.scale(size, size); context.lineJoin = 'round'; context.lineCap = 'round';
    context.strokeStyle = '#3a302d'; context.fillStyle = '#cd9668'; context.lineWidth = 2.7;
    for (const side of [-1, 1]) {
        context.beginPath(); context.moveTo(side * 19, -3); context.lineTo(side * 36, -14);
        context.lineTo(side * 38, -31); context.lineTo(side * 31, -36); context.lineTo(side * 32, -46);
        context.lineTo(side * 47, -44); context.lineTo(side * 51, -36); context.lineTo(side * 48, -28);
        context.quadraticCurveTo(side * 58, -5, side * 41, 9); context.lineTo(side * 22, 15);
        context.closePath(); context.fill(); context.stroke();
        context.beginPath(); context.moveTo(side * 37, -40); context.lineTo(side * 45, -38); context.stroke();
        context.beginPath(); context.moveTo(side * 7, -42); context.lineTo(side * 11, -56); context.stroke();
    }
    context.beginPath(); context.ellipse(0, 20, 26, 39, 0, 0, Math.PI * 2); context.fill(); context.stroke();
    context.fillStyle = '#e6ad7d';
    context.beginPath(); context.ellipse(0, -22, 33, 25, 0, 0, Math.PI * 2); context.fill(); context.stroke();
    cuteEllipse(context, -11, -26, 2.5, 3.5, '#3a302d'); cuteEllipse(context, 11, -26, 2.5, 3.5, '#3a302d');
    context.beginPath(); context.moveTo(-6, -11); context.quadraticCurveTo(0, -7, 6, -11); context.stroke();
    context.lineWidth = 2;
    for (const side of [-1, 1]) {
        context.beginPath(); context.moveTo(side * 5, 9); context.quadraticCurveTo(side * 13, 14, side * 22, 9); context.stroke();
        for (const y of [25, 36, 47]) {
            context.beginPath(); context.moveTo(side * 5, y); context.lineTo(side * 16, y - 2); context.stroke();
        }
    }
    context.beginPath(); context.moveTo(0, 18); context.lineTo(0, 51); context.stroke(); context.restore();
}
