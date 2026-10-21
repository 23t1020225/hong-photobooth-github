// Original reconstruction of the visible look of TikTok effect 3086335461.
// The camera image is warped locally on the GPU; no frames leave the device.
const kingVertexShader = `
attribute vec2 position;
varying vec2 uv;
void main(){ uv=(position+1.0)*0.5; gl_Position=vec4(position,0.0,1.0); }
`;
const kingFragmentShader = `
precision mediump float;
uniform sampler2D frame;
uniform vec2 resolution;
uniform vec2 origin;
uniform vec2 faceScale;
uniform float roll;
varying vec2 uv;
void main(){
    vec2 pixel=vec2(uv.x,1.0-uv.y)*resolution;
    float cs=cos(roll), sn=sin(roll);
    vec2 delta=pixel-origin;
    vec2 local=vec2(cs*delta.x+sn*delta.y,-sn*delta.x+cs*delta.y)/faceScale;
    vec2 radial=(local-vec2(0.0,48.0))/vec2(203.0,222.0);
    float weight=max(0.0,1.0-dot(radial,radial));
    weight=weight*weight;
    vec2 mapped=vec2(local.x/(1.0+0.56*weight),48.0+(local.y-48.0)/(1.0+0.12*weight));
    vec2 nose=(mapped-vec2(0.0,48.0))/vec2(67.0,74.0);
    float noseWeight=max(0.0,1.0-dot(nose,nose));
    mapped=vec2(0.0,48.0)+(mapped-vec2(0.0,48.0))/(1.0+0.35*noseWeight*noseWeight);
    vec2 scaled=mapped*faceScale;
    vec2 source=origin+vec2(cs*scaled.x-sn*scaled.y,sn*scaled.x+cs*scaled.y);
    gl_FragColor=texture2D(frame,vec2(source.x/resolution.x,1.0-source.y/resolution.y));
}
`;
let kingWarp = null, kingWarpUnavailable = false;
let kingFallbackSource = null, kingFallbackPatch = null;

function createKingWarp() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false });
    if (!gl) return null;
    function shader(type, source) {
        const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('King shader failed'); }
        return shader;
    }
    const vertex = shader(gl.VERTEX_SHADER, kingVertexShader), fragment = shader(gl.FRAGMENT_SHADER, kingFragmentShader);
    const program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('King program failed');
    gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, 'frame'), 0);
    const uniforms = Object.fromEntries(['resolution','origin','faceScale','roll'].map(name => [name, gl.getUniformLocation(program, name)]));
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); kingWarpUnavailable = true; kingWarp = null; });
    return { canvas, gl, texture, uniforms };
}

function applyKingFaceLook(context, pose, width, height) {
    if (!pose || !context.canvas || ![pose.x,pose.y,pose.scaleX,pose.scaleY,pose.angle].every(Number.isFinite) || pose.scaleX <= 0 || pose.scaleY <= 0) return;
    if (!kingWarp && !kingWarpUnavailable) {
        try { kingWarp = createKingWarp(); } catch { kingWarp = null; }
        if (!kingWarp) kingWarpUnavailable = true;
    }
    if (kingWarp) {
        try {
            const { canvas, gl, uniforms } = kingWarp;
            if (gl.isContextLost()) throw new Error('King context lost');
            if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
            gl.viewport(0, 0, width, height); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, kingWarp.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, context.canvas);
            gl.uniform2f(uniforms.resolution, width, height); gl.uniform2f(uniforms.origin, pose.x, pose.y);
            gl.uniform2f(uniforms.faceScale, pose.scaleX, pose.scaleY); gl.uniform1f(uniforms.roll, pose.angle);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            context.save(); context.filter = 'none'; context.drawImage(canvas, 0, 0); context.restore();
            context.canvas.setAttribute?.('data-king-renderer', 'webgl');
            return;
        } catch { kingWarpUnavailable = true; kingWarp = null; }
    }
    // Older devices still get a broad-face look with a softly blended Canvas pass.
    applyKingFallback(context, pose, width, height);
}

function applyKingFallback(context, pose, width, height) {
    context.canvas.setAttribute?.('data-king-renderer', 'canvas-2d');
    kingFallbackSource ||= document.createElement('canvas'); kingFallbackPatch ||= document.createElement('canvas');
    if (kingFallbackSource.width !== width || kingFallbackSource.height !== height) { kingFallbackSource.width = width; kingFallbackSource.height = height; }
    const source = kingFallbackSource.getContext('2d'); source.clearRect(0, 0, width, height); source.drawImage(context.canvas, 0, 0);
    const w = Math.max(2, Math.min(width, Math.ceil(pose.scaleX * 440))), h = Math.max(2, Math.min(height, Math.ceil(pose.scaleY * 440)));
    if (kingFallbackPatch.width !== w || kingFallbackPatch.height !== h) { kingFallbackPatch.width = w; kingFallbackPatch.height = h; }
    const patch = kingFallbackPatch.getContext('2d'); patch.clearRect(0, 0, w, h);
    const x = pose.x - Math.sin(pose.angle) * 48 * pose.scaleY, y = pose.y + Math.cos(pose.angle) * 48 * pose.scaleY;
    patch.save(); patch.translate(w/2,h/2); patch.scale(1.36,1.08); patch.rotate(-pose.angle); patch.translate(-x,-y); patch.drawImage(kingFallbackSource,0,0); patch.restore();
    patch.save(); patch.globalCompositeOperation='destination-in'; patch.translate(w/2,h/2); patch.scale(w/2,h/2);
    const feather=patch.createRadialGradient(0,0,0,0,0,1); feather.addColorStop(0,'#fff'); feather.addColorStop(.78,'#fff'); feather.addColorStop(1,'#ffffff00');
    patch.fillStyle=feather; patch.fillRect(-1,-1,2,2); patch.restore();
    context.save(); context.filter='none'; context.translate(x,y); context.rotate(pose.angle); context.drawImage(kingFallbackPatch,-w/2,-h/2); context.restore();
}

function drawKingSticker(c) {
    c.save(); c.lineCap='round'; c.lineJoin='round'; c.strokeStyle='#191514';
    for (const side of [-1,1]) {
        c.lineWidth=3; c.beginPath(); c.moveTo(side*25,-129); c.lineTo(side*44,-187); c.lineTo(side*77,-228);
        c.quadraticCurveTo(side*81,-233,side*87,-227);
        c.bezierCurveTo(side*176,-166,side*228,-28,side*184,151); c.stroke();
        c.fillStyle='#191514'; c.beginPath(); c.moveTo(side*18,-126);
        c.quadraticCurveTo(side*22,-164,side*44,-187); c.lineTo(side*77,-228); c.lineTo(side*49,-183);
        c.quadraticCurveTo(side*34,-151,side*34,-128); c.quadraticCurveTo(side*28,-116,side*18,-126); c.fill();
    }
    c.restore();
}

function drawKingMascot(c,width,height) {
    c.save(); c.filter='none'; c.translate(width*.105,height*.14);
    const scale=Math.min(width,height)/600*.48; c.scale(scale,scale); c.strokeStyle='#221c19'; c.lineWidth=3; c.lineCap='round';
    c.fillStyle='#936743'; c.beginPath(); c.ellipse(0,15,27,40,0,0,Math.PI*2); c.fill(); c.stroke();
    c.fillStyle='#c79b70'; c.beginPath(); c.ellipse(-8,12,12,30,-.3,0,Math.PI*2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(8,12,12,30,.3,0,Math.PI*2); c.fill(); c.stroke();
    c.fillStyle='#ecc196'; c.beginPath(); c.ellipse(0,-28,30,23,0,0,Math.PI*2); c.fill(); c.stroke();
    cuteEllipse(c,-8,-30,2,3,'#221c19');
    for(let i=0;i<5;i++){const angle=i*Math.PI*2/5;cuteEllipse(c,14+Math.cos(angle)*6,-28+Math.sin(angle)*6,3.5,3.5,'#c26a69');}
    cuteEllipse(c,14,-28,2,2,'#f4dd98');
    for(const side of [-1,1]){c.beginPath();c.moveTo(side*8,-49);c.lineTo(side*12,-62);c.stroke();c.beginPath();c.moveTo(side*6,54);c.lineTo(side*9,62);c.lineTo(side*3,62);c.stroke();}
    c.restore();
}
