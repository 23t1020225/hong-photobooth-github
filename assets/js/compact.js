document.body.classList.add('compact-layout');
const resultPanel=$('.result');
resultPanel.hidden=true;
const frameDialog=document.createElement('dialog');frameDialog.className='frame-dialog';frameDialog.setAttribute('aria-label','Bộ sưu tập khung ảnh');
frameDialog.innerHTML='<div class="dialog-heading"><div><div class="section-label">MỘT CHIẾC KHUNG, MỘT TÂM TRẠNG</div><h2>Chọn khung của bạn ♡</h2></div><button class="close-dialog" aria-label="Đóng bảng khung">×</button></div>';
frameDialog.append(categories,framePicker);document.body.append(frameDialog);pickerTitle.remove();
const chooseButton=document.createElement('button');chooseButton.className='choose-frame';chooseButton.innerHTML='<span>♡ Tim hồng</span><small>Đổi khung · 26 mẫu ↗</small>';$('#strip').after(chooseButton);chooseButton.onclick=()=>frameDialog.showModal();
const reviewPhotosButton=document.createElement('button');reviewPhotosButton.id='review-photos';reviewPhotosButton.className='review-photos';reviewPhotosButton.type='button';reviewPhotosButton.textContent='♡ Chọn lại ảnh yêu thích';reviewPhotosButton.hidden=true;chooseButton.after(reviewPhotosButton);
reviewPhotosButton.onclick=()=>document.dispatchEvent(new Event('photo-review-open'));
frameDialog.querySelector('.close-dialog').onclick=()=>frameDialog.close();frameDialog.addEventListener('click',e=>{if(e.target===frameDialog)frameDialog.close();});
framePicker.querySelectorAll('button').forEach(b=>{const select=b.onclick;b.onclick=()=>{select();chooseButton.querySelector('span').textContent=chosenFrame.mark+' '+chosenFrame.name;frameDialog.close();};});
$('.result-note').textContent='Chạm ảnh để xem lớn ↗';
const largeDialog=document.createElement('dialog');largeDialog.className='large-strip-dialog';largeDialog.setAttribute('aria-label','Xem dải ảnh lớn');largeDialog.innerHTML='<button class="close-dialog" aria-label="Đóng ảnh lớn">×</button><img alt="Dải ảnh kỷ niệm của bạn">';document.body.append(largeDialog);
stripCanvas.setAttribute('role','button');stripCanvas.tabIndex=0;stripCanvas.setAttribute('aria-label','Phóng to dải ảnh');async function enlarge(){if(largeDialog.open||!(await updateCutePreview()))return;largeDialog.querySelector('img').src=stripCanvas.toDataURL();largeDialog.showModal();}stripCanvas.onclick=enlarge;stripCanvas.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();enlarge();}};largeDialog.querySelector('button').onclick=()=>largeDialog.close();largeDialog.onclick=e=>{if(e.target===largeDialog)largeDialog.close();};
function labelRetakes(){document.querySelectorAll("#slots .slot button").forEach((b,i)=>{b.textContent="↻ "+(i+1);b.setAttribute("aria-label","Chụp lại ảnh "+(i+1));});}new MutationObserver(labelRetakes).observe($("#slots"),{childList:true});labelRetakes();



document.addEventListener('photos-selected',()=>{
 resultPanel.hidden=false;
 reviewPhotosButton.hidden=false;
 frameDialog.showModal();
 if(window.matchMedia('(max-width: 550px)').matches)requestAnimationFrame(()=>resultPanel.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
});
$('#reset').addEventListener('click',()=>{resultPanel.hidden=true;reviewPhotosButton.hidden=true;if(frameDialog.open)frameDialog.close();});
