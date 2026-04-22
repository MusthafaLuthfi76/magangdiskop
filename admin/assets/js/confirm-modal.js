// ============================================================
// confirm-modal.js — Reusable Confirm Modal Utility
// Admin Panel — Dinas Koperasi UKM
// Menggantikan confirm() / alert() browser default di seluruh
// halaman admin dengan modal konfirmasi yang konsisten.
// Tombol Confirm menampilkan loading spinner selama aksi async
// berlangsung dan menutup modal setelah selesai.
//
// Usage:
//   showConfirmModal({
//     icon: '🗑️',
//     title: 'Hapus Data?',
//     message: 'Data akan dihapus permanen.',
//     confirmText: 'Ya, Hapus',
//     loadingText: 'Menghapus...',      // optional, default 'Memproses...'
//     confirmClass: 'btn-danger',       // btn-danger | btn-success | btn-warning | btn-primary
//   }, async function() {
//     // Jalankan aksi — boleh async, modal akan tutup otomatis setelah selesai
//   });
// ============================================================
(function () {
    'use strict';

    const MODAL_ID = 'global-confirm-modal';
    const STYLE_ID = 'global-confirm-modal-styles';
    const OVERLAY_ID = 'global-confirm-overlay';

    // ── Inject CSS ──────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
#${OVERLAY_ID} {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15,23,42,.55);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    backdrop-filter: blur(2px);
    animation: gcmFadeIn .15s ease;
}
@keyframes gcmFadeIn { from { opacity:0 } to { opacity:1 } }
#${MODAL_ID} {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,.18);
    width: 100%; max-width: 400px;
    overflow: hidden;
    animation: gcmSlideUp .18s ease;
}
@keyframes gcmSlideUp { from { transform:translateY(12px); opacity:0 } to { transform:translateY(0); opacity:1 } }
.gcm-body {
    padding: 32px 28px 24px;
    text-align: center;
}
.gcm-icon  { font-size: 44px; line-height: 1; margin-bottom: 14px; }
.gcm-title {
    font-size: 18px; font-weight: 700; color: #1e293b;
    margin-bottom: 10px; line-height: 1.3;
}
.gcm-msg {
    font-size: 13px; color: #64748b;
    line-height: 1.7; margin: 0;
}
.gcm-footer {
    display: flex; gap: 10px;
    padding: 0 20px 20px;
}
.gcm-footer .btn { flex: 1; justify-content: center; display: flex; align-items: center; gap: 6px; }
.gcm-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: gcmSpin .6s linear infinite;
    flex-shrink: 0;
}
@keyframes gcmSpin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }

    // ── Build / reuse modal DOM ─────────────────────────────
    function getOrCreateModal() {
        let overlay = document.getElementById(OVERLAY_ID);
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.display = 'none';
        overlay.innerHTML = `
<div id="${MODAL_ID}">
    <div class="gcm-body">
        <div class="gcm-icon"  id="gcm-icon"></div>
        <div class="gcm-title" id="gcm-title"></div>
        <p  class="gcm-msg"   id="gcm-msg"></p>
    </div>
    <div class="gcm-footer">
        <button id="gcm-btn-cancel"  class="btn">Batal</button>
        <button id="gcm-btn-confirm" class="btn">Konfirmasi</button>
    </div>
</div>`;
        document.body.appendChild(overlay);
        return overlay;
    }

    // ── Public API ──────────────────────────────────────────
    /**
     * showConfirmModal(options, callback)
     * @param {object} opts
     *   - icon         {string}  emoji (default '❓')
     *   - title        {string}  judul modal
     *   - message      {string}  HTML pesan
     *   - confirmText  {string}  label tombol confirm (default 'Konfirmasi')
     *   - loadingText  {string}  label tombol saat loading (default 'Memproses...')
     *   - confirmClass {string}  CSS class tambahan pada tombol confirm
     * @param {function} callback  dipanggil setelah user klik Confirm (boleh async)
     */
    window.showConfirmModal = function (opts, callback) {
        injectStyles();
        const overlay = getOrCreateModal();

        opts = opts || {};
        const icon = opts.icon || '❓';
        const title = opts.title || 'Konfirmasi';
        const message = opts.message || 'Apakah Anda yakin?';
        const confirmText = opts.confirmText || 'Konfirmasi';
        const loadingText = opts.loadingText || 'Memproses...';
        const confirmClass = opts.confirmClass || 'btn-primary';

        document.getElementById('gcm-icon').textContent = icon;
        document.getElementById('gcm-title').textContent = title;
        document.getElementById('gcm-msg').innerHTML = message;

        const btnConfirm = document.getElementById('gcm-btn-confirm');
        btnConfirm.textContent = confirmText;
        btnConfirm.className = 'btn ' + confirmClass;
        btnConfirm.disabled = false;

        // Hapus listener lama (clone trick)
        const newConfirm = btnConfirm.cloneNode(true);
        btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);

        const btnCancel = document.getElementById('gcm-btn-cancel');
        const newCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newCancel, btnCancel);

        function close() { overlay.style.display = 'none'; }

        const freshConfirm = document.getElementById('gcm-btn-confirm');
        const freshCancel = document.getElementById('gcm-btn-cancel');

        freshConfirm.addEventListener('click', async function () {
            // ── Set loading state ──────────────────────────
            freshConfirm.disabled = true;
            freshCancel.disabled = true;
            freshConfirm.innerHTML = `<span class="gcm-spinner"></span> ${loadingText}`;

            try {
                if (typeof callback === 'function') {
                    await Promise.resolve(callback());
                }
            } finally {
                // ── Reset + close ──────────────────────────
                close();
                freshConfirm.disabled = false;
                freshCancel.disabled = false;
                freshConfirm.textContent = confirmText;
                freshConfirm.className = 'btn ' + confirmClass;
            }
        });

        freshCancel.addEventListener('click', close);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

        overlay.style.display = 'flex';
    };

})();
