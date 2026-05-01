// ============================================================
// ruang-rapat.js — Ruang Rapat section (SPA)
// Admin Panel — Dinas Koperasi UKM
// Update: tambah field Difabel [12] dan Permintaan Khusus [13]
// ============================================================
(function () {
    'use strict';

    const API_URL = 'https://script.google.com/macros/s/AKfycbxNQCq-3r2xBQvug2uzlgGzUSm9FGNnXgoZjJKLzmZpw-BltRPUoCP8gFw8Ke2SV1Z8Eg/exec';
    const CACHE_DURATION = 5 * 60 * 1000;
    const CACHE_KEYS = { REQUESTS: 'ruang_rapat_requests', VIOLATIONS: 'ruang_rapat_violations', SCORES: 'ruang_rapat_scores' };

    let masterRequests = [], allRequests = [];
    let masterViolations = [], allViolations = [];
    let allScores = {}, scoreChart = null, violationChart = null;
    let currentApproveId = null, currentEditId = null;
    let currentEditViol = null;
    let selectedApprovedReq = null;
    let violSource = 'approved';
    let requestsCurrentPage = 1, violationsCurrentPage = 1;
    const itemsPerPage = 10;

    const MONTHS_ID = ['', 'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
        'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];

    const ALL_ROOMS = [
        'Ruang Sekar Polo', 'Ruang Purbonegoro', 'Ruang Sekar Asem', 'Ruang Sido Luhur',
        'Ruang Sekar Jagad', 'Ruang Sido Asih', 'Ruang Semen Rante', 'Ruang Truntum',
        'Ruang Bokor Kencana', 'Ruang Pamiluto', 'Ruang Wahyu Tumurun', 'Ruang Ratu Ratih',
        'Open Space', 'Coworking Space'
    ];

    const ICONS = {
        refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
        plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        checkCircle: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        x: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        eye: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
        door: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><circle cx="15.5" cy="12" r="0.5" fill="currentColor"/></svg>`,
        user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        building: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 9h6"/><path d="M3 15h6"/><path d="M15 9h3"/><path d="M15 15h3"/></svg>`,
        calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        users: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        fileText: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
        // ★ BARU
        wheelchair: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="1.5"/><path d="M9 8h3l2 6h4"/><path d="M9 8l-1 7"/><path d="M8 15a5 5 0 1 0 9.4 2.5"/></svg>`,
        note: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="12" y1="17" x2="8" y2="17"/></svg>`,
    };

    const OPT_BULAN = `<option value="">Pilih Bulan</option>
        <option value="JANUARI">Januari</option><option value="FEBRUARI">Februari</option>
        <option value="MARET">Maret</option><option value="APRIL">April</option>
        <option value="MEI">Mei</option><option value="JUNI">Juni</option>
        <option value="JULI">Juli</option><option value="AGUSTUS">Agustus</option>
        <option value="SEPTEMBER">September</option><option value="OKTOBER">Oktober</option>
        <option value="NOVEMBER">November</option><option value="DESEMBER">Desember</option>`;

    const OPT_UNIT = `<option value="">Pilih Unit</option>
        <option value="Sekretariat">Sekretariat</option>
        <option value="Bidang Koperasi">Bidang Koperasi</option>
        <option value="Bidang UKM">Bidang UKM</option>
        <option value="Bidang Usaha Mikro">Bidang Usaha Mikro</option>
        <option value="Bidang Kewirausahaan">Bidang Kewirausahaan</option>
        <option value="Balai Layanan Usaha Terpadu KUMKM">Balai Layanan Usaha Terpadu KUMKM</option>`;

    const OPT_RUANG = `<option value="">Pilih Ruang Rapat</option>
        <option>Ruang Sekar Polo</option><option>Ruang Purbonegoro</option>
        <option>Ruang Sekar Asem</option><option>Ruang Sido Luhur</option>
        <option>Ruang Sekar Jagad</option><option>Ruang Sido Asih</option>
        <option>Ruang Semen Rante</option><option>Ruang Truntum</option>
        <option>Ruang Bokor Kencana</option><option>Ruang Pamiluto</option>
        <option>Ruang Wahyu Tumurun</option><option>Ruang Ratu Ratih</option>
        <option>Open Space</option><option>Coworking Space</option>`;

    // ★ BARU: opsi difabel
    const OPT_DIFABEL = `
        <option value="">Pilih jawaban</option>
        <option value="Ya">Ya</option>
        <option value="Tidak">Tidak</option>
        <option value="Tidak Tahu">Tidak Tahu</option>`;

    // ── Helper: render badge difabel ──────────────────────────
    function difabelBadge(val) {
        const v = String(val || 'Tidak Tahu').trim();
        if (v === 'Ya') return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:#ede9fe;color:#5b21b6;">♿ Ya</span>`;
        if (v === 'Tidak') return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:#f0fdf4;color:#15803d;">✓ Tidak</span>`;
        return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:#f1f5f9;color:#64748b;">? Tidak Tahu</span>`;
    }

    // ── Cache ─────────────────────────────────────────────────
    function saveToCache(k, d) { try { localStorage.setItem(k, JSON.stringify({ data: d, timestamp: Date.now() })); } catch (e) { } }
    function getFromCache(k) { try { const c = localStorage.getItem(k); if (!c) return null; const p = JSON.parse(c); if (Date.now() - p.timestamp < CACHE_DURATION) return p.data; localStorage.removeItem(k); return null; } catch (e) { return null; } }
    function clearCache() { Object.values(CACHE_KEYS).forEach(k => localStorage.removeItem(k)); }
    function showCacheIndicator() { const el = document.getElementById('rr-cache-indicator'); if (el) { el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2000); } }

    // ── API (JSONP) ───────────────────────────────────────────
    function callAPI(params) {
        return new Promise((resolve, reject) => {
            const cb = 'rr_cb_' + Math.round(100000 * Math.random());
            window[cb] = data => { delete window[cb]; document.getElementById(cb)?.remove(); resolve(data); };
            const qs = new URLSearchParams({ ...params, callback: cb }).toString();
            const script = document.createElement('script');
            script.id = cb; script.src = `${API_URL}?${qs}`;
            const tid = setTimeout(() => { delete window[cb]; script.remove(); reject(new Error('Timeout')); }, 15000);
            script.onerror = () => { clearTimeout(tid); delete window[cb]; reject(new Error('Network error')); };
            document.body.appendChild(script);
        });
    }

    // ── Date helpers ─────────────────────────────────────────
    function normalizeDisplayDate(val) {
        if (!val || val === '-') return '-';
        const s = String(val).trim();
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) return s;
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const [y, m, d] = s.split('-');
            return `${parseInt(d)}-${parseInt(m)}-${y}`;
        }
        try { const dt = new Date(s); if (!isNaN(dt.getTime())) return `${dt.getDate()}-${dt.getMonth() + 1}-${dt.getFullYear()}`; } catch (e) { }
        return s;
    }
    function storageToInputDate(str) {
        const n = normalizeDisplayDate(str);
        if (n === '-' || !n) return '';
        const p = n.split('-');
        if (p.length === 3 && p[2].length === 4) return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
        return '';
    }
    function inputDateToStorage(str) {
        if (!str) return '';
        const p = str.split('-');
        if (p.length === 3 && p[0].length === 4) return `${parseInt(p[2])}-${parseInt(p[1])}-${p[0]}`;
        return str;
    }
    function normalizeDateForCompare(val) {
        if (!val) return '';
        const s = normalizeDisplayDate(val);
        const parts = s.split('-');
        if (parts.length === 3 && parts[2].length === 4)
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        return '';
    }

    function getIdOrderValue(rawId) {
        if (!rawId) return 0;
        const text = String(rawId).trim();
        if (!text) return 0;
        const tail = text.includes('|') ? text.split('|').pop() : text;
        const m = tail.match(/(\d+)(?!.*\d)/);
        return m ? parseInt(m[1], 10) : 0;
    }

    function sortByNewestId(arr) {
        return arr.slice().sort((a, b) => {
            const numericDiff = getIdOrderValue(b.id) - getIdOrderValue(a.id);
            if (numericDiff !== 0) return numericDiff;
            const ida = String(a.id || '');
            const idb = String(b.id || '');
            if (idb > ida) return 1;
            if (idb < ida) return -1;
            return 0;
        });
    }

    // ── Helpers ───────────────────────────────────────────────
    function createStatusBadge(status) {
        const s = (status || '').toLowerCase();
        const base = 'display:inline-flex;align-items:center;justify-content:center;min-width:80px;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;white-space:nowrap;';
        if (s === 'approved') return `<span style="${base}background:#dcfce7;color:#15803d;">Disetujui</span>`;
        if (s === 'completed' || s === 'selesai') return `<span style="${base}background:#dbeafe;color:#1d4ed8;">Selesai</span>`;
        if (s === 'rejected') return `<span style="${base}background:#fee2e2;color:#b91c1c;">Ditolak</span>`;
        return `<span style="${base}background:#fef9c3;color:#a16207;">Menunggu</span>`;
    }
    function openModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'flex'; }
    function closeModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    function setCurrentMonth(elId) {
        const el = document.getElementById(elId);
        if (el && !el.value) el.value = MONTHS_ID[new Date().getMonth() + 1];
    }
    function timeToMinutes(t) {
        if (!t || t === '-' || t === '—') return -1;
        const parts = String(t).trim().split(':');
        if (parts.length >= 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        return -1;
    }

    // ── Tab switch ────────────────────────────────────────────
    function rrSwitchTab(tabName, event) {
        document.querySelectorAll('#section-ruang-rapat .tab').forEach(t => t.classList.remove('active'));
        if (event?.target) event.target.classList.add('active');
        document.querySelectorAll('#section-ruang-rapat .tab-content').forEach(tc => tc.classList.remove('active'));
        const el = document.getElementById('rr-tab-' + tabName); if (el) el.classList.add('active');
        if (tabName === 'requests') loadRequests();
        else if (tabName === 'violations') loadViolations();
        else if (tabName === 'scores') loadScores();
    }
    window.rrSwitchTab = rrSwitchTab;
    window.rrSwitchTabDD = (v) => {
        document.querySelectorAll('#section-ruang-rapat .tab-content').forEach(tc => tc.classList.remove('active'));
        const el = document.getElementById('rr-tab-' + v); if (el) el.classList.add('active');
        if (v === 'requests') loadRequests(); else if (v === 'violations') loadViolations(); else if (v === 'scores') loadScores();
    };

    function updateStats() {
        const t = document.getElementById('rr-stat-total');
        const a = document.getElementById('rr-stat-approved');
        const p = document.getElementById('rr-stat-pending');
        const c = document.getElementById('rr-stat-completed');
        if (t) t.textContent = masterRequests.length;
        if (a) a.textContent = masterRequests.filter(r => (r.status || '').toUpperCase() === 'APPROVED').length;
        if (p) p.textContent = masterRequests.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;
        if (c) c.textContent = masterRequests.filter(r => (r.status || '').toUpperCase() === 'COMPLETED').length;
    }

    function rrApplyFilter() {
        const status = (document.getElementById('rr-filter-status')?.value || '').toUpperCase();
        const term = (document.getElementById('rr-search-requests')?.value || '').toLowerCase();
        allRequests = masterRequests.filter(r => {
            if (status && (r.status || '').toUpperCase() !== status) return false;
            return !term || (r.nama_pemohon || '').toLowerCase().includes(term)
                || (r.kegiatan || '').toLowerCase().includes(term)
                || (r.keperluan || '').toLowerCase().includes(term);
        });
        requestsCurrentPage = 1; renderPaginatedRequests();
    }
    window.rrApplyFilter = rrApplyFilter;

    // ═══ TAB 1: PERMINTAAN ═══════════════════════════════════
    async function loadRequests(forceRefresh = false) {
        if (!forceRefresh) {
            const cached = getFromCache(CACHE_KEYS.REQUESTS);
            if (cached) { masterRequests = sortByNewestId(cached); allRequests = [...masterRequests]; requestsCurrentPage = 1; renderPaginatedRequests(); showCacheIndicator(); return; }
        }
        const tbody = document.getElementById('rr-requests-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="loading"><div class="spinner"></div><p style="margin-top:12px;color:#64748b;">Memuat data...</p></td></tr>';
        try {
            const res = await callAPI({ action: 'getRoomRequests' });
            const rawData = Array.isArray(res) ? res : (res?.data || []);
            saveToCache(CACHE_KEYS.REQUESTS, rawData);
            masterRequests = sortByNewestId(rawData);
            allRequests = [...masterRequests]; requestsCurrentPage = 1;
            renderPaginatedRequests();
        } catch (e) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#ef4444;">Gagal memuat data. <button onclick="rrLoadRequests(true)" class="btn btn-sm" style="margin-left:8px;">Coba Lagi</button></td></tr>`;
            if (window.showToast) showToast('Gagal memuat data: ' + e.message, 'error');
        }
    }
    window.rrLoadRequests = (f) => loadRequests(f);
    window.rrLoadRoomRequests = (f) => loadRequests(f);

    function renderPaginatedRequests() {
        const tbody = document.getElementById('rr-requests-tbody');
        const cards = document.getElementById('rr-requests-cards');
        const pgn = document.getElementById('rr-requests-pagination');
        if (!tbody) return;
        updateStats();

        if (!allRequests.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada permintaan</td></tr>';
            if (cards) cards.innerHTML = '<div style="text-align:center;padding:2rem;color:#64748b;">Data tidak ditemukan</div>';
            if (pgn) pgn.innerHTML = ''; return;
        }
        const totalPages = Math.ceil(allRequests.length / itemsPerPage);
        const start = (requestsCurrentPage - 1) * itemsPerPage;
        const items = allRequests.slice(start, start + itemsPerPage);

        tbody.innerHTML = items.map(req => {
            const s = (req.status || '').toLowerCase();
            const isPending = s === 'pending';
            const isApproved = s === 'approved';
            const tgl = normalizeDisplayDate(req.tanggal);
            const ruangan = (req.namaRuang && req.namaRuang !== '-')
                ? `<span style="font-weight:500;">${req.namaRuang}</span>`
                : `<span style="color:#94a3b8;font-size:12px;">Belum ditentukan</span>`;

            // ★ BARU: tampilkan badge difabel
            const difabel = req.difabel || 'Tidak Tahu';
            const difabelHtml = difabelBadge(difabel);

            return `<tr>
                <td style="font-weight:500;">${req.nama_pemohon || '—'}</td>
                <td style="color:#64748b;font-size:13px;">${req.unit_eselon || '—'}</td>
                <td>${tgl}</td>
                <td>${req.waktu_mulai || '—'} – ${req.waktu_selesai || '—'}</td>
                <td>${ruangan}</td>
                <td style="text-align:center;">${difabelHtml}</td>
                <td style="min-width:110px;">
                    <div style="display:flex;align-items:center;justify-content:center;">
                    ${isPending ? `<div class="btn-icon-group" style="margin:0;">
                        <button onclick="rrOpenApprove('${req.id}')" class="btn-icon btn-icon-approve" title="Setujui">${ICONS.check}</button>
                        <button onclick="rrQuickReject('${req.id}', this)" class="btn-icon btn-icon-reject" title="Tolak">${ICONS.x}</button>
                    </div>` : createStatusBadge(req.status)}
                    </div>
                </td>
                <td><div class="action-buttons"><div class="btn-icon-group">
                    ${isApproved ? `<button onclick="rrMarkAsCompleted('${req.id}', this)" class="btn-icon btn-icon-complete" title="Selesai">${ICONS.checkCircle}</button>` : ''}
                    <button onclick="rrViewDetail('${req.id}')" class="btn-icon btn-icon-view" title="Detail">${ICONS.eye}</button>
                    <button onclick="rrOpenEdit('${req.id}')" class="btn-icon btn-icon-edit" title="Edit">${ICONS.edit}</button>
                    <button onclick="rrDeleteRequest('${req.id}', this)" class="btn-icon btn-icon-delete" title="Hapus">${ICONS.trash}</button>
                </div></div></td>
            </tr>`;
        }).join('');

        if (cards) cards.innerHTML = items.map(req => {
            const s = (req.status || '').toLowerCase();
            const isPending = s === 'pending';
            const isApproved = s === 'approved';
            const tgl = normalizeDisplayDate(req.tanggal);
            return `<div class="requests-card">
                <div class="requests-card-header">
                    <div style="flex:1;">
                        <div class="requests-card-title">${req.nama_pemohon || '—'}</div>
                        <div class="requests-card-subtitle">${req.unit_eselon || '—'}</div>
                    </div>
                    ${isPending ? `<div class="btn-icon-group" style="margin:0;">
                        <button onclick="rrOpenApprove('${req.id}')" class="btn-icon btn-icon-approve">${ICONS.check}</button>
                        <button onclick="rrQuickReject('${req.id}', this)" class="btn-icon btn-icon-reject">${ICONS.x}</button>
                    </div>` : createStatusBadge(req.status)}
                </div>
                <div class="requests-card-body">
                    <div class="requests-card-row"><span class="requests-card-label">Tanggal</span><span class="requests-card-value">${tgl}</span></div>
                    <div class="requests-card-row"><span class="requests-card-label">Waktu</span><span class="requests-card-value">${req.waktu_mulai || '—'} – ${req.waktu_selesai || '—'}</span></div>
                    <div class="requests-card-row"><span class="requests-card-label">Ruangan</span><span class="requests-card-value" style="font-weight:600;">${req.namaRuang || '-'}</span></div>
                    <div class="requests-card-row"><span class="requests-card-label">Keperluan</span><span class="requests-card-value">${req.kegiatan || req.keperluan || '—'}</span></div>
                    <div class="requests-card-row"><span class="requests-card-label">Difabel</span><span class="requests-card-value">${difabelBadge(req.difabel)}</span></div>
                    ${(req.permintaan_khusus && req.permintaan_khusus.trim())
                    ? `<div class="requests-card-row"><span class="requests-card-label">Permintaan Khusus</span><span class="requests-card-value" style="font-style:italic;color:#64748b;">${req.permintaan_khusus}</span></div>`
                    : ''}
                </div>
                <div class="requests-card-footer">
                    <div class="action-buttons" style="justify-content:flex-end;"><div class="btn-icon-group">
                        ${isApproved ? `<button onclick="rrMarkAsCompleted('${req.id}', this)" class="btn-icon btn-icon-complete">${ICONS.checkCircle}</button>` : ''}
                        <button onclick="rrViewDetail('${req.id}')" class="btn-icon btn-icon-view">${ICONS.eye}</button>
                        <button onclick="rrOpenEdit('${req.id}')" class="btn-icon btn-icon-edit">${ICONS.edit}</button>
                        <button onclick="rrDeleteRequest('${req.id}', this)" class="btn-icon btn-icon-delete">${ICONS.trash}</button>
                    </div></div>
                </div>
            </div>`;
        }).join('');

        if (pgn) pgn.innerHTML = `
            <button onclick="rrChangeReqPage(${requestsCurrentPage - 1})" ${requestsCurrentPage === 1 ? 'disabled' : ''}>&#8249; Prev</button>
            <span class="pagination-info">Halaman ${requestsCurrentPage} dari ${totalPages} (${allRequests.length} data)</span>
            <button onclick="rrChangeReqPage(${requestsCurrentPage + 1})" ${requestsCurrentPage === totalPages ? 'disabled' : ''}>Next &#8250;</button>`;
    }
    window.rrChangeReqPage = (page) => { const t = Math.ceil(allRequests.length / itemsPerPage); if (page < 1 || page > t) return; requestsCurrentPage = page; renderPaginatedRequests(); };

    // ── Detail Modal ──────────────────────────────────────────
    window.rrViewDetail = (id) => {
        const req = masterRequests.find(r => String(r.id) === String(id)); if (!req) return;
        const el = document.getElementById('rr-detail-body');
        const statusS = (req.status || 'pending').toLowerCase();
        const statusColor = statusS === 'approved' ? '#10b981' : statusS === 'rejected' ? '#ef4444' : statusS === 'completed' ? '#3b82f6' : '#f59e0b';
        const statusBg = statusS === 'approved' ? '#f0fdf4' : statusS === 'rejected' ? '#fff1f2' : statusS === 'completed' ? '#eff6ff' : '#fffbeb';
        const statusLabel = statusS === 'approved' ? 'Disetujui' : statusS === 'rejected' ? 'Ditolak' : statusS === 'completed' ? 'Selesai' : 'Menunggu';
        const ruangan = (req.namaRuang && req.namaRuang !== '-') ? req.namaRuang : 'Belum Ditentukan';

        // ★ BARU: data difabel & permintaan khusus
        const difabelVal = req.difabel || 'Tidak Tahu';
        const permKhusus = (req.permintaan_khusus || '').trim();

        if (el) el.innerHTML = `
        <div class="req-detail-wrap">
            <div class="req-detail-status-banner" style="background:${statusBg};border-color:${statusColor};">
                <div class="req-detail-status-dot" style="background:${statusColor};"></div>
                <span style="font-weight:700;color:${statusColor};font-size:14px;">${statusLabel}</span>
                <span style="margin-left:auto;font-size:12px;color:#64748b;">${req.id || ''}</span>
            </div>

            <div class="req-detail-section">
                <div class="req-detail-section-title">Informasi Pemohon</div>
                <div class="req-detail-grid-2">
                    <div class="req-detail-field"><div class="req-detail-field-icon" style="background:#eff6ff;color:#3b82f6;">${ICONS.user}</div><div><div class="req-detail-field-label">Nama</div><div class="req-detail-field-value">${req.nama_pemohon || '-'}</div></div></div>
                    <div class="req-detail-field"><div class="req-detail-field-icon" style="background:#f0fdf4;color:#10b981;">${ICONS.building}</div><div><div class="req-detail-field-label">Unit Eselon</div><div class="req-detail-field-value">${req.unit_eselon || '-'}</div></div></div>
                </div>
            </div>

            <div class="req-detail-section">
                <div class="req-detail-section-title">Jadwal Penggunaan</div>
                <div class="req-detail-grid-3">
                    <div class="req-detail-field"><div class="req-detail-field-icon" style="background:#fefce8;color:#ca8a04;">${ICONS.calendar}</div><div><div class="req-detail-field-label">Tanggal</div><div class="req-detail-field-value">${normalizeDisplayDate(req.tanggal)}</div></div></div>
                    <div class="req-detail-field"><div class="req-detail-field-icon" style="background:#fdf4ff;color:#a855f7;">${ICONS.clock}</div><div><div class="req-detail-field-label">Waktu Mulai</div><div class="req-detail-field-value">${req.waktu_mulai || '-'}</div></div></div>
                    <div class="req-detail-field"><div class="req-detail-field-icon" style="background:#fff7ed;color:#f97316;">${ICONS.clock}</div><div><div class="req-detail-field-label">Waktu Selesai</div><div class="req-detail-field-value">${req.waktu_selesai || '-'}</div></div></div>
                </div>
            </div>

            <div class="req-detail-section">
                <div class="req-detail-section-title">Ruang Rapat</div>
                <div class="req-detail-vehicle-box" style="border-color:${ruangan !== 'Belum Ditentukan' ? '#10b981' : '#e2e8f0'};background:${ruangan !== 'Belum Ditentukan' ? '#f0fdf4' : '#f8fafc'};">
                    ${ICONS.door}<span style="font-size:15px;font-weight:700;color:${ruangan !== 'Belum Ditentukan' ? '#065f46' : '#94a3b8'};">${ruangan}</span>
                </div>
                ${req.jumlah_peserta ? `<div class="req-detail-field" style="margin-top:10px;"><div class="req-detail-field-icon" style="background:#eff6ff;color:#3b82f6;">${ICONS.users}</div><div><div class="req-detail-field-label">Jumlah Peserta</div><div class="req-detail-field-value">${req.jumlah_peserta} Orang</div></div></div>` : ''}
            </div>

            <div class="req-detail-section">
                <div class="req-detail-section-title">Detail Keperluan</div>
                <div class="req-detail-field"><div class="req-detail-field-icon" style="background:#eff6ff;color:#3b82f6;">${ICONS.fileText}</div><div style="flex:1;"><div class="req-detail-field-label">Agenda / Kegiatan</div><div class="req-detail-field-value">${req.kegiatan || req.keperluan || '-'}</div></div></div>
            </div>

            <!-- ★ BARU: Informasi Aksesibilitas -->
            <div class="req-detail-section">
                <div class="req-detail-section-title">Informasi Aksesibilitas</div>
                <div class="req-detail-grid-2">
                    <div class="req-detail-field">
                        <div class="req-detail-field-icon" style="background:#ede9fe;color:#7c3aed;">${ICONS.wheelchair}</div>
                        <div>
                            <div class="req-detail-field-label">Peserta Difabel</div>
                            <div class="req-detail-field-value" style="margin-top:4px;">${difabelBadge(difabelVal)}</div>
                        </div>
                    </div>
                    <div class="req-detail-field">
                        <div class="req-detail-field-icon" style="background:#fef9c3;color:#a16207;">${ICONS.note}</div>
                        <div style="flex:1;">
                            <div class="req-detail-field-label">Permintaan Khusus</div>
                            <div class="req-detail-field-value" style="margin-top:2px;">${permKhusus
                ? `<span style="font-style:italic;color:#374151;">${permKhusus}</span>`
                : `<span style="color:#94a3b8;font-size:13px;">Tidak ada</span>`}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        openModal('rr-detailModal');
    };

    // ── Smart Room Availability ───────────────────────────────
    function isTimeConflict(existStart, existEnd, newStart, newEnd) {
        const es = timeToMinutes(existStart), ee = timeToMinutes(existEnd);
        const ns = timeToMinutes(newStart), ne = timeToMinutes(newEnd);
        if (es < 0 || ee < 0 || ns < 0 || ne < 0) return false;
        return ns < (ee + 30) && ne > es;
    }

    function getRoomAvailability(targetReqId) {
        const targetReq = masterRequests.find(r => String(r.id) === String(targetReqId));
        if (!targetReq) return ALL_ROOMS.map(r => ({ room: r, available: true, conflict: null }));
        const targetDate = normalizeDateForCompare(targetReq.tanggal);
        const targetStart = targetReq.waktu_mulai || '';
        const targetEnd = targetReq.waktu_selesai || '';
        return ALL_ROOMS.map(room => {
            const conflicts = masterRequests.filter(r => {
                if (String(r.id) === String(targetReqId)) return false;
                if ((r.namaRuang || '') !== room) return false;
                const rStatus = (r.status || '').toLowerCase();
                if (rStatus !== 'approved' && rStatus !== 'completed') return false;
                if (normalizeDateForCompare(r.tanggal) !== targetDate) return false;
                return isTimeConflict(r.waktu_mulai, r.waktu_selesai, targetStart, targetEnd);
            });
            if (!conflicts.length) return { room, available: true, conflict: null };
            const c = conflicts[0];
            const freeAt = timeToMinutes(c.waktu_selesai) + 30;
            return { room, available: false, conflict: { nama: c.nama_pemohon || '-', unit: c.unit_eselon || '-', start: c.waktu_mulai, end: c.waktu_selesai, freeAt: `${Math.floor(freeAt / 60).toString().padStart(2, '0')}:${(freeAt % 60).toString().padStart(2, '0')}` } };
        });
    }

    window.rrOpenApprove = (id) => {
        currentApproveId = id;
        const req = masterRequests.find(r => String(r.id) === String(id));
        const infoEl = document.getElementById('rr-approve-req-info');
        if (infoEl && req) {
            infoEl.innerHTML = `
                <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:13px;">
                    <div style="flex:1;min-width:140px;"><div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:2px;">Pemohon</div><div style="font-weight:600;color:#1e293b;">${req.nama_pemohon || '-'}</div><div style="color:#64748b;font-size:12px;">${req.unit_eselon || '-'}</div></div>
                    <div style="flex:1;min-width:140px;"><div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:2px;">Jadwal</div><div style="font-weight:600;color:#1e293b;">${normalizeDisplayDate(req.tanggal)}</div><div style="color:#64748b;font-size:12px;">${req.waktu_mulai || '—'} – ${req.waktu_selesai || '—'}</div></div>
                    ${req.jumlah_peserta ? `<div style="flex:1;min-width:100px;"><div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:2px;">Peserta</div><div style="font-weight:600;color:#1e293b;">${req.jumlah_peserta} Orang</div></div>` : ''}
                    <div style="flex:1;min-width:120px;"><div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:2px;">Difabel</div>${difabelBadge(req.difabel)}</div>
                    ${(req.permintaan_khusus && req.permintaan_khusus.trim()) ? `<div style="flex:2;min-width:200px;"><div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:2px;">Permintaan Khusus</div><div style="font-size:12px;color:#374151;font-style:italic;">${req.permintaan_khusus}</div></div>` : ''}
                </div>`;
        }
        const availability = getRoomAvailability(id);
        const listEl = document.getElementById('rr-room-smart-list');
        if (listEl) {
            listEl.innerHTML = availability.map(v => {
                if (v.available) {
                    return `<div class="rr-room-item rr-room-available" onclick="rrSelectRoom('${v.room.replace(/'/g, "\\'")}', this)">
                        <div class="rr-room-name">${v.room}</div>
                        <div class="rr-room-status rr-room-status-ok"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Tersedia</div>
                    </div>`;
                } else {
                    const c = v.conflict;
                    return `<div class="rr-room-item rr-room-busy" title="Digunakan: ${c.nama} (${c.start}–${c.end}), bebas pukul ${c.freeAt}">
                        <div><div class="rr-room-name" style="color:#94a3b8;">${v.room}</div><div style="font-size:11px;color:#64748b;margin-top:2px;">Dipakai: <strong>${c.nama}</strong> · ${c.start}–${c.end}</div><div style="font-size:11px;color:#f97316;margin-top:1px;">⏱ Bebas mulai pukul ${c.freeAt}</div></div>
                        <div class="rr-room-status rr-room-status-busy"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Tidak Tersedia</div>
                    </div>`;
                }
            }).join('');
        }
        document.getElementById('rr-room-hidden').value = '';
        const selDisplay = document.getElementById('rr-room-selected-display');
        if (selDisplay) selDisplay.style.display = 'none';
        openModal('rr-approveModal');
    };

    window.rrSelectRoom = (room, el) => {
        document.querySelectorAll('.rr-room-item.rr-room-available').forEach(i => i.classList.remove('rr-room-selected'));
        el.classList.add('rr-room-selected');
        document.getElementById('rr-room-hidden').value = room;
        const disp = document.getElementById('rr-room-selected-display');
        if (disp) { disp.style.display = 'flex'; disp.querySelector('.rr-room-chosen-name').textContent = room; }
    };

    window.rrConfirmApprove = async () => {
        const ruang = document.getElementById('rr-room-hidden')?.value;
        if (!ruang) { if (window.showToast) showToast('Pilih ruang rapat terlebih dahulu', 'error'); return; }
        const btn = document.getElementById('rr-confirm-approve-btn'), orig = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyetujui...';
        try {
            const res = await callAPI({ action: 'updateRoomRequest', id: currentApproveId, status: 'APPROVED', namaRuang: ruang });
            if (res.success) { if (window.showToast) showToast('Permintaan disetujui: ' + ruang, 'success'); closeModal('rr-approveModal'); clearCache(); await loadRequests(true); }
            else if (window.showToast) showToast(res.message || 'Gagal', 'error');
        } catch (e) { if (window.showToast) showToast('Gagal: ' + e.message, 'error'); }
        finally { btn.disabled = false; btn.innerHTML = orig; }
    };

    window.rrQuickReject = (id, btnEl) => {
        showConfirmModal({
            icon: '❌',
            title: 'Tolak Permintaan?',
            message: 'Permintaan ruang rapat ini akan ditolak.',
            confirmText: 'Ya, Tolak',
            confirmClass: 'btn-warning',
        }, async () => {
            const orig = btnEl ? btnEl.innerHTML : null;
            if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="spinner spinner-sm"></span>'; }
            try {
                const res = await callAPI({ action: 'updateRoomRequest', id, status: 'REJECTED' });
                if (res.success) { if (window.showToast) showToast('Permintaan ditolak', 'success'); clearCache(); await loadRequests(true); }
                else { if (window.showToast) showToast(res.message || 'Gagal', 'error'); if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; } }
            } catch (e) { if (window.showToast) showToast('Gagal: ' + e.message, 'error'); if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; } }
        });
    };

    window.rrMarkAsCompleted = (id, btnEl) => {
        showConfirmModal({
            icon: '✅',
            title: 'Tandai Selesai?',
            message: 'Permintaan ini akan ditandai sebagai <strong>Selesai</strong>.',
            confirmText: 'Ya, Selesai',
            confirmClass: 'btn-success',
        }, async () => {
            const orig = btnEl.innerHTML; btnEl.disabled = true; btnEl.innerHTML = '<span class="spinner spinner-sm"></span>';
            try {
                const res = await callAPI({ action: 'updateRoomRequest', id, status: 'COMPLETED' });
                if (res.success) { if (window.showToast) showToast('Status diperbarui menjadi Selesai', 'success'); clearCache(); await loadRequests(true); }
                else { if (window.showToast) showToast(res.message || 'Gagal', 'error'); btnEl.disabled = false; btnEl.innerHTML = orig; }
            } catch (e) { if (window.showToast) showToast('Gagal: ' + e.message, 'error'); btnEl.disabled = false; btnEl.innerHTML = orig; }
        });
    };

    // ── Edit pengajuan — termasuk difabel & permintaan_khusus ─
    window.rrOpenEdit = (id) => {
        const req = masterRequests.find(r => String(r.id) === String(id)); if (!req) return;
        currentEditId = id;
        const setVal = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val || ''; };
        setVal('rr-edit-nama', req.nama_pemohon);
        setVal('rr-edit-unit', req.unit_eselon);
        setVal('rr-edit-tanggal', storageToInputDate(req.tanggal));
        setVal('rr-edit-waktu-mulai', req.waktu_mulai);
        setVal('rr-edit-waktu-selesai', req.waktu_selesai);
        setVal('rr-edit-keperluan', req.kegiatan || req.keperluan);
        setVal('rr-edit-peserta', req.jumlah_peserta);
        setVal('rr-edit-room', req.namaRuang);
        setVal('rr-edit-status', (req.status || 'PENDING').toUpperCase());
        // ★ BARU
        setVal('rr-edit-difabel', req.difabel || 'Tidak Tahu');
        setVal('rr-edit-permintaan-khusus', req.permintaan_khusus || '');
        openModal('rr-editModal');
    };

    window.rrSubmitEdit = async () => {
        const btn = document.getElementById('rr-submit-edit-btn'), orig = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';
        try {
            const tanggalInput = document.getElementById('rr-edit-tanggal')?.value || '';
            const res = await callAPI({
                action: 'updateRoomRequest',
                id: currentEditId,
                nama_pemohon: document.getElementById('rr-edit-nama')?.value || '',
                unit_eselon: document.getElementById('rr-edit-unit')?.value || '',
                tanggal: inputDateToStorage(tanggalInput),
                waktu_mulai: document.getElementById('rr-edit-waktu-mulai')?.value || '',
                waktu_selesai: document.getElementById('rr-edit-waktu-selesai')?.value || '',
                keperluan: document.getElementById('rr-edit-keperluan')?.value || '',
                jumlah_peserta: document.getElementById('rr-edit-peserta')?.value || '',
                namaRuang: document.getElementById('rr-edit-room')?.value || '',
                status: document.getElementById('rr-edit-status')?.value || 'PENDING',
                // ★ BARU
                difabel: document.getElementById('rr-edit-difabel')?.value || 'Tidak Tahu',
                permintaan_khusus: document.getElementById('rr-edit-permintaan-khusus')?.value || ''
            });
            if (res.success) { if (window.showToast) showToast('Permintaan berhasil diperbarui', 'success'); closeModal('rr-editModal'); clearCache(); await loadRequests(true); }
            else if (window.showToast) showToast(res.message || 'Gagal', 'error');
        } catch (e) { if (window.showToast) showToast('Gagal: ' + e.message, 'error'); }
        finally { btn.disabled = false; btn.innerHTML = orig; }
    };

    window.rrDeleteRequest = (id, btnEl) => {
        showConfirmModal({
            icon: '🗑️',
            title: 'Hapus Permintaan?',
            message: 'Permintaan ruang rapat ini akan dihapus permanen. <span style="color:#ef4444;font-weight:600;">Tindakan ini tidak dapat dibatalkan.</span>',
            confirmText: 'Ya, Hapus',
            confirmClass: 'btn-danger',
        }, async () => {
            const orig = btnEl ? btnEl.innerHTML : null;
            if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="spinner spinner-sm"></span>'; }
            try {
                const res = await callAPI({ action: 'deleteRoomRequest', id });
                if (res.success) { if (window.showToast) showToast('Permintaan berhasil dihapus', 'success'); clearCache(); await loadRequests(true); }
                else { if (window.showToast) showToast(res.message || 'Gagal', 'error'); if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; } }
            } catch (e) { if (window.showToast) showToast('Gagal: ' + e.message, 'error'); if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; } }
        });
    };

    // ═══ TAB 2: VIOLATIONS ═══════════════════════════════════
    async function loadViolations(forceRefresh = false) {
        setCurrentMonth('rr-filter-bulan');
        if (!forceRefresh) {
            const cached = getFromCache(CACHE_KEYS.VIOLATIONS);
            if (cached) { masterViolations = sortByNewestId(cached); window.rrFilterViolations(); showCacheIndicator(); return; }
        }
        const tbody = document.getElementById('rr-violations-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="loading"><div class="spinner"></div><p style="margin-top:12px;color:#64748b;">Memuat data...</p></td></tr>';
        try {
            const res = await callAPI({ action: 'getRoomViolations' });
            const rawData = Array.isArray(res) ? res : (res?.data || []);
            saveToCache(CACHE_KEYS.VIOLATIONS, rawData);
            masterViolations = sortByNewestId(rawData);
            window.rrFilterViolations();
        } catch (e) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#ef4444;">Gagal memuat data.</td></tr>`;
            if (window.showToast) showToast('Gagal memuat data pelanggaran: ' + e.message, 'error');
        }
    }
    window.rrLoadViolations = (f) => loadViolations(f);

    window.rrFilterViolations = () => {
        const b = document.getElementById('rr-filter-bulan')?.value || '';
        const u = document.getElementById('rr-filter-unit')?.value || '';
        allViolations = masterViolations.filter(v => (!b || v.bulan === b) && (!u || v.unit === u));
        violationsCurrentPage = 1; renderPaginatedViolations();
    };

    function resolveViol(safeId) {
        try {
            const key = JSON.parse(decodeURIComponent(safeId));
            return allViolations.find(v => v.id === key.id && v.bulan === key.bulan && v.unit === key.unit)
                || masterViolations.find(v => v.id === key.id && v.bulan === key.bulan && v.unit === key.unit)
                || null;
        } catch (e) { return null; }
    }

    function renderPaginatedViolations() {
        const tbody = document.getElementById('rr-violations-tbody');
        const cards = document.getElementById('rr-violations-cards');
        const pgn = document.getElementById('rr-violations-pagination');
        if (!tbody) return;
        if (!allViolations.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada catatan pelanggaran</td></tr>';
            if (cards) cards.innerHTML = '<div style="text-align:center;padding:2rem;color:#64748b;">Data tidak ditemukan</div>';
            if (pgn) pgn.innerHTML = ''; return;
        }
        const totalPages = Math.ceil(allViolations.length / itemsPerPage);
        const start = (violationsCurrentPage - 1) * itemsPerPage;
        const items = allViolations.slice(start, start + itemsPerPage);

        tbody.innerHTML = items.map(v => {
            const safeV = encodeURIComponent(JSON.stringify({ id: v.id, bulan: v.bulan, unit: v.unit }));
            return `<tr>
                <td>${v.bulan || '—'}</td>
                <td>${v.unit || '—'}</td>
                <td>${normalizeDisplayDate(v.tanggal)}</td>
                <td>${v.namaRuang || '—'}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${v.laporan || ''}">${v.laporan || '—'}</td>
                <td><div class="action-buttons"><div class="btn-icon-group">
                    <button onclick="rrOpenEditViol('${safeV}')" class="btn-icon btn-icon-edit" title="Edit">${ICONS.edit}</button>
                    <button onclick="rrDeleteViol('${safeV}', this)" class="btn-icon btn-icon-delete" title="Hapus">${ICONS.trash}</button>
                </div></div></td>
            </tr>`;
        }).join('');

        if (cards) cards.innerHTML = items.map(v => {
            const safeV = encodeURIComponent(JSON.stringify({ id: v.id, bulan: v.bulan, unit: v.unit }));
            return `<div class="violation-card">
                <div class="violation-card-header"><div><div class="violation-card-title">${v.unit || '—'}</div><div class="violation-card-subtitle">Bulan ${v.bulan || '—'}</div></div></div>
                <div class="violation-card-body">
                    <div class="violation-card-item"><div class="violation-card-label">Tanggal</div><div class="violation-card-value">${normalizeDisplayDate(v.tanggal)}</div></div>
                    <div class="violation-card-item"><div class="violation-card-label">Nama Ruang</div><div class="violation-card-value">${v.namaRuang || '—'}</div></div>
                    <div class="violation-card-item" style="grid-column:1/-1"><div class="violation-card-label">Laporan</div><div class="violation-card-value">${v.laporan || '—'}</div></div>
                </div>
                <div class="violation-card-footer"><div class="action-buttons" style="justify-content:flex-end;"><div class="btn-icon-group">
                    <button onclick="rrOpenEditViol('${safeV}')" class="btn-icon btn-icon-edit">${ICONS.edit}</button>
                    <button onclick="rrDeleteViol('${safeV}', this)" class="btn-icon btn-icon-delete">${ICONS.trash}</button>
                </div></div></div>
            </div>`;
        }).join('');

        if (pgn) pgn.innerHTML = `
            <button onclick="rrChangeViolPage(${violationsCurrentPage - 1})" ${violationsCurrentPage === 1 ? 'disabled' : ''}>&#8249; Prev</button>
            <span class="pagination-info">Halaman ${violationsCurrentPage} dari ${totalPages} (${allViolations.length} data)</span>
            <button onclick="rrChangeViolPage(${violationsCurrentPage + 1})" ${violationsCurrentPage === totalPages ? 'disabled' : ''}>Next &#8250;</button>`;
    }
    window.rrChangeViolPage = (p) => { const t = Math.ceil(allViolations.length / itemsPerPage); if (p < 1 || p > t) return; violationsCurrentPage = p; renderPaginatedViolations(); };

    // ── TAMBAH VIOLATION ──────────────────────────────────────
    window.rrOpenAddViol = () => {
        selectedApprovedReq = null;
        ['rr-viol-tanggal', 'rr-viol-laporan', 'rr-viol-ruang', 'rr-viol-bulan', 'rr-viol-unit'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        const srch = document.getElementById('rr-approved-search'); if (srch) srch.value = '';
        const info = document.getElementById('rr-selected-req-info'); if (info) info.style.display = 'none';
        if (!masterRequests.length) loadRequests().then(() => renderApprovedReqList());
        else renderApprovedReqList();
        rrSetViolSource('approved');
        openModal('rr-addViolModal');
    };

    window.rrSetViolSource = (src) => {
        violSource = src;
        document.getElementById('rr-vsrc-approved').style.display = src === 'approved' ? 'block' : 'none';
        document.getElementById('rr-vsrc-manual').style.display = src === 'manual' ? 'block' : 'none';
        document.getElementById('rr-vsrc-btn-approved').className = `btn btn-sm ${src === 'approved' ? 'btn-primary' : ''}`;
        document.getElementById('rr-vsrc-btn-manual').className = `btn btn-sm ${src === 'manual' ? 'btn-primary' : ''}`;
        if (src === 'approved') renderApprovedReqList();
    };

    function renderApprovedReqList(filter = '') {
        const list = document.getElementById('rr-approved-req-list'); if (!list) return;
        const approved = masterRequests.filter(r => (r.status || '').toUpperCase() === 'APPROVED');
        const filtered = filter
            ? approved.filter(r => `${r.nama_pemohon} ${r.unit_eselon} ${r.namaRuang || ''}`.toLowerCase().includes(filter.toLowerCase()))
            : approved;
        if (!filtered.length) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b;font-size:13px;">Tidak ada pengajuan yang disetujui</div>';
            return;
        }
        list.innerHTML = filtered.map(r => `
            <div class="req-pick-item ${selectedApprovedReq?.id === r.id ? 'selected' : ''}" onclick="rrSelectApproved('${r.id}')">
                <div class="req-pick-check">${selectedApprovedReq?.id === r.id ? ICONS.check : ''}</div>
                <div style="flex:1;min-width:0;">
                    <div class="req-pick-name">${r.nama_pemohon || '-'}</div>
                    <div class="req-pick-meta">${r.unit_eselon || '-'} &nbsp;·&nbsp; <span style="font-size:11px;background:#f1f5f9;padding:1px 5px;border-radius:3px;">${r.namaRuang || 'Belum ditentukan'}</span></div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${normalizeDisplayDate(r.tanggal)} · ${r.waktu_mulai || '—'}–${r.waktu_selesai || '—'}</div>
                </div>
            </div>`).join('');
    }
    window.rrFilterApprovedReqs = () => renderApprovedReqList(document.getElementById('rr-approved-search')?.value || '');

    window.rrSelectApproved = (id) => {
        selectedApprovedReq = masterRequests.find(r => String(r.id) === String(id));
        renderApprovedReqList(document.getElementById('rr-approved-search')?.value || '');
        if (!selectedApprovedReq) return;
        const info = document.getElementById('rr-selected-req-info');
        const detail = document.getElementById('rr-selected-req-detail');
        if (info) info.style.display = 'block';
        if (detail) {
            const ruangLabel = selectedApprovedReq.namaRuang
                ? `<span style="font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:3px;">${selectedApprovedReq.namaRuang}</span>`
                : '<span style="color:#94a3b8;font-size:12px;">Belum ada ruangan</span>';
            detail.innerHTML = `<strong>${selectedApprovedReq.nama_pemohon}</strong> — ${selectedApprovedReq.unit_eselon} — ${ruangLabel}`;
        }
        const tglInput = document.getElementById('rr-viol-tanggal');
        if (tglInput) tglInput.value = storageToInputDate(selectedApprovedReq.tanggal);
        const ruangSel = document.getElementById('rr-viol-ruang');
        if (ruangSel) {
            const namaRuang = (selectedApprovedReq.namaRuang || '').trim();
            if (namaRuang) {
                let matched = false;
                for (let i = 0; i < ruangSel.options.length; i++) {
                    if (ruangSel.options[i].value.toLowerCase() === namaRuang.toLowerCase()) { ruangSel.selectedIndex = i; matched = true; break; }
                }
                if (!matched) ruangSel.value = '';
            } else { ruangSel.value = ''; }
        }
    };

    window.rrSubmitViol = async () => {
        const btn = document.getElementById('rr-submit-viol-btn'), orig = btn.innerHTML;
        const tglInput = document.getElementById('rr-viol-tanggal')?.value || '';
        const laporan = document.getElementById('rr-viol-laporan')?.value.trim() || '';
        const namaRuang = document.getElementById('rr-viol-ruang')?.value || '';
        if (!namaRuang) { if (window.showToast) showToast('Nama ruang harus dipilih', 'error'); return; }
        if (!tglInput) { if (window.showToast) showToast('Tanggal harus diisi', 'error'); return; }
        if (!laporan) { if (window.showToast) showToast('Laporan harus diisi', 'error'); return; }
        let bulan, unit;
        if (violSource === 'approved') {
            if (!selectedApprovedReq) { if (window.showToast) showToast('Pilih pengajuan yang disetujui', 'error'); return; }
            unit = selectedApprovedReq.unit_eselon;
            bulan = MONTHS_ID[new Date(tglInput + 'T00:00:00').getMonth() + 1];
        } else {
            bulan = document.getElementById('rr-viol-bulan')?.value || '';
            unit = document.getElementById('rr-viol-unit')?.value || '';
            if (!bulan || !unit) { if (window.showToast) showToast('Bulan dan unit harus diisi', 'error'); return; }
        }
        btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';
        try {
            const res = await callAPI({ action: 'createRoomViolation', bulan, unit, tanggal: inputDateToStorage(tglInput), namaRuang, laporan });
            if (res.success) { if (window.showToast) showToast('Catatan berhasil ditambahkan!', 'success'); closeModal('rr-addViolModal'); clearCache(); await loadViolations(true); await loadScores(true); }
            else { if (window.showToast) showToast(res.message || 'Gagal menyimpan', 'error'); }
        } catch (e) { if (window.showToast) showToast('Gagal: ' + e.message, 'error'); }
        finally { btn.disabled = false; btn.innerHTML = orig; }
    };

    // ── EDIT VIOLATION ────────────────────────────────────────
    window.rrOpenEditViol = (safeV) => {
        const v = resolveViol(safeV);
        if (!v) { if (window.showToast) showToast('Data tidak ditemukan', 'error'); return; }
        currentEditViol = v;
        const bulanEl = document.getElementById('rr-ev-bulan');
        const unitEl = document.getElementById('rr-ev-unit');
        if (bulanEl) bulanEl.value = v.bulan || '';
        if (unitEl) unitEl.value = v.unit || '';
        document.getElementById('rr-ev-tanggal').value = storageToInputDate(v.tanggal || '');
        document.getElementById('rr-ev-ruang').value = v.namaRuang || '';
        document.getElementById('rr-ev-laporan').value = v.laporan || '';
        if (bulanEl) bulanEl.dataset.original = v.bulan || '';
        if (unitEl) unitEl.dataset.original = v.unit || '';
        openModal('rr-editViolModal');
    };

    window.rrSubmitEditViol = async () => {
        if (!currentEditViol) { if (window.showToast) showToast('Tidak ada data yang diedit', 'error'); return; }
        const bulanBaru = document.getElementById('rr-ev-bulan')?.value;
        const unitBaru = document.getElementById('rr-ev-unit')?.value;
        const tanggalInput = document.getElementById('rr-ev-tanggal')?.value;
        const namaRuang = document.getElementById('rr-ev-ruang')?.value;
        const laporan = document.getElementById('rr-ev-laporan')?.value.trim();
        if (!bulanBaru || !unitBaru) { if (window.showToast) showToast('Bulan dan unit harus diisi', 'error'); return; }
        if (!tanggalInput) { if (window.showToast) showToast('Tanggal harus diisi', 'error'); return; }
        if (!laporan) { if (window.showToast) showToast('Laporan harus diisi', 'error'); return; }
        const bulanLama = document.getElementById('rr-ev-bulan')?.dataset.original || currentEditViol.bulan;
        const unitLama = document.getElementById('rr-ev-unit')?.dataset.original || currentEditViol.unit;
        const isPindah = bulanBaru !== bulanLama || unitBaru !== unitLama;
        const btn = document.getElementById('rr-submit-ev-btn'), orig = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';
        try {
            const res = await callAPI({
                action: 'updateRoomViolation',
                id: currentEditViol.id,
                bulan: bulanLama,
                unit: unitLama,
                tanggal: inputDateToStorage(tanggalInput),
                namaRuang,
                laporan,
                tanggal_lama: currentEditViol.tanggal,
                pindah: isPindah ? '1' : '0',
                bulan_baru: isPindah ? bulanBaru : undefined,
                unit_baru: isPindah ? unitBaru : undefined
            });
            if (res.success) { if (window.showToast) showToast(res.message || 'Catatan berhasil diperbarui!', 'success'); closeModal('rr-editViolModal'); currentEditViol = null; clearCache(); await loadViolations(true); await loadScores(true); }
            else if (window.showToast) showToast(res.message || 'Gagal', 'error');
        } catch (e) { if (window.showToast) showToast('Gagal: ' + e.message, 'error'); }
        finally { btn.disabled = false; btn.innerHTML = orig; }
    };

    window.rrDeleteViol = (safeV, btnEl) => {
        const v = resolveViol(safeV);
        if (!v) { if (window.showToast) showToast('Data tidak ditemukan', 'error'); return; }
        showConfirmModal({
            icon: '🗑️',
            title: 'Hapus Catatan Pelanggaran?',
            message: `Unit: <strong>${v.unit}</strong><br>Bulan: <strong>${v.bulan}</strong><br>Tanggal: <strong>${normalizeDisplayDate(v.tanggal)}</strong><br><br><span style="color:#ef4444;font-weight:600;">Tindakan ini tidak dapat dibatalkan.</span>`,
            confirmText: 'Ya, Hapus',
            confirmClass: 'btn-danger',
        }, async () => {
            const orig = btnEl ? btnEl.innerHTML : null;
            if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="spinner spinner-sm"></span>'; }
            try {
                const res = await callAPI({ action: 'deleteRoomViolation', id: v.id, bulan: v.bulan, unit: v.unit });
                if (res.success) { if (window.showToast) showToast('Catatan berhasil dihapus', 'success'); clearCache(); await loadViolations(true); await loadScores(true); }
                else { if (window.showToast) showToast(res.message || 'Gagal', 'error'); if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; } }
            } catch (e) {
                if (window.showToast) showToast('Gagal: ' + e.message, 'error');
                if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; }
            }
        });
    };

    // ═══ TAB 3: SCORES ═══════════════════════════════════════
    async function loadScores(forceRefresh = false) {
        let bulan = document.getElementById('rr-filter-score-bulan')?.value || '';
        if (!bulan) { bulan = MONTHS_ID[new Date().getMonth() + 1]; const el = document.getElementById('rr-filter-score-bulan'); if (el) el.value = bulan; }
        const ck = `${CACHE_KEYS.SCORES}_${bulan}`;
        try {
            if (!forceRefresh && bulan) { const cached = getFromCache(ck); if (cached) { allScores = cached; renderScores(); showCacheIndicator(); return; } }
            const container = document.getElementById('rr-scores-container');
            if (container) container.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px;">Memuat penilaian...</p></div>';
            const data = await callAPI({ action: 'getRoomScores' });
            if (data?.success) {
                allScores = { sanksi: data.sanksiPerPelanggaran, scores: data.scores };
                const sv = document.getElementById('rr-sanksi-value'); if (sv) sv.textContent = `${data.sanksiPerPelanggaran} poin`;
                if (bulan) saveToCache(ck, allScores);
                renderScores();
            } else throw new Error(data?.message || 'Respons tidak valid');
        } catch (e) {
            const container = document.getElementById('rr-scores-container');
            if (container) container.innerHTML = `<div class="empty-state"><p style="color:#ef4444;">${e.message}</p></div>`;
        }
    }
    window.rrLoadScores = (f) => loadScores(f);

    function renderScores() {
        const bulan = document.getElementById('rr-filter-score-bulan')?.value || '';
        const c = document.getElementById('rr-scores-container'); if (!c) return;
        if (!bulan) { c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><p>Pilih bulan untuk melihat penilaian</p></div>'; if (scoreChart) scoreChart.destroy(); if (violationChart) violationChart.destroy(); return; }
        if (!allScores.scores) { c.innerHTML = '<div class="empty-state"><p style="color:#ef4444;">Data tidak tersedia</p></div>'; return; }
        const monthScores = allScores.scores.filter(s => s.bulan === bulan);
        if (!monthScores.length) { c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Tidak ada data untuk bulan ini</p></div>'; if (scoreChart) scoreChart.destroy(); if (violationChart) violationChart.destroy(); return; }
        renderCharts(monthScores);
        c.innerHTML = '<div class="scores-grid">' + monthScores.map(score => {
            const s = parseFloat(score.skorAkhir) || 0;
            const cls = s >= 4.5 ? 'score-good' : s >= 3 ? 'score-warning' : 'score-danger';
            return `<div class="score-card">
                <div class="score-header"><div><div class="score-unit-name">${score.unit}</div><div class="score-month">Bulan ${score.bulan}</div></div><div class="score-value ${cls}">${s.toFixed(2)}</div></div>
                <div class="score-details">
                    <div class="score-detail-item"><div class="score-detail-label">Skor Utuh</div><div class="score-detail-value">${parseFloat(score.skorUtuh || 0).toFixed(1)}</div></div>
                    <div class="score-detail-item"><div class="score-detail-label">Pelanggaran</div><div class="score-detail-value">${score.jumlahPelanggaran || 0}</div></div>
                    <div class="score-detail-item"><div class="score-detail-label">Sanksi</div><div class="score-detail-value" style="color:#ef4444;">-${parseFloat(score.jumlahSanksi || 0).toFixed(2)}</div></div>
                </div>
            </div>`;
        }).join('') + '</div>';
    }

    function renderCharts(monthScores) {
        const units = monthScores.map(s => s.unit.length > 25 ? s.unit.substring(0, 22) + '...' : s.unit);
        const scores = monthScores.map(s => parseFloat(s.skorAkhir) || 0);
        const violations = monthScores.map(s => parseInt(s.jumlahPelanggaran) || 0);
        const scCtx = document.getElementById('rr-scoreChart'); if (!scCtx) return;
        const vlCtx = document.getElementById('rr-violationChart'); if (!vlCtx) return;
        if (scoreChart) scoreChart.destroy();
        scoreChart = new Chart(scCtx.getContext('2d'), {
            type: 'bar', data: { labels: units, datasets: [{ label: 'Skor Akhir', data: scores, backgroundColor: scores.map(s => s >= 4.5 ? '#10b981' : s >= 3 ? '#f59e0b' : '#ef4444'), borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 5, ticks: { stepSize: 0.5 } } } }
        });
        if (violationChart) violationChart.destroy();
        violationChart = new Chart(vlCtx.getContext('2d'), {
            type: 'bar', data: { labels: units, datasets: [{ label: 'Jumlah Pelanggaran', data: violations, backgroundColor: '#3b82f6', borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }

    // ═══ HTML ════════════════════════════════════════════════
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['ruang-rapat'] = function () {
        const section = document.getElementById('section-ruang-rapat');
        if (!section) return;
        section.innerHTML = `
<style>
.filter-container { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.section-page-header { margin-bottom:28px; padding-bottom:20px; border-bottom:1px solid #f1f5f9; }
.section-page-title { font-size:22px; font-weight:700; color:#0f172a; margin-bottom:4px; }
.section-page-subtitle { font-size:14px; color:#64748b; }
.vsrc-toggle { display:flex; gap:8px; margin-bottom:14px; }
.req-pick-list { max-height:260px; overflow-y:auto; border:1px solid #e5e7eb; border-radius:6px; margin-bottom:12px; }
.req-pick-item { padding:11px 14px; cursor:pointer; border-bottom:1px solid #f1f5f9; display:flex; align-items:flex-start; gap:10px; transition:background 0.12s; }
.req-pick-item:last-child { border-bottom:none; }
.req-pick-item:hover { background:#eff6ff; }
.req-pick-item.selected { background:#d1fae5; }
.req-pick-check { width:18px; height:18px; border-radius:50%; border:2px solid #e5e7eb; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:11px; font-weight:700; margin-top:2px; }
.req-pick-item.selected .req-pick-check { background:#10b981; border-color:#10b981; color:white; }
.req-pick-name { font-weight:600; font-size:13.5px; color:#1e293b; }
.req-pick-meta { font-size:12px; color:#64748b; margin-top:2px; }
#rr-requests-tbody tr td:nth-child(7), #section-ruang-rapat table thead tr th:nth-child(7) { text-align:center; vertical-align:middle; }
#rr-requests-tbody tr { vertical-align:middle; }
.req-detail-wrap { display:flex; flex-direction:column; gap:14px; }
.req-detail-status-banner { display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:10px; border:1.5px solid; }
.req-detail-status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.req-detail-section { background:#f8fafc; border-radius:10px; padding:14px; border:1px solid #f1f5f9; }
.req-detail-section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#94a3b8; margin-bottom:12px; }
.req-detail-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.req-detail-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
@media(max-width:480px) { .req-detail-grid-2,.req-detail-grid-3 { grid-template-columns:1fr; } }
.req-detail-field { display:flex; align-items:flex-start; gap:10px; }
.req-detail-field-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.req-detail-field-label { font-size:11px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:2px; }
.req-detail-field-value { font-size:13.5px; font-weight:600; color:#1e293b; line-height:1.4; }
.req-detail-vehicle-box { display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:10px; border:1.5px solid; }
.rr-room-item { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border:1.5px solid #e2e8f0; border-radius:10px; transition:all 0.15s; gap:12px; }
.rr-room-available { cursor:pointer; background:#fff; }
.rr-room-available:hover { border-color:#3b82f6; background:#eff6ff; }
.rr-room-available.rr-room-selected { border-color:#10b981; background:#f0fdf4; box-shadow:0 0 0 3px #bbf7d044; }
.rr-room-busy { background:#fafafa; cursor:not-allowed; opacity:0.85; }
.rr-room-name { font-weight:600; font-size:14px; color:#1e293b; }
.rr-room-status { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; white-space:nowrap; flex-shrink:0; }
.rr-room-status-ok { background:#dcfce7; color:#15803d; }
.rr-room-status-busy { background:#fee2e2; color:#b91c1c; }
</style>

<div class="container">
    <div class="section-page-header">
        <h1 class="section-page-title">Pelayanan Ruang Rapat</h1>
        <p class="section-page-subtitle">Kelola permintaan, catatan ketidakrapian, dan penilaian penggunaan ruang rapat</p>
    </div>

    <div class="tabs">
        <button class="tab active" onclick="rrSwitchTab('requests',event)">Permintaan</button>
        <button class="tab" onclick="rrSwitchTab('violations',event)">Catatan Pelanggaran</button>
        <button class="tab" onclick="rrSwitchTab('scores',event)">Penilaian</button>
    </div>
    <div class="tabs-dropdown">
        <select onchange="rrSwitchTabDD(this.value)">
            <option value="requests">Permintaan</option>
            <option value="violations">Catatan Pelanggaran</option>
            <option value="scores">Penilaian</option>
        </select>
    </div>

    <!-- TAB 1: Permintaan -->
    <div id="rr-tab-requests" class="tab-content active">
        <div class="stats-grid">
            <div class="stat-card" style="border-left:3px solid #64748b;"><div class="stat-label">Total Permintaan</div><div class="stat-value" id="rr-stat-total">0</div></div>
            <div class="stat-card" style="border-left:3px solid #10b981;"><div class="stat-label">Disetujui</div><div class="stat-value" id="rr-stat-approved">0</div></div>
            <div class="stat-card" style="border-left:3px solid #f59e0b;"><div class="stat-label">Menunggu</div><div class="stat-value" id="rr-stat-pending">0</div></div>
            <div class="stat-card" style="border-left:3px solid #3b82f6;"><div class="stat-label">Selesai</div><div class="stat-value" id="rr-stat-completed">0</div></div>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Daftar Permintaan Ruang Rapat</h2>
                <div class="filter-container">
                    <select class="select-input" id="rr-filter-status" onchange="rrApplyFilter()">
                        <option value="">Semua Status</option>
                        <option value="PENDING">Menunggu</option>
                        <option value="APPROVED">Disetujui</option>
                        <option value="COMPLETED">Selesai</option>
                    </select>
                    <input type="text" class="search-input" placeholder="Cari Nama..." id="rr-search-requests" oninput="rrApplyFilter()">
                    <button onclick="rrLoadRequests(true)" class="btn btn-sm">${ICONS.refresh} Refresh</button>
                </div>
            </div>
            <div class="table-container">
                <!-- ★ DIPERBARUI: tambah kolom Difabel -->
                <table>
                    <thead><tr>
                        <th>Nama</th>
                        <th>Unit / Bidang</th>
                        <th>Tanggal</th>
                        <th>Waktu</th>
                        <th>Ruangan</th>
                        <th style="text-align:center;">Difabel</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr></thead>
                    <tbody id="rr-requests-tbody"><tr><td colspan="8" class="loading"><div class="spinner"></div></td></tr></tbody>
                </table>
            </div>
            <div id="rr-requests-cards"></div>
            <div class="pagination" id="rr-requests-pagination"></div>
        </div>
    </div>

    <!-- TAB 2: Catatan Pelanggaran -->
    <div id="rr-tab-violations" class="tab-content">
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Catatan Ketidakrapian Ruangan</h2>
                <div class="filter-container">
                    <select class="select-input" id="rr-filter-bulan" onchange="rrFilterViolations()">
                        <option value="">Semua Bulan</option>
                        <option value="JANUARI">Januari</option><option value="FEBRUARI">Februari</option><option value="MARET">Maret</option><option value="APRIL">April</option>
                        <option value="MEI">Mei</option><option value="JUNI">Juni</option><option value="JULI">Juli</option><option value="AGUSTUS">Agustus</option>
                        <option value="SEPTEMBER">September</option><option value="OKTOBER">Oktober</option><option value="NOVEMBER">November</option><option value="DESEMBER">Desember</option>
                    </select>
                    <select class="select-input" id="rr-filter-unit" onchange="rrFilterViolations()">
                        <option value="">Semua Unit</option>
                        <option value="Sekretariat">Sekretariat</option><option value="Bidang Koperasi">Bidang Koperasi</option>
                        <option value="Bidang UKM">Bidang UKM</option><option value="Bidang Usaha Mikro">Bidang Usaha Mikro</option>
                        <option value="Bidang Kewirausahaan">Bidang Kewirausahaan</option>
                        <option value="Balai Layanan Usaha Terpadu KUMKM">BLUT KUMKM</option>
                    </select>
                    <button onclick="rrOpenAddViol()" class="btn btn-sm btn-primary">${ICONS.plus} Tambah</button>
                    <button onclick="rrLoadViolations(true)" class="btn btn-sm">${ICONS.refresh} Refresh</button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Bulan</th><th>Unit / Bidang</th><th>Tanggal</th><th>Nama Ruang</th><th>Laporan</th><th>Aksi</th></tr></thead>
                    <tbody id="rr-violations-tbody"><tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">Memuat data...</td></tr></tbody>
                </table>
            </div>
            <div id="rr-violations-cards"></div>
            <div class="pagination" id="rr-violations-pagination"></div>
        </div>
    </div>

    <!-- TAB 3: Penilaian -->
    <div id="rr-tab-scores" class="tab-content">
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Rekapitulasi Penilaian Penggunaan Ruang Rapat</h2>
                <div class="filter-container">
                    <select class="select-input" id="rr-filter-score-bulan" onchange="rrLoadScores(false)">
                        <option value="">Pilih Bulan</option>
                        <option value="JANUARI">Januari</option><option value="FEBRUARI">Februari</option><option value="MARET">Maret</option><option value="APRIL">April</option>
                        <option value="MEI">Mei</option><option value="JUNI">Juni</option><option value="JULI">Juli</option><option value="AGUSTUS">Agustus</option>
                        <option value="SEPTEMBER">September</option><option value="OKTOBER">Oktober</option><option value="NOVEMBER">November</option><option value="DESEMBER">Desember</option>
                    </select>
                    <button onclick="rrLoadScores(true)" class="btn btn-sm">${ICONS.refresh} Refresh</button>
                </div>
            </div>
            <div class="card-content">
                <div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #f1f5f9;">
                    <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;font-weight:600;margin-bottom:4px;">Sanksi per Ketidakrapian</p>
                    <p style="font-size:22px;font-weight:700;color:#0f172a;" id="rr-sanksi-value">—</p>
                </div>
                <div class="charts-grid">
                    <div class="card" style="margin:0;"><div class="card-header" style="padding:16px;"><h3 style="font-size:14px;font-weight:600;color:#374151;">Skor Akhir Per Unit</h3></div><div class="card-content"><div class="chart-container"><canvas id="rr-scoreChart"></canvas></div></div></div>
                    <div class="card" style="margin:0;"><div class="card-header" style="padding:16px;"><h3 style="font-size:14px;font-weight:600;color:#374151;">Jumlah Pelanggaran Per Unit</h3></div><div class="card-content"><div class="chart-container"><canvas id="rr-violationChart"></canvas></div></div></div>
                </div>
                <div id="rr-scores-container"><div class="empty-state"><div class="empty-state-icon">📊</div><p>Pilih bulan untuk melihat penilaian</p></div></div>
            </div>
        </div>
    </div>
</div>

<!-- ════════ MODALS ════════ -->

<!-- DETAIL -->
<div id="rr-detailModal" class="modal-overlay" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal" style="max-width:580px;">
        <div class="modal-header"><h2 class="modal-title">Detail Permintaan Ruang Rapat</h2></div>
        <div class="modal-content" id="rr-detail-body"></div>
        <div class="modal-footer"><button onclick="document.getElementById('rr-detailModal').style.display='none'" class="btn" style="flex:1;">Tutup</button></div>
    </div>
</div>

<!-- APPROVE — Smart Room Picker -->
<div id="rr-approveModal" class="modal-overlay" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal" style="max-width:560px;">
        <div class="modal-header"><h2 class="modal-title" style="display:flex;align-items:center;gap:8px;">${ICONS.door} Setujui &amp; Pilih Ruang Rapat</h2></div>
        <div class="modal-content" style="padding:20px;">
            <div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:14px;margin-bottom:18px;" id="rr-approve-req-info"></div>
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:10px;">Pilih Ruang Rapat <span style="font-weight:400;text-transform:none;letter-spacing:0;color:#94a3b8;margin-left:6px;">— merah = tidak tersedia</span></div>
            <div id="rr-room-smart-list" style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto;"></div>
            <div id="rr-room-selected-display" style="display:none;align-items:center;gap:10px;margin-top:14px;padding:12px 16px;background:#f0fdf4;border:1.5px solid #10b981;border-radius:10px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span style="font-size:13px;color:#064e3b;">Ruangan dipilih:</span>
                <span class="rr-room-chosen-name" style="font-weight:700;font-size:14px;color:#065f46;"></span>
            </div>
            <input type="hidden" id="rr-room-hidden">
        </div>
        <div class="modal-footer">
            <button onclick="document.getElementById('rr-approveModal').style.display='none'" class="btn" style="flex:1;">Batal</button>
            <button onclick="rrConfirmApprove()" class="btn btn-primary" style="flex:1;" id="rr-confirm-approve-btn">${ICONS.check} Setujui</button>
        </div>
    </div>
</div>

<!-- EDIT REQUEST — ★ DIPERBARUI: tambah Difabel & Permintaan Khusus -->
<div id="rr-editModal" class="modal-overlay" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal" style="max-width:600px;">
        <div class="modal-header"><h2 class="modal-title">Edit Permintaan Ruang Rapat</h2></div>
        <div class="modal-content">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group" style="grid-column:1/-1;"><label class="input-label">Nama <span style="color:#ef4444;">*</span></label><input type="text" class="form-input" id="rr-edit-nama" placeholder="Nama"></div>
                <div class="form-group" style="grid-column:1/-1;"><label class="input-label">Unit / Bidang <span style="color:#ef4444;">*</span></label>
                    <select class="form-input" id="rr-edit-unit">${OPT_UNIT}</select>
                </div>
                <div class="form-group"><label class="input-label">Tanggal <span style="color:#ef4444;">*</span></label><input type="date" class="form-input" id="rr-edit-tanggal"></div>
                <div class="form-group"><label class="input-label">Jumlah Peserta</label><input type="number" class="form-input" id="rr-edit-peserta" placeholder="0" min="0"></div>
                <div class="form-group"><label class="input-label">Waktu Mulai <span style="color:#ef4444;">*</span></label><input type="time" class="form-input" id="rr-edit-waktu-mulai"></div>
                <div class="form-group"><label class="input-label">Waktu Selesai <span style="color:#ef4444;">*</span></label><input type="time" class="form-input" id="rr-edit-waktu-selesai"></div>
                <div class="form-group" style="grid-column:1/-1;"><label class="input-label">Keperluan / Agenda</label><textarea class="form-textarea" id="rr-edit-keperluan" placeholder="Deskripsikan keperluan..."></textarea></div>
                <div class="form-group"><label class="input-label">Ruang Rapat</label><select class="form-input" id="rr-edit-room">${OPT_RUANG}</select></div>
                <div class="form-group"><label class="input-label">Status</label>
                    <select class="form-input" id="rr-edit-status">
                        <option value="PENDING">Menunggu</option>
                        <option value="APPROVED">Disetujui</option>
                        <option value="COMPLETED">Selesai</option>
                        <option value="REJECTED">Ditolak</option>
                    </select>
                </div>
                <!-- ★ BARU: Difabel & Permintaan Khusus di form edit -->
                <div class="form-group">
                    <label class="input-label">
                        ♿ Peserta Difabel
                        <span style="font-size:11px;font-weight:400;color:#94a3b8;margin-left:4px;">(opsional)</span>
                    </label>
                    <select class="form-input" id="rr-edit-difabel">${OPT_DIFABEL}</select>
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label class="input-label">
                        📌 Permintaan Khusus
                        <span style="font-size:11px;font-weight:400;color:#94a3b8;margin-left:4px;">(opsional)</span>
                    </label>
                    <textarea class="form-textarea" id="rr-edit-permintaan-khusus" rows="2" placeholder="Contoh: butuh proyektor, kursi roda, meja U-shape, dll."></textarea>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="document.getElementById('rr-editModal').style.display='none'" class="btn" style="flex:1;">Batal</button>
            <button onclick="rrSubmitEdit()" class="btn btn-primary" style="flex:1;" id="rr-submit-edit-btn">Simpan Perubahan</button>
        </div>
    </div>
</div>

<!-- ADD VIOLATION -->
<div id="rr-addViolModal" class="modal-overlay" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal" style="max-width:680px;">
        <div class="modal-header"><h2 class="modal-title">Tambah Catatan Ketidakrapian</h2></div>
        <div class="modal-content">
            <div class="vsrc-toggle">
                <button class="btn btn-sm btn-primary" id="rr-vsrc-btn-approved" onclick="rrSetViolSource('approved')">${ICONS.check} Dari Permintaan Disetujui</button>
                <button class="btn btn-sm" id="rr-vsrc-btn-manual" onclick="rrSetViolSource('manual')">${ICONS.plus} Input Manual</button>
            </div>
            <div id="rr-vsrc-approved">
                <div class="alert alert-info" style="margin-bottom:10px;">Pilih permintaan yang sudah disetujui sebagai dasar catatan.</div>
                <div class="form-group" style="margin-bottom:8px;"><input type="text" class="form-input" id="rr-approved-search" placeholder="Cari nama, unit, atau ruangan..." oninput="rrFilterApprovedReqs()"></div>
                <div class="req-pick-list" id="rr-approved-req-list"><div style="padding:20px;text-align:center;color:#64748b;font-size:13px;">Memuat data...</div></div>
                <div id="rr-selected-req-info" style="display:none;" class="info-box">
                    <p class="info-box-label">Permintaan Dipilih</p>
                    <div id="rr-selected-req-detail" style="font-size:13.5px;"></div>
                </div>
            </div>
            <div id="rr-vsrc-manual" style="display:none;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="form-group"><label class="input-label">Bulan <span style="color:#ef4444;">*</span></label><select class="form-input" id="rr-viol-bulan">${OPT_BULAN}</select></div>
                    <div class="form-group"><label class="input-label">Unit / Bidang <span style="color:#ef4444;">*</span></label><select class="form-input" id="rr-viol-unit">${OPT_UNIT}</select></div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;">
                <div class="form-group"><label class="input-label">Tanggal Penggunaan <span style="color:#ef4444;">*</span></label><input type="date" class="form-input" id="rr-viol-tanggal"></div>
                <div class="form-group"><label class="input-label">Nama Ruang <span style="color:#ef4444;">*</span></label><select class="form-input" id="rr-viol-ruang">${OPT_RUANG}</select></div>
                <div class="form-group" style="grid-column:1/-1;"><label class="input-label">Laporan Ketidakrapian <span style="color:#ef4444;">*</span></label><textarea class="form-textarea" id="rr-viol-laporan" placeholder="Deskripsikan ketidakrapian yang terjadi..."></textarea></div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="document.getElementById('rr-addViolModal').style.display='none'" class="btn" style="flex:1;">Batal</button>
            <button onclick="rrSubmitViol()" class="btn btn-primary" style="flex:1;" id="rr-submit-viol-btn">💾 Simpan</button>
        </div>
    </div>
</div>

<!-- EDIT VIOLATION -->
<div id="rr-editViolModal" class="modal-overlay" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal">
        <div class="modal-header"><h2 class="modal-title">Edit Catatan Ketidakrapian</h2></div>
        <div class="modal-content">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group"><label class="input-label">Bulan <span style="color:#ef4444;">*</span></label><select class="form-input" id="rr-ev-bulan" onchange="rrUpdatePindahBadge()">${OPT_BULAN}</select></div>
                <div class="form-group"><label class="input-label">Unit / Bidang <span style="color:#ef4444;">*</span></label><select class="form-input" id="rr-ev-unit" onchange="rrUpdatePindahBadge()">${OPT_UNIT}</select></div>
                <div class="form-group"><label class="input-label">Tanggal <span style="color:#ef4444;">*</span></label><input type="date" class="form-input" id="rr-ev-tanggal"></div>
                <div class="form-group"><label class="input-label">Nama Ruang <span style="color:#ef4444;">*</span></label><select class="form-input" id="rr-ev-ruang">${OPT_RUANG}</select></div>
                <div id="rr-ev-pindah-badge" style="display:none;grid-column:1/-1;padding:8px 12px;background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;color:#92400e;font-size:12px;font-weight:500;align-items:center;gap:6px;"></div>
                <div class="form-group" style="grid-column:1/-1;"><label class="input-label">Laporan <span style="color:#ef4444;">*</span></label><textarea class="form-textarea" id="rr-ev-laporan" placeholder="Deskripsikan ketidakrapian..."></textarea></div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="document.getElementById('rr-editViolModal').style.display='none'" class="btn" style="flex:1;">Batal</button>
            <button onclick="rrSubmitEditViol()" class="btn btn-primary" style="flex:1;" id="rr-submit-ev-btn">Simpan Perubahan</button>
        </div>
    </div>
</div>`;

        loadRequests();
    };
})();