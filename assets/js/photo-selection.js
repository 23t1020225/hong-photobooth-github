const photoReview = document.createElement('dialog');
photoReview.className = 'photo-review';
photoReview.setAttribute('aria-labelledby', 'photo-review-title');
photoReview.innerHTML = '<div class="dialog-heading"><div><div class="section-label">BƯỚC 1 · GIỮ LẠI TẤM BẠN THÍCH</div><h2 id="photo-review-title">Chọn ảnh yêu thích ♡</h2></div><button class="close-dialog" type="button" aria-label="Đóng bước chọn ảnh">×</button></div><p class="photo-review-help">Bỏ chọn những tấm bạn không muốn giữ. Chọn từ 2 đến 4 ảnh, rồi mình sẽ mở các mẫu khung.</p><div class="photo-review-grid" role="group" aria-label="Ảnh vừa chụp"></div><div class="photo-review-footer"><span class="photo-review-count" aria-live="polite"></span><button class="photo-review-continue" type="button">Chọn ảnh này &amp; chọn khung →</button></div>';
document.body.append(photoReview);
const photoGrid = photoReview.querySelector('.photo-review-grid');
const photoCount = photoReview.querySelector('.photo-review-count');
const continueButton = photoReview.querySelector('.photo-review-continue');
let selectedReviewPhotos = [];
function updatePhotoReviewCount() {
    const selected = photoGrid.querySelectorAll('input:checked').length;
    photoCount.textContent = 'Đã chọn ' + selected + ' ảnh';
    continueButton.disabled = selected < 2 || selected > 4;
    continueButton.textContent = selected < 2 ? 'Chọn ít nhất 2 ảnh để tiếp tục →' : 'Chọn ảnh này & chọn khung →';
}
function openPhotoReview() {
    selectedReviewPhotos = photos.slice(0, total).filter(Boolean);
    photoGrid.replaceChildren();
    selectedReviewPhotos.forEach((src, index) => {
        const label = document.createElement('label');
        label.className = 'photo-review-card';
        const image = new Image();
        image.src = src;
        image.alt = 'Ảnh vừa chụp ' + (index + 1);
        const check = document.createElement('input');
        check.type = 'checkbox'; check.checked = true; check.value = String(index);
        check.setAttribute('aria-label', 'Giữ ảnh ' + (index + 1));
        check.addEventListener('change', updatePhotoReviewCount);
        const caption = document.createElement('span'); caption.textContent = 'Ảnh ' + (index + 1);
        label.append(image, check, caption); photoGrid.append(label);
    });
    updatePhotoReviewCount();
    if (!photoReview.open) photoReview.showModal();
}
photoReview.querySelector('.close-dialog').addEventListener('click', () => photoReview.close());
photoReview.addEventListener('click', event => { if (event.target === photoReview) photoReview.close(); });
continueButton.addEventListener('click', () => {
    const chosen = [...photoGrid.querySelectorAll('input:checked')].map(input => selectedReviewPhotos[Number(input.value)]).filter(Boolean);
    if (chosen.length < 2 || chosen.length > 4) return;
    photos = chosen; total = chosen.length;
    document.querySelectorAll('[data-n]').forEach(button => button.classList.toggle('active', Number(button.dataset.n) === total));
    slots();
    $('#capture').innerHTML = '<span>●</span> Chụp lại cả bộ';
    photoReview.close(); document.dispatchEvent(new Event('photos-selected'));
});
document.querySelector('#reset').addEventListener('click', () => photoReview.close());
document.addEventListener('photos-captured', openPhotoReview);
document.addEventListener('photo-review-open', openPhotoReview);
