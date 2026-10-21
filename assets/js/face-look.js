// Reusable canvases keep the eye-warp pass local and avoid per-frame allocations.
let cuteRoachSource = null, cuteRoachEyePatch = null;
function applyCuteRoachFaceLook(context, pose, width, height) {
    if (!pose?.eyes?.length || !context.canvas) return;
    cuteRoachSource ||= document.createElement('canvas');
    cuteRoachEyePatch ||= document.createElement('canvas');
    if (cuteRoachSource.width !== width || cuteRoachSource.height !== height) {
        cuteRoachSource.width = width; cuteRoachSource.height = height;
    }
    const source = cuteRoachSource.getContext('2d');
    source.clearRect(0, 0, width, height); source.drawImage(context.canvas, 0, 0);
    for (const eye of pose.eyes) {
        if (!Number.isFinite(eye.x) || !Number.isFinite(eye.y) || !Number.isFinite(eye.width) || eye.width < 6) continue;
        const w = Math.min(width, Math.ceil(eye.width * 2.15)), h = Math.min(height, Math.ceil(eye.width * 1.45));
        if (cuteRoachEyePatch.width !== w || cuteRoachEyePatch.height !== h) {
            cuteRoachEyePatch.width = w; cuteRoachEyePatch.height = h;
        }
        const patch = cuteRoachEyePatch.getContext('2d');
        patch.clearRect(0, 0, w, h);
        patch.save(); patch.translate(w / 2, h / 2);
        patch.scale(1.22, 1.3); patch.rotate(-pose.angle); patch.translate(-eye.x, -eye.y);
        patch.drawImage(cuteRoachSource, 0, 0); patch.restore();
        // Feather the boundary so enlarged eyes blend with the surrounding skin.
        patch.save(); patch.globalCompositeOperation = 'destination-in';
        patch.translate(w / 2, h / 2); patch.scale(w / 2, h / 2);
        const feather = patch.createRadialGradient(0, 0, 0, 0, 0, 1);
        feather.addColorStop(0, '#fff'); feather.addColorStop(.48, '#fff'); feather.addColorStop(1, '#ffffff00');
        patch.fillStyle = feather; patch.fillRect(-1, -1, 2, 2); patch.restore();
        context.save(); context.filter = 'none'; context.translate(eye.x, eye.y); context.rotate(pose.angle);
        context.drawImage(cuteRoachEyePatch, -w / 2, -h / 2); context.restore();
    }
}
