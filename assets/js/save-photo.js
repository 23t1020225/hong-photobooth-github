const saveDialog = document.querySelector('#save-dialog');
const savePreview = document.querySelector('#save-preview');
const saveLink = document.querySelector('#save-png');
let savedPhotoUrl = null;

async function savePhoto(output, filename) {
    const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Không thể tạo ảnh PNG.');
    if (savedPhotoUrl) URL.revokeObjectURL(savedPhotoUrl);
    savedPhotoUrl = URL.createObjectURL(blob);
    savePreview.src = savedPhotoUrl;
    saveLink.href = savedPhotoUrl;
    saveLink.download = filename;
    if (!saveDialog.open) saveDialog.showModal();
    saveDialog.scrollTop = 0;
    saveLink.click();
}

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
    if (savedPhotoUrl) URL.revokeObjectURL(savedPhotoUrl);
    savedPhotoUrl = null;
});
