// ============================================================
// pengajuan-dana-bersama.js — Pengajuan Dana Bersama section
// Admin Panel — Dinas Koperasi UKM
// Dipanggil eksplisit via window.initPengajuanDanaBersama()
// dari dalam sectionInits['pengajuan-dana'] di pengajuan-dana.js
// Update: konten dirender ke #pdb-content-slot (tab ke-2)
// ============================================================
(function () {
    'use strict';

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrlBOq5yyUH-FSX6s1g_4feGVeJNJVNP_5vw7fAW4VdHrGxdwZgBnb_0rIomtXgw-U/exec';
    const CACHE_KEY = 'pengajuan_dana_bersama_cache';
    const CACHE_DURATION = 5 * 60 * 1000;
    const ITEMS_PER_PAGE = 10;

    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    let chartBersama = null;

    let currentEditId = null;
    let currentEditStatus = null;

    // ── Icons ─────────────────────────────────────────────────
    const ICONS = {
        refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
        check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
        x: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        eye: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
        save: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
        link: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
        user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        users: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        money: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
        briefcase: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
        clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    };

    // ── Cache ─────────────────────────────────────────────────
    function getCachedData() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const { data, timestamp } = JSON.parse(raw);
            if (Date.now() - timestamp < CACHE_DURATION) return data;
            localStorage.removeItem(CACHE_KEY);
        } catch { }
        return null;
    }
    function setCachedData(data) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() })); } catch { }
    }
    window.pdbClearCache = () => localStorage.removeItem(CACHE_KEY);

    // ── Helpers ───────────────────────────────────────────────
    function formatTimestamp(ts) {
        if (!ts) return '-';
        try {
            const d = new Date(ts);
            if (isNaN(d)) return String(ts);
            const p = n => String(n).padStart(2, '0');
            return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
        } catch { return String(ts); }
    }
    const fmtRupiah = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
    const fmtNum = n => new Intl.NumberFormat('id-ID').format(n || 0);

    function renderBidangChips(bidangStr) {
        if (!bidangStr) return '<span style="color:#94a3b8;">-</span>';
        const list = String(bidangStr).split(',').map(s => s.trim()).filter(Boolean);
        if (!list.length) return '<span style="color:#94a3b8;">-</span>';
        return list.map(b => `<span class="pdb-chip">${b}</span>`).join('');
    }

    // ── API (JSONP) ───────────────────────────────────────────
    function callAPI(params) {
        return new Promise((resolve, reject) => {
            const cb = 'pdb_cb_' + Date.now() + '_' + Math.floor(Math.random() * 1e4);
            window[cb] = data => { cleanup(); resolve(data); };
            const s = document.createElement('script');
            s.src = `${APPS_SCRIPT_URL}?${new URLSearchParams({ ...params, callback: cb })}`;
            const t = setTimeout(() => { cleanup(); reject(new Error('Timeout')); }, 15000);
            function cleanup() { clearTimeout(t); s.parentNode?.removeChild(s); delete window[cb]; }
            s.onerror = () => { cleanup(); reject(new Error('Network error')); };
            document.body.appendChild(s);
        });
    }

    // ── Load ──────────────────────────────────────────────────
    window.pdbLoadData = async function (forceRefresh = false) {
        if (!forceRefresh) {
            const cached = getCachedData();
            if (cached) {
                allData = cached;
                filteredData = [...allData];
                currentPage = 1;
                renderTable();
                updateStats();
                renderChart();
                return;
            }
        }
        const tbody = document.getElementById('pdb-data-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;">
            <div class="spinner"></div><div style="margin-top:12px;color:#94a3b8;">Memuat data...</div>
        </td></tr>`;
        const pgn = document.getElementById('pdb-pagination');
        if (pgn) pgn.innerHTML = '';
        try {
            const res = await callAPI({ action: 'getPengajuanDanaBersama' });
            if (res?.success) {
                allData = (res.data || []).slice().reverse();
                filteredData = [...allData];
                setCachedData(allData);
                currentPage = 1;
                renderTable();
                updateStats();
                renderChart();
            } else {
                showError(res?.message || 'Gagal memuat data');
            }
        } catch (err) {
            showError('Gagal menghubungi server: ' + err.message);
        }
    };

    function showError(msg) {
        const tbody = document.getElementById('pdb-data-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#ef4444;">${msg}
            <br><button onclick="pdbLoadData(true)" class="btn btn-sm" style="margin-top:12px;">Coba Lagi</button></td></tr>`;
    }

    // ── Filter ────────────────────────────────────────────────
    window.pdbFilterData = function () {
        const bulan = (document.getElementById('pdb-filter-bulan')?.value || '').toUpperCase();
        const status = (document.getElementById('pdb-filter-status')?.value || '').toUpperCase();
        const search = (document.getElementById('pdb-search')?.value || '').toLowerCase();

        filteredData = allData.filter(item => {
            const matchBulan = !bulan || (item.bulanPengajuan || '').toUpperCase() === bulan;
            const matchStatus = !status || (item.status || '').toUpperCase() === status;
            const matchSearch = !search
                || (item.nama || '').toLowerCase().includes(search)
                || (item.subKegiatan || '').toLowerCase().includes(search)
                || (item.bidang || '').toLowerCase().includes(search);
            return matchBulan && matchStatus && matchSearch;
        });
        currentPage = 1;
        renderTable();
        updateStats();
    };

    // ── Render Table + Pagination ─────────────────────────────
    function renderTable() {
        const tbody = document.getElementById('pdb-data-tbody');
        const pgn = document.getElementById('pdb-pagination');
        if (!tbody) return;

        if (!filteredData.length) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">
                Tidak ada data pengajuan dana bersama</td></tr>`;
            if (pgn) pgn.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const items = filteredData.slice(start, start + ITEMS_PER_PAGE);

        tbody.innerHTML = items.map(item => {
            const isPending = (item.status || '').toUpperCase() === 'PENDING';
            const isApproved = (item.status || '').toUpperCase() === 'APPROVED';
            const isRejected = (item.status || '').toUpperCase() === 'REJECTED';

            let statusCell;
            if (isPending) {
                statusCell = `<div style="display:flex;align-items:center;justify-content:center;gap:4px;">
                    <button onclick="pdbApproveItem('${item.id}')" class="btn-icon btn-icon-approve" title="Setujui" id="pdb-btn-approve-${item.id}">${ICONS.check}</button>
                    <button onclick="pdbRejectItem('${item.id}')"  class="btn-icon btn-icon-reject"  title="Tolak"   id="pdb-btn-reject-${item.id}">${ICONS.x}</button>
                </div>`;
            } else if (isApproved) {
                statusCell = `<span class="badge badge-approved">Disetujui</span>`;
            } else if (isRejected) {
                statusCell = `<span class="badge badge-rejected">Ditolak</span>`;
            } else {
                statusCell = `<span class="badge badge-pending">${item.status || '-'}</span>`;
            }

            return `<tr>
                <td style="font-size:.85rem;color:#64748b;">${formatTimestamp(item.timestamp)}</td>
                <td style="font-weight:500;">${item.nama || '-'}</td>
                <td style="min-width:180px;">${item.subKegiatan || '-'}</td>
                <td>${item.bulanPengajuan || '-'}</td>
                <td>Rp ${fmtNum(item.nominalPengajuan)}</td>
                <td style="min-width:220px;"><div class="pdb-chips-wrap">${renderBidangChips(item.bidang)}</div></td>
                <td style="text-align:center;vertical-align:middle;">${statusCell}</td>
                <td>
                    <td>
                    <div class="action-buttons"><div class="btn-icon-group">
                        <button onclick="pdbViewDetail('${item.id}')" class="btn-icon btn-icon-view" title="Lihat Detail">${ICONS.eye}</button>
                        <button onclick="pdbOpenEditModal('${item.id}')"   class="btn-icon btn-icon-edit"   title="Edit Status">${ICONS.edit}</button>
                        <button onclick="pdbOpenDeleteModal('${item.id}')" class="btn-icon btn-icon-delete" title="Hapus">${ICONS.trash}</button>
                    </div></div>
                </td>
                </td>
            </tr>`;
        }).join('');

        if (pgn) pgn.innerHTML = `
            <button onclick="pdbChangePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&#8249; Prev</button>
            <span class="pagination-info">Halaman ${currentPage} dari ${totalPages} (${filteredData.length} data)</span>
            <button onclick="pdbChangePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next &#8250;</button>`;
    }

    window.pdbChangePage = function (page) {
        const total = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
        if (page < 1 || page > total) return;
        currentPage = page;
        renderTable();
    };

    // ── Stats ─────────────────────────────────────────────────
    const BULAN_MAP = {
        'januari': 'JANUARI', 'februari': 'FEBRUARI', 'maret': 'MARET', 'april': 'APRIL',
        'mei': 'MEI', 'juni': 'JUNI', 'juli': 'JULI', 'agustus': 'AGUSTUS',
        'september': 'SEPTEMBER', 'oktober': 'OKTOBER', 'november': 'NOVEMBER', 'desember': 'DESEMBER'
    };

    function updateStats() {
        const now = new Date();
        const namaHari = now.toLocaleString('id-ID', { month: 'long' }).toLowerCase();
        const currentMonthKey = BULAN_MAP[namaHari] || namaHari.toUpperCase();
        const currentYear = now.getFullYear();

        const bulanIni = allData.filter(i => (i.bulanPengajuan || '').toUpperCase().trim() === currentMonthKey);
        const pending = allData.filter(i => (i.status || '').toUpperCase() === 'PENDING');
        const totalNom = filteredData.reduce((s, i) => s + (parseFloat(i.nominalPengajuan) || 0), 0);

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('pdb-stat-total', allData.length);
        set('pdb-stat-bulan', bulanIni.length);
        set('pdb-stat-pending', pending.length);
        set('pdb-stat-nominal', fmtRupiah(totalNom));
        set('pdb-stat-bulan-label', `${currentMonthKey} ${currentYear}`);
    }

    // ── Chart ─────────────────────────────────────────────────
    function renderChart() {
        const ct = document.getElementById('pdb-chartBersama');
        if (!ct) return;
        const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
            'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
        const md = {};
        months.forEach(m => { md[m] = { count: 0, nominal: 0 }; });
        allData.forEach(item => {
            const b = (item.bulanPengajuan || '').toUpperCase().trim();
            if (md[b]) { md[b].count++; md[b].nominal += parseFloat(item.nominalPengajuan) || 0; }
        });
        const labels = months.map(m => m.charAt(0) + m.slice(1).toLowerCase());
        const counts = months.map(m => md[m].count);
        const nominals = months.map(m => md[m].nominal / 1_000_000);
        if (chartBersama) chartBersama.destroy();
        chartBersama = new Chart(ct.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Jumlah Pengajuan', data: counts, backgroundColor: '#8b5cf6', borderRadius: 6, yAxisID: 'y' },
                    { label: 'Total Nominal (Juta Rp)', data: nominals, type: 'line', borderColor: '#6d28d9', backgroundColor: 'transparent', borderWidth: 2, tension: 0.4, yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { type: 'linear', position: 'left', title: { display: true, text: 'Jumlah Pengajuan' }, beginAtZero: true, ticks: { stepSize: 1 } },
                    y1: { type: 'linear', position: 'right', title: { display: true, text: 'Nominal (Juta Rp)' }, beginAtZero: true, grid: { drawOnChartArea: false } }
                },
                plugins: { legend: { position: 'top' } }
            }
        });
    }

    // ── Approve ───────────────────────────────────────────────
    window.pdbApproveItem = function (id) {
        showConfirmModal({
            icon: '✅', title: 'Setujui Pengajuan Dana Bersama?',
            message: 'Pengajuan dana bersama ini akan disetujui.',
            confirmText: 'Ya, Setujui', confirmClass: 'btn-success',
        }, async () => {
            const aBtn = document.getElementById(`pdb-btn-approve-${id}`);
            const rBtn = document.getElementById(`pdb-btn-reject-${id}`);
            if (aBtn) { aBtn.disabled = true; aBtn.innerHTML = '<span class="spinner spinner-sm"></span>'; }
            if (rBtn) rBtn.disabled = true;
            try {
                const res = await callAPI({ action: 'updateStatusPengajuanDanaBersama', id, status: 'APPROVED' });
                if (res?.success) {
                    if (window.showToast) showToast('Pengajuan dana bersama disetujui', 'success');
                    window.pdbClearCache(); await window.pdbLoadData(true);
                } else {
                    if (window.showToast) showToast(res?.message || 'Gagal', 'error');
                    if (aBtn) { aBtn.disabled = false; aBtn.innerHTML = ICONS.check; }
                    if (rBtn) rBtn.disabled = false;
                }
            } catch (err) {
                if (window.showToast) showToast('Error: ' + err.message, 'error');
                if (aBtn) { aBtn.disabled = false; aBtn.innerHTML = ICONS.check; }
                if (rBtn) rBtn.disabled = false;
            }
        });
    };

    // ── Reject ────────────────────────────────────────────────
    window.pdbRejectItem = function (id) {
        showConfirmModal({
            icon: '❌', title: 'Tolak Pengajuan Dana Bersama?',
            message: 'Pengajuan dana bersama ini akan ditolak.',
            confirmText: 'Ya, Tolak', confirmClass: 'btn-warning',
        }, async () => {
            const aBtn = document.getElementById(`pdb-btn-approve-${id}`);
            const rBtn = document.getElementById(`pdb-btn-reject-${id}`);
            if (rBtn) { rBtn.disabled = true; rBtn.innerHTML = '<span class="spinner spinner-sm"></span>'; }
            if (aBtn) aBtn.disabled = true;
            try {
                const res = await callAPI({ action: 'updateStatusPengajuanDanaBersama', id, status: 'REJECTED' });
                if (res?.success) {
                    if (window.showToast) showToast('Pengajuan dana bersama ditolak', 'success');
                    window.pdbClearCache(); await window.pdbLoadData(true);
                } else {
                    if (window.showToast) showToast(res?.message || 'Gagal', 'error');
                    if (rBtn) { rBtn.disabled = false; rBtn.innerHTML = ICONS.x; }
                    if (aBtn) aBtn.disabled = false;
                }
            } catch (err) {
                if (window.showToast) showToast('Error: ' + err.message, 'error');
                if (rBtn) { rBtn.disabled = false; rBtn.innerHTML = ICONS.x; }
                if (aBtn) aBtn.disabled = false;
            }
        });
    };

    // ── Edit Modal ────────────────────────────────────────────
    window.pdbOpenEditModal = function (id) {
        const item = allData.find(d => d.id === id);
        if (!item) return;
        currentEditId = id;
        currentEditStatus = (item.status || 'PENDING').toUpperCase();

        document.getElementById('pdb-edit-subtitle').textContent = `${item.nama || '-'} — ${item.bulanPengajuan || ''}`;
        document.getElementById('pdb-edit-info-nama').textContent = item.nama || '-';
        document.getElementById('pdb-edit-info-subkeg').textContent = item.subKegiatan || '-';
        document.getElementById('pdb-edit-info-bulan').textContent = item.bulanPengajuan || '-';
        document.getElementById('pdb-edit-info-nominal').textContent = fmtRupiah(item.nominalPengajuan);
        const bidangEl = document.getElementById('pdb-edit-info-bidang');
        if (bidangEl) bidangEl.innerHTML = renderBidangChips(item.bidang);

        pdbSelectStatus(currentEditStatus);
        document.getElementById('pdb-editModal').style.display = 'flex';
    };

    window.pdbSelectStatus = function (status) {
        currentEditStatus = status;
        ['PENDING', 'APPROVED', 'REJECTED'].forEach(s => {
            const el = document.getElementById('pdb-opt-' + s.toLowerCase());
            if (el) el.classList.remove('pdb-opt-selected-pending', 'pdb-opt-selected-approved', 'pdb-opt-selected-rejected');
        });
        const radio = document.getElementById('pdb-radio-' + status.toLowerCase());
        if (radio) radio.checked = true;
        const active = document.getElementById('pdb-opt-' + status.toLowerCase());
        if (active) active.classList.add('pdb-opt-selected-' + status.toLowerCase());
    };

    window.pdbCloseEditModal = function () {
        document.getElementById('pdb-editModal').style.display = 'none';
        currentEditId = null;
    };

    window.pdbSubmitEdit = async function () {
        if (!currentEditId || !currentEditStatus) return;
        const btn = document.getElementById('pdb-btn-submit-edit');
        const orig = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';
        try {
            const res = await callAPI({ action: 'updateStatusPengajuanDanaBersama', id: currentEditId, status: currentEditStatus });
            if (res?.success) {
                if (window.showToast) showToast('Status berhasil diperbarui', 'success');
                window.pdbClearCache(); window.pdbCloseEditModal(); await window.pdbLoadData(true);
            } else {
                if (window.showToast) showToast(res?.message || 'Gagal memperbarui status', 'error');
                btn.disabled = false; btn.innerHTML = orig;
            }
        } catch {
            if (window.showToast) showToast('Gagal menghubungi server', 'error');
            btn.disabled = false; btn.innerHTML = orig;
        }
    };

    // ── Delete ────────────────────────────────────────────────
    window.pdbOpenDeleteModal = function (id) {
        const item = allData.find(d => d.id === id);
        if (!item) return;
        showConfirmModal({
            icon: '🗑️', title: 'Hapus Pengajuan Dana Bersama?',
            message: `<strong>${item.nama || '-'}</strong><br>Bulan: ${item.bulanPengajuan || '-'} · Rp ${fmtNum(item.nominalPengajuan)}<br><br><span style="color:#ef4444;font-weight:600;">Tindakan ini tidak dapat dibatalkan.</span>`,
            confirmText: 'Ya, Hapus', confirmClass: 'btn-danger',
        }, async () => {
            try {
                const res = await callAPI({ action: 'deletePengajuanDanaBersama', id });
                if (res?.success) {
                    if (window.showToast) showToast('Data pengajuan dana bersama berhasil dihapus', 'success');
                    window.pdbClearCache(); await window.pdbLoadData(true);
                } else {
                    allData = allData.filter(d => d.id !== id);
                    filteredData = filteredData.filter(d => d.id !== id);
                    setCachedData(allData); renderTable(); updateStats(); renderChart();
                    if (window.showToast) showToast('Dihapus lokal. Server: ' + (res?.message || ''), 'error');
                }
            } catch (err) {
                if (window.showToast) showToast('Gagal menghubungi server: ' + err.message, 'error');
            }
        });
    };

    // ── View Detail ───────────────────────────────────────────
    window.pdbViewDetail = function (id) {
        const item = allData.find(d => d.id === id);
        if (!item) return;
        const ex = document.getElementById('pdb-detail-dynamic-modal');
        if (ex) ex.remove();

        const statusLabel = (item.status || '').toUpperCase() === 'APPROVED' ? 'Disetujui'
            : (item.status || '').toUpperCase() === 'REJECTED' ? 'Ditolak' : 'Pending';
        const statusColor = (item.status || '').toUpperCase() === 'APPROVED' ? '#10b981'
            : (item.status || '').toUpperCase() === 'REJECTED' ? '#ef4444' : '#f59e0b';
        const statusBg = (item.status || '').toUpperCase() === 'APPROVED' ? '#f0fdf4'
            : (item.status || '').toUpperCase() === 'REJECTED' ? '#fff1f2' : '#fffbeb';

        const modal = document.createElement('div');
        modal.id = 'pdb-detail-dynamic-modal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
        <div class="modal" style="max-width:580px;">
            <div class="modal-header"><h2 class="modal-title">Detail Pengajuan Dana Bersama</h2></div>
            <div class="modal-content">
                <div class="pd-detail-wrap">
                    <div class="pd-detail-status-banner" style="background:${statusBg};border-color:${statusColor};">
                        <div class="pd-detail-status-dot" style="background:${statusColor};"></div>
                        <span style="font-weight:700;color:${statusColor};font-size:14px;">${statusLabel}</span>
                        <span style="margin-left:auto;font-size:12px;color:#64748b;">${item.id || ''}</span>
                    </div>
                    <div class="pd-detail-section">
                        <div class="pd-detail-section-title">Informasi Pengaju</div>
                        <div class="pd-detail-field">
                            <div class="pd-detail-field-icon" style="background:#eff6ff;color:#3b82f6;">${ICONS.user}</div>
                            <div><div class="pd-detail-field-label">Nama</div><div class="pd-detail-field-value">${item.nama || '-'}</div></div>
                        </div>
                    </div>
                    <div class="pd-detail-section">
                        <div class="pd-detail-section-title">Informasi Pengajuan</div>
                        <div class="pd-detail-grid-2">
                            <div class="pd-detail-field">
                                <div class="pd-detail-field-icon" style="background:#fefce8;color:#ca8a04;">${ICONS.calendar}</div>
                                <div><div class="pd-detail-field-label">Bulan Pengajuan</div><div class="pd-detail-field-value">${item.bulanPengajuan || '-'}</div></div>
                            </div>
                            <div class="pd-detail-field">
                                <div class="pd-detail-field-icon" style="background:#fdf4ff;color:#a855f7;">${ICONS.money}</div>
                                <div><div class="pd-detail-field-label">Nominal Pengajuan</div><div class="pd-detail-field-value">${fmtRupiah(item.nominalPengajuan)}</div></div>
                            </div>
                            <div class="pd-detail-field" style="grid-column:1/-1;">
                                <div class="pd-detail-field-icon" style="background:#eff6ff;color:#3b82f6;">${ICONS.briefcase}</div>
                                <div><div class="pd-detail-field-label">Sub Kegiatan</div><div class="pd-detail-field-value">${item.subKegiatan || '-'}</div></div>
                            </div>
                            <div class="pd-detail-field">
                                <div class="pd-detail-field-icon" style="background:#fff7ed;color:#f97316;">${ICONS.clock}</div>
                                <div><div class="pd-detail-field-label">Waktu Pengajuan</div><div class="pd-detail-field-value" style="font-size:13px;">${formatTimestamp(item.timestamp)}</div></div>
                            </div>
                        </div>
                    </div>
                    <div class="pd-detail-section">
                        <div class="pd-detail-section-title">Bidang yang Terlibat</div>
                        <div style="display:flex;align-items:flex-start;gap:10px;">
                            <div class="pd-detail-field-icon" style="background:#f0fdf4;color:#10b981;flex-shrink:0;">${ICONS.users}</div>
                            <div style="display:flex;flex-wrap:wrap;gap:6px;padding-top:6px;">${renderBidangChips(item.bidang)}</div>
                        </div>
                    </div>
                    ${item.linkFilePengajuanDana ? `
                    <div class="pd-detail-section">
                        <div class="pd-detail-section-title">File Lampiran</div>
                        <a href="${item.linkFilePengajuanDana}" target="_blank" rel="noopener noreferrer"
                           class="btn btn-sm" style="display:inline-flex;align-items:center;gap:6px;">
                            ${ICONS.link} Buka File Pengajuan
                        </a>
                    </div>` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="document.getElementById('pdb-detail-dynamic-modal').remove()" class="btn" style="flex:1;">Tutup</button>
            </div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
    };

    // ═══════════════════════════════════════════════════════════
    // INIT — dipanggil eksplisit dari pengajuan-dana.js
    // Menyuntikkan konten ke #pdb-content-slot (di dalam tab ke-2)
    // ═══════════════════════════════════════════════════════════
    window.initPengajuanDanaBersama = function () {
        // Target: slot di dalam tab bersama
        const slot = document.getElementById('pdb-content-slot');
        if (!slot) return;

        // Reset chart lama jika re-init
        if (chartBersama) { chartBersama.destroy(); chartBersama = null; }

        slot.innerHTML = `
<style>
.pdb-chip        { display:inline-block; padding:2px 10px; border-radius:20px; font-size:11.5px; font-weight:600; background:#ede9fe; color:#5b21b6; white-space:nowrap; }
.pdb-chips-wrap  { display:flex; flex-wrap:wrap; gap:4px; }
.pdb-status-options { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
.pdb-status-option  { display:flex; align-items:center; gap:12px; padding:12px 14px; border:1.5px solid #e2e8f0; border-radius:10px; cursor:pointer; transition:all 0.15s; }
.pdb-status-option:hover { border-color:#94a3b8; background:#f8fafc; }
.pdb-status-option input[type="radio"] { display:none; }
.pdb-status-option-label { font-size:13.5px; font-weight:600; }
.pdb-status-option-sub   { font-size:12px; color:#64748b; margin-top:1px; }
.pdb-opt-selected-pending  { border-color:#f59e0b !important; background:#fffbeb !important; }
.pdb-opt-selected-approved { border-color:#10b981 !important; background:#f0fdf4 !important; }
.pdb-opt-selected-rejected { border-color:#ef4444 !important; background:#fff1f2 !important; }
.pdb-info-grid  { display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#f8fafc; border-radius:10px; padding:14px; border:1px solid #f1f5f9; margin-bottom:16px; }
.pdb-info-item  { display:flex; flex-direction:column; gap:2px; }
.pdb-info-label { font-size:11px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; }
.pdb-info-value { font-size:13px; font-weight:600; color:#1e293b; }
#pdb-data-tbody tr td:nth-child(7) { text-align:center; vertical-align:middle; }
#pdb-data-tbody tr { vertical-align:middle; }
</style>

<!-- ── Stat cards ──────────────────────────────────────── -->
<div class="stats-grid">
    <div class="stat-card" style="border-left:4px solid #7c3aed;">
        <div class="stat-label">Total Pengajuan</div>
        <div class="stat-value" id="pdb-stat-total">0</div>
        <div class="stat-footer">Laporan Pengajuan Dana Bersama</div>
    </div>
    <div class="stat-card" style="border-left:4px solid #8b5cf6;">
        <div class="stat-label">Bulan Ini</div>
        <div class="stat-value" id="pdb-stat-bulan">0</div>
        <div class="stat-footer" id="pdb-stat-bulan-label">Laporan</div>
    </div>
    <div class="stat-card" style="border-left:4px solid #f59e0b;">
        <div class="stat-label">Pending</div>
        <div class="stat-value" id="pdb-stat-pending">0</div>
        <div class="stat-footer">Menunggu verifikasi</div>
    </div>
    <div class="stat-card" style="border-left:4px solid #64748b;">
        <div class="stat-label">Total Nominal</div>
        <div class="stat-value" id="pdb-stat-nominal" style="font-size:24px;">Rp 0</div>
        <div class="stat-footer">Akumulasi pengajuan bersama</div>
    </div>
</div>

<!-- ── Chart ───────────────────────────────────────────── -->
<div class="card">
    <div class="card-header"><h2 class="card-title">Tren Pengajuan Dana Bersama per Bulan</h2></div>
    <div class="card-content"><div class="chart-container"><canvas id="pdb-chartBersama"></canvas></div></div>
</div>

<!-- ── Tabel ───────────────────────────────────────────── -->
<div class="card">
    <div class="card-header">
        <h2 class="card-title">Daftar Pengajuan Dana Bersama</h2>
        <div class="filter-container" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
            <select class="select-input" id="pdb-filter-bulan" onchange="pdbFilterData()">
                <option value="">Semua Bulan</option>
                <option value="JANUARI">Januari</option><option value="FEBRUARI">Februari</option>
                <option value="MARET">Maret</option><option value="APRIL">April</option>
                <option value="MEI">Mei</option><option value="JUNI">Juni</option>
                <option value="JULI">Juli</option><option value="AGUSTUS">Agustus</option>
                <option value="SEPTEMBER">September</option><option value="OKTOBER">Oktober</option>
                <option value="NOVEMBER">November</option><option value="DESEMBER">Desember</option>
            </select>
            <select class="select-input" id="pdb-filter-status" onchange="pdbFilterData()">
                <option value="">Semua Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Disetujui</option>
                <option value="REJECTED">Ditolak</option>
            </select>
            <input type="text" class="search-input" id="pdb-search"
                placeholder="Cari nama / sub kegiatan / bidang..." oninput="pdbFilterData()">
            <button onclick="pdbLoadData(true)" class="btn btn-sm" title="Refresh data">
                ${ICONS.refresh} Refresh
            </button>
        </div>
    </div>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Timestamp</th><th>Nama</th><th>Sub Kegiatan</th>
                    <th>Bulan</th><th>Nominal</th><th>Bidang yang Terlibat</th>
                    <th>Status</th><th>Aksi</th>
                </tr>
            </thead>
            <tbody id="pdb-data-tbody">
                <tr><td colspan="8" style="text-align:center;padding:40px;">
                    <div class="spinner"></div>
                    <div style="margin-top:12px;color:#94a3b8;">Memuat data...</div>
                </td></tr>
            </tbody>
        </table>
    </div>
    <div class="pagination" id="pdb-pagination"></div>
</div>

<!-- ════ EDIT STATUS MODAL — Pengajuan Dana Bersama ════ -->
<div id="pdb-editModal" class="modal-overlay" style="display:none;">
    <div class="modal" style="max-width:500px;">
        <div class="modal-header">
            <h2 class="modal-title">Edit Status Pengajuan Dana Bersama</h2>
            <p style="font-size:13px;color:#64748b;margin-top:4px;" id="pdb-edit-subtitle">—</p>
        </div>
        <div class="modal-content">
            <div class="pdb-info-grid">
                <div class="pdb-info-item"><div class="pdb-info-label">Nama</div><div class="pdb-info-value" id="pdb-edit-info-nama">—</div></div>
                <div class="pdb-info-item"><div class="pdb-info-label">Bulan</div><div class="pdb-info-value" id="pdb-edit-info-bulan">—</div></div>
                <div class="pdb-info-item" style="grid-column:1/-1;"><div class="pdb-info-label">Sub Kegiatan</div><div class="pdb-info-value" id="pdb-edit-info-subkeg">—</div></div>
                <div class="pdb-info-item"><div class="pdb-info-label">Nominal</div><div class="pdb-info-value" id="pdb-edit-info-nominal">—</div></div>
                <div class="pdb-info-item" style="grid-column:1/-1;">
                    <div class="pdb-info-label">Bidang yang Terlibat</div>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;" id="pdb-edit-info-bidang"></div>
                </div>
            </div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:8px;">Ubah Status</div>
            <div class="pdb-status-options">
                <label class="pdb-status-option" id="pdb-opt-pending" onclick="pdbSelectStatus('PENDING')">
                    <input type="radio" name="pdb-edit-status" id="pdb-radio-pending">
                    <div style="width:10px;height:10px;border-radius:50%;background:#f59e0b;flex-shrink:0;"></div>
                    <div><div class="pdb-status-option-label" style="color:#92400e;">Pending</div><div class="pdb-status-option-sub">Menunggu verifikasi admin</div></div>
                </label>
                <label class="pdb-status-option" id="pdb-opt-approved" onclick="pdbSelectStatus('APPROVED')">
                    <input type="radio" name="pdb-edit-status" id="pdb-radio-approved">
                    <div style="width:10px;height:10px;border-radius:50%;background:#10b981;flex-shrink:0;"></div>
                    <div><div class="pdb-status-option-label" style="color:#065f46;">Disetujui</div><div class="pdb-status-option-sub">Pengajuan dana bersama disetujui</div></div>
                </label>
                <label class="pdb-status-option" id="pdb-opt-rejected" onclick="pdbSelectStatus('REJECTED')">
                    <input type="radio" name="pdb-edit-status" id="pdb-radio-rejected">
                    <div style="width:10px;height:10px;border-radius:50%;background:#ef4444;flex-shrink:0;"></div>
                    <div><div class="pdb-status-option-label" style="color:#991b1b;">Ditolak</div><div class="pdb-status-option-sub">Pengajuan tidak disetujui</div></div>
                </label>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="pdbCloseEditModal()" class="btn" style="flex:1;">Batal</button>
            <button onclick="pdbSubmitEdit()" class="btn btn-primary" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;" id="pdb-btn-submit-edit">
                ${ICONS.save} Simpan Perubahan
            </button>
        </div>
    </div>
</div>`;

        window.addEventListener('click', e => {
            if (e.target.id === 'pdb-editModal') window.pdbCloseEditModal();
        });

        // Data belum dimuat — akan dipanggil saat tab diklik (lazy load via pdSwitchTab)
        // Namun preload diam-diam agar siap saat user berpindah tab
        window.pdbLoadData(false);
    };

})();