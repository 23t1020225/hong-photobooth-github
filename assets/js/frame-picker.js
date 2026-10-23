let chosenFrame=cuteFrames[1],renderSequence=0,activeFrameCategory='all';
const previewStatus=document.createElement('p');previewStatus.className='preview-status';previewStatus.setAttribute('role','status');previewStatus.setAttribute('aria-live','polite');$('#strip').after(previewStatus);
const framePicker=document.createElement('div');framePicker.className='frame-picker';framePicker.setAttribute('aria-label','Chọn mẫu khung');
const frameEmpty=document.createElement('p');frameEmpty.className='frame-picker-empty';frameEmpty.hidden=true;framePicker.append(frameEmpty);
const stripCanvas=document.createElement('canvas');stripCanvas.id='cute-preview';stripCanvas.setAttribute('aria-label','Xem trước dải ảnh và khung trang trí');$('#strip').prepend(stripCanvas);$('#strip').classList.add('cute-strip');
$('#strip').after(framePicker);$('.result-note').textContent='chọn một chiếc khung thật xinh ♡';$('.swatches').style.display='none';
const pickerTitle=document.createElement('div');pickerTitle.className='picker-title';pickerTitle.innerHTML='Chọn chiếc khung xinh <small></small>';framePicker.before(pickerTitle);
const categories=document.createElement('div');categories.className='frame-categories';framePicker.before(categories);
function supportsFrameCount(frame,count){return !frame.custom||frame.slots.length===count;}
function updateFrameOptions(){let available=0;for(const button of framePicker.querySelectorAll('button')){const frame=cuteFrames.find(item=>item.id===button.dataset.frame);const visible=(activeFrameCategory==='all'||button.dataset.category===activeFrameCategory)&&supportsFrameCount(frame,total);button.hidden=!visible;if(visible)available++;}pickerTitle.querySelector('small').textContent=total+' ảnh · '+available+' khung';frameEmpty.hidden=available>0;frameEmpty.textContent='Chưa có khung trong nhóm này có đúng '+total+' ô ảnh. Hãy chọn “Tất cả” hoặc “Dễ thương” nhé.';}
function updateFrameChooserLabel(){const label=document.querySelector('.choose-frame span');if(label)label.textContent=chosenFrame.mark+' '+chosenFrame.name;}
function chooseFlexibleFrame(){chosenFrame=cuteFrames.find(frame=>!frame.custom&&!frame.couple)||cuteFrames[1];activeFrameCategory='all';categories.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category==='all')));framePicker.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.frame===chosenFrame.id)));updateFrameChooserLabel();}
for(const [key,label] of [['all','Tất cả'],['custom','Khung của bạn'],['couple','Cặp đôi'],['cute','Dễ thương']]){const b=document.createElement('button');b.textContent=label;b.dataset.category=key;b.setAttribute('aria-pressed',String(key==='all'));b.onclick=()=>{activeFrameCategory=key;categories.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));updateFrameOptions();};categories.append(b);}
for(const f of cuteFrames){const b=document.createElement('button');const thumb=document.createElement('canvas');thumb.setAttribute('aria-hidden','true');const thumbCount=f.custom?f.slots.length:2;paintCuteStrip(thumb.getContext('2d'),f,[],thumbCount,'with love','HỒNG STUDIO');b.append(thumb,document.createTextNode(f.name));b.title=f.desc||f.name;b.dataset.frame=f.id;b.dataset.category=f.custom?'custom':f.couple?'couple':'cute';b.setAttribute('aria-pressed',String(f===chosenFrame));b.onclick=()=>{if(busy||!supportsFrameCount(f,total))return;chosenFrame=f;document.querySelectorAll('[data-n]').forEach(x=>{x.disabled=busy;x.classList.toggle('active',Number(x.dataset.n)===total);});document.querySelector('#frame-count-note').textContent=f.custom?'Khung này có đúng '+total+' ô ảnh':'Khung tự điều chỉnh theo '+total+' ảnh';framePicker.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const remaining=total-photos.slice(0,total).filter(Boolean).length;$('#capture').innerHTML=remaining&&photos.some(Boolean)?'<span>●</span> Chụp thêm '+remaining+' ảnh':'<span>●</span> Chụp một bộ mới';if(photos.some(Boolean))$('#frame-count-note').textContent+=' · Ảnh đã chụp được giữ lại.';updateCutePreview();};framePicker.append(b);}
updateFrameOptions();
async function updateCutePreview(){
 const seq=++renderSequence,frame=chosenFrame,count=total,sources=photos.slice(0,total),caption=$('#caption').value;
 stripCanvas.setAttribute('aria-busy','true');previewStatus.textContent='Đang ghép ảnh vào khung…';
 try{
  if(!supportsFrameCount(frame,count))throw new Error('Số ô khung không khớp số ảnh. Chọn một khung phù hợp nhé.');
  const [,imgs]=await Promise.all([loadFrameAsset(frame),Promise.all(sources.map(src=>new Promise((resolve,reject)=>{if(!src)return resolve(null);const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Không đọc được ảnh đã chụp. Bạn thử chụp lại nhé.'));im.src=src;})))]);
  if(seq!==renderSequence)return false;
  paintCuteStrip(stripCanvas.getContext('2d'),frame,imgs,count,caption,date);
  stripCanvas.setAttribute('aria-busy','false');previewStatus.textContent='';return true;
 }catch(error){if(seq!==renderSequence)return false;previewStatus.textContent=error.message;return false;}
}
for(const button of document.querySelectorAll('[data-n]'))button.addEventListener('click',()=>setTimeout(()=>{if(chosenFrame.custom&&!supportsFrameCount(chosenFrame,total)){chooseFlexibleFrame();document.querySelector('#frame-count-note').textContent='Khung đã đổi sang mẫu ghép linh hoạt cho '+total+' ảnh.';}updateFrameOptions();updateCutePreview();},0));
document.addEventListener('photos-selected',()=>{if(!supportsFrameCount(chosenFrame,total)){chooseFlexibleFrame();document.querySelector('#frame-count-note').textContent='Đã đổi sang khung ghép đúng '+total+' ảnh.';}updateFrameOptions();updateCutePreview();});
new MutationObserver(()=>{document.querySelectorAll('[data-n]').forEach(b=>b.disabled=busy);updateFrameOptions();updateCutePreview();}).observe($('#slots'),{childList:true});$('#caption').addEventListener('input',updateCutePreview);updateCutePreview();
let exportingPhoto=false;
$('#download').onclick=async()=>{
 if(busy||exportingPhoto||photos.slice(0,total).filter(Boolean).length!==total)return;
 const frame=chosenFrame,count=total,text=$('#caption').value,sources=photos.slice(0,total),button=$('#download');
 if(!supportsFrameCount(frame,count)){previewStatus.textContent='Số ô khung không khớp số ảnh. Chọn một khung phù hợp nhé.';return;}
 exportingPhoto=true;button.disabled=true;button.textContent='Đang chuẩn bị ảnh…';
 try{await loadFrameAsset(frame);const imgs=await Promise.all(sources.map(src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Không đọc được ảnh đã chụp. Bạn thử chụp lại nhé.'));im.src=src;})));const output=document.createElement('canvas');paintCuteStrip(output.getContext('2d'),frame,imgs,count,text,date);await savePhoto(output,`hong-${frame.id}.png`);}
 catch(error){$('#status').textContent=error.message||'Chưa tải được ảnh. Bạn thử lại nhé.';}
 finally{exportingPhoto=false;button.textContent='Tải dải ảnh ↓';button.disabled=busy||photos.slice(0,total).filter(Boolean).length!==total;}
};
