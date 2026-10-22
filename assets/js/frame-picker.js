let chosenFrame=cuteFrames[1],renderSequence=0;
const previewStatus=document.createElement('p');previewStatus.className='preview-status';previewStatus.setAttribute('role','status');previewStatus.setAttribute('aria-live','polite');$('#strip').after(previewStatus);
const framePicker=document.createElement('div');framePicker.className='frame-picker';framePicker.setAttribute('aria-label','Chọn mẫu khung');
const stripCanvas=document.createElement('canvas');stripCanvas.id='cute-preview';stripCanvas.setAttribute('aria-label','Xem trước dải ảnh và khung trang trí');$('#strip').prepend(stripCanvas);$('#strip').classList.add('cute-strip');
$('#strip').after(framePicker);$('.result-note').textContent='chọn một chiếc khung thật xinh ♡';$('.swatches').style.display='none';
const pickerTitle=document.createElement('div');pickerTitle.className='picker-title';pickerTitle.innerHTML='Chọn chiếc khung xinh <small>26 mẫu</small>';framePicker.before(pickerTitle);
const categories=document.createElement('div');categories.className='frame-categories';framePicker.before(categories);
for(const [key,label] of [['all','Tất cả'],['custom','Khung của bạn'],['couple','Cặp đôi'],['cute','Dễ thương']]){const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-pressed',String(key==='all'));b.onclick=()=>{categories.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));framePicker.querySelectorAll('button').forEach(x=>{x.hidden=key==='all'?false:x.dataset.category!==key;});};categories.append(b);}
for(const f of cuteFrames){const b=document.createElement('button');const thumb=document.createElement('canvas');thumb.setAttribute('aria-hidden','true');paintCuteStrip(thumb.getContext('2d'),f,[],2,'with love','HỒNG STUDIO');b.append(thumb,document.createTextNode(f.name));b.title=f.desc||f.name;b.dataset.frame=f.id;b.dataset.category=f.custom?'custom':f.couple?'couple':'cute';b.setAttribute('aria-pressed',String(f===chosenFrame));b.onclick=()=>{if(busy)return;chosenFrame=f;if(f.custom&&total!==f.slots.length){total=f.slots.length;slots();}document.querySelectorAll('[data-n]').forEach(x=>{x.disabled=!!f.custom;x.classList.toggle('active',Number(x.dataset.n)===total);});document.querySelector('#frame-count-note').textContent=f.custom?'Khung này chụp '+total+' ảnh · tự ghép đúng ô':'';framePicker.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const remaining=total-photos.slice(0,total).filter(Boolean).length;$('#capture').innerHTML=remaining&&photos.some(Boolean)?'<span>●</span> Chụp thêm '+remaining+' ảnh':'<span>●</span> Chụp một bộ mới';if(photos.some(Boolean))$('#frame-count-note').textContent+=' Ảnh đã chụp được giữ lại khi đổi khung.';updateCutePreview();};framePicker.append(b);}
async function updateCutePreview(){
 const seq=++renderSequence,frame=chosenFrame,count=total,sources=photos.slice(0,total),caption=$('#caption').value;
 stripCanvas.setAttribute('aria-busy','true');previewStatus.textContent='Đang ghép ảnh vào khung…';
 try{
  const [,imgs]=await Promise.all([loadFrameAsset(frame),Promise.all(sources.map(src=>new Promise((resolve,reject)=>{if(!src)return resolve(null);const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Không đọc được ảnh đã chụp. Bạn thử chụp lại nhé.'));im.src=src;})))]);
  if(seq!==renderSequence)return false;
  paintCuteStrip(stripCanvas.getContext('2d'),frame,imgs,count,caption,date);
  stripCanvas.setAttribute('aria-busy','false');previewStatus.textContent='';return true;
 }catch(error){
  if(seq!==renderSequence)return false;
  previewStatus.textContent=error.message;return false;
 }
}

new MutationObserver(()=>{document.querySelectorAll('[data-n]').forEach(b=>b.disabled=busy||!!chosenFrame.custom);updateCutePreview();}).observe($('#slots'),{childList:true});$('#caption').addEventListener('input',updateCutePreview);updateCutePreview();
let exportingPhoto=false;
$('#download').onclick=async()=>{
 if(busy||exportingPhoto||photos.slice(0,total).filter(Boolean).length!==total)return;
 const frame=chosenFrame,count=total,text=$('#caption').value,sources=photos.slice(0,total),button=$('#download');
 exportingPhoto=true;button.disabled=true;button.textContent='Đang chuẩn bị ảnh…';
 try{
  await loadFrameAsset(frame);
  const imgs=await Promise.all(sources.map(src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Không đọc được ảnh đã chụp. Bạn thử chụp lại nhé.'));im.src=src;})));
  const output=document.createElement('canvas');
  paintCuteStrip(output.getContext('2d'),frame,imgs,count,text,date);
  await savePhoto(output,`hong-${frame.id}.png`);
 }catch(error){$('#status').textContent=error.message||'Chưa tải được ảnh. Bạn thử lại nhé.';}
 finally{exportingPhoto=false;button.textContent='Tải dải ảnh ↓';button.disabled=busy||photos.slice(0,total).filter(Boolean).length!==total;}
};
