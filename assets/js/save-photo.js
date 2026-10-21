const saveDialog = document.querySelector('#save-dialog');
const savePreview = document.querySelector('#save-preview');
const saveLink = document.querySelector('#save-png');
const saveShare = document.querySelector('#save-share');
const saveFeedback = document.querySelector('#save-feedback');
let savedPhotoUrl = null;
let savedPhotoFile = null;

async function savePhoto(output, filename) {
    const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Không thể tạo ảnh PNG.');
    if (savedPhotoUrl) URL.revokeObjectURL(savedPhotoUrl);
    savedPhotoUrl = URL.createObjectURL(blob);
    savePreview.src = savedPhotoUrl;
    saveLink.href = savedPhotoUrl;
    saveLink.download = filename;
    savedPhotoFile = new File([blob], filename, { type: 'image/png' });
    saveShare.hidden = true;
    try { saveShare.hidden = !(navigator.share && navigator.canShare?.({ files: [savedPhotoFile] })); } catch {}
    saveFeedback.textContent = '';
    if (!saveDialog.open) saveDialog.showModal();
    saveDialog.scrollTop = 0;
    // A touch device keeps the preview open for long-press saving.
    if (!window.matchMedia('(pointer: coarse)').matches) saveLink.click();
}

saveShare.onclick = async () => {
    if (!savedPhotoFile) return;
    saveShare.disabled = true;
    try { await navigator.share({ files: [savedPhotoFile] }); }
    catch (error) {
        if (error.name !== 'AbortError') saveFeedback.textContent = 'Chưa mở được bảng chia sẻ. Bạn bấm “Tải PNG ↓” hoặc nhấn giữ ảnh để lưu nhé.';
    } finally { saveShare.disabled = false; }
};

saveDialog.querySelector('.close-dialog').onclick = () => saveDialog.close();
saveDialog.addEventListener('click', event => {
    if (event.target !== saveDialog) return;
    const bounds = saveDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) saveDialog.close();
});
saveDialog.addEventListener('close', () => {
    savePreview.removeAttribute('src');
    saveLink.removeAttribute('href');
    // Keep the URL alive for downloads still being processed after closing.
    // It is released when the next photo replaces it or the page unloads.
    savedPhotoFile = null;
});
