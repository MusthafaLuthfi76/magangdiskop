// ============================================================
// diklat.js — Diklat Training Management Section (SPA) v2.2
// Admin Panel — Dinas Koperasi UKM
//
// PERUBAHAN v2.2:
//  1. Lock triwulan HANYA berbasis periode bulan (TIDAK sequential):
//     Jan–Mar  → hanya Triwulan 1 terbuka
//     Apr–Jun  → Triwulan 1 & 2 terbuka
//     Jul–Sep  → Triwulan 1, 2 & 3 terbuka
//     Okt–Des  → semua 4 triwulan terbuka
//  2. Redesign tampilan: lebih profesional, modern, menarik
// ============================================================
(function () {
    'use strict';

    const API_URL = 'https://script.google.com/macros/s/AKfycbxsdAlN0gLea0f9iA9h5R8VTZJtIBK_JJxFwzP_TbP5lPNCq4oylR5rD6gPB5sshMjwlg/exec';

    const QUARTERS = [
        { key: 'triwulan1', label: 'Triwulan I',   sub: 'Jan – Mar', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6', gradient: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)' },
        { key: 'triwulan2', label: 'Triwulan II',  sub: 'Apr – Jun', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', dot: '#10b981', gradient: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)' },
        { key: 'triwulan3', label: 'Triwulan III', sub: 'Jul – Sep', color: '#b45309', bg: '#fffbeb', border: '#fcd34d', dot: '#f59e0b', gradient: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)' },
        { key: 'triwulan4', label: 'Triwulan IV',  sub: 'Okt – Des', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', dot: '#8b5cf6', gradient: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)' }
    ];

    // ── Daftar pegawai ──
    const PEGAWAI_LIST = [
        { nama: 'Ritaningrum, S.Sos., M.M.',                       unit: 'Sekretariat' },
        { nama: 'Hellen Phornica, S.T.P., M.Si.',                  unit: 'Bidang UKM' },
        { nama: 'Veronica Setioningtyas Prativi, S.Si., M.Si.',     unit: 'Bidang Usaha Mikro' },
        { nama: 'Wisnu Hermawan, S.P., M.T.',                       unit: 'Balai Layanan Usaha Terpadu KUMKM' },
        { nama: 'Ir. Setyo Hastuti, M.P.',                          unit: 'Bidang Koperasi' },
        { nama: 'Hana Fais Prabowo, S.T.P., M.Si.',                 unit: 'Bidang Kewirausahaan' },
        { nama: 'Fuji Ippa Wati, S.E.',                    unit: 'Sekretariat' },
        { nama: 'Winarto, S.E.',                            unit: 'Sekretariat' },
        { nama: 'Ice Norawati, S.E., Akt.',                 unit: 'Sekretariat' },
        { nama: 'Marselina Widaranti, S.T., M.T.',          unit: 'Sekretariat' },
        { nama: 'Hana Kurniawati',                          unit: 'Sekretariat' },
        { nama: 'Raden Bambang Bagus Tri Hantoro, S.M.',    unit: 'Sekretariat' },
        { nama: 'Heru Wiranto, SIP',                        unit: 'Sekretariat' },
        { nama: 'Septia Yudha Rennaningtyas, S.M.B.',       unit: 'Sekretariat' },
        { nama: 'Dias Hartanto, S.M.',                      unit: 'Sekretariat' },
        { nama: 'Anas Margono, S.Kom.',                     unit: 'Sekretariat' },
        { nama: 'Joko Sambudi Raharjo',                     unit: 'Sekretariat' },
        { nama: 'Luvianingsih, A.Md.',                      unit: 'Sekretariat' },
        { nama: 'Hesti Ratnasari, A.Md.',                   unit: 'Sekretariat' },
        { nama: 'Rana Salsabila Putri',                     unit: 'Sekretariat' },
        { nama: 'Bob Prabowo, S.E.',                        unit: 'Sekretariat' },
        { nama: 'Windu Wahyu Suryaningsih, S.E.',           unit: 'Sekretariat' },
        { nama: 'Dhaniar Fitria Widyaningtyas, S.E.',       unit: 'Sekretariat' },
        { nama: 'Nita Arum Sari, A.Md.Sek.',               unit: 'Sekretariat' },
        { nama: 'Purnama Setiawan, S.T.',            unit: 'Bidang Koperasi' },
        { nama: 'Fikri Muttaqin, S.A.B.',            unit: 'Bidang Koperasi' },
        { nama: 'Rembranto Gusani Putro, S.A.B.',    unit: 'Bidang Koperasi' },
        { nama: 'Faris Rizki Rahardian, S.H.',       unit: 'Bidang Koperasi' },
        { nama: 'Anindya Putri Kusumaningrum, S.H.', unit: 'Bidang Koperasi' },
        { nama: 'Firdha Ikhsania Fadilla, S.H.',     unit: 'Bidang Koperasi' },
        { nama: 'Laura Nindya Khalista, S.H.',       unit: 'Bidang Koperasi' },
        { nama: 'Perpetua Windhy Harmonie, S.E., M.E.', unit: 'Bidang UKM' },
        { nama: 'Yogie Krisnawangi Saifullah, S.A.B.',  unit: 'Bidang UKM' },
        { nama: 'Ali Najmudin, S.A.B.',                 unit: 'Bidang UKM' },
        { nama: 'Edi Susila',                           unit: 'Bidang UKM' },
        { nama: 'Asyifa Dicha Firani, S.T.',            unit: 'Bidang UKM' },
        { nama: 'Deni Wijayanto, S.Kom.',               unit: 'Bidang UKM' },
        { nama: 'Alexius Widhi Nur Pambudi, S.E., M.Sc.', unit: 'Bidang Usaha Mikro' },
        { nama: 'Rizki Octaviani, S.T.',                  unit: 'Bidang Usaha Mikro' },
        { nama: 'Desi Kurniawati, S.H., M.Acc.',          unit: 'Bidang Usaha Mikro' },
        { nama: 'Asrindha Patriandina, S.STP.',           unit: 'Bidang Usaha Mikro' },
        { nama: 'Bernadheta Gezia Arine, S.E.',           unit: 'Bidang Usaha Mikro' },
        { nama: 'Gita Putri Andikawati, S.E.',            unit: 'Bidang Usaha Mikro' },
        { nama: 'Ratna Listiyani, S.Si.',          unit: 'Bidang Kewirausahaan' },
        { nama: 'Muhammad Daud Ramadhan, S.H.',    unit: 'Bidang Kewirausahaan' },
        { nama: 'Nanda Kesuma Devi, S.I.A.',       unit: 'Bidang Kewirausahaan' },
        { nama: 'Rosalia Kurnia Handari, S.T.P.',  unit: 'Bidang Kewirausahaan' },
        { nama: 'Pancais Meysir Kusdanarko, S.E.', unit: 'Bidang Kewirausahaan' },
        { nama: 'Annisa Sulcha Afifah, S.Kom.',    unit: 'Bidang Kewirausahaan' },
        { nama: 'Endah Febriasih, S.A.B.',         unit: 'Bidang Kewirausahaan' },
        { nama: 'Aribowo, S.Pi., M.Eng.',    unit: 'Balai Layanan Usaha Terpadu KUMKM' },
        { nama: 'Kuntarta, S.Sos., M.AP',    unit: 'Balai Layanan Usaha Terpadu KUMKM' },
        { nama: 'Hana Budi Setyowati, S.T.', unit: 'Balai Layanan Usaha Terpadu KUMKM' },
    ];

    // ── Hitung triwulan yang boleh diupload berdasarkan bulan sekarang ──
    function getMaxAllowedTriwulan() {
        const month = new Date().getMonth() + 1;
        if (month <= 3)  return 1;
        if (month <= 6)  return 2;
        if (month <= 9)  return 3;
        return 4;
    }

    // ── [v2.2] Cek triwulan HANYA berbasis periode bulan (TIDAK sequential) ──
    function isTriwulanAllowed(idx) {
        const maxIdx = getMaxAllowedTriwulan() - 1;
        return idx <= maxIdx;
    }

    function getTriwulanLockReason(idx) {
        const monthNames = ['','Januari','Februari','Maret','April','Mei','Juni',
                            'Juli','Agustus','September','Oktober','November','Desember'];
        const startMonth = [0,1,4,7,10][idx + 1];
        return `Periode belum tiba (mulai ${monthNames[startMonth]})`;
    }

    let masterDiklat = [];
    let allDiklat = [];
    let diklatCurrentPage = 1;
    const itemsPerPage = 10;
    let editingId = null;
    let fileData = [{}, {}, {}, {}];

    const SVG = {
        refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
        plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        eye: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
        check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        link: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
        file: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        img: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
        upload: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`,
        lock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
        x: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        calendar: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        users: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        award: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
        search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    };

    // ─── API JSONP ───────────────────────────────────────────────
    function apiCall(params) {
        return new Promise((resolve, reject) => {
            const cbName = 'dklatCb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
            const timeout = setTimeout(() => {
                delete window[cbName];
                reject(new Error('Request timeout'));
            }, 60000);
            window[cbName] = function (data) {
                clearTimeout(timeout);
                delete window[cbName];
                resolve(data);
            };
            const parts = [];
            Object.entries({ ...params, callback: cbName }).forEach(([k, v]) => {
                parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(
                    typeof v === 'object' ? JSON.stringify(v) : String(v)
                ));
            });
            const script = document.createElement('script');
            script.src = API_URL + '?' + parts.join('&');
            script.onerror = () => {
                clearTimeout(timeout);
                delete window[cbName];
                try { document.head.removeChild(script); } catch (_) { }
                reject(new Error('Network error'));
            };
            document.head.appendChild(script);
            setTimeout(() => { try { document.head.removeChild(script); } catch (_) { } }, 65000);
        });
    }

    function apiCallPost(params) {
        return new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error('timeout')), 60000);
            fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(params),
                redirect: 'follow'
            })
                .then(r => r.text())
                .then(text => {
                    clearTimeout(t);
                    try { resolve(JSON.parse(text)); }
                    catch (e) { resolve({ status: 'error', message: 'Respons tidak valid' }); }
                })
                .catch(err => { clearTimeout(t); reject(err); });
        });
    }

    // ─── NORMALISE ──────────────────────────────────────────────
    function _normaliseRow(row) {
        QUARTERS.forEach(q => {
            const raw = row[q.key];
            if (!raw || raw === '') {
                row[q.key] = { link: null, fileName: null, fileDataUrl: null };
            } else if (typeof raw === 'object') {
                row[q.key] = raw;
            } else {
                const isDriveImg = raw.includes('drive.google.com/thumbnail') ||
                    raw.includes('googleusercontent.com');
                row[q.key] = {
                    link: raw,
                    fileName: _fileNameFromUrl(raw),
                    fileDataUrl: isDriveImg ? raw : null,
                };
            }
        });
        return row;
    }

    function _fileNameFromUrl(url) {
        if (!url) return null;
        try {
            const u = new URL(url);
            const path = u.pathname.split('/').filter(Boolean);
            const last = path[path.length - 1];
            if (last && last.length < 100 && last.includes('.')) return last;
        } catch (_) { }
        return 'File';
    }

    function findDiklatByNama(nama) {
        return masterDiklat.find(d => (d.nama || '').toLowerCase().trim() === (nama || '').toLowerCase().trim());
    }

    // ─── LOAD ────────────────────────────────────────────────────
    async function loadDiklat() {
        _setTableLoading(true);
        try {
            const res = await apiCall({ action: 'getDiklat' });
            if (res.status === 'success') {
                masterDiklat = (res.diklat || []).map(_normaliseRow);
            } else {
                masterDiklat = [];
                _toast('Gagal memuat data: ' + (res.message || ''), 'error');
            }
        } catch (e) {
            masterDiklat = [];
            _toast('Gagal terhubung ke server: ' + e.message, 'error');
        }
        allDiklat = buildMergedList();
        diklatCurrentPage = 1;
        renderStats();
        renderPaginatedDiklat();
    }
    window.diklatLoad = loadDiklat;

    window.diklatGetMasterData = () => masterDiklat;
    window.diklatHasUpload = (nama) => {
        const d = findDiklatByNama(nama);
        if (!d) return false;
        return QUARTERS.some(q => {
            const qd = d[q.key] || {};
            return !!(qd.link || qd.fileName || qd.fileDataUrl);
        });
    };

    function _setTableLoading(on) {
        const tbody = document.getElementById('dklat-tbody');
        if (tbody && on) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:48px;color:#94a3b8;font-size:14px;">
            <span class="spinner"></span>&nbsp; Memuat data…
        </td></tr>`;
    }

    // ─── STATS ───────────────────────────────────────────────────
    function renderStats() {
        let lengkap = 0, sebagian = 0, kosong = 0;
        PEGAWAI_LIST.forEach(p => {
            const d = findDiklatByNama(p.nama);
            if (!d) { kosong++; return; }
            const filled = QUARTERS.filter(q => {
                const qd = d[q.key] || {};
                return qd.link || qd.fileName || qd.fileDataUrl;
            }).length;
            if (filled === 4) lengkap++;
            else if (filled > 0) sebagian++;
            else kosong++;
        });
        const el = id => document.getElementById(id);
        if (el('dklat-stat-total'))    el('dklat-stat-total').textContent    = PEGAWAI_LIST.length;
        if (el('dklat-stat-lengkap'))  el('dklat-stat-lengkap').textContent  = lengkap;
        if (el('dklat-stat-sebagian')) el('dklat-stat-sebagian').textContent = sebagian;
        if (el('dklat-stat-kosong'))   el('dklat-stat-kosong').textContent   = kosong;

        // Update progress bar
        const total = PEGAWAI_LIST.length;
        const pct = total > 0 ? Math.round((lengkap / total) * 100) : 0;
        const bar = document.getElementById('dklat-progress-bar');
        const pctEl = document.getElementById('dklat-progress-pct');
        if (bar) bar.style.width = pct + '%';
        if (pctEl) pctEl.textContent = pct + '%';
    }

    // ─── FILTER ──────────────────────────────────────────────────
    function diklatApplyFilter() {
        const q = (document.getElementById('dklat-search')?.value || '').toLowerCase().trim();
        allDiklat = buildMergedList().filter(d =>
            (d.nama || '').toLowerCase().includes(q) ||
            (d.unit || '').toLowerCase().includes(q)
        );
        diklatCurrentPage = 1;
        renderPaginatedDiklat();
    }
    window.diklatApplyFilter = diklatApplyFilter;

    function buildMergedList() {
        const merged = PEGAWAI_LIST.map(p => {
            const serverData = findDiklatByNama(p.nama);
            if (serverData) return serverData;
            const empty = { id: null, nama: p.nama, unit: p.unit };
            QUARTERS.forEach(q => { empty[q.key] = { link: null, fileName: null, fileDataUrl: null }; });
            return empty;
        });
        masterDiklat.forEach(d => {
            const inList = PEGAWAI_LIST.some(p => p.nama.toLowerCase().trim() === (d.nama || '').toLowerCase().trim());
            if (!inList) merged.push(d);
        });
        return merged;
    }

    // ─── BADGE (table cell) ──────────────────────────────────────
    function _qdBadge(qd, q, locked) {
        if (locked) {
            return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;
                padding:2px 8px 2px 6px;border-radius:20px;
                background:#f8fafc;color:#cbd5e1;border:1px solid #e2e8f0;white-space:nowrap;">
                ${SVG.lock}&nbsp;—
            </span>`;
        }

        const hasImg  = !!(qd.fileDataUrl && (qd.fileDataUrl.startsWith('data:image') || qd.fileDataUrl.includes('thumbnail')));
        const hasLink = !!qd.link;
        const hasFile = !!qd.fileName && !hasImg;

        if (!hasImg && !hasFile && !hasLink) {
            return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;
                padding:2px 8px 2px 7px;border-radius:20px;
                background:#f8fafc;color:#94a3b8;border:1px dashed #e2e8f0;white-space:nowrap;">
                Belum ada
            </span>`;
        }

        const icon  = hasImg ? SVG.img : hasFile ? SVG.file : SVG.link;
        const label = hasImg ? 'Foto' : hasFile ? 'File' : 'Link';
        const url   = hasLink ? qd.link : null;

        const inner = `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;
            padding:3px 10px 3px 8px;border-radius:20px;
            background:${q.bg};color:${q.color};border:1px solid ${q.border};
            white-space:nowrap;line-height:1.4;">
            ${icon}&nbsp;${label}
        </span>`;

        if (url) return `<a href="${url}" target="_blank" rel="noopener" style="text-decoration:none;" title="Buka ${label}">${inner}</a>`;
        return inner;
    }

    // ─── COMPLETION DOTS ─────────────────────────────────────────
    function _completionDots(d) {
        const maxIdx = getMaxAllowedTriwulan() - 1;
        return QUARTERS.map((q, idx) => {
            if (idx > maxIdx) {
                return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#e2e8f0;" title="${q.label} (belum periode)"></span>`;
            }
            const qd = d[q.key] || {};
            const filled = !!(qd.link || qd.fileName || qd.fileDataUrl);
            return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${filled ? q.dot : '#e2e8f0'};
                ${filled ? 'box-shadow:0 0 0 2px ' + q.bg : ''};" title="${q.label}: ${filled ? 'Sudah upload' : 'Belum'}"></span>`;
        }).join('');
    }

    // ─── RENDER TABLE ────────────────────────────────────────────
    function renderPaginatedDiklat() {
        const tbody = document.getElementById('dklat-tbody');
        const cards = document.getElementById('dklat-cards');
        const pgn   = document.getElementById('dklat-pagination');
        if (!tbody) return;

        const list = allDiklat.length > 0 ? allDiklat : buildMergedList();

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:48px;color:#94a3b8;font-size:14px;">Tidak ada data.</td></tr>`;
            if (cards) cards.innerHTML = '';
            if (pgn)   pgn.innerHTML   = '';
            return;
        }

        const totalPages = Math.ceil(list.length / itemsPerPage);
        const start = (diklatCurrentPage - 1) * itemsPerPage;
        const items = list.slice(start, start + itemsPerPage);

        tbody.innerHTML = items.map((d, i) => {
            const no       = start + i + 1;
            const initials = (d.nama || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

            // Color for avatar based on unit
            const unitColors = {
                'Sekretariat': { bg: '#eff6ff', color: '#1d4ed8' },
                'Bidang Koperasi': { bg: '#fef3c7', color: '#b45309' },
                'Bidang UKM': { bg: '#d1fae5', color: '#065f46' },
                'Bidang Usaha Mikro': { bg: '#ede9fe', color: '#5b21b6' },
                'Bidang Kewirausahaan': { bg: '#fee2e2', color: '#991b1b' },
                'Balai Layanan Usaha Terpadu KUMKM': { bg: '#e0f2fe', color: '#075985' },
            };
            const uc = unitColors[d.unit] || { bg: '#f1f5f9', color: '#475569' };

            const qCells = QUARTERS.map((q, idx) => {
                const locked = !isTriwulanAllowed(idx);
                return `<td style="text-align:center;vertical-align:middle;padding:12px 8px;">${_qdBadge(d[q.key] || {}, q, locked)}</td>`;
            }).join('');

            const hasId = !!d.id;

            // Count filled quarters in allowed period
            const maxIdx = getMaxAllowedTriwulan() - 1;
            const filledCount = QUARTERS.filter((q, idx) => {
                if (idx > maxIdx) return false;
                const qd = d[q.key] || {};
                return !!(qd.link || qd.fileName || qd.fileDataUrl);
            }).length;
            const totalAllowed = maxIdx + 1;
            const isComplete = filledCount === totalAllowed;
            const isPartial  = filledCount > 0 && !isComplete;

            const statusBadge = isComplete
                ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#d1fae5;color:#065f46;letter-spacing:.03em;">✓ Lengkap</span>`
                : isPartial
                ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#fef3c7;color:#92400e;letter-spacing:.03em;">${filledCount}/${totalAllowed}</span>`
                : `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#fee2e2;color:#991b1b;letter-spacing:.03em;">Kosong</span>`;

            return `<tr style="transition:background .15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                <td style="color:#94a3b8;font-size:12px;font-weight:600;padding:12px 10px;">${no}</td>
                <td style="padding:12px 10px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:36px;height:36px;border-radius:10px;background:${uc.bg};
                            display:flex;align-items:center;justify-content:center;
                            font-size:12px;font-weight:700;color:${uc.color};flex-shrink:0;letter-spacing:.02em;">${initials}</div>
                        <div>
                            <div style="font-weight:600;font-size:13px;color:#1e293b;line-height:1.3;">${d.nama || '—'}</div>
                            <div style="margin-top:3px;">${statusBadge}</div>
                        </div>
                    </div>
                </td>
                <td style="padding:12px 10px;">
                    <span style="font-size:12px;color:#64748b;background:#f1f5f9;padding:3px 9px;border-radius:6px;font-weight:500;white-space:nowrap;">${d.unit || '—'}</span>
                </td>
                ${qCells}
                <td style="padding:12px 10px;">
                    <div style="display:flex;gap:4px;justify-content:center;">
                        ${hasId ? `<button onclick="diklatOpenDetail('${d.id}')" class="btn-icon btn-icon-view" title="Lihat detail" style="width:30px;height:30px;border-radius:8px;">${SVG.eye}</button>` : ''}
                        <button onclick="diklatOpenEditByNama('${_escJs(d.nama)}','${_escJs(d.unit)}')" class="btn-icon btn-icon-edit" title="Upload bukti" style="width:30px;height:30px;border-radius:8px;">${SVG.edit}</button>
                        ${hasId ? `<button onclick="diklatDelete('${d.id}',this)" class="btn-icon btn-icon-delete" title="Hapus" style="width:30px;height:30px;border-radius:8px;">${SVG.trash}</button>` : ''}
                    </div>
                </td>
            </tr>`;
        }).join('');

        // Mobile cards
        if (cards) {
            cards.innerHTML = items.map(d => {
                const qRows = QUARTERS.map((q, idx) => {
                    const locked = !isTriwulanAllowed(idx);
                    const badge  = _qdBadge(d[q.key] || {}, q, locked);
                    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9;">
                        <span style="font-size:12px;font-weight:600;color:#64748b;">${q.label} <span style="font-weight:400;color:#94a3b8;">${q.sub}</span></span>
                        ${badge}
                    </div>`;
                }).join('');
                const hasId = !!d.id;
                const initials = (d.nama || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
                return `<div class="krs-card" style="margin-bottom:12px;border-radius:14px;overflow:hidden;">
                    <div class="krs-card-top" style="background:linear-gradient(135deg,#1e293b,#334155);padding:14px 16px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.15);
                                display:flex;align-items:center;justify-content:center;
                                font-size:13px;font-weight:700;color:#fff;">${initials}</div>
                            <div>
                                <div style="font-weight:700;font-size:13.5px;color:#fff;">${d.nama || '—'}</div>
                                <div style="font-size:11.5px;color:rgba(255,255,255,.6);margin-top:1px;">${d.unit || '—'}</div>
                            </div>
                        </div>
                    </div>
                    <div style="padding:10px 14px 6px;">${qRows}</div>
                    <div style="padding:8px 14px 12px;display:flex;justify-content:flex-end;">
                        <div style="display:flex;gap:4px;">
                            ${hasId ? `<button onclick="diklatOpenDetail('${d.id}')" class="btn-icon btn-icon-view" style="border-radius:8px;">${SVG.eye}</button>` : ''}
                            <button onclick="diklatOpenEditByNama('${_escJs(d.nama)}','${_escJs(d.unit)}')" class="btn-icon btn-icon-edit" style="border-radius:8px;">${SVG.edit}</button>
                            ${hasId ? `<button onclick="diklatDelete('${d.id}',this)" class="btn-icon btn-icon-delete" style="border-radius:8px;">${SVG.trash}</button>` : ''}
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        if (pgn) pgn.innerHTML = `
            <button onclick="diklatChangePage(${diklatCurrentPage - 1})" ${diklatCurrentPage === 1 ? 'disabled' : ''}>&#8249; Prev</button>
            <span class="pagination-info">Halaman ${diklatCurrentPage} dari ${totalPages} &nbsp;·&nbsp; ${list.length} pegawai</span>
            <button onclick="diklatChangePage(${diklatCurrentPage + 1})" ${diklatCurrentPage === totalPages ? 'disabled' : ''}>Next &#8250;</button>`;
    }

    window.diklatChangePage = (page) => {
        const list = allDiklat.length > 0 ? allDiklat : buildMergedList();
        const t = Math.ceil(list.length / itemsPerPage);
        if (page < 1 || page > t) return;
        diklatCurrentPage = page;
        renderPaginatedDiklat();
    };

    function _escJs(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

    // ─── MODAL HELPERS ───────────────────────────────────────────
    function _openModal(id)  { const el = document.getElementById(id); if (el) el.style.display = 'flex'; }
    function _closeModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    window.diklatCloseModal = (id) => _closeModal(id);

    // ─── FORM ────────────────────────────────────────────────────
    window.diklatOpenEditByNama = function (nama, unit) {
        const existing = findDiklatByNama(nama);
        if (existing) {
            diklatOpenEdit(existing.id);
        } else {
            editingId = null;
            fileData  = [{}, {}, {}, {}];
            document.getElementById('dklat-modal-title').textContent = 'Upload Bukti Diklat';
            document.getElementById('dklat-form-nama').value = nama;
            const unitSel = document.getElementById('dklat-form-unit');
            if (unitSel) unitSel.value = unit || '';
            document.getElementById('dklat-form-nama').readOnly = true;
            if (unitSel) unitSel.disabled = true;
            _buildQuarterForms(null);
            _openModal('dklat-formModal');
        }
    };

    window.diklatOpenAdd = function () {
        editingId = null;
        fileData  = [{}, {}, {}, {}];
        document.getElementById('dklat-modal-title').textContent = 'Tambah Data Diklat';
        document.getElementById('dklat-form-nama').value = '';
        document.getElementById('dklat-form-nama').readOnly = false;
        const unitSel = document.getElementById('dklat-form-unit');
        if (unitSel) { unitSel.value = ''; unitSel.disabled = false; }
        _buildQuarterForms(null);
        _openModal('dklat-formModal');
    };

    window.diklatOpenEdit = function (id) {
        const d = masterDiklat.find(x => x.id === id);
        if (!d) return;
        editingId = id;
        fileData  = QUARTERS.map(q => ({ ...(d[q.key] || {}) }));
        document.getElementById('dklat-modal-title').textContent = 'Upload Bukti Diklat';
        document.getElementById('dklat-form-nama').value = d.nama || '';
        document.getElementById('dklat-form-nama').readOnly = true;
        const unitSel = document.getElementById('dklat-form-unit');
        if (unitSel) { unitSel.value = d.unit || ''; unitSel.disabled = true; }
        _buildQuarterForms(d);
        _openModal('dklat-formModal');
    };

    // ─── SUBMIT ──────────────────────────────────────────────────
    window.diklatSubmitForm = async function () {
        const nama = document.getElementById('dklat-form-nama').value.trim();
        const unitEl = document.getElementById('dklat-form-unit');
        const unit = (unitEl.value || '').trim();
        if (!nama || !unit) {
            _toast('Nama Peserta dan Unit harus diisi', 'error');
            return;
        }

        const qPayload = {};
        QUARTERS.forEach((q, idx) => {
            const linkEl  = document.getElementById(`dklat-link-${idx}`);
            const linkVal = linkEl ? linkEl.value.trim() : '';
            const isLinkPane = document.getElementById(`dklat-pane-link-${idx}`)?.style.display !== 'none';
            const hasNewFile = !!(fileData[idx]?.fileDataUrl && fileData[idx].fileDataUrl.startsWith('data:'));
            qPayload[q.key] = { isLink: isLinkPane, linkVal, hasNewFile, idx };
        });

        const btnSave = document.getElementById('dklat-btn-save');
        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan…';
        }

        try {
            let targetId = editingId;
            const baseParams = { nama, unit };
            QUARTERS.forEach(q => {
                const p = qPayload[q.key];
                if (p.isLink) baseParams[q.key] = p.linkVal || '';
            });

            if (!editingId) {
                const res = await apiCall({ action: 'createDiklat', ...baseParams });
                if (res.status !== 'success') throw new Error(res.message || 'Gagal membuat data');
                targetId = res.id;
            } else {
                const res = await apiCall({ action: 'updateDiklat', id: editingId, ...baseParams });
                if (res.status !== 'success') throw new Error(res.message || 'Gagal memperbarui data');
            }

            const uploadErrors = [];
            for (const q of QUARTERS) {
                const p = qPayload[q.key];
                if (!p.hasNewFile) continue;
                const fd = fileData[p.idx];
                const commaIdx = fd.fileDataUrl.indexOf(',');
                const base64Raw = commaIdx > -1 ? fd.fileDataUrl.slice(commaIdx + 1) : fd.fileDataUrl;
                try {
                    const upRes = await apiCallPost({
                        action: 'uploadDiklatFile',
                        id: targetId,
                        triwulanKey: q.key,
                        fileData: base64Raw,
                        mimeType: fd.fileType || 'application/octet-stream',
                        fileName: fd.fileName || ('file_' + q.key),
                    });
                    if (upRes.status !== 'success' && !upRes.success) {
                        uploadErrors.push(q.label + ': ' + (upRes.message || 'gagal upload'));
                    }
                } catch (e) {
                    uploadErrors.push(q.label + ': ' + e.message);
                }
            }

            if (uploadErrors.length > 0) {
                _toast('Data tersimpan, tapi ada file gagal:\n' + uploadErrors.join('\n'), 'warning');
            } else {
                _toast(editingId ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan', 'success');
            }

            _closeModal('dklat-formModal');
            await loadDiklat();

        } catch (err) {
            _toast('Error: ' + err.message, 'error');
        } finally {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = SVG.check + ' &nbsp;Simpan Data';
            }
        }
    };

    // ─── DELETE ──────────────────────────────────────────────────
    window.diklatDelete = function (id, btnEl) {
        const d = masterDiklat.find(x => x.id === id);
        if (!d) return;
        const doDelete = async () => {
            const orig = btnEl ? btnEl.innerHTML : null;
            if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="spinner spinner-sm"></span>'; }
            try {
                const res = await apiCall({ action: 'deleteDiklat', id });
                if (res.status === 'success') {
                    _toast('Data berhasil dihapus', 'success');
                    await loadDiklat();
                } else {
                    _toast('Gagal hapus: ' + (res.message || ''), 'error');
                    if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; }
                }
            } catch (e) {
                _toast('Error: ' + e.message, 'error');
                if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; }
            }
        };
        if (window.showConfirmModal) {
            showConfirmModal({
                icon: '🗑️',
                title: 'Hapus Data Diklat?',
                message: `Peserta: <strong>${d.nama || '-'}</strong><br>Unit: <strong>${d.unit || '-'}</strong><br><br>
                    <span style="color:#ef4444;font-weight:600;">File di Drive juga akan dihapus. Tindakan ini tidak dapat dibatalkan.</span>`,
                confirmText: 'Ya, Hapus',
                confirmClass: 'btn-danger',
            }, doDelete);
        } else {
            if (confirm(`Hapus data ${d.nama}?`)) doDelete();
        }
    };

    window.diklatDeleteFile = async function (id, triwulanKey, btnEl) {
        const orig = btnEl ? btnEl.innerHTML : null;
        if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="spinner spinner-sm"></span>'; }
        try {
            const res = await apiCall({ action: 'deleteDiklatFile', id, triwulanKey });
            if (res.status === 'success') {
                _toast('File berhasil dihapus', 'success');
                await loadDiklat();
                const dm = document.getElementById('dklat-detailModal');
                if (dm && dm.style.display !== 'none') diklatOpenDetail(id);
            } else {
                _toast('Gagal hapus file: ' + (res.message || ''), 'error');
                if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; }
            }
        } catch (e) {
            _toast('Error: ' + e.message, 'error');
            if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; }
        }
    };

    // ─── QUARTER FORM BUILDER ────────────────────────────────────
    function _buildQuarterForms(existData) {
        const grid = document.getElementById('dklat-quarters-grid');
        if (!grid) return;

        grid.innerHTML = QUARTERS.map((q, idx) => {
            const saved   = existData ? (existData[q.key] || {}) : {};
            const allowed = isTriwulanAllowed(idx);
            const reason  = allowed ? '' : getTriwulanLockReason(idx);

            if (!allowed) {
                return `
                <div style="border-radius:12px;border:1px solid #e2e8f0;background:#f8fafc;padding:16px;opacity:.55;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                        <div style="width:28px;height:28px;border-radius:8px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;">
                            <span style="font-size:11px;font-weight:700;color:#94a3b8;">${idx+1}</span>
                        </div>
                        <div>
                            <div style="font-size:13px;font-weight:600;color:#94a3b8;">${q.label}</div>
                            <div style="font-size:11px;color:#cbd5e1;">${q.sub}</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;padding:11px 12px;background:#f1f5f9;border-radius:8px;border:1px dashed #e2e8f0;">
                        <span style="color:#94a3b8;">${SVG.lock}</span>
                        <span style="font-size:12px;color:#94a3b8;">${reason}</span>
                    </div>
                </div>`;
            }

            const isLink  = !!(saved.link && !saved.fileDataUrl);
            const hasImg  = !!(saved.fileDataUrl &&
                (saved.fileDataUrl.startsWith('data:image') ||
                    saved.fileDataUrl.includes('thumbnail') ||
                    saved.fileDataUrl.includes('googleusercontent')));
            const hasFile = !!saved.fileName && !hasImg && !isLink;

            let fileContent;
            if (hasImg) {
                fileContent = `
                    <img src="${saved.fileDataUrl}" style="width:100%;border-radius:8px;object-fit:cover;max-height:90px;display:block;border:1px solid ${q.border};margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:6px;padding:6px 9px;background:#f8fafc;border-radius:6px;font-size:12px;color:#475569;border:1px solid #e2e8f0;">
                        ${SVG.img}&nbsp;<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${saved.fileName || 'Gambar'}</span>
                        <button type="button" onclick="diklatClearFileLocal(${idx})" style="background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;padding:2px;">${SVG.x}</button>
                    </div>`;
            } else if (hasFile) {
                fileContent = `
                    <div style="display:flex;align-items:center;gap:6px;padding:9px 11px;background:#f8fafc;border-radius:8px;font-size:12px;color:#475569;border:1px solid #e2e8f0;">
                        ${SVG.file}&nbsp;<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${saved.fileName}</span>
                        <button type="button" onclick="diklatClearFileLocal(${idx})" style="background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;padding:2px;">${SVG.x}</button>
                    </div>`;
            } else {
                fileContent = _uploadZoneHTML(idx, q);
            }

            return `
            <div id="dklat-qcard-${idx}" style="border-radius:12px;border:1px solid ${q.border};background:${q.gradient};padding:16px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <div style="width:28px;height:28px;border-radius:8px;background:${q.color};display:flex;align-items:center;justify-content:center;">
                        <span style="font-size:11px;font-weight:700;color:#fff;">${idx+1}</span>
                    </div>
                    <div>
                        <div style="font-size:13px;font-weight:700;color:#1e293b;">${q.label}</div>
                        <div style="font-size:11px;color:#64748b;">${q.sub}</div>
                    </div>
                </div>

                <div style="display:flex;border-radius:8px;overflow:hidden;border:1px solid ${q.border};margin-bottom:10px;background:rgba(255,255,255,.6);">
                    <button type="button" id="dklat-tab-file-${idx}" onclick="diklatSwitchQTab(${idx},'file')"
                        style="flex:1;padding:6px 10px;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all .15s;
                               background:${!isLink ? q.color : 'transparent'};color:${!isLink ? '#fff' : q.color};">
                        ↑ Upload File
                    </button>
                    <button type="button" id="dklat-tab-link-${idx}" onclick="diklatSwitchQTab(${idx},'link')"
                        style="flex:1;padding:6px 10px;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all .15s;
                               background:${isLink ? q.color : 'transparent'};color:${isLink ? '#fff' : q.color};">
                        🔗 Tempel Link
                    </button>
                </div>

                <div id="dklat-pane-file-${idx}" style="display:${isLink ? 'none' : 'block'};">
                    <div id="dklat-file-area-${idx}">${fileContent}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:5px;">JPG · PNG · PDF · Word — maks 10MB</div>
                </div>
                <div id="dklat-pane-link-${idx}" style="display:${isLink ? 'block' : 'none'};">
                    <input type="text" id="dklat-link-${idx}" class="form-input"
                        placeholder="https://drive.google.com/…"
                        value="${isLink ? (saved.link || '') : ''}"
                        oninput="diklatOnLinkInput(${idx})"
                        style="font-size:12.5px;background:rgba(255,255,255,.8);">
                    <div id="dklat-link-preview-${idx}" style="margin-top:5px;">
                        ${isLink && saved.link
                    ? `<a href="${saved.link}" target="_blank" style="font-size:12px;color:${q.color};text-decoration:none;display:inline-flex;align-items:center;gap:4px;font-weight:600;">${SVG.link}&nbsp;Buka link</a>`
                    : ''}
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    function _uploadZoneHTML(idx, q) {
        const color = q ? q.color : '#64748b';
        const border = q ? q.border : '#cbd5e1';
        return `
            <label style="display:flex;flex-direction:column;align-items:center;gap:7px;
                border:2px dashed ${border};border-radius:10px;padding:18px 10px;text-align:center;
                cursor:pointer;background:rgba(255,255,255,.5);color:#94a3b8;font-size:12px;position:relative;
                transition:all .15s;" for="dklat-file-${idx}"
                onmouseover="this.style.borderColor='${color}';this.style.background='rgba(255,255,255,.8)'"
                onmouseout="this.style.borderColor='${border}';this.style.background='rgba(255,255,255,.5)'">
                <input type="file" id="dklat-file-${idx}" accept="image/*,.pdf,.doc,.docx"
                    style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;"
                    onchange="diklatHandleFile(${idx})">
                <div style="color:${color};opacity:.7;">${SVG.upload}</div>
                <div style="font-size:12px;color:#64748b;font-weight:500;">Klik atau seret file ke sini</div>
            </label>`;
    }

    window.diklatSwitchQTab = function (idx, mode) {
        const fp = document.getElementById(`dklat-pane-file-${idx}`);
        const lp = document.getElementById(`dklat-pane-link-${idx}`);
        const tf = document.getElementById(`dklat-tab-file-${idx}`);
        const tl = document.getElementById(`dklat-tab-link-${idx}`);
        const q  = QUARTERS[idx];
        if (!fp || !lp) return;
        fp.style.display = mode === 'file' ? 'block' : 'none';
        lp.style.display = mode === 'link' ? 'block' : 'none';
        if (tf) { tf.style.background = mode === 'file' ? q.color : 'transparent'; tf.style.color = mode === 'file' ? '#fff' : q.color; }
        if (tl) { tl.style.background = mode === 'link' ? q.color : 'transparent'; tl.style.color = mode === 'link' ? '#fff' : q.color; }
    };

    window.diklatHandleFile = function (idx) {
        const input = document.getElementById(`dklat-file-${idx}`);
        const file  = input?.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            _toast(`File terlalu besar (${(file.size / 1024 / 1024).toFixed(1)}MB). Maks 10MB.`, 'error');
            input.value = '';
            return;
        }
        const isImage = file.type.startsWith('image/');
        const q = QUARTERS[idx];
        const reader = new FileReader();
        reader.onload = function (e) {
            fileData[idx] = { fileName: file.name, fileDataUrl: e.target.result, fileType: file.type };
            const area = document.getElementById(`dklat-file-area-${idx}`);
            if (!area) return;
            area.innerHTML = isImage
                ? `<img src="${e.target.result}" style="width:100%;border-radius:8px;object-fit:cover;max-height:90px;display:block;border:1px solid ${q.border};margin-bottom:6px;">
                   <div style="display:flex;align-items:center;gap:6px;padding:6px 9px;background:rgba(255,255,255,.8);border-radius:6px;font-size:12px;color:#475569;border:1px solid ${q.border};">
                       ${SVG.img}&nbsp;<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${file.name}</span>
                       <button type="button" onclick="diklatClearFileLocal(${idx})" style="background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;padding:2px;">${SVG.x}</button>
                   </div>`
                : `<div style="display:flex;align-items:center;gap:6px;padding:9px 11px;background:rgba(255,255,255,.8);border-radius:8px;font-size:12px;color:#475569;border:1px solid ${q.border};">
                       ${SVG.file}&nbsp;<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${file.name}</span>
                       <button type="button" onclick="diklatClearFileLocal(${idx})" style="background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;padding:2px;">${SVG.x}</button>
                   </div>`;
        };
        reader.readAsDataURL(file);
    };

    window.diklatClearFileLocal = function (idx) {
        fileData[idx] = {};
        const area = document.getElementById(`dklat-file-area-${idx}`);
        if (!area) return;
        area.innerHTML = _uploadZoneHTML(idx, QUARTERS[idx]);
    };

    window.diklatOnLinkInput = function (idx) {
        const val     = document.getElementById(`dklat-link-${idx}`)?.value.trim() || '';
        const preview = document.getElementById(`dklat-link-preview-${idx}`);
        const q = QUARTERS[idx];
        if (preview) preview.innerHTML = val
            ? `<a href="${val}" target="_blank" style="font-size:12px;color:${q.color};text-decoration:none;display:inline-flex;align-items:center;gap:4px;font-weight:600;">${SVG.link}&nbsp;Buka link</a>`
            : '';
    };

    // ─── DETAIL MODAL ────────────────────────────────────────────
    window.diklatOpenDetail = function (id) {
        const d    = masterDiklat.find(x => x.id === id);
        if (!d) return;
        const body = document.getElementById('dklat-detail-body');
        if (!body) return;

        const maxIdx = getMaxAllowedTriwulan() - 1;
        const filledCount = QUARTERS.filter((q, idx) => {
            if (idx > maxIdx) return false;
            const qd = d[q.key] || {};
            return !!(qd.link || qd.fileName || qd.fileDataUrl);
        }).length;
        const totalAllowed = maxIdx + 1;
        const pct = Math.round((filledCount / totalAllowed) * 100);

        body.innerHTML = `
            <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:14px;padding:20px;margin-bottom:20px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div>
                        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.5);margin-bottom:5px;">Nama Peserta</div>
                        <div style="font-size:15px;font-weight:700;color:#fff;">${d.nama || '—'}</div>
                    </div>
                    <div>
                        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.5);margin-bottom:5px;">Unit / Bagian</div>
                        <div style="font-size:14px;font-weight:600;color:rgba(255,255,255,.85);">${d.unit || '—'}</div>
                    </div>
                </div>
                <div style="margin-top:16px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <span style="font-size:12px;color:rgba(255,255,255,.6);">Progress Triwulan Aktif</span>
                        <span style="font-size:12px;font-weight:700;color:#fff;">${filledCount}/${totalAllowed} &nbsp;(${pct}%)</span>
                    </div>
                    <div style="height:6px;background:rgba(255,255,255,.2);border-radius:10px;overflow:hidden;">
                        <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#3b82f6,#10b981);border-radius:10px;transition:width .5s ease;"></div>
                    </div>
                </div>
            </div>

            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:12px;">Bukti Keikutsertaan Diklat</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;" class="dklat-detail-qgrid">
                ${QUARTERS.map((q, idx) => {
            const qd      = d[q.key] || {};
            const locked  = !isTriwulanAllowed(idx);
            const hasImg  = !!(qd.fileDataUrl &&
                (qd.fileDataUrl.startsWith('data:image') ||
                    qd.fileDataUrl.includes('thumbnail') ||
                    qd.fileDataUrl.includes('googleusercontent')));
            const hasLink = !!qd.link;
            const hasFile = !!qd.fileName && !hasImg;

            let content;
            if (locked && !hasImg && !hasFile && !hasLink) {
                content = `<div style="text-align:center;padding:18px;color:#cbd5e1;font-size:12px;display:flex;align-items:center;gap:6px;justify-content:center;">${SVG.lock}&nbsp;${getTriwulanLockReason(idx)}</div>`;
            } else if (hasImg) {
                content = `
                    <img src="${qd.fileDataUrl}" alt="${q.label}"
                        style="width:100%;border-radius:8px;object-fit:cover;max-height:110px;display:block;border:1px solid ${q.border};cursor:zoom-in;margin-bottom:6px;"
                        onclick="diklatZoomImg('${qd.fileDataUrl}')">
                    <div style="display:flex;align-items:center;gap:5px;padding:5px 8px;background:rgba(255,255,255,.7);border-radius:6px;font-size:12px;color:#475569;border:1px solid ${q.border};">
                        ${SVG.img}&nbsp;<span style="flex:1;font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${qd.fileName || 'Gambar'}</span>
                        ${hasLink ? `<a href="${qd.link}" target="_blank" style="color:${q.color};font-size:11px;white-space:nowrap;font-weight:600;">Buka ↗</a>` : ''}
                        <button onclick="diklatDeleteFile('${d.id}','${q.key}',this)"
                            style="background:none;border:none;cursor:pointer;color:#ef4444;display:flex;align-items:center;padding:2px 4px;">${SVG.trash}</button>
                    </div>`;
            } else if (hasFile) {
                content = `
                    <div style="display:flex;align-items:center;gap:6px;padding:10px 12px;background:rgba(255,255,255,.7);border-radius:8px;font-size:13px;color:#475569;border:1px solid ${q.border};">
                        ${SVG.file}&nbsp;<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${qd.fileName}</span>
                        ${hasLink ? `<a href="${qd.link}" target="_blank" style="color:${q.color};font-size:11px;white-space:nowrap;font-weight:600;">Buka ↗</a>` : ''}
                        <button onclick="diklatDeleteFile('${d.id}','${q.key}',this)"
                            style="background:none;border:none;cursor:pointer;color:#ef4444;display:flex;align-items:center;padding:2px 4px;">${SVG.trash}</button>
                    </div>`;
            } else if (hasLink) {
                const short = qd.link.length > 40 ? qd.link.slice(0, 40) + '…' : qd.link;
                content = `
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <a href="${qd.link}" target="_blank" rel="noopener"
                            style="display:flex;align-items:center;gap:6px;padding:10px 12px;
                            background:${q.bg};border-radius:8px;color:${q.color};font-size:12px;
                            font-weight:600;text-decoration:none;word-break:break-all;border:1px solid ${q.border};">
                            ${SVG.link}&nbsp;${short}
                        </a>
                        <button onclick="diklatDeleteFile('${d.id}','${q.key}',this)"
                            style="background:none;border:1px solid #fca5a5;cursor:pointer;color:#ef4444;
                            font-size:11.5px;font-weight:600;padding:5px 10px;border-radius:6px;
                            align-self:flex-end;display:flex;align-items:center;gap:4px;">
                            ${SVG.trash}&nbsp;Hapus
                        </button>
                    </div>`;
            } else {
                content = `<div style="text-align:center;padding:22px;color:#cbd5e1;font-size:13px;">Belum ada data</div>`;
            }

            return `<div style="border-radius:12px;border:1px solid ${locked && !hasImg && !hasFile && !hasLink ? '#e2e8f0' : q.border};background:${locked && !hasImg && !hasFile && !hasLink ? '#f8fafc' : q.gradient};padding:12px;">
                        <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px;">
                            <div style="width:24px;height:24px;border-radius:6px;background:${locked && !hasImg && !hasFile && !hasLink ? '#e2e8f0' : q.color};display:flex;align-items:center;justify-content:center;">
                                <span style="font-size:10px;font-weight:700;color:${locked && !hasImg && !hasFile && !hasLink ? '#94a3b8' : '#fff'};">${idx+1}</span>
                            </div>
                            <div>
                                <div style="font-size:12.5px;font-weight:700;color:${locked && !hasImg && !hasFile && !hasLink ? '#94a3b8' : '#1e293b'};">${q.label}</div>
                                <div style="font-size:11px;color:#94a3b8;">${q.sub}</div>
                            </div>
                        </div>
                        ${content}
                    </div>`;
        }).join('')}
            </div>`;

        _openModal('dklat-detailModal');
    };

    window.diklatZoomImg = function (src) {
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:24px;backdrop-filter:blur(4px);';
        el.innerHTML = `<img src="${src}" style="max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 25px 60px rgba(0,0,0,.5);">`;
        el.onclick = () => document.body.removeChild(el);
        document.body.appendChild(el);
    };

    // ─── TOAST ───────────────────────────────────────────────────
    function _toast(msg, type = 'info') {
        if (window.showToast) { showToast(msg, type); return; }
        console.log(`[Diklat toast/${type}]`, msg);
    }

    // ─── REGISTER SECTION ────────────────────────────────────────
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['diklat'] = function () {
        const section = document.getElementById('section-diklat');
        if (!section) return;

        const maxTw   = getMaxAllowedTriwulan();
        const twNames = ['', 'Triwulan I (Jan–Mar)', 'Triwulan II (Apr–Jun)', 'Triwulan III (Jul–Sep)', 'Triwulan IV (Okt–Des)'];

        const now = new Date();
        const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        section.innerHTML = `
<style>
/* ── Diklat Section Styles v2.2 ── */
.dklat-cards { display:none; }
@media (max-width: 768px) {
    .dklat-table-wrap { display:none !important; }
    .dklat-cards      { display:block !important; }
    .dklat-stats-row  { grid-template-columns:1fr 1fr !important; }
    .dklat-header-row { flex-direction:column; align-items:flex-start !important; }
}
@media (max-width: 420px) {
    .dklat-detail-qgrid { grid-template-columns:1fr !important; }
    .dklat-qgrid        { grid-template-columns:1fr !important; }
    .dklat-stats-row    { grid-template-columns:1fr 1fr !important; }
}
.dklat-qgrid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width: 520px) { .dklat-qgrid { grid-template-columns:1fr; } }

/* Stat cards */
.dklat-stat-card {
    position:relative;overflow:hidden;
    display:flex;flex-direction:column;gap:6px;
    padding:18px 20px;border-radius:14px;
    border:1px solid #e2e8f0;background:#fff;
    transition:transform .2s,box-shadow .2s;
    cursor:default;
}
.dklat-stat-card:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08); }
.dklat-stat-card::before {
    content:'';position:absolute;top:0;left:0;right:0;height:3px;
    border-radius:14px 14px 0 0;
}
.dklat-stat-card.blue::before   { background:linear-gradient(90deg,#3b82f6,#1d4ed8); }
.dklat-stat-card.green::before  { background:linear-gradient(90deg,#10b981,#059669); }
.dklat-stat-card.amber::before  { background:linear-gradient(90deg,#f59e0b,#b45309); }
.dklat-stat-card.red::before    { background:linear-gradient(90deg,#ef4444,#b91c1c); }
.dklat-stat-icon {
    width:40px;height:40px;border-radius:10px;
    display:flex;align-items:center;justify-content:center;
    margin-bottom:4px;
}
.dklat-stat-label { font-size:12px;font-weight:500;color:#64748b; }
.dklat-stat-val   { font-size:28px;font-weight:800;line-height:1;letter-spacing:-.02em; }
.dklat-stat-sub   { font-size:11.5px;color:#94a3b8;margin-top:2px; }

/* Period badges */
.dklat-tw-badge {
    display:inline-flex;align-items:center;gap:5px;
    padding:4px 12px;border-radius:20px;
    font-size:12px;font-weight:600;
    transition:opacity .2s;
}

/* Header area */
.dklat-page-header {
    display:flex;align-items:flex-start;justify-content:space-between;
    flex-wrap:wrap;gap:12px;
    margin-bottom:24px;
    padding-bottom:20px;
    border-bottom:1px solid #e2e8f0;
}

/* Table styles */
.dklat-table-wrap table thead tr {
    background:linear-gradient(135deg,#1e293b,#334155);
}
.dklat-table-wrap table thead th {
    color:rgba(255,255,255,.85) !important;
    font-size:11.5px;font-weight:600;
    text-transform:uppercase;letter-spacing:.05em;
    padding:12px 10px;
}
.dklat-table-wrap table tbody tr {
    border-bottom:1px solid #f1f5f9;
}

/* Search input */
.dklat-search-wrap {
    position:relative;
    display:flex;align-items:center;
}
.dklat-search-wrap .search-icon {
    position:absolute;left:11px;color:#94a3b8;pointer-events:none;
}
.dklat-search-wrap input {
    padding-left:34px !important;
}

/* Progress bar */
.dklat-progress-wrap {
    background:#f1f5f9;border-radius:10px;overflow:hidden;height:8px;
    margin-top:8px;
}
.dklat-progress-fill {
    height:100%;background:linear-gradient(90deg,#3b82f6,#10b981);
    border-radius:10px;transition:width .6s cubic-bezier(.4,0,.2,1);
}
</style>

<div class="container">

    <!-- ── Page Header ── -->
    <div class="dklat-page-header dklat-header-row">
        <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
                <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#1e293b,#334155);
                    display:flex;align-items:center;justify-content:center;">
                    ${SVG.award.replace('width="14" height="14"','width="18" height="18" stroke="white"')}
                </div>
                <div>
                    <h1 style="font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-.03em;margin:0;">Diklat &amp; Pelatihan</h1>
                    <p style="font-size:13px;color:#64748b;margin:0;">Rekap bukti keikutsertaan pelatihan pegawai per triwulan</p>
                </div>
            </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                <span style="color:#64748b;">${SVG.calendar}</span>
                <span style="font-size:12.5px;font-weight:600;color:#475569;">${monthName}</span>
            </div>
            <div style="padding:8px 14px;background:linear-gradient(135deg,#1e40af,#1d4ed8);border-radius:10px;">
                <span style="font-size:12.5px;font-weight:700;color:#fff;">Periode Aktif: ${twNames[maxTw]}</span>
            </div>
        </div>
    </div>

    <!-- ── Stats ── -->
    <div class="stats-grid">
        <div class="stat-card" style="border-left:4px solid #2563eb;">
            <div class="stat-label">Total Pegawai</div>
            <div class="stat-value" id="dklat-stat-total">0</div>
            <div class="stat-footer">Daftar resmi</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #10b981;">
            <div class="stat-label">Lengkap</div>
            <div class="stat-value" id="dklat-stat-lengkap">0</div>
            <div class="stat-footer">4 triwulan terisi</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #f59e0b;">
            <div class="stat-label">Sebagian</div>
            <div class="stat-value" id="dklat-stat-sebagian">0</div>
            <div class="stat-footer">1–3 triwulan</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #ef4444;">
            <div class="stat-label">Belum Ada Bukti</div>
            <div class="stat-value" id="dklat-stat-kosong">0</div>
            <div class="stat-footer">Semua kosong</div>
        </div>
    </div>



    <!-- ── Info banner ── -->
    <div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:1px solid #bae6fd;border-radius:12px;padding:12px 16px;margin-bottom:20px;font-size:12.5px;color:#0369a1;display:flex;gap:10px;align-items:flex-start;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>Upload dibuka sesuai <strong>periode aktif</strong> berdasarkan bulan berjalan.
        Jan–Mar → Tw I &nbsp;·&nbsp; Apr–Jun → Tw I &amp; II &nbsp;·&nbsp; Jul–Sep → Tw I–III &nbsp;·&nbsp; Okt–Des → Semua.
        Klik ikon <strong>pensil</strong> untuk upload bukti diklat.</span>
    </div>

    <!-- ── Table card ── -->
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <div>
                <h2 style="font-size:15px;font-weight:700;color:#1e293b;margin:0;">Daftar Bukti Diklat Pegawai</h2>
                <p style="font-size:12px;color:#94a3b8;margin:4px 0 0;">Semua pegawai ditampilkan — klik pensil untuk upload</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <div class="dklat-search-wrap">
                    <span class="search-icon">${SVG.search}</span>
                    <input type="text" class="search-input" id="dklat-search"
                        placeholder="Cari nama atau unit…" oninput="diklatApplyFilter()"
                        style="min-width:220px;border-radius:9px;font-size:13px;">
                </div>
                <button onclick="diklatLoad()" class="btn btn-sm"
                    style="display:inline-flex;align-items:center;gap:5px;border-radius:9px;font-size:12.5px;">
                    ${SVG.refresh} Refresh
                </button>
            </div>
        </div>

        <div class="table-container dklat-table-wrap" style="margin:0;">
            <table style="border-radius:0;">
                <thead>
                    <tr>
                        <th style="width:40px;">#</th>
                        <th>Nama Pegawai</th>
                        <th>Unit / Bagian</th>
                        <th style="text-align:center;">Trw. I</th>
                        <th style="text-align:center;">Trw. II</th>
                        <th style="text-align:center;">Trw. III</th>
                        <th style="text-align:center;">Trw. IV</th>
                        <th style="width:100px;text-align:center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="dklat-tbody">
                    <tr><td colspan="8" style="text-align:center;padding:48px;color:#94a3b8;">Memuat data…</td></tr>
                </tbody>
            </table>
        </div>
        <div class="dklat-cards" id="dklat-cards" style="padding:12px;"></div>
        <div class="pagination" id="dklat-pagination"></div>
    </div>
</div>

<!-- ── MODAL: FORM UPLOAD ── -->
<div id="dklat-formModal" class="modal-overlay" onclick="if(event.target===this)diklatCloseModal('dklat-formModal')">
    <div class="modal" style="max-width:700px;border-radius:18px;overflow:hidden;">
        <div class="modal-header" style="background:linear-gradient(135deg,#1e293b,#334155);padding:20px 24px;">
            <h2 class="modal-title" id="dklat-modal-title" style="color:#fff;font-size:16px;font-weight:700;">Upload Bukti Diklat</h2>
        </div>
        <div class="modal-content" style="padding:24px;">

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px;">
                <div class="form-group" style="margin:0;">
                    <label class="input-label" style="font-weight:600;color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:.04em;">Nama Peserta <span style="color:#ef4444;">*</span></label>
                    <input type="text" class="form-input" id="dklat-form-nama" placeholder="Nama lengkap pegawai"
                        style="background:#f8fafc;border-radius:10px;font-size:13.5px;margin-top:6px;">
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="input-label" style="font-weight:600;color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:.04em;">Unit / Bagian <span style="color:#ef4444;">*</span></label>
                    <select class="form-input" id="dklat-form-unit" style="background:#f8fafc;border-radius:10px;font-size:13.5px;margin-top:6px;">
                        <option value="">— Pilih Unit —</option>
                        <option value="Sekretariat">Sekretariat</option>
                        <option value="Bidang Koperasi">Bidang Koperasi</option>
                        <option value="Bidang UKM">Bidang UKM</option>
                        <option value="Bidang Usaha Mikro">Bidang Usaha Mikro</option>
                        <option value="Bidang Kewirausahaan">Bidang Kewirausahaan</option>
                        <option value="Balai Layanan Usaha Terpadu KUMKM">Balai Layanan Usaha Terpadu KUMKM</option>
                    </select>
                </div>
            </div>

            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;white-space:nowrap;">Bukti per Triwulan</span>
                <span style="flex:1;height:1px;background:#e2e8f0;"></span>
                <span style="font-size:11.5px;color:#475569;font-weight:600;white-space:nowrap;background:#f1f5f9;padding:3px 10px;border-radius:20px;">Periode: ${twNames[maxTw]}</span>
            </div>

            <div class="dklat-qgrid" id="dklat-quarters-grid"></div>

            <div style="margin-top:14px;padding:11px 14px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:10px;
                border:1px solid #bae6fd;font-size:12px;color:#0369a1;display:flex;gap:8px;align-items:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Upload langsung maks <strong>10 MB</strong> &nbsp;·&nbsp; Atau tempelkan link Google Drive.
            </div>
        </div>
        <div class="modal-footer" style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <button onclick="diklatCloseModal('dklat-formModal');document.getElementById('dklat-form-nama').readOnly=false;document.getElementById('dklat-form-unit').disabled=false;"
                class="btn" style="flex:1;border-radius:10px;">Batal</button>
            <button id="dklat-btn-save" onclick="diklatSubmitForm()" class="btn btn-success"
                style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:10px;font-weight:700;">
                ${SVG.check} &nbsp;Simpan Data
            </button>
        </div>
    </div>
</div>

<!-- ── MODAL: DETAIL ── -->
<div id="dklat-detailModal" class="modal-overlay" onclick="if(event.target===this)diklatCloseModal('dklat-detailModal')">
    <div class="modal" style="max-width:660px;border-radius:18px;overflow:hidden;">
        <div class="modal-header" style="background:linear-gradient(135deg,#1e293b,#334155);padding:20px 24px;">
            <h2 class="modal-title" style="color:#fff;font-size:16px;font-weight:700;">Detail Diklat</h2>
        </div>
        <div class="modal-content" style="padding:24px;" id="dklat-detail-body"></div>
        <div class="modal-footer" style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <button onclick="diklatCloseModal('dklat-detailModal')" class="btn" style="flex:1;border-radius:10px;">Tutup</button>
        </div>
    </div>
</div>`;

        // Render daftar kosong dulu dari PEGAWAI_LIST
        allDiklat = buildMergedList();
        renderStats();
        renderPaginatedDiklat();

        // Fetch data dari server
        loadDiklat();
    };

})();