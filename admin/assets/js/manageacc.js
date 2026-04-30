// ============================================================
// manageacc.js — Manajemen Akun section (SPA)
// Admin Panel — Dinas Koperasi UKM
// Changes:
//   1. Layout konsisten dengan halaman lain (section-page-header, container)
//   2. Fix FOUC: CSS diinjeksi ke <head> sebelum innerHTML di-set
//   3. Password di-hash SHA-256 via Web Crypto API sebelum dikirim ke GAS
//   4. UI diperbaiki: role cards, badge, avatar konsisten
//   5. [FIX] Default role fallback diubah dari 'subumum' ke 'subkendaraan'
//   6. [FIX] Semua role baru terdaftar dengan benar
//   7. [FIX UTAMA] gasRequest diganti dengan flat-param JSONP agar role
//      tidak corrupt saat dikirim ke GAS (mencegah "Error: Role tidak valid")
// ============================================================
(function () {
    'use strict';

    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxNQCq-3r2xBQvug2uzlgGzUSm9FGNnXgoZjJKLzmZpw-BltRPUoCP8gFw8Ke2SV1Z8Eg/exec';
    const STYLE_ID = 'acc-section-styles';

    const ROLES = {
        superadmin: {
            label: 'Super Admin',
            icon: '🛡️',
            color: '#1e293b', bg: '#f1f5f9', border: '#cbd5e1'
        },
        // --- Sub Bagian Umum (dipecah 3) ---
        subkendaraan: {
            label: 'Subbag Kendaraan & Ruang Rapat',
            icon: '🚗',
            color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe'
        },
        subvoucher: {
            label: 'Subbag Voucher BBM',
            icon: '⛽',
            color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc'
        },
        subkearsipan: {
            label: 'Subbag Kearsipan',
            icon: '📁',
            color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe'
        },
        // --- Keuangan ---
        subkeuangan: {
            label: 'Subbag Keuangan',
            icon: '💰',
            color: '#15803d', bg: '#f0fdf4', border: '#86efac'
        },
        // --- Program (dulu: sekretariat) ---
        program: {
            label: 'Program',
            icon: '📊',
            color: '#b45309', bg: '#fffbeb', border: '#fde68a'
        },
        // --- Penilai ---
        penilai_sekretariat: {
            label: 'Penilai Sekretariat',
            icon: '✍️',
            color: '#6b21a8', bg: '#faf5ff', border: '#d8b4fe'
        },
        penilai_ketua: {
            label: 'Penilai Ketua',
            icon: '👑',
            color: '#92400e', bg: '#fef3c7', border: '#fcd34d'
        },
        penilai_koperasi: {
            label: 'Penilai Bidang Koperasi',
            icon: '🤝',
            color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7'
        },
        penilai_ukm: {
            label: 'Penilai Bidang UKM',
            icon: '🏪',
            color: '#1e40af', bg: '#dbeafe', border: '#93c5fd'
        },
        penilai_usaha_mikro: {
            label: 'Penilai Bidang Usaha Mikro',
            icon: '🏬',
            color: '#9a3412', bg: '#fff7ed', border: '#fdba74'
        },
        penilai_kewirausahaan: {
            label: 'Penilai Bidang Kewirausahaan',
            icon: '💡',
            color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd'
        },
        penilai_blut: {
            label: 'Penilai BLUT KUMKM',
            icon: '🏢',
            color: '#4338ca', bg: '#eef2ff', border: '#a5b4fc'
        },
    };

    let allUsers = [], filteredUsers = [];
    let currentPage = 1;
    const PAGE_SIZE = 10;
    let editingId = null;

    const AV_COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9', '#14b8a6', '#f97316'];
    function avColor(email) {
        let h = 0;
        for (const c of (email || '')) h = (h << 5) - h + c.charCodeAt(0);
        return AV_COLORS[Math.abs(h) % AV_COLORS.length];
    }
    function initials(name) {
        return (name || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
    }

    // ── SHA-256 hash via Web Crypto API ────────────────────
    async function sha256(str) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ── Inject CSS ke <head> ───────────────────────────────
    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
/* ── Avatar ── */
.acc-avatar {
    width: 38px; height: 38px; border-radius: 10px;
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 14px; color: white; flex-shrink: 0;
}
.acc-avatar-lg {
    width: 52px; height: 52px; border-radius: 14px; font-size: 20px;
}
/* ── User cell ── */
.acc-user-cell { display: flex; align-items: center; gap: 10px; }
.acc-user-name { font-weight: 600; font-size: 14px; color: #1e293b; }
.acc-user-email { font-size: 12px; color: #64748b; margin-top: 1px; }
.acc-user-id { font-size: 10px; color: #94a3b8; margin-top: 1px; font-family: monospace; }
/* ── Role badge ── */
.acc-role-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
    border: 1px solid; white-space: nowrap;
}
/* ── API Bar ── */
.acc-api-bar {
    padding: 8px 20px; font-size: 12px; font-weight: 500;
    display: flex; align-items: center; gap: 8px;
    border-bottom: 1px solid #f1f5f9; min-height: 36px;
    color: #64748b; transition: all 0.3s;
}
.acc-api-bar.loading { background: #f8fafc; color: #3b82f6; }
.acc-api-bar.ok      { background: #f0fdf4; color: #15803d; }
.acc-api-bar.err     { background: #fef2f2; color: #dc2626; }
.acc-api-dot {
    width: 8px; height: 8px; border-radius: 50%; background: currentColor; flex-shrink: 0;
}
.acc-api-bar.loading .acc-api-dot { animation: accPulse 1s infinite; }
@keyframes accPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
/* ── Role options (form) ── */
.acc-role-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
.acc-role-opt { position: relative; }
.acc-role-opt input[type="radio"] { position: absolute; opacity: 0; width: 0; height: 0; }
.acc-role-opt-label {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px; border: 2px solid #e5e7eb;
    cursor: pointer; transition: all 0.15s; background: white;
}
.acc-role-opt-label:hover { border-color: #94a3b8; background: #f8fafc; }
.acc-role-opt input:checked + .acc-role-opt-label { border-color: #3b82f6; background: #eff6ff; }
.acc-role-ico { font-size: 18px; }
.acc-role-nm { font-size: 13px; font-weight: 600; color: #1e293b; }
.acc-role-ds { font-size: 11px; color: #94a3b8; margin-top: 1px; }
/* ── Field error ── */
.acc-field-err { font-size: 12px; color: #dc2626; margin-top: 4px; display: none; }
.acc-field-hint { font-size: 12px; color: #64748b; margin-top: 4px; }
.input-field.err, .form-input.err { border-color: #dc2626 !important; box-shadow: 0 0 0 3px rgba(220,38,38,.1) !important; }
/* ── Superadmin banner ── */
.acc-banner {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
    border-radius: 10px; padding: 18px 22px; margin-bottom: 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
}
.acc-banner-title { color: white; font-size: 15px; font-weight: 700; }
.acc-banner-sub { color: #94a3b8; font-size: 12px; margin-top: 3px; }
.acc-banner-badge {
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
    color: #e2e8f0; font-size: 11px; font-weight: 700; letter-spacing: .05em;
    padding: 5px 14px; border-radius: 20px; white-space: nowrap;
}
/* ── View grid (detail modal) ── */
.acc-view-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.acc-view-field { background: #f8fafc; border-radius: 8px; padding: 12px 14px; }
.acc-view-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; margin-bottom: 4px; }
.acc-view-value { font-size: 14px; font-weight: 600; color: #1e293b; }
/* ── Modal close btn ── */
.acc-modal-close {
    width: 32px; height: 32px; border-radius: 8px; border: none;
    background: #f1f5f9; cursor: pointer; display: flex; align-items: center;
    justify-content: center; color: #64748b; transition: all .15s;
}
.acc-modal-close:hover { background: #e2e8f0; color: #1e293b; }
/* ── Confirm modal ── */
.acc-confirm-ico { font-size: 40px; text-align: center; margin-bottom: 12px; }
.acc-confirm-title { font-size: 18px; font-weight: 700; color: #1e293b; text-align: center; margin-bottom: 8px; }
.acc-confirm-msg { font-size: 13px; color: #64748b; text-align: center; line-height: 1.6; }
/* ── Password strength ── */
.acc-pass-strength { display: flex; gap: 4px; margin-top: 6px; }
.acc-pass-bar { flex: 1; height: 3px; border-radius: 2px; background: #e5e7eb; transition: background .2s; }
.acc-pass-label { font-size: 11px; color: #94a3b8; margin-top: 4px; }
/* ── Mobile cards ── */
#acc-mobile-cards { display: none; padding: 0 16px 8px; }
@media (max-width: 768px) {
    .table-container table { display: none; }
    #acc-mobile-cards { display: block; }
    .acc-role-opts { grid-template-columns: 1fr; }
    .acc-view-grid { grid-template-columns: 1fr; }
}
        `;
        document.head.appendChild(style);
    }

    // ── JSONP helper (flat params — TIDAK pakai jsonBody) ──────────────
    // Ini adalah fix utama: semua field dikirim sebagai query param biasa,
    // bukan di-encode ke jsonBody, sehingga GAS menerimanya dengan benar
    // dan tidak ada risiko double-decode yang merusak nilai field seperti
    // penilai_sekretariat, penilai_blut, dll.
    function gasGet(params) {
        return new Promise((resolve, reject) => {
            const cb = '__gas_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
            const qs = new URLSearchParams({ ...params, callback: cb }).toString();
            const script = document.createElement('script');
            let done = false;
            window[cb] = data => { done = true; delete window[cb]; script.remove(); resolve(data); };
            script.onerror = () => { if (done) return; delete window[cb]; script.remove(); reject(new Error('Gagal terhubung ke server')); };
            setTimeout(() => { if (done) return; delete window[cb]; script.remove(); reject(new Error('Request timeout (15s)')); }, 15000);
            script.src = `${GAS_URL}?${qs}`;
            document.head.appendChild(script);
        });
    }

    // ── gasRequest: sekarang pakai flat params, BUKAN jsonBody ────────────
    // Ini menggantikan implementasi lama yang pakai jsonBody dan menyebabkan
    // role seperti penilai_sekretariat tidak terbaca dengan benar di GAS.
    function gasRequest(payload) {
        return gasGet(payload);
    }

    // ── Load Users ─────────────────────────────────────────
    window.accLoadUsers = async function () {
        accShowApiBar('loading', 'Memuat data dari Google Sheets…');
        accSetTableLoading();
        try {
            const res = await gasGet({ action: 'getUsers' });
            if (res.status === 'success') {
                allUsers = res.users || [];
                accShowApiBar('ok', `Berhasil memuat ${allUsers.length} akun`);
                window.accApplyFilter();
            } else {
                throw new Error(res.message || 'Gagal memuat data');
            }
        } catch (err) {
            accShowApiBar('err', err.message);
            if (window.showToast) showToast('Gagal memuat data: ' + err.message, 'error');
            allUsers = [];
            window.accApplyFilter();
        }
    };

    // ── Filter & Render ────────────────────────────────────
    window.accApplyFilter = function () {
        const q = (document.getElementById('acc-searchQ')?.value || '').trim().toLowerCase();
        const role = document.getElementById('acc-fltRole')?.value || '';
        filteredUsers = allUsers.filter(u => {
            const mQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
            const mR = !role || u.role === role;
            return mQ && mR;
        });
        currentPage = 1;
        accRenderStats();
        accRender();
    };

    function accRenderStats() {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        const penilaiRoles = [
            'penilai_sekretariat','penilai_ketua','penilai_koperasi','penilai_ukm',
            'penilai_usaha_mikro','penilai_kewirausahaan','penilai_blut'
        ];
        set('acc-stat-super',     allUsers.filter(u => u.role === 'superadmin').length);
        set('acc-stat-kendaraan', allUsers.filter(u => u.role === 'subkendaraan').length);
        set('acc-stat-voucher',   allUsers.filter(u => u.role === 'subvoucher').length);
        set('acc-stat-kearsipan', allUsers.filter(u => u.role === 'subkearsipan').length);
        set('acc-stat-keuangan',  allUsers.filter(u => u.role === 'subkeuangan').length);
        set('acc-stat-program',   allUsers.filter(u => u.role === 'program').length);
        set('acc-stat-penilai',   allUsers.filter(u => penilaiRoles.includes(u.role)).length);
    }

    function accRender() {
        const start = (currentPage - 1) * PAGE_SIZE;
        const items = filteredUsers.slice(start, start + PAGE_SIZE);
        const tbody = document.getElementById('acc-tbl-body');
        const cards = document.getElementById('acc-mobile-cards');
        const pager = document.getElementById('acc-pagination');
        if (!tbody || !pager) return;

        if (filteredUsers.length === 0) {
            const emptyHtml = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#94a3b8;">
                <div style="font-size:32px;margin-bottom:8px;">🔍</div>
                <div style="font-weight:600;margin-bottom:4px;">Tidak ada akun ditemukan</div>
                <div style="font-size:13px;">Coba ubah kata kunci atau filter</div>
            </td></tr>`;
            tbody.innerHTML = emptyHtml;
            if (cards) cards.innerHTML = '';
            pager.innerHTML = '';
            return;
        }

        tbody.innerHTML = items.map((u, i) => {
            const no = start + i + 1;
            const r = ROLES[u.role] || { label: u.role, color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', icon: '👤' };
            return `<tr>
                <td style="color:#94a3b8;font-weight:600;font-size:12px;width:40px;">${no}</td>
                <td>
                    <div class="acc-user-cell">
                        <div class="acc-avatar" style="background:${avColor(u.email)}">${initials(u.name)}</div>
                        <div>
                            <div class="acc-user-name">${esc(u.name)}</div>
                            <div class="acc-user-email">${esc(u.email)}</div>
                            <div class="acc-user-id">${esc(u.id)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="acc-role-badge" style="color:${r.color};background:${r.bg};border-color:${r.border};">
                        ${r.icon} ${r.label}
                    </span>
                </td>
                <td style="font-size:13px;color:#64748b;">${accFmtDate(u.createdAt)}</td>
                <td>
                    <div class="action-buttons" style="justify-content:center;">
                        <div class="btn-icon-group">
                            <button onclick="accViewUser('${escA(u.id)}')" class="btn-icon btn-icon-view" title="Detail">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button onclick="accOpenForm('edit','${escA(u.id)}')" class="btn-icon btn-icon-edit" title="Edit">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onclick="accConfirmDelete('${escA(u.id)}')" class="btn-icon btn-icon-delete" title="Hapus">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>`;
        }).join('');

        if (cards) {
            cards.innerHTML = items.map(u => {
                const r = ROLES[u.role] || { label: u.role, color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', icon: '👤' };
                return `<div class="documents-card" style="margin-bottom:12px;">
                    <div class="documents-card-header">
                        <div style="display:flex;align-items:center;gap:10px;flex:1;">
                            <div class="acc-avatar" style="background:${avColor(u.email)}">${initials(u.name)}</div>
                            <div>
                                <div class="documents-card-title">${esc(u.name)}</div>
                                <div class="documents-card-subtitle">${esc(u.email)}</div>
                            </div>
                        </div>
                        <span class="acc-role-badge" style="color:${r.color};background:${r.bg};border-color:${r.border};">${r.icon} ${r.label}</span>
                    </div>
                    <div class="documents-card-body">
                        <div class="documents-card-row">
                            <span class="documents-card-label">Dibuat</span>
                            <span class="documents-card-value">${accFmtDate(u.createdAt)}</span>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;padding-top:12px;border-top:1px solid #f1f5f9;margin-top:4px;">
                        <button onclick="accViewUser('${escA(u.id)}')" class="btn btn-sm" style="flex:1;">👁️ Detail</button>
                        <button onclick="accOpenForm('edit','${escA(u.id)}')" class="btn btn-sm" style="flex:1;">✏️ Edit</button>
                        <button onclick="accConfirmDelete('${escA(u.id)}')" class="btn btn-sm btn-danger" style="flex:1;">🗑️ Hapus</button>
                    </div>
                </div>`;
            }).join('');
        }

        const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
        pager.innerHTML = totalPages <= 1 ? '' : `
            <button onclick="accGoPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&#8249; Prev</button>
            <span class="pagination-info">Halaman ${currentPage} dari ${totalPages} (${filteredUsers.length} akun)</span>
            <button onclick="accGoPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next &#8250;</button>`;
    }

    window.accGoPage = function (p) {
        const total = Math.ceil(filteredUsers.length / PAGE_SIZE);
        if (p < 1 || p > total) return;
        currentPage = p;
        accRender();
    };

    function accSetTableLoading() {
        const tbody = document.getElementById('acc-tbl-body');
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;">
            <div class="spinner"></div>
            <div style="margin-top:12px;color:#94a3b8;">Memuat data...</div>
        </td></tr>`;
    }

    // ── Form: Tambah / Edit ────────────────────────────────
    window.accOpenForm = function (mode, id) {
        editingId = null;
        accClearErrs();
        const isEdit = mode === 'edit';

        document.getElementById('acc-form-title').textContent = isEdit ? '✏️ Edit Akun' : '✚ Tambah Akun Baru';
        document.getElementById('acc-save-lbl').textContent = isEdit ? 'Perbarui Akun' : 'Simpan Akun';
        document.getElementById('acc-pass-req').style.display = isEdit ? 'none' : 'inline';
        document.getElementById('acc-pass-hint').style.display = isEdit ? 'block' : 'none';
        document.getElementById('acc-f-password').placeholder = isEdit ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter';
        document.getElementById('acc-f-password').value = '';
        accUpdateStrength('');

        if (isEdit) {
            const u = allUsers.find(x => x.id === id);
            if (!u) return;
            editingId = id;
            document.getElementById('acc-f-name').value = u.name;
            document.getElementById('acc-f-email').value = u.email;
            const r = document.querySelector(`#section-manageacc input[name="acc-role"][value="${u.role}"]`);
            if (r) r.checked = true;
        } else {
            document.getElementById('acc-f-name').value = '';
            document.getElementById('acc-f-email').value = '';
            // [FIX] Default role adalah 'subkendaraan'
            const def = document.querySelector('#section-manageacc input[name="acc-role"][value="subkendaraan"]');
            if (def) def.checked = true;
        }

        document.getElementById('acc-ov-view').style.display = 'none';
        document.getElementById('acc-ov-form').style.display = 'flex';
    };

    window.accSaveAccount = async function () {
        accClearErrs();
        const name     = document.getElementById('acc-f-name').value.trim();
        const email    = document.getElementById('acc-f-email').value.trim();
        const password = document.getElementById('acc-f-password').value;
        // [FIX] Default fallback ke 'subkendaraan'
        const role     = document.querySelector('#section-manageacc input[name="acc-role"]:checked')?.value || 'subkendaraan';
        let valid = true;

        if (!name) { accShowErr('acc-e-name', 'acc-f-name'); valid = false; }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { accShowErr('acc-e-email', 'acc-f-email'); valid = false; }
        if (!editingId && password.length < 8) { accShowErr('acc-e-password', 'acc-f-password'); valid = false; }
        if (editingId && password && password.length < 8) { accShowErr('acc-e-password', 'acc-f-password'); valid = false; }
        if (!valid) return;

        const btn  = document.getElementById('acc-btn-save');
        const orig = btn.innerHTML;
        const savedId = editingId;

        const resetBtn = () => { btn.disabled = false; btn.innerHTML = orig; };

        btn.disabled = true;
        btn.innerHTML = `<span class="spinner spinner-sm"></span> Menyimpan...`;

        try {
            let payload;
            if (savedId) {
                // UPDATE — kirim sebagai flat params
                payload = { action: 'updateUser', id: savedId, name, email, role };
                if (password) payload.password = await sha256(password);
            } else {
                // CREATE — kirim sebagai flat params
                payload = { action: 'createUser', name, email, password: await sha256(password), role };
            }

            // gasRequest sekarang = gasGet (flat params), tidak ada jsonBody
            const res = await gasRequest(payload);

            if (res.status === 'success') {
                if (window.showToast) showToast(savedId ? 'Akun berhasil diperbarui!' : 'Akun baru berhasil dibuat!', 'success');
                const ov = document.getElementById('acc-ov-form');
                if (ov) ov.style.display = 'none';
                editingId = null;
                resetBtn();
                await window.accLoadUsers();
            } else {
                throw new Error(res.message || 'Gagal menyimpan');
            }
        } catch (err) {
            if (window.showToast) showToast('Error: ' + err.message, 'error');
            resetBtn();
        }
    };

    // ── View Detail ────────────────────────────────────────
    window.accViewUser = function (id) {
        const u = allUsers.find(x => x.id === id);
        if (!u) return;
        const r = ROLES[u.role] || { label: u.role, color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', icon: '👤' };
        document.getElementById('acc-v-avatar').style.background = avColor(u.email);
        document.getElementById('acc-v-avatar').textContent = initials(u.name);
        document.getElementById('acc-v-name').textContent = u.name;
        document.getElementById('acc-v-email').textContent = u.email;
        document.getElementById('acc-v-role-badge').innerHTML = `<span class="acc-role-badge" style="color:${r.color};background:${r.bg};border-color:${r.border};">${r.icon} ${r.label}</span>`;
        document.getElementById('acc-v-id').textContent = u.id;
        document.getElementById('acc-v-role').textContent = `${r.icon} ${r.label}`;
        document.getElementById('acc-v-email2').textContent = u.email;
        document.getElementById('acc-v-created').textContent = accFmtDate(u.createdAt);
        document.getElementById('acc-v-edit-btn').onclick = () => {
            document.getElementById('acc-ov-view').style.display = 'none';
            window.accOpenForm('edit', id);
        };
        document.getElementById('acc-ov-view').style.display = 'flex';
    };

    // ── Delete ─────────────────────────────────────────────
    window.accConfirmDelete = function (id) {
        const u = allUsers.find(x => x.id === id);
        if (!u) return;

        document.getElementById('acc-del-name').textContent = u.name;

        const btn = document.getElementById('acc-btn-confirm-del');
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.onclick = () => accDoDelete(id);

        document.getElementById('acc-ov-delete').style.display = 'flex';
    };

    async function accDoDelete(id) {
        const btn = document.getElementById('acc-btn-confirm-del');
        const orig = btn.innerHTML;

        const resetBtn = () => { btn.disabled = false; btn.innerHTML = orig; };

        btn.disabled = true;
        btn.innerHTML = `<span class="spinner spinner-sm"></span> Menghapus...`;

        try {
            const res = await gasRequest({ action: 'deleteUser', id });
            if (res.status === 'success') {
                if (window.showToast) showToast('Akun berhasil dihapus!', 'success');
                const ov = document.getElementById('acc-ov-delete');
                if (ov) ov.style.display = 'none';
                resetBtn();
                await window.accLoadUsers();
            } else {
                throw new Error(res.message || 'Gagal menghapus');
            }
        } catch (err) {
            if (window.showToast) showToast('Error: ' + err.message, 'error');
            resetBtn();
        }
    }

    // ── Password strength indicator ────────────────────────
    function accUpdateStrength(val) {
        const bars = document.querySelectorAll('#section-manageacc .acc-pass-bar');
        const label = document.getElementById('acc-pass-strength-label');
        if (!bars.length || !label) return;
        let score = 0;
        if (val.length >= 8) score++;
        if (val.length >= 12) score++;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;
        const levels = [
            { color: '#e5e7eb', text: '' },
            { color: '#ef4444', text: 'Sangat lemah' },
            { color: '#f59e0b', text: 'Lemah' },
            { color: '#eab308', text: 'Cukup' },
            { color: '#22c55e', text: 'Kuat' },
            { color: '#10b981', text: 'Sangat kuat' },
        ];
        const lv = val.length === 0 ? 0 : Math.max(1, Math.min(score, 5));
        bars.forEach((b, i) => { b.style.background = i < lv ? levels[lv].color : '#e5e7eb'; });
        label.textContent = levels[lv].text;
        label.style.color = levels[lv].color;
    }

    // ── Helpers ────────────────────────────────────────────
    function accClearErrs() {
        document.querySelectorAll('#section-manageacc .acc-field-err').forEach(e => e.style.display = 'none');
        document.querySelectorAll('#section-manageacc .input-field').forEach(e => e.classList.remove('err'));
    }
    function accShowErr(errId, fieldId) {
        const e = document.getElementById(errId); if (e) e.style.display = 'block';
        const f = document.getElementById(fieldId); if (f) f.classList.add('err');
    }
    function accShowApiBar(type, msg) {
        const bar = document.getElementById('acc-api-bar');
        if (!bar) return;
        bar.className = 'acc-api-bar ' + type;
        bar.innerHTML = `<div class="acc-api-dot"></div> ${esc(msg)}`;
        if (type === 'ok') setTimeout(() => { if (bar) bar.className = 'acc-api-bar'; }, 4000);
    }
    function accFmtDate(d) {
        if (!d || d === '—') return '—';
        try { const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    }
    function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function escA(s) { return String(s || '').replace(/'/g, "\\'"); }

    // ═══════════════════════════════════════════════════════
    // REGISTER SECTION
    // ═══════════════════════════════════════════════════════
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['manageacc'] = function () {
        const section = document.getElementById('section-manageacc');
        if (!section) return;

        injectStyles();

        section.innerHTML = `
<div class="container">

    <!-- Page Header -->
    <div class="section-page-header">
        <h1 class="section-page-title">Manajemen Akun</h1>
        <p class="section-page-subtitle">Pengelolaan akun pengguna Admin Panel</p>
    </div>

    <!-- Superadmin Banner -->
    <div class="acc-banner">
        <div>
            <div class="acc-banner-title">🛡️ Halaman Khusus Super Admin</div>
            <div class="acc-banner-sub">CRUD akun pengguna — password di-hash SHA-256 sebelum disimpan ke Google Sheets</div>
        </div>
        <div class="acc-banner-badge">SUPER ADMIN ACCESS</div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
        <div class="stat-card" style="border-left:4px solid #1e293b;">
            <div class="stat-label">Super Admin</div>
            <div class="stat-value" id="acc-stat-super">0</div>
            <div class="stat-footer">Akses penuh</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #1d4ed8;">
            <div class="stat-label">Kendaraan &amp; Ruang Rapat</div>
            <div class="stat-value" id="acc-stat-kendaraan">0</div>
            <div class="stat-footer">Pengajuan kendaraan &amp; ruang</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #0891b2;">
            <div class="stat-label">Voucher BBM</div>
            <div class="stat-value" id="acc-stat-voucher">0</div>
            <div class="stat-footer">Distribusi BBM</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #7c3aed;">
            <div class="stat-label">Kearsipan</div>
            <div class="stat-value" id="acc-stat-kearsipan">0</div>
            <div class="stat-footer">Arsip &amp; diklat</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #15803d;">
            <div class="stat-label">Sub Bag. Keuangan</div>
            <div class="stat-value" id="acc-stat-keuangan">0</div>
            <div class="stat-footer">SPJ &amp; keuangan</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #b45309;">
            <div class="stat-label">Program</div>
            <div class="stat-value" id="acc-stat-program">0</div>
            <div class="stat-footer">Monev &amp; penilaian</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #6b21a8;">
            <div class="stat-label">Penilai</div>
            <div class="stat-value" id="acc-stat-penilai">0</div>
            <div class="stat-footer">7 role penilai</div>
        </div>
    </div>

    <!-- Table Card -->
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">Daftar Akun Pengguna</h2>
            <div class="filter-container">
                <select class="select-input" id="acc-fltRole" onchange="accApplyFilter()">
                    <option value="">Semua Role</option>
                    <optgroup label="Super Admin">
                        <option value="superadmin">Super Admin</option>
                    </optgroup>
                    <optgroup label="Sub Bagian Umum">
                        <option value="subkendaraan">Subbag Kendaraan &amp; Ruang Rapat</option>
                        <option value="subvoucher">Subbag Voucher BBM</option>
                        <option value="subkearsipan">Subbag Kearsipan</option>
                    </optgroup>
                    <optgroup label="Keuangan">
                        <option value="subkeuangan">Subbag Keuangan</option>
                    </optgroup>
                    <optgroup label="Program">
                        <option value="program">Program</option>
                    </optgroup>
                    <optgroup label="Penilai">
                        <option value="penilai_sekretariat">Penilai Sekretariat</option>
                        <option value="penilai_ketua">Penilai Ketua</option>
                        <option value="penilai_koperasi">Penilai Bidang Koperasi</option>
                        <option value="penilai_ukm">Penilai Bidang UKM</option>
                        <option value="penilai_usaha_mikro">Penilai Bidang Usaha Mikro</option>
                        <option value="penilai_kewirausahaan">Penilai Bidang Kewirausahaan</option>
                        <option value="penilai_blut">Penilai BLUT KUMKM</option>
                    </optgroup>
                </select>
                <input type="text" class="search-input" id="acc-searchQ" placeholder="Cari nama / email..." oninput="accApplyFilter()">
                <button onclick="accLoadUsers()" class="btn btn-sm" title="Refresh">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Refresh
                </button>
                <button onclick="accOpenForm('add')" class="btn btn-sm btn-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Tambah Akun
                </button>
            </div>
        </div>

        <div class="acc-api-bar" id="acc-api-bar"></div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width:40px;">#</th>
                        <th>Pengguna</th>
                        <th>Role</th>
                        <th>Dibuat</th>
                        <th style="text-align:center;width:110px;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="acc-tbl-body">
                    <tr><td colspan="5" style="text-align:center;padding:40px;">
                        <div class="spinner"></div>
                        <div style="margin-top:12px;color:#94a3b8;">Memuat data...</div>
                    </td></tr>
                </tbody>
            </table>
        </div>

        <div id="acc-mobile-cards"></div>
        <div class="pagination" id="acc-pagination"></div>
    </div>

</div>

<!-- MODAL: TAMBAH / EDIT -->
<div class="modal-overlay" id="acc-ov-form" style="display:none;">
    <div class="modal" style="max-width:560px;">
        <div class="modal-header">
            <h2 class="modal-title" id="acc-form-title">✚ Tambah Akun Baru</h2>
            <button class="acc-modal-close" onclick="document.getElementById('acc-ov-form').style.display='none'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <div class="modal-content" style="display:flex;flex-direction:column;gap:14px;">
            <div class="alert alert-info" style="margin:0;">
                🔐 Password akan di-hash <strong>SHA-256</strong> di browser sebelum dikirim ke server — tidak pernah tersimpan dalam bentuk plain text.
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group" style="margin:0;">
                    <label class="input-label">Nama Lengkap <span style="color:#ef4444;">*</span></label>
                    <input type="text" class="input-field form-input" id="acc-f-name" placeholder="cth. Budi Santoso">
                    <div class="acc-field-err" id="acc-e-name">Nama wajib diisi</div>
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="input-label">Email <span style="color:#ef4444;">*</span></label>
                    <input type="email" class="input-field form-input" id="acc-f-email" placeholder="cth. budi@dinas.gov.id">
                    <div class="acc-field-err" id="acc-e-email">Email tidak valid</div>
                </div>
            </div>

            <div class="form-group" style="margin:0;">
                <label class="input-label">
                    Password <span style="color:#ef4444;" id="acc-pass-req">*</span>
                </label>
                <input type="password" class="input-field form-input" id="acc-f-password"
                    placeholder="Minimal 8 karakter"
                    oninput="accUpdateStrength(this.value)">
                <div class="acc-pass-strength" id="acc-pass-strength">
                    <div class="acc-pass-bar"></div>
                    <div class="acc-pass-bar"></div>
                    <div class="acc-pass-bar"></div>
                    <div class="acc-pass-bar"></div>
                    <div class="acc-pass-bar"></div>
                </div>
                <div class="acc-pass-label" id="acc-pass-strength-label"></div>
                <div class="acc-field-hint" id="acc-pass-hint" style="display:none;">Kosongkan jika tidak ingin mengubah password</div>
                <div class="acc-field-err" id="acc-e-password">Password minimal 8 karakter</div>
            </div>

            <div class="form-group" style="margin:0;">
                <label class="input-label">Role Akun <span style="color:#ef4444;">*</span></label>
                <div class="acc-role-opts" style="grid-template-columns:1fr 1fr;">

                    <!-- Super Admin -->
                    <div class="acc-role-opt" style="grid-column:1/-1;">
                        <input type="radio" name="acc-role" id="acc-r-superadmin" value="superadmin">
                        <label class="acc-role-opt-label" for="acc-r-superadmin">
                            <span class="acc-role-ico">🛡️</span>
                            <div><div class="acc-role-nm">Super Admin</div><div class="acc-role-ds">Akses penuh &amp; kelola akun</div></div>
                        </label>
                    </div>

                    <!-- Sub Bagian Umum (3 role) -->
                    <div style="grid-column:1/-1;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding:8px 0 4px;">Sub Bagian Umum</div>

                    <div class="acc-role-opt">
                        <input type="radio" name="acc-role" id="acc-r-subkendaraan" value="subkendaraan" checked>
                        <label class="acc-role-opt-label" for="acc-r-subkendaraan">
                            <span class="acc-role-ico">🚗</span>
                            <div><div class="acc-role-nm">Kendaraan &amp; Ruang Rapat</div><div class="acc-role-ds">Pengajuan kendaraan &amp; ruang</div></div>
                        </label>
                    </div>
                    <div class="acc-role-opt">
                        <input type="radio" name="acc-role" id="acc-r-subvoucher" value="subvoucher">
                        <label class="acc-role-opt-label" for="acc-r-subvoucher">
                            <span class="acc-role-ico">⛽</span>
                            <div><div class="acc-role-nm">Voucher BBM</div><div class="acc-role-ds">Permintaan &amp; distribusi BBM</div></div>
                        </label>
                    </div>
                    <div class="acc-role-opt">
                        <input type="radio" name="acc-role" id="acc-r-subkearsipan" value="subkearsipan">
                        <label class="acc-role-opt-label" for="acc-r-subkearsipan">
                            <span class="acc-role-ico">📁</span>
                            <div><div class="acc-role-nm">Kearsipan</div><div class="acc-role-ds">Kearsipan internal &amp; diklat</div></div>
                        </label>
                    </div>

                    <!-- Keuangan -->
                    <div style="grid-column:1/-1;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding:8px 0 4px;">Keuangan</div>

                    <div class="acc-role-opt">
                        <input type="radio" name="acc-role" id="acc-r-subkeuangan" value="subkeuangan">
                        <label class="acc-role-opt-label" for="acc-r-subkeuangan">
                            <span class="acc-role-ico">💰</span>
                            <div><div class="acc-role-nm">Sub Bagian Keuangan</div><div class="acc-role-ds">SPJ, pengajuan dana</div></div>
                        </label>
                    </div>

                    <!-- Program -->
                    <div style="grid-column:1/-1;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding:8px 0 4px;">Program</div>

                    <div class="acc-role-opt">
                        <input type="radio" name="acc-role" id="acc-r-program" value="program">
                        <label class="acc-role-opt-label" for="acc-r-program">
                            <span class="acc-role-ico">📊</span>
                            <div><div class="acc-role-nm">Program</div><div class="acc-role-ds">Monev &amp; penilaian orang</div></div>
                        </label>
                    </div>

                    <!-- Penilai -->
                    <div style="grid-column:1/-1;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding:8px 0 4px;">Penilai</div>

                    <div class="acc-role-opt">
                        <input type="radio" name="acc-role" id="acc-r-penilai_sekretariat" value="penilai_sekretariat">
                        <label class="acc-role-opt-label" for="acc-r-penilai_sekretariat">
                            <span class="acc-role-ico">✍️</span>
                            <div><div class="acc-role-nm">Penilai Sekretariat</div><div class="acc-role-ds">Menilai pegawai Sekretariat</div></div>
                        </label>
                    </div>
                    <div class="acc-role-opt">
                        <input type="radio" name="acc-role" id="acc-r-penilai_ketua" value="penilai_ketua">
                        <label class="acc-role-opt-label" for="acc-r-penilai_ketua">
                            <span class="acc-role-ico">👑</span>
                            <div><div class="acc-role-nm">Penilai Ketua</div><div class="acc-role-ds">Menilai 6 kepala bidang</div></div>
                        </label>
                    </div>
                    <div class="acc-role-opt">
                        <input type="radio" name="acc-role" id="acc-r-penilai_koperasi" value="penilai_koperasi">
                        <label class="acc-role-opt-label" for="acc-r-penilai_koperasi">
                            <span class="acc-role-ico">🤝</span>
                            <div><div class="acc-role-nm">Penilai Bidang Koperasi</div><div class="acc-role-ds">Menilai Bidang Koperasi</div></div>
                        </label>
                    </div>
                    <div class="acc-role-opt">
                        <input type="radio" name="acc-role" id="acc-r-penilai_ukm" value="penilai_ukm">
                        <label class="acc-role-opt-label" for="acc-r-penilai_ukm">
                            <span class="acc-role-ico">🏪</span>
                            <div><div class="acc-role-nm">Penilai Bidang UKM</div><div class="acc-role-ds">Menilai Bidang UKM</div></div>
                        </label>
                    </div>
                    <div class="acc-role-opt">
                        <input type="radio" name="acc-role" id="acc-r-penilai_usaha_mikro" value="penilai_usaha_mikro">
                        <label class="acc-role-opt-label" for="acc-r-penilai_usaha_mikro">
                            <span class="acc-role-ico">🏬</span>
                            <div><div class="acc-role-nm">Penilai Usaha Mikro</div><div class="acc-role-ds">Menilai Bidang Usaha Mikro</div></div>
                        </label>
                    </div>
                    <div class="acc-role-opt">
                        <input type="radio" name="acc-role" id="acc-r-penilai_kewirausahaan" value="penilai_kewirausahaan">
                        <label class="acc-role-opt-label" for="acc-r-penilai_kewirausahaan">
                            <span class="acc-role-ico">💡</span>
                            <div><div class="acc-role-nm">Penilai Kewirausahaan</div><div class="acc-role-ds">Menilai Bidang Kewirausahaan</div></div>
                        </label>
                    </div>
                    <div class="acc-role-opt">
                        <input type="radio" name="acc-role" id="acc-r-penilai_blut" value="penilai_blut">
                        <label class="acc-role-opt-label" for="acc-r-penilai_blut">
                            <span class="acc-role-ico">🏢</span>
                            <div><div class="acc-role-nm">Penilai BLUT KUMKM</div><div class="acc-role-ds">Menilai Balai Layanan Usaha Terpadu</div></div>
                        </label>
                    </div>

                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="document.getElementById('acc-ov-form').style.display='none'" class="btn" style="flex:1;">Batal</button>
            <button onclick="accSaveAccount()" id="acc-btn-save" class="btn btn-primary" style="flex:1;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span id="acc-save-lbl">Simpan Akun</span>
            </button>
        </div>
    </div>
</div>

<!-- MODAL: DETAIL -->
<div class="modal-overlay" id="acc-ov-view" style="display:none;">
    <div class="modal" style="max-width:480px;">
        <div class="modal-header">
            <h2 class="modal-title">Detail Akun</h2>
            <button class="acc-modal-close" onclick="document.getElementById('acc-ov-view').style.display='none'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <div class="modal-content">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f1f5f9;">
                <div class="acc-avatar acc-avatar-lg" id="acc-v-avatar"></div>
                <div>
                    <div style="font-size:16px;font-weight:700;color:#1e293b;" id="acc-v-name">—</div>
                    <div style="font-size:13px;color:#64748b;margin-top:2px;" id="acc-v-email">—</div>
                    <div style="margin-top:6px;" id="acc-v-role-badge"></div>
                </div>
            </div>
            <div class="acc-view-grid">
                <div class="acc-view-field">
                    <div class="acc-view-label">User ID</div>
                    <div class="acc-view-value" id="acc-v-id" style="font-family:monospace;font-size:11px;word-break:break-all;">—</div>
                </div>
                <div class="acc-view-field">
                    <div class="acc-view-label">Role</div>
                    <div class="acc-view-value" id="acc-v-role">—</div>
                </div>
                <div class="acc-view-field">
                    <div class="acc-view-label">Email</div>
                    <div class="acc-view-value" id="acc-v-email2" style="font-size:13px;">—</div>
                </div>
                <div class="acc-view-field">
                    <div class="acc-view-label">Dibuat</div>
                    <div class="acc-view-value" id="acc-v-created">—</div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="document.getElementById('acc-ov-view').style.display='none'" class="btn" style="flex:1;">Tutup</button>
            <button id="acc-v-edit-btn" class="btn btn-primary" style="flex:1;">✏️ Edit Akun</button>
        </div>
    </div>
</div>

<!-- MODAL: HAPUS -->
<div class="modal-overlay" id="acc-ov-delete" style="display:none;">
    <div class="modal" style="max-width:400px;">
        <div class="modal-content" style="padding:32px 24px;text-align:center;">
            <div class="acc-confirm-ico">🗑️</div>
            <div class="acc-confirm-title">Hapus Akun?</div>
            <div class="acc-confirm-msg">
                Akun <strong id="acc-del-name">—</strong> akan dihapus permanen dari Google Sheets.<br>
                <span style="color:#ef4444;font-weight:600;">Tindakan ini tidak dapat dibatalkan.</span>
            </div>
        </div>
        <div class="modal-footer" style="justify-content:center;">
            <button onclick="document.getElementById('acc-ov-delete').style.display='none'" class="btn" style="flex:1;">Batal</button>
            <button id="acc-btn-confirm-del" class="btn btn-danger" style="flex:1;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Ya, Hapus
            </button>
        </div>
    </div>
</div>
        `;

        document.querySelectorAll('#section-manageacc .modal-overlay').forEach(ov => {
            ov.addEventListener('click', e => { if (e.target === ov) ov.style.display = 'none'; });
        });

        window.accUpdateStrength = accUpdateStrength;
        window.accLoadUsers();
    };

})();