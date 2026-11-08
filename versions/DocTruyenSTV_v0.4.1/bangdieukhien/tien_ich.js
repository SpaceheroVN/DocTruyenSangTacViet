export function showToast(message, type = 'info') {
    let toast = document.getElementById('stv-toast-singleton');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'stv-toast-singleton';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.className = `toast show toast-${type}`;
    
    let icon = '';
    if (type === 'success') icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    else if (type === 'error' || type === 'warning') icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    else icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

    toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-message">${message}</div>`;
    
    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

export function showConfirm(tieuDe, noiDung, hanhDongXacNhan) {
    const modal = document.getElementById('confirm-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const btnConfirm = document.getElementById('modal-confirm');
    const btnCancel = document.getElementById('modal-cancel');
    
    if (!modal || !title || !body || !btnConfirm || !btnCancel) {
        if (confirm(`${tieuDe}\n${noiDung}`)) hanhDongXacNhan();
        return;
    }

    title.textContent = tieuDe;
    body.textContent = noiDung;
    
    const dongModal = () => modal.classList.remove('show');
    
    const xacNhan = () => { dongModal(); hanhDongXacNhan(); donDep(); };
    const huyBo = () => { dongModal(); donDep(); };
    
    const donDep = () => {
        btnConfirm.removeEventListener('click', xacNhan);
        btnCancel.removeEventListener('click', huyBo);
    };

    btnConfirm.addEventListener('click', xacNhan);
    btnCancel.addEventListener('click', huyBo);
    
    modal.classList.add('show');
}
