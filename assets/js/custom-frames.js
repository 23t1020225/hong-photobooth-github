cuteFrames.push(...customFrames);
const frameAssets=new Map();
const pendingFrameAssets=new Map();
function loadFrameAsset(frame){
 if(!frame.custom)return Promise.resolve();
 if(frameAssets.has(frame.id))return Promise.resolve(frameAssets.get(frame.id));
 if(pendingFrameAssets.has(frame.id))return pendingFrameAssets.get(frame.id);
 const promise=new Promise((resolve,reject)=>{
  const image=new Image();
  const timer=setTimeout(()=>finish(false),15000);
  function finish(loaded){
   clearTimeout(timer);image.onload=null;image.onerror=null;
   if(loaded){frameAssets.set(frame.id,image);resolve(image);}
   else reject(new Error('Chưa tải được khung “'+frame.name+'”. Bạn kiểm tra mạng rồi bấm tải lại nhé.'));
  }
  image.onload=()=>finish(true);image.onerror=()=>finish(false);image.src=frame.asset;
 });
 pendingFrameAssets.set(frame.id,promise);
 const cleanup=()=>pendingFrameAssets.delete(frame.id);
 promise.then(cleanup,cleanup);
 return promise;
}
const customFramesReady=Promise.allSettled(customFrames.map(loadFrameAsset));
const paintBeforeCustom=paintCuteStrip;
paintCuteStrip=function(c,f,images,n,caption,dateText){if(!f.custom)return paintBeforeCustom(c,f,images,n,caption,dateText);if(n!==f.slots.length)throw new Error('Khung này có '+f.slots.length+' ô nhưng đang chọn '+n+' ảnh.');const asset=frameAssets.get(f.id);c.canvas.width=f.width;c.canvas.height=f.height+90;c.fillStyle='#fff9f3';c.fillRect(0,0,c.canvas.width,c.canvas.height);for(let i=0;i<n;i++){const [x,y,w,h]=f.slots[i],im=images[i];if(im){const s=Math.max(w/im.width,h/im.height),sw=w/s,sh=h/s;c.drawImage(im,(im.width-sw)/2,(im.height-sh)/2,sw,sh,x,y,w,h);}else{c.fillStyle='#e9ddd8';c.fillRect(x,y,w,h);c.fillStyle='#b28b8b';c.textAlign='center';c.font=`${Math.max(15,w*.15)}px Georgia`;c.fillText('♡',x+w/2,y+h/2);}}if(asset)c.drawImage(asset,0,0);c.fillStyle='#79504d';c.textAlign='center';c.font=`${Math.max(13,f.width*.032)}px sans-serif`;c.fillText(caption||'một chút hồng, một chút bạn.',f.width/2,f.height+36,f.width-24);c.font=`${Math.max(10,f.width*.022)}px sans-serif`;c.fillText(dateText,f.width/2,f.height+68);return c.canvas;};
// Refresh each thumbnail independently; a slow frame cannot hold up the others.
customFrames.forEach(frame=>loadFrameAsset(frame).then(()=>{
 const button=document.querySelector('.frame-picker button[data-frame="'+frame.id+'"]');
 if(button)paintCuteStrip(button.querySelector('canvas').getContext('2d'),frame,[],frame.slots.length,'','');
},()=>{}));
