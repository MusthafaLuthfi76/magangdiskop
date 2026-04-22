// ============================================================
// pengajuan-dana.js — Pengajuan Dana section (SPA)
// Admin Panel — Dinas Koperasi UKM
// Update: navigasi tab (Pengajuan Dana | Pengajuan Dana Bersama)
// ============================================================
(function () {
    'use strict';

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrlBOq5yyUH-FSX6s1g_4feGVeJNJVNP_5vw7fAW4VdHrGxdwZgBnb_0rIomtXgw-U/exec';
    const CACHE_KEY = 'pengajuan_dana_cache';
    const CACHE_DURATION = 5 * 60 * 1000;
    const ITEMS_PER_PAGE = 10;

    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    let chartPengajuan = null;

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
        building: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 9h6"/><path d="M3 15h6"/><path d="M15 9h3"/><path d="M15 15h3"/></svg>`,
        calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        money: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
        briefcase: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
        clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        fileText: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
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
    window.pdClearCache = () => localStorage.removeItem(CACHE_KEY);

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

    // ── API (JSONP) ───────────────────────────────────────────
    function callAPI(params) {
        return new Promise((resolve, reject) => {
            const cb = 'pd_cb_' + Date.now() + '_' + Math.floor(Math.random() * 1e4);
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
    window.pdLoadData = async function (forceRefresh = false) {
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
        const tbody = document.getElementById('pd-data-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;">
            <div class="spinner"></div><div style="margin-top:12px;color:#94a3b8;">Memuat data...</div>
        </td></tr>`;
        const pgn = document.getElementById('pd-pagination');
        if (pgn) pgn.innerHTML = '';
        try {
            const res = await callAPI({ action: 'getPengajuanDana' });
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
        const tbody = document.getElementById('pd-data-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#ef4444;">${msg}
            <br><button onclick="pdLoadData(true)" class="btn btn-sm" style="margin-top:12px;">Coba Lagi</button></td></tr>`;
    }

    // ── Filter ────────────────────────────────────────────────
    window.pdFilterData = function () {
        const bulan = (document.getElementById('pd-filter-bulan')?.value || '').toUpperCase();
        const unit = document.getElementById('pd-filter-unit')?.value || '';
        const status = (document.getElementById('pd-filter-status')?.value || '').toUpperCase();
        const search = (document.getElementById('pd-search')?.value || '').toLowerCase();

        filteredData = allData.filter(item => {
            const matchBulan = !bulan || (item.bulanPengajuan || '').toUpperCase() === bulan;
            const matchUnit = !unit || item.unit === unit;
            const matchStatus = !status || (item.status || '').toUpperCase() === status;
            const matchSearch = !search
                || (item.nama || '').toLowerCase().includes(search)
                || (item.subKegiatan || '').toLowerCase().includes(search)
                || (item.unit || '').toLowerCase().includes(search);
            return matchBulan && matchUnit && matchStatus && matchSearch;
        });
        currentPage = 1;
        renderTable();
        updateStats();
    };

    // ── Render Table + Pagination ─────────────────────────────
    function renderTable() {
        const tbody = document.getElementById('pd-data-tbody');
        const pgn = document.getElementById('pd-pagination');
        if (!tbody) return;

        if (!filteredData.length) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">
                Tidak ada data pengajuan dana</td></tr>`;
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
                    <button onclick="pdApproveItem('${item.id}')" class="btn-icon btn-icon-approve" title="Setujui" id="pd-btn-approve-${item.id}">${ICONS.check}</button>
                    <button onclick="pdRejectItem('${item.id}')" class="btn-icon btn-icon-reject" title="Tolak" id="pd-btn-reject-${item.id}">${ICONS.x}</button>
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
                <td>${item.unit || '-'}</td>
                <td style="min-width:200px;">${item.subKegiatan || '-'}</td>
                <td>${item.bulanPengajuan || '-'}</td>
                <td>Rp ${fmtNum(item.nominalPengajuan)}</td>
                <td style="text-align:center;vertical-align:middle;">${statusCell}</td>
                <td>
                    <td>
                    <div class="action-buttons"><div class="btn-icon-group">
                        <button onclick="pdViewDetail('${item.id}')" class="btn-icon btn-icon-view" title="Lihat Detail">${ICONS.eye}</button>
                        <button onclick="pdOpenEditModal('${item.id}')"   class="btn-icon btn-icon-edit"   title="Edit Status">${ICONS.edit}</button>
                        <button onclick="pdOpenDeleteModal('${item.id}')" class="btn-icon btn-icon-delete" title="Hapus">${ICONS.trash}</button>
                    </div></div>
                </td>
                </td>
            </tr>`;
        }).join('');

        if (pgn) pgn.innerHTML = `
            <button onclick="pdChangePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&#8249; Prev</button>
            <span class="pagination-info">Halaman ${currentPage} dari ${totalPages} (${filteredData.length} data)</span>
            <button onclick="pdChangePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next &#8250;</button>`;
    }

    window.pdChangePage = function (page) {
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

        const bulanIni = allData.filter(i =>
            (i.bulanPengajuan || '').toUpperCase().trim() === currentMonthKey
        );
        const pending = allData.filter(i => (i.status || '').toUpperCase() === 'PENDING');
        const totalNom = filteredData.reduce((s, i) => s + (parseFloat(i.nominalPengajuan) || 0), 0);

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('pd-stat-total', allData.length);
        set('pd-stat-bulan', bulanIni.length);
        set('pd-stat-pending', pending.length);
        set('pd-stat-nominal', fmtRupiah(totalNom));
        set('pd-stat-bulan-label', `${currentMonthKey} ${currentYear}`);
    }

    // ── Chart ─────────────────────────────────────────────────
    function renderChart() {
        const ct = document.getElementById('pd-chartPengajuan');
        if (!ct) return;
        const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
            'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
        const monthlyData = {};
        months.forEach(m => { monthlyData[m] = { count: 0, nominal: 0 }; });
        allData.forEach(item => {
            const b = (item.bulanPengajuan || '').toUpperCase().trim();
            if (monthlyData[b]) {
                monthlyData[b].count++;
                monthlyData[b].nominal += parseFloat(item.nominalPengajuan) || 0;
            }
        });
        const labels = months.map(m => m.charAt(0) + m.slice(1).toLowerCase());
        const counts = months.map(m => monthlyData[m].count);
        const nominals = months.map(m => monthlyData[m].nominal / 1_000_000);
        if (chartPengajuan) chartPengajuan.destroy();
        chartPengajuan = new Chart(ct.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Jumlah Pengajuan', data: counts, backgroundColor: '#3b82f6', borderRadius: 6, yAxisID: 'y' },
                    { label: 'Total Nominal (Juta Rp)', data: nominals, type: 'line', borderColor: '#1e40af', backgroundColor: 'transparent', borderWidth: 2, tension: 0.4, yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { type: 'linear', position: 'left', title: { display: true, text: 'Jumlah Pengajuan' }, beginAtZero: true, ticks: { stepSize: 1 } },
                    y1: { type: 'linear', position: 'right', title: { display: true, text: 'Nominal (Juta Rp)' }, beginAtZero: true, grid: { drawOnChartArea: false } }
                },
                plugins: { legend: { position: 'top' } }
            }
        });
    }

    // ── Approve ──────────────────────────────────────────────
    window.pdApproveItem = function (id) {
        showConfirmModal({
            icon: '✅',
            title: 'Setujui Pengajuan Dana?',
            message: 'Pengajuan dana ini akan disetujui.',
            confirmText: 'Ya, Setujui',
            confirmClass: 'btn-success',
        }, async () => {
            const aBtn = document.getElementById(`pd-btn-approve-${id}`);
            const rBtn = document.getElementById(`pd-btn-reject-${id}`);
            if (aBtn) { aBtn.disabled = true; aBtn.innerHTML = '<span class="spinner spinner-sm"></span>'; }
            if (rBtn) rBtn.disabled = true;
            try {
                const res = await callAPI({ action: 'updateStatusPengajuanDana', id, status: 'APPROVED' });
                if (res?.success) {
                    if (window.showToast) showToast('Pengajuan dana disetujui', 'success');
                    window.pdClearCache(); await window.pdLoadData(true);
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
    window.pdRejectItem = function (id) {
        showConfirmModal({
            icon: '❌',
            title: 'Tolak Pengajuan Dana?',
            message: 'Pengajuan dana ini akan ditolak.',
            confirmText: 'Ya, Tolak',
            confirmClass: 'btn-warning',
        }, async () => {
            const aBtn = document.getElementById(`pd-btn-approve-${id}`);
            const rBtn = document.getElementById(`pd-btn-reject-${id}`);
            if (rBtn) { rBtn.disabled = true; rBtn.innerHTML = '<span class="spinner spinner-sm"></span>'; }
            if (aBtn) aBtn.disabled = true;
            try {
                const res = await callAPI({ action: 'updateStatusPengajuanDana', id, status: 'REJECTED' });
                if (res?.success) {
                    if (window.showToast) showToast('Pengajuan dana ditolak', 'success');
                    window.pdClearCache(); await window.pdLoadData(true);
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

    // ── Edit Status Modal ─────────────────────────────────────
    window.pdOpenEditModal = function (id) {
        const item = allData.find(d => d.id === id);
        if (!item) return;
        currentEditId = id;
        currentEditStatus = (item.status || 'PENDING').toUpperCase();

        document.getElementById('pd-edit-subtitle').textContent = `${item.nama || '-'} — ${item.bulanPengajuan || ''}`;
        document.getElementById('pd-edit-info-nama').textContent = item.nama || '-';
        document.getElementById('pd-edit-info-unit').textContent = item.unit || '-';
        document.getElementById('pd-edit-info-subkeg').textContent = item.subKegiatan || '-';
        document.getElementById('pd-edit-info-bulan').textContent = item.bulanPengajuan || '-';
        document.getElementById('pd-edit-info-nominal').textContent = fmtRupiah(item.nominalPengajuan);

        pdSelectStatus(currentEditStatus);
        document.getElementById('pd-editModal').style.display = 'flex';
    };

    window.pdSelectStatus = function (status) {
        currentEditStatus = status;
        ['PENDING', 'APPROVED', 'REJECTED'].forEach(s => {
            const el = document.getElementById('pd-opt-' + s.toLowerCase());
            if (el) el.classList.remove('pd-opt-selected-pending', 'pd-opt-selected-approved', 'pd-opt-selected-rejected');
        });
        const radio = document.getElementById('pd-radio-' + status.toLowerCase());
        if (radio) radio.checked = true;
        const active = document.getElementById('pd-opt-' + status.toLowerCase());
        if (active) active.classList.add('pd-opt-selected-' + status.toLowerCase());
    };

    window.pdCloseEditModal = function () {
        document.getElementById('pd-editModal').style.display = 'none';
        currentEditId = null;
    };

    window.pdSubmitEdit = async function () {
        if (!currentEditId || !currentEditStatus) return;
        const btn = document.getElementById('pd-btn-submit-edit');
        const orig = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';
        try {
            const res = await callAPI({ action: 'updateStatusPengajuanDana', id: currentEditId, status: currentEditStatus });
            if (res?.success) {
                if (window.showToast) showToast('Status berhasil diperbarui', 'success');
                window.pdClearCache(); window.pdCloseEditModal(); btn.disabled = false; btn.innerHTML = orig; await window.pdLoadData(true);
            } else {
                if (window.showToast) showToast(res?.message || 'Gagal memperbarui status', 'error');
            }
        } catch (err) {
            if (window.showToast) showToast('Gagal menghubungi server', 'error');
            btn.disabled = false; btn.innerHTML = orig;
        }
    };

    // ── Delete ────────────────────────────────────────────────
    window.pdOpenDeleteModal = function (id) {
        const item = allData.find(d => d.id === id);
        if (!item) return;
        showConfirmModal({
            icon: '🗑️',
            title: 'Hapus Pengajuan Dana?',
            message: `<strong>${item.nama || '-'}</strong> — ${item.unit || '-'}<br>Bulan: ${item.bulanPengajuan || '-'} · Rp ${fmtNum(item.nominalPengajuan)}<br><br><span style="color:#ef4444;font-weight:600;">Tindakan ini tidak dapat dibatalkan.</span>`,
            confirmText: 'Ya, Hapus',
            confirmClass: 'btn-danger',
        }, async () => {
            try {
                const res = await callAPI({ action: 'deletePengajuanDana', id });
                if (res?.success) {
                    if (window.showToast) showToast('Data pengajuan dana berhasil dihapus', 'success');
                    window.pdClearCache(); await window.pdLoadData(true);
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
    window.pdViewDetail = function (id) {
        const item = allData.find(d => d.id === id);
        if (!item) return;
        const ex = document.getElementById('pd-detail-dynamic-modal');
        if (ex) ex.remove();

        const statusLabel = (item.status || '').toUpperCase() === 'APPROVED' ? 'Disetujui'
            : (item.status || '').toUpperCase() === 'REJECTED' ? 'Ditolak' : 'Pending';
        const statusColor = (item.status || '').toUpperCase() === 'APPROVED' ? '#10b981'
            : (item.status || '').toUpperCase() === 'REJECTED' ? '#ef4444' : '#f59e0b';
        const statusBg = (item.status || '').toUpperCase() === 'APPROVED' ? '#f0fdf4'
            : (item.status || '').toUpperCase() === 'REJECTED' ? '#fff1f2' : '#fffbeb';

        const modal = document.createElement('div');
        modal.id = 'pd-detail-dynamic-modal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
        <div class="modal" style="max-width:560px;">
            <div class="modal-header"><h2 class="modal-title">Detail Pengajuan Dana</h2></div>
            <div class="modal-content">
                <div class="pd-detail-wrap">
                    <div class="pd-detail-status-banner" style="background:${statusBg};border-color:${statusColor};">
                        <div class="pd-detail-status-dot" style="background:${statusColor};"></div>
                        <span style="font-weight:700;color:${statusColor};font-size:14px;">${statusLabel}</span>
                        <span style="margin-left:auto;font-size:12px;color:#64748b;">${item.id || ''}</span>
                    </div>
                    <div class="pd-detail-section">
                        <div class="pd-detail-section-title">Informasi Pegawai</div>
                        <div class="pd-detail-grid-2">
                            <div class="pd-detail-field">
                                <div class="pd-detail-field-icon" style="background:#eff6ff;color:#3b82f6;">${ICONS.user}</div>
                                <div><div class="pd-detail-field-label">Nama</div><div class="pd-detail-field-value">${item.nama || '-'}</div></div>
                            </div>
                            <div class="pd-detail-field">
                                <div class="pd-detail-field-icon" style="background:#f0fdf4;color:#10b981;">${ICONS.building}</div>
                                <div><div class="pd-detail-field-label">Unit / Bidang</div><div class="pd-detail-field-value">${item.unit || '-'}</div></div>
                            </div>
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
                <button onclick="document.getElementById('pd-detail-dynamic-modal').remove()" class="btn" style="flex:1;">Tutup</button>
            </div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
    };

    // ═══════════════════════════════════════════════════════════
    // TAB SWITCH — dipanggil dari tombol tab
    // ═══════════════════════════════════════════════════════════
    window.pdSwitchTab = function (tabName, event) {
        // Update tombol tab
        document.querySelectorAll('#section-pengajuan-dana .tab').forEach(t => t.classList.remove('active'));
        if (event?.target) event.target.classList.add('active');

        // Update konten tab
        document.querySelectorAll('#section-pengajuan-dana .tab-content').forEach(tc => tc.classList.remove('active'));
        const el = document.getElementById('pd-tab-' + tabName);
        if (el) el.classList.add('active');

        // Load data sesuai tab
        if (tabName === 'pengajuan') {
            window.pdLoadData(false).then(() => {
                const currentMonthName = new Date().toLocaleString('id-ID', { month: 'long' }).toUpperCase();
                const fMonth = document.getElementById('pd-filter-bulan');
                if (fMonth && !fMonth.value) fMonth.value = currentMonthName;
                window.pdFilterData();
            });
        } else if (tabName === 'bersama') {
            if (window.pdbLoadData) window.pdbLoadData(false).then(() => {
                const currentMonthName = new Date().toLocaleString('id-ID', { month: 'long' }).toUpperCase();
                const fMonth = document.getElementById('pdb-filter-bulan');
                if (fMonth && !fMonth.value) fMonth.value = currentMonthName;
                if (window.pdbFilterData) window.pdbFilterData();
            });
        }
    };

    // Dropdown version untuk mobile
    window.pdSwitchTabDD = function (v) {
        document.querySelectorAll('#section-pengajuan-dana .tab-content').forEach(tc => tc.classList.remove('active'));
        const el = document.getElementById('pd-tab-' + v);
        if (el) el.classList.add('active');

        if (v === 'pengajuan') {
            window.pdLoadData(false).then(() => {
                const currentMonthName = new Date().toLocaleString('id-ID', { month: 'long' }).toUpperCase();
                const fMonth = document.getElementById('pd-filter-bulan');
                if (fMonth && !fMonth.value) fMonth.value = currentMonthName;
                window.pdFilterData();
            });
        } else if (v === 'bersama') {
            if (window.pdbLoadData) window.pdbLoadData(false).then(() => {
                const currentMonthName = new Date().toLocaleString('id-ID', { month: 'long' }).toUpperCase();
                const fMonth = document.getElementById('pdb-filter-bulan');
                if (fMonth && !fMonth.value) fMonth.value = currentMonthName;
                if (window.pdbFilterData) window.pdbFilterData();
            });
        }
    };

    // ═══════════════════════════════════════════════════════════
    // HTML INJECT & SECTION INIT
    // ═══════════════════════════════════════════════════════════
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['pengajuan-dana'] = function () {
        const section = document.getElementById('section-pengajuan-dana');
        if (!section) return;

        // Hancurkan chart lama jika ada
        if (chartPengajuan) { chartPengajuan.destroy(); chartPengajuan = null; }

        section.innerHTML = `
<style>
/* ── Shared detail styles ──────────────────────────────── */
.pd-detail-wrap { display:flex; flex-direction:column; gap:14px; }
.pd-detail-status-banner { display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:10px; border:1.5px solid; }
.pd-detail-status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.pd-detail-section { background:#f8fafc; border-radius:10px; padding:14px; border:1px solid #f1f5f9; }
.pd-detail-section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#94a3b8; margin-bottom:12px; }
.pd-detail-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
@media(max-width:480px) { .pd-detail-grid-2 { grid-template-columns:1fr; } }
.pd-detail-field { display:flex; align-items:flex-start; gap:10px; }
.pd-detail-field-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.pd-detail-field-label { font-size:11px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:2px; }
.pd-detail-field-value { font-size:13.5px; font-weight:600; color:#1e293b; line-height:1.4; }
/* ── Edit modal status options ──────────────────────────── */
.pd-status-options { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
.pd-status-option { display:flex; align-items:center; gap:12px; padding:12px 14px; border:1.5px solid #e2e8f0; border-radius:10px; cursor:pointer; transition:all 0.15s; }
.pd-status-option:hover { border-color:#94a3b8; background:#f8fafc; }
.pd-status-option input[type="radio"] { display:none; }
.pd-status-option-label { font-size:13.5px; font-weight:600; }
.pd-status-option-sub { font-size:12px; color:#64748b; margin-top:1px; }
.pd-opt-selected-pending  { border-color:#f59e0b !important; background:#fffbeb !important; }
.pd-opt-selected-approved { border-color:#10b981 !important; background:#f0fdf4 !important; }
.pd-opt-selected-rejected { border-color:#ef4444 !important; background:#fff1f2 !important; }
.pd-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#f8fafc; border-radius:10px; padding:14px; border:1px solid #f1f5f9; margin-bottom:16px; }
.pd-info-item { display:flex; flex-direction:column; gap:2px; }
.pd-info-label { font-size:11px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; }
.pd-info-value { font-size:13px; font-weight:600; color:#1e293b; }
/* ── Filter container ───────────────────────────────────── */
#section-pengajuan-dana .filter-container { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
#pd-data-tbody tr td:nth-child(7) { text-align:center; vertical-align:middle; }
#pd-data-tbody tr { vertical-align:middle; }
</style>

<div class="container">
    <div class="section-page-header">
        <h1 class="section-page-title">Pengajuan Dana</h1>
        <p class="section-page-subtitle">Kelola dan verifikasi pengajuan dana kegiatan dari setiap unit / bidang</p>
    </div>

    <!-- ── Tab navigasi (desktop) ──────────────────────────── -->
    <div class="tabs">
        <button class="tab active" onclick="pdSwitchTab('pengajuan', event)">Pengajuan Dana</button>
        <button class="tab"        onclick="pdSwitchTab('bersama', event)">Pengajuan Dana Bersama</button>
    </div>

    <!-- ── Tab navigasi (mobile dropdown) ─────────────────── -->
    <div class="tabs-dropdown">
        <select onchange="pdSwitchTabDD(this.value)">
            <option value="pengajuan">Pengajuan Dana</option>
            <option value="bersama">Pengajuan Dana Bersama</option>
        </select>
    </div>

    <!-- ══════════════════════════════════════════════════════
         TAB 1: PENGAJUAN DANA
    ══════════════════════════════════════════════════════════ -->
    <div id="pd-tab-pengajuan" class="tab-content active">

        <div class="stats-grid">
            <div class="stat-card" style="border-left:4px solid #10b981;">
                <div class="stat-label">Total Pengajuan</div>
                <div class="stat-value" id="pd-stat-total">0</div>
                <div class="stat-footer">Laporan Pengajuan Dana</div>
            </div>
            <div class="stat-card" style="border-left:4px solid #3b82f6;">
                <div class="stat-label">Bulan Ini</div>
                <div class="stat-value" id="pd-stat-bulan">0</div>
                <div class="stat-footer" id="pd-stat-bulan-label">Laporan</div>
            </div>
            <div class="stat-card" style="border-left:4px solid #f59e0b;">
                <div class="stat-label">Pending</div>
                <div class="stat-value" id="pd-stat-pending">0</div>
                <div class="stat-footer">Menunggu verifikasi</div>
            </div>
            <div class="stat-card" style="border-left:4px solid #64748b;">
                <div class="stat-label">Total Nominal</div>
                <div class="stat-value" id="pd-stat-nominal" style="font-size:24px;">Rp 0</div>
                <div class="stat-footer">Akumulasi pengajuan</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h2 class="card-title">Tren Pengajuan Dana per Bulan</h2></div>
            <div class="card-content"><div class="chart-container"><canvas id="pd-chartPengajuan"></canvas></div></div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Daftar Pengajuan Dana</h2>
                <div class="filter-container">
                    <select class="select-input" id="pd-filter-bulan" onchange="pdFilterData()">
                        <option value="">Semua Bulan</option>
                        <option value="JANUARI">Januari</option><option value="FEBRUARI">Februari</option>
                        <option value="MARET">Maret</option><option value="APRIL">April</option>
                        <option value="MEI">Mei</option><option value="JUNI">Juni</option>
                        <option value="JULI">Juli</option><option value="AGUSTUS">Agustus</option>
                        <option value="SEPTEMBER">September</option><option value="OKTOBER">Oktober</option>
                        <option value="NOVEMBER">November</option><option value="DESEMBER">Desember</option>
                    </select>
                    <select class="select-input" id="pd-filter-unit" onchange="pdFilterData()">
                        <option value="">Semua Unit</option>
                        <option value="Sekretariat">Sekretariat</option>
                        <option value="Balai Layanan Usaha Terpadu KUMKM">BLUT KUMKM</option>
                        <option value="Bidang Kewirausahaan">Bid. Kewirausahaan</option>
                        <option value="Bidang Koperasi">Bid. Koperasi</option>
                        <option value="Bidang UKM">Bid. UKM</option>
                        <option value="Bidang Usaha Mikro">Bid. Usaha Mikro</option>
                    </select>
                    <select class="select-input" id="pd-filter-status" onchange="pdFilterData()">
                        <option value="">Semua Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Disetujui</option>
                        <option value="REJECTED">Ditolak</option>
                    </select>
                    <input type="text" class="search-input" id="pd-search" placeholder="Cari nama / sub kegiatan..." oninput="pdFilterData()">
                    <button onclick="pdLoadData(true)" class="btn btn-sm" title="Refresh data">
                        ${ICONS.refresh} Refresh
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th><th>Nama</th><th>Unit / Bidang</th>
                            <th>Sub Kegiatan</th><th>Bulan</th><th>Nominal</th><th>Status</th><th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="pd-data-tbody">
                        <tr><td colspan="8" style="text-align:center;padding:40px;">
                            <div class="spinner"></div>
                            <div style="margin-top:12px;color:#94a3b8;">Memuat data...</div>
                        </td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="pd-pagination"></div>
        </div>

    </div><!-- /pd-tab-pengajuan -->

    <!-- ══════════════════════════════════════════════════════
         TAB 2: PENGAJUAN DANA BERSAMA
         Konten diisi oleh initPengajuanDanaBersama()
    ══════════════════════════════════════════════════════════ -->
    <div id="pd-tab-bersama" class="tab-content">
        <div id="pdb-content-slot"></div>
    </div><!-- /pd-tab-bersama -->

</div><!-- /container -->

<!-- ════ EDIT STATUS MODAL — Pengajuan Dana ════ -->
<div id="pd-editModal" class="modal-overlay" style="display:none;">
    <div class="modal" style="max-width:480px;">
        <div class="modal-header">
            <h2 class="modal-title">Edit Status Pengajuan Dana</h2>
            <p style="font-size:13px;color:#64748b;margin-top:4px;" id="pd-edit-subtitle">—</p>
        </div>
        <div class="modal-content">
            <div class="pd-info-grid">
                <div class="pd-info-item"><div class="pd-info-label">Nama</div><div class="pd-info-value" id="pd-edit-info-nama">—</div></div>
                <div class="pd-info-item"><div class="pd-info-label">Unit</div><div class="pd-info-value" id="pd-edit-info-unit">—</div></div>
                <div class="pd-info-item" style="grid-column:1/-1;"><div class="pd-info-label">Sub Kegiatan</div><div class="pd-info-value" id="pd-edit-info-subkeg">—</div></div>
                <div class="pd-info-item"><div class="pd-info-label">Bulan</div><div class="pd-info-value" id="pd-edit-info-bulan">—</div></div>
                <div class="pd-info-item"><div class="pd-info-label">Nominal</div><div class="pd-info-value" id="pd-edit-info-nominal">—</div></div>
            </div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:8px;">Ubah Status</div>
            <div class="pd-status-options">
                <label class="pd-status-option" id="pd-opt-pending" onclick="pdSelectStatus('PENDING')">
                    <input type="radio" name="pd-edit-status" id="pd-radio-pending">
                    <div style="width:10px;height:10px;border-radius:50%;background:#f59e0b;flex-shrink:0;"></div>
                    <div><div class="pd-status-option-label" style="color:#92400e;">Pending</div><div class="pd-status-option-sub">Menunggu verifikasi admin</div></div>
                </label>
                <label class="pd-status-option" id="pd-opt-approved" onclick="pdSelectStatus('APPROVED')">
                    <input type="radio" name="pd-edit-status" id="pd-radio-approved">
                    <div style="width:10px;height:10px;border-radius:50%;background:#10b981;flex-shrink:0;"></div>
                    <div><div class="pd-status-option-label" style="color:#065f46;">Disetujui</div><div class="pd-status-option-sub">Pengajuan dana disetujui</div></div>
                </label>
                <label class="pd-status-option" id="pd-opt-rejected" onclick="pdSelectStatus('REJECTED')">
                    <input type="radio" name="pd-edit-status" id="pd-radio-rejected">
                    <div style="width:10px;height:10px;border-radius:50%;background:#ef4444;flex-shrink:0;"></div>
                    <div><div class="pd-status-option-label" style="color:#991b1b;">Ditolak</div><div class="pd-status-option-sub">Pengajuan tidak disetujui</div></div>
                </label>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="pdCloseEditModal()" class="btn" style="flex:1;">Batal</button>
            <button onclick="pdSubmitEdit()" class="btn btn-primary" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;" id="pd-btn-submit-edit">
                ${ICONS.save} Simpan Perubahan
            </button>
        </div>
    </div>
</div>`;

        window.addEventListener('click', e => {
            if (e.target.id === 'pd-editModal') window.pdCloseEditModal();
        });

        // Load tab aktif (Pengajuan Dana) langsung
        window.pdLoadData(false).then(() => {
            const currentMonthName = new Date().toLocaleString('id-ID', { month: 'long' }).toUpperCase();
            const fMonth = document.getElementById('pd-filter-bulan');
            if (fMonth) fMonth.value = currentMonthName;
            window.pdFilterData();
        });

        // Inisialisasi konten Pengajuan Dana Bersama ke slot-nya
        if (window.initPengajuanDanaBersama) window.initPengajuanDanaBersama();
    };

})();