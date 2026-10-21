const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/king-filter.js'),'utf8');
const pose={x:350,y:230,scaleX:1.1,scaleY:.9,angle:.25};
function fixture(gpu=true,compile=true){
    const calls=[],canvases=[];
    const gl=new Proxy({
        isContextLost:()=>false,getShaderParameter:()=>compile,getProgramParameter:()=>true,
        createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),createTexture:()=>({}),
        getAttribLocation:()=>0,getUniformLocation:(_,name)=>name
    },{get:(o,k)=>k in o?o[k]:String(k).toUpperCase()===k?k:(...args)=>calls.push([k,...args])});
    function canvas(){
        const c={width:0,height:0,addEventListener(){}};
        const ctx=new Proxy({canvas:c,createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:(...args)=>calls.push(['2d:'+k,...args])});
        c.getContext=type=>type==='webgl'?(gpu?gl:null):ctx;return c;
    }
    const context=vm.createContext({document:{createElement:()=>{const c=canvas();canvases.push(c);return c}}});
    vm.runInContext(source,context);return {context,calls,canvases,target:canvas().getContext('2d')};
}
test('King GPU pass uses tracked geometry, correct image orientation and a full-frame draw',()=>{
    const f=fixture();f.context.applyKingFaceLook(f.target,pose,800,600);
    assert.equal(f.canvases.length,1);
    assert.ok(f.calls.some(c=>c[0]==='pixelStorei'&&c[1]==='UNPACK_FLIP_Y_WEBGL'&&c[2]===true));
    assert.ok(f.calls.some(c=>c[0]==='uniform2f'&&c[1]==='origin'&&c[2]===350&&c[3]===230));
    assert.ok(f.calls.some(c=>c[0]==='uniform1f'&&c[1]==='roll'&&c[2]===.25));
    assert.ok(f.calls.some(c=>c[0]==='texImage2D'&&c.at(-1)===f.target.canvas));
    assert.ok(f.calls.some(c=>c[0]==='drawArrays'&&c[3]===6));
    assert.ok(f.calls.some(c=>c[0]==='2d:drawImage'&&c[1]===f.canvases[0]));
    f.context.applyKingFaceLook(f.target,pose,800,600);assert.equal(f.canvases.length,1);
});
test('missing WebGL and shader compilation failures use a reusable feathered fallback',()=>{
    for(const [gpu,compile] of [[false,true],[true,false]]){
        const f=fixture(gpu,compile);f.context.applyKingFaceLook(f.target,pose,800,600);
        assert.equal(f.canvases.length,3);
        assert.ok(f.calls.some(c=>c[0]==='2d:scale'&&c[1]===1.36&&c[2]===1.08));
        f.context.applyKingFaceLook(f.target,pose,800,600);assert.equal(f.canvases.length,3);
        assert.equal(f.calls.filter(c=>c[0]==='2d:save').length,f.calls.filter(c=>c[0]==='2d:restore').length);
    }
});
test('invalid or missing face positions never touch the camera frame',()=>{
    const f=fixture();for(const invalid of [null,{...pose,x:NaN},{...pose,scaleX:0},{...pose,scaleY:-1}])f.context.applyKingFaceLook(f.target,invalid,800,600);
    assert.equal(f.canvases.length,0);assert.equal(f.calls.length,0);
});
