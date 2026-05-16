// ============================================================
// dashboard.js — Dashboard Rekapitulasi Nilai Kinerja
// Admin Panel SPA — Dinas Koperasi UKM
// Mode Dual: Analitik Bulanan & Analitik Triwulan
// ============================================================
(function () {
    'use strict';

    // ── Constants ────────────────────────────────────────────────
    const UNITS = [
        'Sekretariat', 'Bidang Koperasi', 'Bidang UKM',
        'Bidang Usaha Mikro', 'Bidang Kewirausahaan', 'Balai Layanan Usaha Terpadu KUMKM'
    ];
    const US = {
        'Sekretariat': 'Sekretariat',
        'Bidang Koperasi': 'Bid. Koperasi',
        'Bidang UKM': 'Bid. UKM',
        'Bidang Usaha Mikro': 'Bid. Usaha Mikro',
        'Bidang Kewirausahaan': 'Bid. Kewirausahaan',
        'Balai Layanan Usaha Terpadu KUMKM': 'Balai KUMKM'
    };
    const MONTHS = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
    const MOS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const MODS = [
        { key: 'bbm',       label: 'BBM',           color: '#0ea5e9', max: 5  },
        { key: 'kendaraan', label: 'Kendaraan',      color: '#f59e0b', max: 10 },
        { key: 'ruang',     label: 'Ruang Rapat',    color: '#8b5cf6', max: 5  },
        { key: 'kearsipan', label: 'Kearsipan',      color: '#22c55e', max: 5  },
        { key: 'spj',       label: 'SPJ Keuangan',   color: '#10b981', max: 35 },
        { key: 'monev',     label: 'Monev',          color: '#ec4899', max: 40 },
    ];
    const TOTAL_MAX = 100;
    const UC = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#ec4899'];
    const MONTH_MAP = {
        'januari': 'JANUARI', 'februari': 'FEBRUARI', 'maret': 'MARET', 'april': 'APRIL',
        'mei': 'MEI', 'juni': 'JUNI', 'juli': 'JULI', 'agustus': 'AGUSTUS',
        'september': 'SEPTEMBER', 'oktober': 'OKTOBER', 'november': 'NOVEMBER', 'desember': 'DESEMBER'
    };
    const TRIWULAN = {
        'TW I':   ['JANUARI', 'FEBRUARI', 'MARET'],
        'TW II':  ['APRIL', 'MEI', 'JUNI'],
        'TW III': ['JULI', 'AGUSTUS', 'SEPTEMBER'],
        'TW IV':  ['OKTOBER', 'NOVEMBER', 'DESEMBER']
    };
    const TW_KEYS   = Object.keys(TRIWULAN);
    const TW_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
    const TW_BGS    = ['#eff6ff', '#f0fdf4', '#fffbeb', '#fdf2f8'];

    // ── State ────────────────────────────────────────────────────
    var S = { bulan: '', scores: {}, allMonth: {}, loading: false };
    var MONEV_CACHE    = null;
    var SPJ_CACHE      = null;
    var C              = {};
    var spjDataSource  = 'none';

    // Mode: 'bulanan' | 'triwulan'
    var activeMode = 'bulanan';
    var activeTab  = { bulanan: 'total', triwulan: 'total' };
    var activeTW   = 'TW I';
    var activeCat  = { bulanan: 'bbm', triwulan: 'bbm' };

    // ── Helpers ──────────────────────────────────────────────────
    function fn(v) {
        if (v === null || v === undefined) return '—';
        var n = parseFloat(v);
        return isNaN(n) ? '—' : (n % 1 === 0 ? String(n) : n.toFixed(1));
    }
    function cap(s) { return s ? s[0] + s.slice(1).toLowerCase() : ''; }
    function kill(id) { if (C[id]) { C[id].destroy(); delete C[id]; } }
    function ok(r)  { return r.status === 'fulfilled' && r.value && r.value.success; }
    function normalizeBulan(str) {
        if (!str) return '';
        var first = String(str).trim().toLowerCase().split(/[\s,\/\-]+/)[0];
        return MONTH_MAP[first] || String(str).trim().toUpperCase().split(/[\s,\/\-]+/)[0];
    }

    // Hitung total bulan per unit
    function getUnitMonthTotal(unit, m) {
        var sc = S.allMonth[m] ? S.allMonth[m][unit] : null;
        if (!sc) return null;
        var t = 0, h = false;
        MODS.forEach(function (mo) {
            if (sc[mo.key] !== null && sc[mo.key] !== undefined) { t += sc[mo.key]; h = true; }
        });
        return h ? t : null;
    }

    // Nilai modul tertentu dari satu bulan per unit
    function getUnitMonthMod(unit, m, modKey) {
        var sc = S.allMonth[m] ? S.allMonth[m][unit] : null;
        if (!sc || sc[modKey] === null || sc[modKey] === undefined) return null;
        return sc[modKey];
    }

    // Rata-rata total triwulan
    function getUnitTwTotal(unit, twMonths) {
        var vals = twMonths.map(function (m) { return getUnitMonthTotal(unit, m); }).filter(function (v) { return v !== null; });
        return vals.length ? +(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length).toFixed(2) : null;
    }

    // Rata-rata modul tertentu di satu triwulan
    function getUnitTwMod(unit, twMonths, modKey) {
        var vals = twMonths.map(function (m) { return getUnitMonthMod(unit, m, modKey); }).filter(function (v) { return v !== null; });
        return vals.length ? +(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length).toFixed(2) : null;
    }

    // Scores virtual untuk mode triwulan
    function getTwScores(twMonths) {
        var sc = {};
        UNITS.forEach(function (u) {
            sc[u] = {};
            MODS.forEach(function (m) { sc[u][m.key] = getUnitTwMod(u, twMonths, m.key); });
        });
        return sc;
    }

    // Scores sesuai mode aktif
    function getScores() {
        return activeMode === 'bulanan' ? S.scores : getTwScores(TRIWULAN[activeTW]);
    }

    // Label periode aktif
    function getPeriodeLabel() {
        return activeMode === 'bulanan' ? cap(S.bulan) : activeTW;
    }

    // Rows tabel sesuai mode
    function mkRows() {
        var sc = getScores();
        return UNITS.map(function (u) {
            var s = sc[u] || {};
            var tot = 0, has = false, vals = {};
            MODS.forEach(function (m) {
                vals[m.key] = (s[m.key] !== undefined) ? s[m.key] : null;
                if (vals[m.key] !== null) { tot += vals[m.key]; has = true; }
            });
            return { unit: u, vals: vals, tot: tot, has: has };
        });
    }

    // ── Inject UI (dipanggil sekali saat init) ───────────────────
    function injectDashboardUI() {
        var container = document.querySelector('#section-dashboard .container');
        if (!container) return;

        // ── 1. Mode Toggle ──
        var modeDiv = document.createElement('div');
        modeDiv.id = 'db-modeBtns';
        modeDiv.style.cssText = 'display:flex;gap:0;margin-bottom:16px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;width:fit-content';
        modeDiv.innerHTML =
            '<button class="mode-btn active" onclick="dbSetMode(\'bulanan\',this)" style="padding:9px 22px;border:none;background:#0f172a;color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s">📅 Analitik Bulanan</button>'
            + '<button class="mode-btn" onclick="dbSetMode(\'triwulan\',this)" style="padding:9px 22px;border:none;background:#f8fafc;color:#64748b;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;border-left:1px solid #e2e8f0;transition:background .15s">📊 Analitik Triwulan</button>';

        // ── 2. Filter Row ──
        var filterDiv = document.createElement('div');
        filterDiv.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px';

        var bulanWrap = document.createElement('div');
        bulanWrap.id = 'db-bulanFilterWrap';
        bulanWrap.className = 'month-selector';
        bulanWrap.innerHTML = '<label style="font-size:13px;font-weight:600;color:#64748b;">Bulan:</label>'
            + '<select id="db-bulanSelect" onchange="dbOnBulanChange()">'
            + ['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI','JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER']
                .map(function (m) { return '<option value="' + m + '">' + cap(m) + '</option>'; }).join('')
            + '</select>';

        var twWrap = document.createElement('div');
        twWrap.id = 'db-twFilterWrap';
        twWrap.className = 'month-selector';
        twWrap.style.display = 'none';
        twWrap.innerHTML = '<label style="font-size:13px;font-weight:600;color:#64748b;">Triwulan:</label>'
            + '<select id="db-twSelect" onchange="dbOnTwChange()" style="padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-family:inherit;font-size:13px;">'
            + TW_KEYS.map(function (tw) {
                return '<option value="' + tw + '">' + tw + ' (' + TRIWULAN[tw][0].slice(0,3) + '–' + TRIWULAN[tw][2].slice(0,3) + ')</option>';
            }).join('')
            + '</select>';

        var refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-primary';
        refreshBtn.id = 'db-btnRefresh';
        refreshBtn.setAttribute('onclick', 'dbLoadAll()');
        refreshBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Refresh';

        filterDiv.appendChild(bulanWrap);
        filterDiv.appendChild(twWrap);
        filterDiv.appendChild(refreshBtn);

        // ── 3. SPJ Status Bar ──
        var spjBar = document.createElement('div');
        spjBar.id = 'db-spjStatusBar';
        spjBar.className = 'spj-status-bar';
        spjBar.style.display = 'none';
        spjBar.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span id="db-spjStatusMsg"></span>';

        // ── 4. Banner ──
        var banner = document.createElement('div');
        banner.className = 'banner';
        banner.innerHTML = '<div class="banner-left">'
            + '<div class="banner-title">Sistem Penilaian Kinerja — Total Maksimal 100 Poin</div>'
            + '<div class="banner-sub">BBM /5 + Kendaraan /10 + Ruang Rapat /5 + Kearsipan /5 + SPJ Keuangan /35 + Monev /40 = 100</div>'
            + '</div>'
            + '<div class="banner-pills">'
            + [['#0ea5e9','BBM /5'],['#f59e0b','Kendaraan /10'],['#8b5cf6','Ruang Rapat /5'],['#22c55e','Kearsipan /5'],['#10b981','SPJ Keuangan /35'],['#ec4899','Monev /40']]
                .map(function (p) { return '<div class="pill"><div class="pill-dot" style="background:' + p[0] + '"></div>' + p[1] + '</div>'; }).join('')
            + '</div>';

        // ── 5. Stats Grid ──
        var statsGrid = document.createElement('div');
        statsGrid.className = 'stats-grid';
        statsGrid.id = 'db-statsGrid';
        statsGrid.innerHTML = [0,1,2,3].map(function () {
            return '<div class="stat-card"><div class="sk" style="height:72px"></div></div>';
        }).join('');

        // ── 6. Section head ──
        var secHead = document.createElement('div');
        secHead.className = 'section-head';
        secHead.innerHTML = '<span class="section-title">Grafik Perbandingan Nilai</span><span class="section-note" id="db-sectionNote">—</span>';

        // ── 7. Chart Tabs ──
        var chartTabs = document.createElement('div');
        chartTabs.className = 'chart-tabs';
        chartTabs.id = 'db-chartTabs';
        chartTabs.innerHTML = [
            ['total',  '📊 Total per Divisi'],
            ['trend',  '📈 Tren'],
            ['cat',    '🔍 Per Kategori'],
            ['profil', '🎯 Profil Divisi'],
        ].map(function (t, i) {
            return '<button class="chart-tab' + (i === 0 ? ' active' : '') + '" data-tab="' + t[0] + '" onclick="dbGoTab(\'' + t[0] + '\',this)">' + t[1] + '</button>';
        }).join('');

        // ── 8. Panels ──

        // Panel: Total
        var pTotal = document.createElement('div');
        pTotal.id = 'db-pTotal';
        pTotal.setAttribute('data-active','1');
        pTotal.innerHTML = '<div class="grid-2">'
            + '<div class="card"><div class="card-header"><span class="card-title" id="db-cStackedTitle">Total Nilai per Divisi (Stacked)</span><span class="card-note" id="db-stkNote">—</span></div><div class="card-content"><div class="chart-wrap h-380"><canvas id="db-cStacked"></canvas></div></div></div>'
            + '<div class="card"><div class="card-header"><span class="card-title">Distribusi Modul (Radar)</span><span class="card-note">Rata-rata semua divisi %</span></div><div class="card-content"><div class="chart-wrap h-380"><canvas id="db-cRadarMain"></canvas></div></div></div>'
            + '</div>';

        // Panel: Tren
        var pTrend = document.createElement('div');
        pTrend.id = 'db-pTrend';
        pTrend.style.display = 'none';
        pTrend.innerHTML = '<div class="card"><div class="card-header"><span class="card-title" id="db-trendTitle">Tren Total Nilai — per Divisi</span><span class="card-note" id="db-trendNote">—</span></div><div class="card-content"><div class="chart-wrap h-380"><canvas id="db-cTrend"></canvas></div></div></div>'
            + '<div class="section-head"><span class="section-title" id="db-trendSmallTitle">Tren per Divisi — Detail Modul</span><span class="section-note"></span></div>'
            + '<div class="grid-3" id="db-trendSmall"></div>';

        // Panel: Kategori
        var pCat = document.createElement('div');
        pCat.id = 'db-pCat';
        pCat.style.display = 'none';
        pCat.innerHTML = '<div class="section-head" style="margin-bottom:10px"><span class="section-title">Pilih Kategori Penilaian:</span></div>'
            + '<div class="cat-row" id="db-catRow"></div>'
            + '<div class="card"><div class="card-header"><span class="card-title" id="db-catTitle">—</span><span class="card-note" id="db-catNote">—</span></div><div class="card-content"><div class="chart-wrap h-380"><canvas id="db-cCat"></canvas></div></div></div>'
            + '<div class="card"><div class="card-header"><span class="card-title" id="db-catTitle2">—</span><span class="card-note">Lintas periode tiap divisi</span></div><div class="card-content"><div class="chart-wrap h-300"><canvas id="db-cCat2"></canvas></div></div></div>';

        // Panel: Profil
        var pProfil = document.createElement('div');
        pProfil.id = 'db-pProfil';
        pProfil.style.display = 'none';
        pProfil.innerHTML = '<div class="grid-3" id="db-radarGrid"></div>';

        // ── 9. Rekap Tabel ──
        var rekapHead = document.createElement('div');
        rekapHead.className = 'section-head';
        rekapHead.innerHTML = '<span class="section-title">Rekap Nilai Lengkap per Divisi</span><span class="section-note">Diurutkan berdasarkan total nilai tertinggi</span>';

        var rekapCard = document.createElement('div');
        rekapCard.className = 'card';
        rekapCard.style.marginBottom = '32px';
        rekapCard.innerHTML = '<div class="table-container" id="db-rekapTableWrap">'
            + '<table class="rekap" id="db-rekapTable">'
            + '<thead><tr>'
            + '<th>#</th><th>Divisi / Unit</th>'
            + '<th class="center"><span style="color:#0ea5e9">●</span> BBM <small style="opacity:.6">/5</small></th>'
            + '<th class="center"><span style="color:#f59e0b">●</span> Kendaraan <small style="opacity:.6">/10</small></th>'
            + '<th class="center"><span style="color:#8b5cf6">●</span> Ruang Rapat <small style="opacity:.6">/5</small></th>'
            + '<th class="center"><span style="color:#22c55e">●</span> Kearsipan <small style="opacity:.6">/5</small></th>'
            + '<th class="center"><span style="color:#10b981">●</span> SPJ Keuangan <small style="opacity:.6">/35</small></th>'
            + '<th class="center"><span style="color:#ec4899">●</span> Monev <small style="opacity:.6">/40</small></th>'
            + '<th class="center" style="background:#1a2942">Total <small style="opacity:.6">/100</small></th>'
            + '<th class="center">Progress /100</th>'
            + '</tr></thead>'
            + '<tbody id="db-rekapTbody"><tr><td colspan="10" class="empty-state">⏳ Memuat data...</td></tr></tbody>'
            + '</table>'
            + '</div>'
            + '<div id="db-rekapCards"></div>'
            + '<div class="table-legend">'
            + '<div class="leg-item"><div class="leg-dot" style="background:#d1fae5"></div>Sangat Baik ≥80%</div>'
            + '<div class="leg-item"><div class="leg-dot" style="background:#dbeafe"></div>Baik ≥60%</div>'
            + '<div class="leg-item"><div class="leg-dot" style="background:#fef3c7"></div>Cukup ≥40%</div>'
            + '<div class="leg-item"><div class="leg-dot" style="background:#fee2e2"></div>Kurang &lt;40%</div>'
            + '<div class="leg-item" style="margin-left:auto;color:#94a3b8;font-style:italic">Sumber SPJ: <span id="db-spjSourceLabel">—</span></div>'
            + '</div>';

        // ── 10. Inject ke container ──
        // Cari header & elemen yang sudah ada, sisipkan setelah header
        var headerEl = container.querySelector('.header') || container.querySelector('h1')?.closest('.header');
        // Bersihkan container dari elemen lama (selain header dan banner asli jika ada)
        // Strategi: hapus semua lalu masukkan ulang secara berurutan
        container.innerHTML = '';

        container.appendChild(spjBar);
        container.appendChild(banner);
        container.appendChild(modeDiv);
        container.appendChild(filterDiv);
        container.appendChild(statsGrid);
        container.appendChild(secHead);
        container.appendChild(chartTabs);
        container.appendChild(pTotal);
        container.appendChild(pTrend);
        container.appendChild(pCat);
        container.appendChild(pProfil);
        container.appendChild(rekapHead);
        container.appendChild(rekapCard);

        // ── 11. Inject CSS tambahan ──
        if (!document.getElementById('db-extra-css')) {
            var style = document.createElement('style');
            style.id = 'db-extra-css';
            style.textContent = [
                '#db-modeBtns .mode-btn.active{background:#0f172a!important;color:#fff!important}',
                '#db-modeBtns .mode-btn:not(.active){background:#f8fafc!important;color:#64748b!important}',
                '#db-modeBtns .mode-btn:not(.active):hover{background:#e2e8f0!important;color:#0f172a!important}',
                '.spj-status-bar{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:8px;margin-bottom:16px;background:#fef3c7;border:1px solid #fbbf24;font-size:13px;color:#92400e}',
                '.spj-status-bar.success{background:#d1fae5;border-color:#6ee7b7;color:#065f46}',
                '.spj-status-bar.error{background:#fee2e2;border-color:#fca5a5;color:#991b1b}',
                '.chart-wrap{position:relative}.chart-wrap.h-380{height:380px}.chart-wrap.h-300{height:300px}.chart-wrap.h-230{height:230px}',
                '.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-bottom:20px}',
                '.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px}',
                '@media(max-width:900px){.grid-2{grid-template-columns:1fr}.grid-3{grid-template-columns:1fr}}',
                '.chart-tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}',
                '.chart-tab{padding:8px 16px;border-radius:6px;border:1px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:13px;font-weight:500;color:#64748b}',
                '.chart-tab.active{background:#0f172a;color:#fff;border-color:#0f172a}',
                '.banner{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;background:linear-gradient(135deg,#0f172a,#1e3a5f);border-radius:12px;padding:20px 24px;margin-bottom:24px;color:#fff}',
                '.banner-left{flex:1}.banner-title{font-size:16px;font-weight:700}.banner-sub{font-size:12px;opacity:.7;margin-top:4px}',
                '.banner-pills{display:flex;flex-wrap:wrap;gap:8px}.pill{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.12);border-radius:20px;padding:4px 12px;font-size:12px}',
                '.pill-dot{width:8px;height:8px;border-radius:50%}',
                '.cat-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}',
                '.cat-btn{padding:7px 14px;border-radius:6px;border:none;background:#f1f5f9;color:#64748b;cursor:pointer;font-size:13px;font-weight:500}',
                '.cat-btn:hover{background:#e2e8f0}',
                '.month-selector{display:flex;align-items:center;gap:8px}.month-selector select{padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-family:inherit;font-size:13px}',
                '.chip{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}',
                '.chip-great{background:#d1fae5;color:#065f46}.chip-good{background:#dbeafe;color:#1e40af}.chip-fair{background:#fef3c7;color:#92400e}.chip-poor{background:#fee2e2;color:#991b1b}.chip-none{background:#f1f5f9;color:#94a3b8}',
                '.total-chip{display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:700}',
                '.total-great{background:#d1fae5;color:#065f46}.total-good{background:#dbeafe;color:#1e40af}.total-fair{background:#fef3c7;color:#92400e}.total-poor{background:#fee2e2;color:#991b1b}.total-none{background:#f1f5f9;color:#94a3b8}',
                '.rank-badge{display:inline-block;width:24px;height:24px;border-radius:50%;background:#f1f5f9;color:#64748b;font-size:12px;font-weight:600;text-align:center;line-height:24px}',
                '.prog-wrap{display:flex;align-items:center;gap:8px;min-width:120px}.prog-bar{flex:1;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden}.prog-fill{height:100%;border-radius:3px;transition:width .3s}.prog-label{font-size:12px;font-weight:600;color:#64748b;width:32px}',
                '.table-legend{display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:12px 16px;border-top:1px solid #f1f5f9;font-size:12px}',
                '.leg-item{display:flex;align-items:center;gap:6px}.leg-dot{width:12px;height:12px;border-radius:2px}',
                '.rekap{width:100%;border-collapse:collapse}.rekap th,.rekap td{padding:10px 12px;text-align:left;border-bottom:1px solid #f1f5f9;font-size:13px}.rekap th{background:#f8fafc;font-weight:600;font-size:12px;color:#64748b}',
                '.rekap td.center,.rekap th.center{text-align:center}',
                '.section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #f1f5f9}',
                '.section-title{font-size:16px;font-weight:700;color:#0f172a}.section-note{font-size:13px;color:#64748b}',
                '.sk{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:sk 1.5s infinite;border-radius:6px}',
                '@keyframes sk{0%{background-position:200% 0}100%{background-position:-200% 0}}',
                // Hide desktop table / show cards on mobile, vice versa
                '@media(max-width:768px){#db-rekapTableWrap{display:none}#db-rekapCards{display:block}}',
                '@media(min-width:769px){#db-rekapTableWrap{display:block}#db-rekapCards{display:none}}',
            ].join('\n');
            document.head.appendChild(style);
        }
    }

    // ── Load All Data ────────────────────────────────────────────
    async function loadAll() {
        if (S.loading) return;
        S.loading = true;
        setRefreshLoading(true);
        S.bulan = (document.getElementById('db-bulanSelect') || {}).value || S.bulan;

        try {
            var [roomR, vkR, vbR, bbmR, docsR, spjMonthlyR, spjRekapR, monevR] = await Promise.allSettled([
                apiGet(API_OP,    { action: 'getRoomScores' }),
                apiGet(API_OP,    { action: 'getVehicleScores', jenis: 'KUNCI' }),
                apiGet(API_OP,    { action: 'getVehicleScores', jenis: 'BERSIH' }),
                apiGet(API_OP,    { action: 'getBBMScores' }),
                apiGet(API_OP,    { action: 'getRekapArsip' }),
                apiGet(API_SPJ,   { action: 'getAllMonthlySheetData' }),
                apiGet(API_SPJ,   { action: 'getAllSPJKeuangan' }),
                apiGet(API_MONEV, { action: 'getAllSheetData' }),
            ]);

            // SPJ Cache
            SPJ_CACHE = null; spjDataSource = 'none';
            if (spjMonthlyR.status === 'fulfilled' && spjMonthlyR.value && spjMonthlyR.value.success && spjMonthlyR.value.rekap) {
                if (Object.keys(spjMonthlyR.value.rekap).length > 0) {
                    SPJ_CACHE = { type: 'monthly', data: spjMonthlyR.value.rekap };
                    spjDataSource = 'api-monthly';
                }
            }
            if (!SPJ_CACHE && spjRekapR.status === 'fulfilled' && spjRekapR.value && spjRekapR.value.success && spjRekapR.value.rekap) {
                if (Object.keys(spjRekapR.value.rekap).length > 0) {
                    SPJ_CACHE = { type: 'rekap', data: spjRekapR.value.rekap };
                    spjDataSource = 'api-rekap';
                }
            }
            if (!SPJ_CACHE) {
                try {
                    var localRaw = localStorage.getItem('spj_keuangan_data');
                    if (localRaw) {
                        var localData = JSON.parse(localRaw);
                        if (Object.keys(localData).length > 0) { SPJ_CACHE = { type: 'local', data: localData }; spjDataSource = 'local'; }
                    }
                } catch (e) {}
            }
            updateSPJStatusBar();

            // Monev Cache
            MONEV_CACHE = null;
            if (monevR.status === 'fulfilled' && monevR.value) {
                var val = monevR.value;
                if (val.status === 'success' && val.data && !Array.isArray(val.data))      MONEV_CACHE = { type: 'nested', data: val.data };
                else if ((val.success || val.status === 'success') && val.rekap)            MONEV_CACHE = { type: 'rekap',  data: val.rekap };
                else if (Array.isArray(val.data))                                           MONEV_CACHE = { type: 'array',  data: val.data };
                else if (Array.isArray(val))                                                MONEV_CACHE = { type: 'array',  data: val };
                else if (val.success && val.data && typeof val.data === 'object')           MONEV_CACHE = { type: 'nested', data: val.data };
            }

            // Build scores bulan aktif
            var sc = {};
            UNITS.forEach(function (u) { sc[u] = { bbm: null, kendaraan: null, ruang: null, kearsipan: null, spj: null, monev: null }; });
            fillOperasionalScores(sc, S.bulan, roomR, vkR, vbR, bbmR, docsR);
            fillSPJScores(sc, S.bulan);
            fillMonev(sc, S.bulan);
            S.scores = sc;

            // Build scores semua bulan
            var am = {};
            MONTHS.forEach(function (m) {
                am[m] = {};
                UNITS.forEach(function (u) { am[m][u] = { bbm: null, kendaraan: null, ruang: null, kearsipan: null, spj: null, monev: null }; });
            });
            MONTHS.forEach(function (m) {
                fillOperasionalScores(am[m], m, roomR, vkR, vbR, bbmR, docsR);
                fillSPJScores(am[m], m);
                fillMonev(am[m], m);
            });
            S.allMonth = am;

            render();
            if (window.showToast) showToast('Data berhasil dimuat', 'success');
        } catch (e) {
            console.error('[Dashboard]', e);
            if (window.showToast) showToast('Gagal memuat sebagian data', 'error');
            render();
        } finally {
            S.loading = false;
            setRefreshLoading(false);
        }
    }

    function updateSPJStatusBar() {
        var bar    = document.getElementById('db-spjStatusBar');
        var msg    = document.getElementById('db-spjStatusMsg');
        var srcLbl = document.getElementById('db-spjSourceLabel');
        if (!bar) return;
        if (spjDataSource === 'api-monthly') {
            bar.style.display = 'none';
            if (srcLbl) { srcLbl.textContent = 'Google Spreadsheet (Sheet Bulanan)'; srcLbl.style.color = '#065f46'; }
        } else if (spjDataSource === 'api-rekap') {
            bar.style.display = 'none';
            if (srcLbl) { srcLbl.textContent = 'Google Spreadsheet (Sheet Rekap)'; srcLbl.style.color = '#065f46'; }
        } else if (spjDataSource === 'local') {
            bar.className = 'spj-status-bar'; bar.style.display = 'flex';
            if (msg) msg.textContent = '⚠️ API SPJ tidak tersedia. Menampilkan data dari penyimpanan lokal browser.';
            if (srcLbl) { srcLbl.textContent = 'Penyimpanan Lokal Browser'; srcLbl.style.color = '#92400e'; }
        } else {
            bar.className = 'spj-status-bar error'; bar.style.display = 'flex';
            if (msg) msg.textContent = '❌ Data SPJ Keuangan tidak tersedia. API tidak merespons dan tidak ada data lokal.';
            if (srcLbl) { srcLbl.textContent = 'Tidak ada data'; srcLbl.style.color = '#991b1b'; }
        }
    }

    // ── Fill score functions ──────────────────────────────────────
    function fillOperasionalScores(sc, bulan, roomR, vkR, vbR, bbmR, docsR) {
        if (ok(roomR)) {
            (roomR.value.scores || []).forEach(function (s) {
                if (s.bulan === bulan && sc[s.unit]) sc[s.unit].ruang = s.skorAkhir;
            });
        }
        var km = {}, bm = {};
        if (ok(vkR)) (vkR.value.scores || []).forEach(function (s) { if (s.bulan === bulan) km[s.unit] = s.skorAkhir; });
        if (ok(vbR)) (vbR.value.scores || []).forEach(function (s) { if (s.bulan === bulan) bm[s.unit] = s.skorAkhir; });
        UNITS.forEach(function (u) {
            var k = km[u] !== undefined ? km[u] : null;
            var b = bm[u] !== undefined ? bm[u] : null;
            if (k !== null || b !== null) sc[u].kendaraan = (k || 0) + (b || 0);
        });
        if (ok(bbmR)) {
            (bbmR.value.scores || []).forEach(function (s) {
                if (s.bulan === bulan && sc[s.unit]) sc[s.unit].bbm = s.skorAkhir;
            });
        }
        if (docsR.status === 'fulfilled' && docsR.value && docsR.value.success && docsR.value.rekap) {
            var rekap    = docsR.value.rekap;
            var bulanKey = Object.keys(rekap).find(function (k) { return normalizeBulan(k) === bulan; });
            if (bulanKey) {
                var unitData = rekap[bulanKey];
                UNITS.forEach(function (u) {
                    var fk = Object.keys(unitData).find(function (k) { return k.trim().toLowerCase() === u.trim().toLowerCase(); });
                    if (fk && unitData[fk] && unitData[fk].skorAkhir !== undefined) {
                        var nilai = parseFloat(unitData[fk].skorAkhir);
                        if (!isNaN(nilai)) sc[u].kearsipan = +nilai.toFixed(2);
                    }
                });
            }
        }
    }

    function fillSPJScores(sc, bulan) {
        if (!SPJ_CACHE) return;
        var data    = SPJ_CACHE.data;
        var bulanKey = Object.keys(data).find(function (k) { return k.toUpperCase() === bulan.toUpperCase(); });
        if (!bulanKey) return;
        var bulanData = data[bulanKey];
        UNITS.forEach(function (u) {
            var unitKey = Object.keys(bulanData).find(function (k) { return k.trim() === u.trim(); })
                || Object.keys(bulanData).find(function (k) { return k.trim().toLowerCase() === u.trim().toLowerCase(); });
            if (!unitKey) return;
            var ud = bulanData[unitKey];
            var v  = parseFloat(ud.totalNilai !== undefined ? ud.totalNilai : ud.total !== undefined ? ud.total : ud.nilai !== undefined ? ud.nilai : null);
            if (!isNaN(v) && v >= 0) sc[u].spj = v;
        });
    }

    function fillMonev(sc, bulan) {
        if (MONEV_CACHE) {
            var type = MONEV_CACHE.type, data = MONEV_CACHE.data;
            if (type === 'nested' || type === 'rekap') {
                var bk = Object.keys(data).find(function (k) { return normalizeBulan(k) === bulan; });
                var bd = bk ? data[bk] : {};
                UNITS.forEach(function (u) {
                    var uk = Object.keys(bd).find(function (k) { return k.trim() === u.trim(); })
                        || Object.keys(bd).find(function (k) { return k.trim().toLowerCase() === u.trim().toLowerCase(); });
                    var ud = uk ? bd[uk] : null;
                    if (ud !== null && ud !== undefined) {
                        var raw = ud.total !== undefined ? ud.total : ud.totalNilai !== undefined ? ud.totalNilai : ud.nilai !== undefined ? ud.nilai : null;
                        if (raw !== null) { var v = parseFloat(raw); if (!isNaN(v) && v >= 0) sc[u].monev = v; }
                    }
                });
                return;
            }
            if (type === 'array') {
                data.filter(function (d) { return normalizeBulan(d.bulan || d.month || d.periode || '') === bulan; })
                    .forEach(function (d) {
                        var ur = String(d.unit || d.divisi || d.bidang || '').trim();
                        var mu = UNITS.find(function (u) { return u.trim() === ur; }) || UNITS.find(function (u) { return u.trim().toLowerCase() === ur.toLowerCase(); });
                        if (!mu) return;
                        var raw = d.total !== undefined ? d.total : d.totalNilai !== undefined ? d.totalNilai : d.nilai !== undefined ? d.nilai : null;
                        if (raw !== null) { var v = parseFloat(raw); if (!isNaN(v) && v >= 0) sc[mu].monev = v; }
                    });
                return;
            }
        }
        // Fallback localStorage
        UNITS.forEach(function (u) {
            try {
                var keys = ['monev_' + bulan + '_' + u, 'monev_' + bulan.toLowerCase() + '_' + u, 'monev_' + cap(bulan) + '_' + u];
                for (var i = 0; i < keys.length; i++) {
                    var d = JSON.parse(localStorage.getItem(keys[i]) || 'null');
                    if (!d) continue;
                    var v = d.totalScore !== undefined ? d.totalScore : d.total !== undefined ? d.total : d.totalNilai !== undefined ? d.totalNilai : null;
                    if (v !== null && !isNaN(parseFloat(v))) { sc[u].monev = parseFloat(v); break; }
                }
            } catch (e) {}
        });
    }

    function dbSyncToPPOCache() {
        try {
            if (!S.bulan || !S.scores) return;
            var PPO = 'penilaian_orang_team_cache_v1';
            var KEYS = ['bbm','kendaraan','ruang','kearsipan','spj','monev'];
            var scores = {};
            Object.keys(S.scores).forEach(function (unit) {
                var d = S.scores[unit]; if (!d) return;
                var total = 0, hasAny = false, entry = {};
                KEYS.forEach(function (k) {
                    var v = (d[k] !== null && d[k] !== undefined) ? parseFloat(d[k]) : null;
                    var val = (!isNaN(v) && v !== null) ? +v.toFixed(2) : 0;
                    entry[k] = val;
                    if (!isNaN(v) && v !== null) { total += val; hasAny = true; }
                });
                if (hasAny) { entry.total = +total.toFixed(2); scores[unit] = entry; }
            });
            if (!Object.keys(scores).length) return;
            var existing = {};
            try { existing = JSON.parse(localStorage.getItem(PPO) || '{}'); } catch (e) {}
            existing[S.bulan] = { scores: scores, timestamp: Date.now() };
            localStorage.setItem(PPO, JSON.stringify(existing));
        } catch (e) { console.warn('[Dashboard→PPO]', e); }
    }

    // ── Render ────────────────────────────────────────────────────
    function render() {
        updateModeUI();
        renderStats();
        renderTable();
        renderMobileCards();
        renderPanel();
        dbSyncToPPOCache();
    }

    // ── Mode Switching ────────────────────────────────────────────
    window.dbSetMode = function (mode, btn) {
        activeMode = mode;
        document.querySelectorAll('#db-modeBtns .mode-btn').forEach(function (b) { b.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        var bWrap = document.getElementById('db-bulanFilterWrap');
        var tWrap = document.getElementById('db-twFilterWrap');
        if (bWrap) bWrap.style.display = mode === 'bulanan' ? '' : 'none';
        if (tWrap) tWrap.style.display = mode === 'triwulan' ? '' : 'none';

        // Destroy semua chart saat ganti mode
        Object.keys(C).forEach(function (k) { if (C[k]) { C[k].destroy(); delete C[k]; } });

        updateModeUI();
        renderStats();
        renderTable();
        renderMobileCards();
        renderPanel();
    };

    window.dbOnTwChange = function () {
        var sel = document.getElementById('db-twSelect');
        if (sel) activeTW = sel.value;
        Object.keys(C).forEach(function (k) { if (C[k]) { C[k].destroy(); delete C[k]; } });
        render();
    };

    function updateModeUI() {
        var noteEl    = document.getElementById('db-sectionNote');
        var stkNoteEl = document.getElementById('db-stkNote');
        var label     = getPeriodeLabel();
        if (noteEl)    noteEl.textContent    = label;
        if (stkNoteEl) stkNoteEl.textContent = label;

        // Sync active tab button
        var tabBar = document.getElementById('db-chartTabs');
        if (tabBar) {
            tabBar.querySelectorAll('.chart-tab').forEach(function (b) { b.classList.remove('active'); });
            var aBtn = tabBar.querySelector('[data-tab="' + activeTab[activeMode] + '"]');
            if (aBtn) aBtn.classList.add('active');
        }
    }

    // ── Tab Navigation ────────────────────────────────────────────
    window.dbGoTab = function (name, btn) {
        activeTab[activeMode] = name;
        var tabBar = document.getElementById('db-chartTabs');
        if (tabBar) tabBar.querySelectorAll('.chart-tab').forEach(function (b) { b.classList.remove('active'); });
        if (btn) btn.classList.add('active');

        ['db-pTotal','db-pTrend','db-pCat','db-pProfil'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) { el.style.display = 'none'; el.removeAttribute('data-active'); }
        });
        var map = { total:'db-pTotal', trend:'db-pTrend', cat:'db-pCat', profil:'db-pProfil' };
        var el = document.getElementById(map[name]);
        if (el) { el.style.display = ''; el.setAttribute('data-active','1'); }

        // Destroy chart yang relevan sebelum redraw
        var toKill = { total:['cStacked','cRadarMain'], trend:['cTrend'], cat:['cCat','cCat2'], profil:[] };
        (toKill[name] || []).forEach(kill);
        Object.keys(C).filter(function(k){ return k.startsWith('sm_') || k.startsWith('rd_'); }).forEach(function(k){ C[k].destroy(); delete C[k]; });

        renderPanel();
    };

    function renderPanel() {
        var name = activeTab[activeMode];
        if      (name === 'total')  drawTotal();
        else if (name === 'trend')  drawTrend();
        else if (name === 'cat')    drawCat();
        else if (name === 'profil') drawProfil();
    }

    // ── Stats ─────────────────────────────────────────────────────
    function renderStats() {
        var rows = mkRows();
        var wd   = rows.filter(function (r) { return r.has; });
        var tots = wd.map(function (r) { return r.tot; });
        var avg  = tots.length ? tots.reduce(function (a,c) { return a+c; }, 0) / tots.length : 0;
        var best = tots.length ? Math.max.apply(null, tots) : 0;
        var worst= tots.length ? Math.min.apply(null, tots) : 0;
        var bestU= (rows.find(function (r) { return r.tot === best; }) || {}).unit || '—';
        var el   = document.getElementById('db-statsGrid');
        if (!el) return;
        el.innerHTML =
            stat('#3b82f6','Rata-rata Total Nilai', fn(avg), 'dari '+TOTAL_MAX+' poin · '+((avg/TOTAL_MAX)*100).toFixed(0)+'%') +
            stat('#10b981','Nilai Tertinggi', '<span style="color:#059669">'+fn(best)+'</span>', US[bestU]||bestU) +
            stat('#ef4444','Nilai Terendah', '<span style="color:#dc2626">'+fn(worst)+'</span>', 'perlu perhatian') +
            stat('#8b5cf6','Divisi Terdata', wd.length, 'dari '+UNITS.length+' divisi');
    }
    function stat(color, label, value, footer) {
        return '<div class="stat-card"><div class="stat-card-bar" style="background:'+color+'"></div>'
            + '<div class="stat-label">'+label+'</div><div class="stat-value">'+value+'</div>'
            + '<div class="stat-footer">'+footer+'</div></div>';
    }

    // ── Table ─────────────────────────────────────────────────────
    function renderTable() {
        var rows = mkRows();
        rows.sort(function (a,b) { if (a.has !== b.has) return a.has ? -1 : 1; return b.tot - a.tot; });
        var el = document.getElementById('db-rekapTbody');
        if (!el) return;
        if (rows.every(function (r) { return !r.has; })) {
            el.innerHTML = '<tr><td colspan="10" class="empty-state">📭 Belum ada data penilaian untuk <strong>'+getPeriodeLabel()+'</strong></td></tr>';
            return;
        }
        el.innerHTML = rows.map(function (r, i) {
            var pct = r.has ? (r.tot / TOTAL_MAX * 100) : 0;
            var pc  = pct>=80?'#10b981':pct>=60?'#3b82f6':pct>=40?'#f59e0b':'#ef4444';
            var tc  = !r.has?'total-none':pct>=80?'total-great':pct>=60?'total-good':pct>=40?'total-fair':'total-poor';
            function cell(key,max) {
                var v = r.vals[key];
                if (v===null) return '<td style="text-align:center"><span class="chip chip-none">—</span></td>';
                var p = v/max*100, cls = p>=80?'chip-great':p>=60?'chip-good':p>=40?'chip-fair':'chip-poor';
                return '<td style="text-align:center"><span class="chip '+cls+'">'+fn(v)+'</span></td>';
            }
            return '<tr><td><span class="rank-badge">'+(i+1)+'</span></td>'
                + '<td style="font-weight:600;min-width:170px">'+r.unit+'</td>'
                + cell('bbm',5)+cell('kendaraan',10)+cell('ruang',5)+cell('kearsipan',5)+cell('spj',35)+cell('monev',40)
                + '<td style="text-align:center"><span class="total-chip '+tc+'">'+(r.has?fn(r.tot):'—')+'</span></td>'
                + '<td><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill" style="width:'+Math.min(pct,100).toFixed(0)+'%;background:'+pc+'"></div></div>'
                + '<span class="prog-label">'+(r.has?pct.toFixed(0)+'%':'—')+'</span></div></td></tr>';
        }).join('');
    }

    // ── Mobile Cards ──────────────────────────────────────────────
    function renderMobileCards() {
        var container = document.getElementById('db-rekapCards');
        if (!container) return;
        var rows = mkRows();
        rows.sort(function (a,b) { if (a.has !== b.has) return a.has ? -1 : 1; return b.tot - a.tot; });
        if (rows.every(function (r) { return !r.has; })) {
            container.innerHTML = '<div style="text-align:center;padding:32px;color:#94a3b8;font-size:14px">📭 Belum ada data untuk <strong>'+getPeriodeLabel()+'</strong></div>';
            return;
        }
        container.innerHTML = rows.map(function (r, i) {
            var pct = r.has?(r.tot/TOTAL_MAX*100):0;
            var pc  = pct>=80?'#10b981':pct>=60?'#3b82f6':pct>=40?'#f59e0b':'#ef4444';
            var tc  = !r.has?'total-none':pct>=80?'total-great':pct>=60?'total-good':pct>=40?'total-fair':'total-poor';
            var mods = MODS.map(function (m) {
                var v = r.vals[m.key], p = v!==null?(v/m.max*100):0;
                var cls = v===null?'chip-none':p>=80?'chip-great':p>=60?'chip-good':p>=40?'chip-fair':'chip-poor';
                return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f1f5f9">'
                    + '<span style="font-size:13px;color:#64748b">'+m.label+' <span style="font-size:11px;color:#94a3b8">/'+m.max+'</span></span>'
                    + '<span class="chip '+cls+'">'+(v!==null?fn(v):'—')+'</span></div>';
            }).join('');
            return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);margin-bottom:12px">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
                + '<div style="display:flex;align-items:center;gap:8px"><span class="rank-badge">'+(i+1)+'</span><span style="font-weight:700;font-size:14px">'+r.unit+'</span></div>'
                + '<span class="total-chip '+tc+'">'+(r.has?fn(r.tot):'—')+'</span></div>'
                + mods
                + (r.has?'<div style="margin-top:10px"><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill" style="width:'+pct.toFixed(0)+'%;background:'+pc+'"></div></div><span class="prog-label">'+pct.toFixed(0)+'%</span></div></div>':'')
                + '</div>';
        }).join('');
    }

    // ── Chart Helpers ─────────────────────────────────────────────
    function stackedOpts(max, yLabel, grouped) {
        return {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position:'top', labels:{ font:{family:'Inter',size:11}, padding:10, boxWidth:10 } },
                tooltip: { callbacks:{ label:function(c){ return c.dataset.label+': '+c.raw.toFixed(1)+' poin'; } } }
            },
            scales: {
                x: { stacked:!grouped, grid:{display:false}, ticks:{font:{family:'Inter',size:11}} },
                y: { stacked:!grouped, max:max, grid:{color:'#f1f5f9'}, ticks:{font:{family:'Inter',size:11}},
                     title:{display:true, text:yLabel, font:{family:'Inter',size:11}} }
            }
        };
    }
    function trendOpts(max, yLabel) {
        return {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position:'top', labels:{font:{family:'Inter',size:11},padding:10,boxWidth:10} },
                tooltip: { callbacks:{ label:function(c){ return c.raw!==null?c.dataset.label+': '+c.raw+'/'+max:'—'; } } }
            },
            scales: {
                x: { grid:{color:'#f8fafc'}, ticks:{font:{family:'Inter',size:11}} },
                y: { min:0, max:max, grid:{color:'#f1f5f9'}, ticks:{font:{family:'Inter',size:11}},
                     title:{display:true,text:yLabel,font:{family:'Inter',size:11}} }
            }
        };
    }

    // ── Tab: Total per Divisi ─────────────────────────────────────
    function drawTotal() {
        kill('cStacked'); kill('cRadarMain');
        var sc     = getScores();
        var labels = UNITS.map(function (u) { return US[u]; });
        var titleEl = document.getElementById('db-cStackedTitle');
        var stkNoteEl = document.getElementById('db-stkNote');
        if (stkNoteEl) stkNoteEl.textContent = getPeriodeLabel();

        if (activeMode === 'bulanan') {
            if (titleEl) titleEl.textContent = 'Total Nilai per Divisi (Stacked)';
            var ds = MODS.map(function (m) {
                return { label:m.label, data:UNITS.map(function(u){ return +(sc[u]?(sc[u][m.key]||0):0); }),
                    backgroundColor:m.color+'bb', borderColor:m.color, borderWidth:1, borderRadius:3 };
            });
            C.cStacked = new Chart(document.getElementById('db-cStacked'), {
                type:'bar', data:{labels:labels, datasets:ds}, options:stackedOpts(TOTAL_MAX,'Total Nilai (/100)',false)
            });
        } else {
            if (titleEl) titleEl.textContent = 'Perbandingan Nilai Antar Triwulan per Divisi';
            var twDs = TW_KEYS.map(function (tw, ti) {
                return { label:tw, data:UNITS.map(function(u){ return getUnitTwTotal(u,TRIWULAN[tw])||0; }),
                    backgroundColor:TW_COLORS[ti]+'bb', borderColor:TW_COLORS[ti], borderWidth:1, borderRadius:3 };
            });
            C.cStacked = new Chart(document.getElementById('db-cStacked'), {
                type:'bar', data:{labels:labels, datasets:twDs}, options:stackedOpts(TOTAL_MAX,'Rata-rata Nilai (/100)',true)
            });
        }

        // Radar rata-rata %
        var rd = MODS.map(function (m) {
            var vs = UNITS.map(function(u){ return sc[u]?sc[u][m.key]:null; }).filter(function(v){ return v!==null; });
            return vs.length ? +((vs.reduce(function(a,c){return a+c;},0)/vs.length/m.max*100).toFixed(1)) : 0;
        });
        C.cRadarMain = new Chart(document.getElementById('db-cRadarMain'), {
            type:'radar',
            data:{ labels:MODS.map(function(m){return m.label;}), datasets:[{
                label:'Rata-rata %', data:rd, backgroundColor:'rgba(15,23,42,.08)', borderColor:'#0f172a', borderWidth:2,
                pointBackgroundColor:MODS.map(function(m){return m.color;}), pointBorderColor:'#fff', pointBorderWidth:2, pointRadius:5
            }]},
            options:{ responsive:true, maintainAspectRatio:false,
                plugins:{ legend:{display:false}, tooltip:{callbacks:{label:function(c){return c.raw+'% dari maks.';}}} },
                scales:{ r:{ min:0, max:100, ticks:{stepSize:25,font:{family:'Inter',size:10},color:'#94a3b8'},
                    pointLabels:{font:{family:'Inter',size:11}}, grid:{color:'#f1f5f9'} } }
            }
        });
    }

    // ── Tab: Tren ─────────────────────────────────────────────────
    function drawTrend() {
        kill('cTrend');
        Object.keys(C).filter(function(k){return k.startsWith('sm_');}).forEach(function(k){C[k].destroy();delete C[k];});
        var grid = document.getElementById('db-trendSmall');
        var titleEl = document.getElementById('db-trendTitle');
        var noteEl  = document.getElementById('db-trendNote');
        var smTitleEl = document.getElementById('db-trendSmallTitle');

        if (activeMode === 'bulanan') {
            if (titleEl) titleEl.textContent = 'Tren Total Nilai Lintas Bulan — per Divisi';
            if (noteEl)  noteEl.textContent  = 'Semua 12 bulan, nilai /100';
            if (smTitleEl) smTitleEl.textContent = 'Tren per Divisi — Detail Modul';

            var ds = UNITS.map(function(u,i){
                return { label:US[u], data:MONTHS.map(function(m){return getUnitMonthTotal(u,m);}),
                    borderColor:UC[i], backgroundColor:UC[i]+'22', borderWidth:2,
                    pointRadius:4, pointBackgroundColor:UC[i], pointBorderColor:'#fff', pointBorderWidth:2,
                    fill:false, tension:.35, spanGaps:true };
            });
            C.cTrend = new Chart(document.getElementById('db-cTrend'), {
                type:'line', data:{labels:MOS, datasets:ds}, options:trendOpts(TOTAL_MAX,'Total (/100)')
            });

            if (grid) {
                grid.innerHTML = UNITS.map(function(u,i){
                    return '<div class="card"><div class="card-header" style="padding:12px 18px"><span class="card-title" style="color:'+UC[i]+';font-size:14px">'+US[u]+'</span></div>'
                        + '<div class="card-content" style="padding:14px"><div class="chart-wrap h-230"><canvas id="db-sm_'+i+'"></canvas></div></div></div>';
                }).join('');
                UNITS.forEach(function(u,i){
                    C['sm_'+i] = new Chart(document.getElementById('db-sm_'+i), {
                        type:'bar',
                        data:{ labels:MOS, datasets:MODS.map(function(m){
                            return { label:m.label, data:MONTHS.map(function(mo){return +(S.allMonth[mo]&&S.allMonth[mo][u]?(S.allMonth[mo][u][m.key]||0):0).toFixed(2);}),
                                backgroundColor:m.color+'aa', borderColor:m.color, borderWidth:1, borderRadius:2 };
                        })},
                        options:{responsive:true,maintainAspectRatio:false,
                            plugins:{legend:{display:false}},
                            scales:{x:{stacked:true,grid:{display:false},ticks:{font:{family:'Inter',size:9}}},
                                    y:{stacked:true,max:TOTAL_MAX,grid:{color:'#f1f5f9'},ticks:{font:{family:'Inter',size:9}}}}}
                    });
                });
            }
        } else {
            // Triwulan: line X = 4 TW
            if (titleEl) titleEl.textContent = 'Tren Total Nilai Lintas Triwulan — per Divisi';
            if (noteEl)  noteEl.textContent  = 'TW I – TW IV, rata-rata nilai /100';
            if (smTitleEl) smTitleEl.textContent = 'Tren per Divisi — Detail Modul per Triwulan';

            var ds2 = UNITS.map(function(u,i){
                return { label:US[u], data:TW_KEYS.map(function(tw){return getUnitTwTotal(u,TRIWULAN[tw]);}),
                    borderColor:UC[i], backgroundColor:UC[i]+'22', borderWidth:2,
                    pointRadius:5, pointBackgroundColor:UC[i], pointBorderColor:'#fff', pointBorderWidth:2,
                    fill:false, tension:.3, spanGaps:true };
            });
            C.cTrend = new Chart(document.getElementById('db-cTrend'), {
                type:'line', data:{labels:TW_KEYS, datasets:ds2}, options:trendOpts(TOTAL_MAX,'Rata-rata (/100)')
            });

            if (grid) {
                grid.innerHTML = UNITS.map(function(u,i){
                    return '<div class="card"><div class="card-header" style="padding:12px 18px"><span class="card-title" style="color:'+UC[i]+';font-size:14px">'+US[u]+'</span></div>'
                        + '<div class="card-content" style="padding:14px"><div class="chart-wrap h-230"><canvas id="db-sm_'+i+'"></canvas></div></div></div>';
                }).join('');
                UNITS.forEach(function(u,i){
                    C['sm_'+i] = new Chart(document.getElementById('db-sm_'+i), {
                        type:'bar',
                        data:{ labels:TW_KEYS, datasets:MODS.map(function(m){
                            return { label:m.label, data:TW_KEYS.map(function(tw){return getUnitTwMod(u,TRIWULAN[tw],m.key)||0;}),
                                backgroundColor:m.color+'aa', borderColor:m.color, borderWidth:1, borderRadius:2 };
                        })},
                        options:{responsive:true,maintainAspectRatio:false,
                            plugins:{legend:{display:false}},
                            scales:{x:{stacked:true,grid:{display:false},ticks:{font:{family:'Inter',size:10}}},
                                    y:{stacked:true,max:TOTAL_MAX,grid:{color:'#f1f5f9'},ticks:{font:{family:'Inter',size:9}}}}}
                    });
                });
            }
        }
    }

    // ── Tab: Per Kategori ─────────────────────────────────────────
    function drawCat() {
        kill('cCat'); kill('cCat2');
        var cat = activeCat[activeMode];
        var mod = MODS.find(function(m){return m.key===cat;});
        var sc  = getScores();
        document.getElementById('db-catTitle').textContent  = mod.label+' — Semua Divisi, '+getPeriodeLabel();
        document.getElementById('db-catNote').textContent   = 'Maks. '+mod.max+' poin per divisi';
        document.getElementById('db-catTitle2').textContent = mod.label+' — '+(activeMode==='bulanan'?'Tren Lintas Bulan':'Lintas Triwulan')+' per Divisi';

        var xLabels = UNITS.map(function(u){return US[u];});
        C.cCat = new Chart(document.getElementById('db-cCat'), {
            type:'bar',
            data:{ labels:xLabels, datasets:[{ label:mod.label,
                data:UNITS.map(function(u){return +(sc[u]&&sc[u][cat]!==null?sc[u][cat]:0).toFixed(2);}),
                backgroundColor:UNITS.map(function(u){ var v=sc[u]&&sc[u][cat]?sc[u][cat]:0, p=v/mod.max*100;
                    return p>=80?'#10b981bb':p>=60?'#3b82f6bb':p>=40?'#f59e0bbb':'#ef4444bb'; }),
                borderColor:mod.color, borderWidth:2, borderRadius:6 }]},
            options:{ responsive:true, maintainAspectRatio:false,
                plugins:{ legend:{display:false}, tooltip:{callbacks:{label:function(c){return c.raw+' / '+mod.max+' poin ('+((c.raw/mod.max*100).toFixed(0))+'%)';}}} },
                scales:{ x:{grid:{display:false},ticks:{font:{family:'Inter',size:12}}},
                    y:{min:0,max:mod.max,grid:{color:'#f1f5f9'},ticks:{font:{family:'Inter',size:11}},
                       title:{display:true,text:'Nilai '+mod.label+' (/'+mod.max+')',font:{family:'Inter',size:11}}} } }
        });

        var tLabels, tData;
        if (activeMode === 'bulanan') {
            tLabels = MOS;
            tData = UNITS.map(function(u,i){
                return { label:US[u], data:MONTHS.map(function(m){return +(S.allMonth[m]&&S.allMonth[m][u]&&S.allMonth[m][u][cat]?S.allMonth[m][u][cat]:0).toFixed(2);}),
                    borderColor:UC[i], backgroundColor:UC[i]+'22', borderWidth:2,
                    pointRadius:4, pointBackgroundColor:UC[i], pointBorderColor:'#fff', pointBorderWidth:2,
                    fill:false, tension:.35, spanGaps:true };
            });
        } else {
            tLabels = TW_KEYS;
            tData = UNITS.map(function(u,i){
                return { label:US[u], data:TW_KEYS.map(function(tw){return getUnitTwMod(u,TRIWULAN[tw],cat)||0;}),
                    borderColor:UC[i], backgroundColor:UC[i]+'22', borderWidth:2,
                    pointRadius:5, pointBackgroundColor:UC[i], pointBorderColor:'#fff', pointBorderWidth:2,
                    fill:false, tension:.3, spanGaps:true };
            });
        }
        C.cCat2 = new Chart(document.getElementById('db-cCat2'), {
            type:'line', data:{labels:tLabels, datasets:tData},
            options:{ responsive:true, maintainAspectRatio:false,
                plugins:{ legend:{position:'top',labels:{font:{family:'Inter',size:11},padding:8,boxWidth:10}},
                    tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+c.raw+'/'+mod.max;}}} },
                scales:{ x:{grid:{color:'#f8fafc'},ticks:{font:{family:'Inter',size:11}}},
                    y:{min:0,max:mod.max,grid:{color:'#f1f5f9'},ticks:{font:{family:'Inter',size:11}},title:{display:true,text:'/'+mod.max,font:{family:'Inter',size:11}}} } }
        });
    }

    // ── Tab: Profil Divisi ────────────────────────────────────────
    function drawProfil() {
        Object.keys(C).filter(function(k){return k.startsWith('rd_');}).forEach(function(k){C[k].destroy();delete C[k];});
        var sc   = getScores();
        var grid = document.getElementById('db-radarGrid');
        grid.innerHTML = UNITS.map(function(u,i){
            return '<div class="card">'
                + '<div class="card-header" style="padding:12px 18px"><span class="card-title" style="color:'+UC[i]+'">'+US[u]+'</span><span class="card-note">'+getPeriodeLabel()+'</span></div>'
                + '<div class="card-content" style="padding:14px"><div class="chart-wrap h-230"><canvas id="db-rd_'+i+'"></canvas></div>'
                + '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center">'
                + MODS.map(function(m){ var v=sc[u]?sc[u][m.key]:null;
                    return '<span style="font-size:10px;font-weight:600;color:'+m.color+'">'+m.label+': '+(v!==null?fn(v):'—')+'/'+m.max+'</span>'; })
                    .join('<span style="color:#e5e7eb">|</span>')
                + '</div></div></div>';
        }).join('');

        UNITS.forEach(function(u,i){
            C['rd_'+i] = new Chart(document.getElementById('db-rd_'+i), {
                type:'radar',
                data:{ labels:MODS.map(function(m){return m.label;}), datasets:[{
                    label:US[u],
                    data:MODS.map(function(m){ var v=sc[u]?sc[u][m.key]:null; return v!==null?+((v/m.max)*100).toFixed(1):0; }),
                    backgroundColor:UC[i]+'22', borderColor:UC[i], borderWidth:2,
                    pointBackgroundColor:MODS.map(function(m){return m.color;}),
                    pointBorderColor:'#fff', pointBorderWidth:2, pointRadius:4
                }]},
                options:{ responsive:true, maintainAspectRatio:false,
                    plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return c.raw+'%';}}}},
                    scales:{r:{min:0,max:100,ticks:{stepSize:50,font:{size:9},color:'#94a3b8'},
                        pointLabels:{font:{family:'Inter',size:10}},grid:{color:'#f1f5f9'}}} }
            });
        });
    }

    // ── Kategori buttons ─────────────────────────────────────────
    function buildCatRow() {
        var wrap = document.getElementById('db-catRow');
        if (!wrap) return;
        MODS.forEach(function (m) {
            var b = document.createElement('button');
            b.className = 'cat-btn';
            b.textContent = m.label;
            if (m.key === activeCat[activeMode]) { b.style.background = m.color; b.style.color = '#fff'; }
            b.onclick = function () {
                activeCat[activeMode] = m.key;
                wrap.querySelectorAll('.cat-btn').forEach(function(bb){ bb.style.background='#f1f5f9'; bb.style.color='#64748b'; });
                b.style.background = m.color; b.style.color = '#fff';
                drawCat();
            };
            wrap.appendChild(b);
        });
    }

    function setRefreshLoading(on) {
        var btn = document.getElementById('db-btnRefresh');
        if (!btn) return;
        btn.classList.toggle('loading', on);
        btn.disabled = on;
    }

    // ── Public globals ────────────────────────────────────────────
    window.dbLoadAll = function () {
        S.bulan = (document.getElementById('db-bulanSelect') || {}).value || S.bulan;
        loadAll();
    };
    window.dbOnBulanChange = function () {
        S.bulan = document.getElementById('db-bulanSelect').value;
        loadAll();
    };

    // ── Init ─────────────────────────────────────────────────────
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['dashboard'] = function () {
        // Inject seluruh UI ke container
        injectDashboardUI();

        var now = new Date();
        // Set bulan default ke bulan sekarang
        var selEl = document.getElementById('db-bulanSelect');
        if (selEl) selEl.value = MONTHS[now.getMonth()];
        S.bulan = MONTHS[now.getMonth()];

        // Header date
        var dateEl = document.getElementById('db-headerDate');
        if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', {
            weekday:'long', year:'numeric', month:'long', day:'numeric'
        });

        // Set mode default & tab default
        activeMode = 'bulanan';
        activeTab  = { bulanan:'total', triwulan:'total' };
        activeTW   = 'TW I';

        // Build kategori buttons setelah DOM siap
        buildCatRow();

        loadAll();
    };

})();