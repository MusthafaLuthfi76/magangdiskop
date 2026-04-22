// ============================================================
// TRANSPARANSI ALL-IN-ONE — UNIFIED EDITION
// Palet: biru gelap (#1a1a2e / #0f3460) + gold (#c5a572)
// ============================================================

// ── API URLs ─────────────────────────────────────────────────
const ADMIN_GAS_URL = 'https://script.google.com/macros/s/AKfycbxsdAlN0gLea0f9iA9h5R8VTZJtIBK_JJxFwzP_TbP5lPNCq4oylR5rD6gPB5sshMjwlg/exec';
const SPJ_GAS_URL = 'https://script.google.com/macros/s/AKfycbxrlBOq5yyUH-FSX6s1g_4feGVeJNJVNP_5vw7fAW4VdHrGxdwZgBnb_0rIomtXgw-U/exec';
const MONEV_GAS_URL = 'https://script.google.com/macros/s/AKfycbwn6AO1g22y9_WeIoBXJ69nE5cvVRldyQsTSk5Hmc36PWRFU86pWGJ8NN5ZNeDHsaLU6A/exec';

// ── PALET WARNA — sinkron dengan :root di style.css ──────────
const C = {
    primary: '#1a1a2e',
    accent: '#0f3460',
    gold: '#c5a572',
    goldDark: '#a8885a',
    goldLight: 'rgba(197,165,114,0.15)',
    goldBg: 'rgba(197,165,114,0.08)',
    success: '#059669',
    warning: '#f59e0b',
    error: '#dc2626',
    blue: '#3b82f6',
    silver: '#b0b8c1',
    border: '#e5e7eb',
    bgLight: '#f8f9fa',
    textDark: '#1a1a2e',
    textLight: '#6b7280',
    white: '#ffffff',
};

// ── GRADIENT FACTORY ──────────────────────────────────────────
function makeGradient(ctx, chartArea, colorTop, colorBottom) {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, colorBottom);
    gradient.addColorStop(1, colorTop);
    return gradient;
}

const GRAD_TIERS = {
    excellent: { top: '#1a1a2e', bottom: '#0f3460' },
    good: { top: '#0f3460', bottom: '#1a4a8a' },
    fair: { top: '#c5a572', bottom: '#a8885a' },
    poor: { top: '#dc2626', bottom: '#991b1b' },
};

const UNIT_GRAD_PALETTE = [
    { top: '#1a1a2e', bottom: '#0f3460' },
    { top: '#0f3460', bottom: '#1e3a5f' },
    { top: '#c5a572', bottom: '#8a6030' },
    { top: '#1a4a8a', bottom: '#0f3460' },
    { top: '#b5935a', bottom: '#6b4c20' },
    { top: '#2d2d5e', bottom: '#1a1a2e' },
];

function resolveGradient(chartCtx, chartArea, pct, unitIndex) {
    if (!chartArea) {
        if (pct >= 90) return GRAD_TIERS.excellent.top;
        if (pct >= 75) return GRAD_TIERS.good.top;
        if (pct >= 50) return GRAD_TIERS.fair.top;
        return GRAD_TIERS.poor.top;
    }
    if (unitIndex !== undefined && unitIndex >= 0) {
        const g = UNIT_GRAD_PALETTE[unitIndex % UNIT_GRAD_PALETTE.length];
        return makeGradient(chartCtx, chartArea, g.top, g.bottom);
    }
    let tier;
    if (pct >= 90) tier = GRAD_TIERS.excellent;
    else if (pct >= 75) tier = GRAD_TIERS.good;
    else if (pct >= 50) tier = GRAD_TIERS.fair;
    else tier = GRAD_TIERS.poor;
    return makeGradient(chartCtx, chartArea, tier.top, tier.bottom);
}

function barColor(pct) {
    if (pct >= 90) return C.primary;
    if (pct >= 75) return C.accent;
    if (pct >= 50) return C.gold;
    return C.error;
}
function progressColor(pct) {
    if (pct >= 90) return C.primary;
    if (pct >= 75) return C.accent;
    if (pct >= 50) return C.gold;
    return C.error;
}

// ── KONSTANTA ─────────────────────────────────────────────────
const URUTAN_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const URUTAN_BULAN_UPPER = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

// ── FIX: satu sumber kebenaran untuk daftar unit ─────────────
// Backend handleGetRoomScores, handleGetVehicleScores, handleGetBBMScores
// semuanya memakai urutan ini secara hardcoded (kolom 1-6 di spreadsheet).
// Frontend WAJIB memakai array yang sama agar index kolom sinkron.
const UNITS_LIST = [
    'Sekretariat',
    'Bidang Koperasi',
    'Bidang UKM',
    'Bidang Usaha Mikro',
    'Bidang Kewirausahaan',
    'Balai Layanan Usaha Terpadu KUMKM'
];

// UNITS_DISPLAY disamakan dengan UNITS_LIST supaya chart & tabel konsisten.
// Jika Anda ingin urutan tampilan berbeda, ubah HANYA array ini —
// tapi pastikan semua nama identik dengan UNITS_LIST.
const UNITS_DISPLAY = [...UNITS_LIST];

// ── Helper bulan ─────────────────────────────────────────────
function getCurrentMonthName() {
    return URUTAN_BULAN[new Date().getMonth()];
}

function pickDefaultBulan(bulanList) {
    const current = getCurrentMonthName();
    if (bulanList.includes(current)) return current;
    if (bulanList.length > 0) return bulanList[bulanList.length - 1];
    return '';
}

// ── STATE ─────────────────────────────────────────────────────
let currentNilaiType = '';
let currentNilaiData = null;
let dokumenAllDocuments = null;
let homeSummaryAllData = null;
let spjAllData = null;
let monevAllData = null;

// ============================================================
// JSONP HELPER
// ============================================================
function jsonpFetch(url, params = {}) {
    return new Promise((resolve, reject) => {
        const cbName = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 99999);
        const qs = new URLSearchParams({ ...params, callback: cbName }).toString();
        const script = document.createElement('script');
        const timer = setTimeout(() => { cleanup(); reject(new Error('Timeout 20 detik')); }, 20000);
        window[cbName] = data => { cleanup(); resolve(data); };
        script.onerror = () => { cleanup(); reject(new Error('Network error')); };
        script.src = `${url}?${qs}`;
        function cleanup() {
            clearTimeout(timer); delete window[cbName];
            if (script.parentNode) script.parentNode.removeChild(script);
        }
        document.head.appendChild(script);
    });
}

// ── HELPERS ───────────────────────────────────────────────────
function safeParseFloat(v) {
    if (v === null || v === undefined || v === '') return 0;
    const r = parseFloat(String(v).replace(',', '.'));
    return isNaN(r) ? 0 : r;
}

function normalizeMonth(b) {
    if (!b) return '';
    const low = String(b).trim().toLowerCase();
    return URUTAN_BULAN.find(x => x.toLowerCase() === low) || String(b).trim();
}

// FIX: normalizeUnit — pastikan nama unit dari backend cocok dengan UNITS_LIST
function normalizeUnit(u) {
    if (!u) return '';
    const trimmed = String(u).trim();
    // Cari kecocokan persis dulu
    if (UNITS_LIST.includes(trimmed)) return trimmed;
    // Fallback: case-insensitive
    const lower = trimmed.toLowerCase();
    return UNITS_LIST.find(x => x.toLowerCase() === lower) || trimmed;
}

function normalizeScores(arr) {
    return (arr || []).map(s => ({
        ...s,
        bulan: normalizeMonth(s.bulan),
        unit: normalizeUnit(s.unit)
    }));
}

function normalizeDocs(arr) {
    return (Array.isArray(arr) ? arr : []).map(d => ({
        ...d,
        bulan: normalizeMonth(d.bulan),
        unit: normalizeUnit(d.unit)
    }));
}

function fmtRp(n) { return 'Rp ' + (parseFloat(n) || 0).toLocaleString('id-ID'); }

function bulanUpperToTitle(b) {
    const idx = URUTAN_BULAN_UPPER.indexOf(b);
    return idx >= 0 ? URUTAN_BULAN[idx] : b;
}

// ── Progress bar HTML ─────────────────────────────────────────
function progressBar(n, max) {
    const pct = max > 0 ? Math.min(100, (n / max) * 100) : 0;
    const color = progressColor(pct);
    const shimmerClass = pct >= 90 ? ' tp-progress-shimmer' : '';
    return `<div class="tp-progress-wrap">
        <div class="tp-progress-track">
            <div class="tp-progress-fill${shimmerClass}" style="width:${pct.toFixed(1)}%;background:${color};"></div>
        </div>
        <span class="tp-progress-label">${pct.toFixed(0)}%</span>
    </div>`;
}

function nilaiClass(n, max) {
    const p = max > 0 ? n / max : 0;
    if (p >= .9) return 'nilai-excellent';
    if (p >= .75) return 'nilai-good';
    if (p >= .5) return 'nilai-fair';
    return 'nilai-poor';
}

function getKategori(score) {
    if (score >= 4.5) return 'excellent';
    if (score >= 3.5) return 'good';
    if (score >= 2.5) return 'fair';
    return 'poor';
}

function rankBadge(i) {
    const n = i + 1;
    if (i === 0) return `<span class="rank-badge-1">${n}</span>`;
    if (i === 1) return `<span class="rank-badge-2">${n}</span>`;
    if (i === 2) return `<span class="rank-badge-3">${n}</span>`;
    return `<span class="rank-badge-n">${n}</span>`;
}

function topCard(rank, i, score, maxScore, subtitle) {
    const kls = nilaiClass(score, maxScore);
    const pct = maxScore > 0 ? (score / maxScore * 100).toFixed(1) : '0';
    const rankClass = i === 0 ? 'tp-top-card-rank-1' : i === 1 ? 'tp-top-card-rank-2' : 'tp-top-card-rank-3';
    const scoreStr = typeof score === 'number' && !Number.isInteger(score) ? score.toFixed(2) : score;
    return `<div class="tp-top-card ${rankClass}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            ${rankBadge(i)}
            <div>
                <div style="font-weight:700;font-size:.9375rem;color:${C.textDark};line-height:1.3;">${rank.unit}</div>
                <div style="font-size:.75rem;color:${C.textLight};margin-top:2px;">${subtitle}</div>
            </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:10px;">
            <span class="${kls}" style="font-size:2rem;font-weight:800;">${scoreStr}</span>
            <span style="font-size:.8125rem;color:${C.textLight};">/ ${maxScore} &middot; ${pct}%</span>
        </div>
        ${progressBar(score, maxScore)}
    </div>`;
}

function chartHeader(title, subtitle, selectId, bulanList, selectedBulan, onchangeFn) {
    return `<div class="chart-header">
        <div>
            <h3>${title}</h3>
            ${subtitle ? `<p>${subtitle}</p>` : ''}
        </div>
        <div class="month-selector">
            <label>Pilih Bulan:</label>
            <select id="${selectId}" onchange="${onchangeFn}(this.value)">
                ${bulanList.map(b => `<option value="${b}" ${selectedBulan === b ? 'selected' : ''}>${b}</option>`).join('')}
            </select>
        </div>
    </div>`;
}

function baseChartOptions(maxY, stepY, ylabel, stacked) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: stacked
                ? { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { size: 12 } } }
                : { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 15, 35, 0.92)',
                titleColor: '#c5a572',
                bodyColor: '#ffffff',
                borderColor: 'rgba(197,165,114,0.4)',
                borderWidth: 1,
                cornerRadius: 10,
                padding: 12,
                titleFont: { weight: '700', size: 12 },
                bodyFont: { size: 13 },
                displayColors: false,
            }
        },
        scales: {
            x: {
                stacked: !!stacked,
                grid: { display: false },
                ticks: { font: { size: 11 }, color: C.textLight }
            },
            y: {
                stacked: !!stacked,
                beginAtZero: true, max: maxY,
                ticks: { stepSize: stepY, color: C.textLight },
                grid: { color: 'rgba(229,231,235,0.6)', drawBorder: false },
                title: ylabel
                    ? { display: true, text: ylabel, color: C.textLight, font: { size: 11 } }
                    : { display: false }
            }
        },
        animation: { duration: 700, easing: 'easeOutQuart' },
        datasets: { bar: { borderSkipped: false } }
    };
}

function applyGradientColors(chart, unitsList, scoresMap, maxScore, useUnitPalette) {
    try {
        if (!chart || !chart.ctx || !chart.chartArea) return;
        const canvas = chart.canvas;
        if (!canvas || !document.body.contains(canvas)) return;
        const chartCtx = chart.ctx;
        const chartArea = chart.chartArea;
        chart.data.datasets.forEach((dataset) => {
            dataset.backgroundColor = dataset.data.map((val, i) => {
                const pct = maxScore > 0 ? (val / maxScore) * 100 : 0;
                const unitIdx = useUnitPalette ? i : -1;
                return resolveGradient(chartCtx, chartArea, pct, unitIdx >= 0 ? unitIdx : undefined);
            });
        });
        chart.update('none');
    } catch (e) {
        console.warn('[gradient] skipped:', e.message);
    }
}

function showError(message) {
    console.error('Transparansi Error:', message);
    const el = document.getElementById('nilai-content');
    if (!el) return;
    const safeType = String(currentNilaiType || '');
    el.innerHTML = `
        <div class="empty-state">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
                 style="width:80px;height:80px;margin:0 auto 20px;opacity:.5;">
                <circle cx="32" cy="32" r="28" stroke="${C.accent}" stroke-width="2.5"/>
                <path d="M32 20V36" stroke="${C.gold}" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="32" cy="44" r="2" fill="${C.gold}"/>
            </svg>
            <h3>Terjadi Kesalahan</h3>
            <p>${message}</p>
            <button data-retry="${safeType}" class="btn-retry">Muat Ulang</button>
        </div>`;
    el.style.display = 'block';
    const loadingEl = document.getElementById('nilai-loading');
    if (loadingEl) loadingEl.style.display = 'none';
    const btn = el.querySelector('[data-retry]');
    if (btn) btn.addEventListener('click', function () {
        loadNilaiData(this.getAttribute('data-retry'));
    }, { once: true });
}

// ── NAVIGATION ────────────────────────────────────────────────
function handleTransparansiClick(type) {
    if (typeof event !== 'undefined' && event) {
        event.preventDefault && event.preventDefault();
        event.stopPropagation && event.stopPropagation();
    }
    const dd = document.getElementById('transparansi-dropdown');
    if (dd) dd.classList.remove('show');
    if (typeof showSection === 'function') showSection('transparansi-nilai');
    const t = String(type);
    setTimeout(function () { loadNilaiData(t); }, 150);
    return false;
}

// ============================================================
// MAIN DISPATCHER
// ============================================================
function loadNilaiData(type) {
    if (!type) {
        const c = document.getElementById('nilai-content');
        const e = document.getElementById('nilai-empty');
        if (c) c.style.display = 'none';
        if (e) e.style.display = 'block';
        return;
    }
    currentNilaiType = type;
    const loadingEl = document.getElementById('nilai-loading');
    const emptyEl = document.getElementById('nilai-empty');
    const contentEl = document.getElementById('nilai-content');
    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'none';

    ['ruangChart', 'kunciChart', 'kebersihanChart', 'bbmChart', 'dokumenChart', 'spjChart', 'monevChart'].forEach(name => {
        if (window[name]) { try { window[name].destroy(); } catch (e) { } window[name] = null; }
    });

    switch (type) {
        case 'ruang-rapat': loadRuangRapatScores(); break;
        case 'kendaraan': loadKendaraanScores(); break;
        case 'bbm': loadBBMScores(); break;
        case 'dokumen': loadDokumenScores(); break;
        case 'spj-keuangan': loadSPJKeuanganTransparansi(); break;
        case 'monev': loadMonevTransparansi(); break;
        default: showError('Tipe tidak dikenali: ' + type);
    }
}

// ============================================================
// SHARED RENDER — dipakai ruang rapat & BBM
// ============================================================
function renderSingleScorePage({ scores, units, maxScore, stepY,
    title, subtitle, chartId, chartWindow, selectId, onChangeFn, selectedBulan }) {

    const bulanList = URUTAN_BULAN.filter(b => scores.some(s => s.bulan === b));
    const filtered = scores.filter(s => s.bulan === selectedBulan);

    // FIX: gunakan units (UNITS_LIST) sebagai sumber, bukan UNITS_DISPLAY
    const unitScores = units.map(unit => {
        const ud = filtered.filter(s => s.unit === unit);
        if (ud.length === 0) return { unit, skor: null };
        const avg = ud.reduce((s, d) => s + safeParseFloat(d.skorAkhir), 0) / ud.length;
        const latest = ud[ud.length - 1];
        return {
            unit, skor: avg,
            skorUtuh: safeParseFloat(latest.skorUtuh),
            pelanggaran: latest.jumlahPelanggaran,
            sanksi: safeParseFloat(latest.jumlahSanksi)
        };
    });

    const ranked = [...unitScores].sort((a, b) => {
        if (a.skor === null && b.skor === null) return 0;
        if (a.skor === null) return 1;
        if (b.skor === null) return -1;
        return b.skor - a.skor;
    });

    const withData = ranked.filter(r => r.skor !== null);
    const bulanLabel = selectedBulan;

    let html = chartHeader(title, subtitle, selectId, bulanList, selectedBulan, onChangeFn);

    if (withData.length > 0) {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:24px;">
            ${withData.slice(0, 3).map((r, i) => topCard(r, i, r.skor, maxScore, bulanLabel)).join('')}
        </div>`;
    }

    html += `<div class="chart-container"><canvas id="${chartId}"></canvas></div>`;

    html += `<div class="table-compact"><table>
        <thead><tr>
            <th style="width:52px;text-align:center;">Rank</th>
            <th>Unit Kerja</th>
            <th style="text-align:center;">Skor Utuh</th>
            <th style="text-align:center;">Pelanggaran</th>
            <th style="text-align:center;">Sanksi</th>
            <th style="text-align:center;">Skor Akhir</th>
            <th style="min-width:130px;">Progress</th>
        </tr></thead>
        <tbody>${ranked.map((r, i) => {
        if (r.skor === null) return `<tr style="opacity:.4;">
                <td style="text-align:center;">—</td>
                <td><strong>${r.unit}</strong></td>
                <td colspan="5" style="text-align:center;color:${C.textLight};font-style:italic;">Belum dinilai</td>
            </tr>`;
        const kls = nilaiClass(r.skor, maxScore);
        const sanksi = r.sanksi > 0
            ? `<span style="color:${C.error};font-weight:600;">-${r.sanksi.toFixed(2)}</span>`
            : `<span style="color:${C.success};font-weight:600;">0</span>`;
        return `<tr>
                <td style="text-align:center;">${rankBadge(i)}</td>
                <td><strong>${r.unit}</strong></td>
                <td style="text-align:center;">${r.skorUtuh.toFixed(1)}</td>
                <td style="text-align:center;">${r.pelanggaran}</td>
                <td style="text-align:center;">${sanksi}</td>
                <td style="text-align:center;"><span class="${kls}" style="font-size:1rem;">${r.skor.toFixed(2)}</span></td>
                <td>${progressBar(r.skor, maxScore)}</td>
            </tr>`;
    }).join('')}</tbody>
    </table></div>`;

    document.getElementById('nilai-content').innerHTML = html;
    document.getElementById('nilai-loading').style.display = 'none';
    document.getElementById('nilai-content').style.display = 'block';

    const ctx = document.getElementById(chartId);
    if (window[chartWindow]) window[chartWindow].destroy();
    if (ctx) {
        // FIX: chart memakai urutan units (UNITS_LIST) yang sama dengan backend
        const chartData = units.map(u => {
            const r = unitScores.find(x => x.unit === u);
            return r && r.skor !== null ? r.skor : 0;
        });
        window[chartWindow] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: units.map(u => u.length > 16 ? u.substring(0, 16) + '…' : u),
                datasets: [{
                    label: 'Skor Akhir',
                    data: chartData,
                    backgroundColor: UNIT_GRAD_PALETTE.slice(0, units.length).map(g => g.top),
                    borderRadius: 10,
                    borderSkipped: false,
                    borderWidth: 0,
                }]
            },
            options: {
                ...baseChartOptions(maxScore, stepY, `Skor (maks. ${maxScore})`, false),
                animation: {
                    duration: 700,
                    easing: 'easeOutQuart',
                    onComplete: function (ctx) {
                        if (!ctx.initial) return;
                        applyGradientColors(this, units, unitScores, maxScore, true);
                    }
                }
            }
        });
    }
}

// ============================================================
// 1. RUANG RAPAT
// ============================================================
function loadRuangRapatScores() {
    jsonpFetch(ADMIN_GAS_URL, { action: 'getRoomScores' })
        .then(data => {
            if (data && data.success) {
                const scores = normalizeScores(data.scores || []);
                const bulanList = URUTAN_BULAN.filter(b => scores.some(s => s.bulan === b));
                const defaultBulan = pickDefaultBulan(bulanList);
                renderRuangRapatScores(scores, defaultBulan);
            } else {
                showError('Gagal memuat data Ruang Rapat');
            }
        })
        .catch(err => showError('Error Ruang Rapat: ' + err.message));
}

function renderRuangRapatScores(scores, selectedBulan) {
    currentNilaiData = { scores, units: UNITS_LIST, type: 'ruang-rapat' };
    renderSingleScorePage({
        scores, units: UNITS_LIST, maxScore: 5, stepY: 1,
        title: 'Nilai Ruang Rapat',
        subtitle: 'Skor kinerja penggunaan ruang rapat (maks. 5)',
        chartId: 'ruang-chart', chartWindow: 'ruangChart',
        selectId: 'month-select-ruang', onChangeFn: 'updateRuangRapatMonth', selectedBulan
    });
}

function updateRuangRapatMonth(bulan) {
    if (!currentNilaiData) return;
    renderRuangRapatScores(currentNilaiData.scores, bulan);
}

// ============================================================
// 2. KENDARAAN
// ============================================================
function loadKendaraanScores() {
    Promise.all([
        jsonpFetch(ADMIN_GAS_URL, { action: 'getVehicleScores', jenis: 'KUNCI' }),
        jsonpFetch(ADMIN_GAS_URL, { action: 'getVehicleScores', jenis: 'KEBERSIHAN' })
    ])
        .then(([kD, keD]) => {
            if (kD && kD.success && keD && keD.success) {
                const kunci = normalizeScores(kD.scores || []);
                const kebersihan = normalizeScores(keD.scores || []);
                const allMonthsSet = new Set([...kunci.map(s => s.bulan), ...kebersihan.map(s => s.bulan)]);
                const bulanList = URUTAN_BULAN.filter(b => allMonthsSet.has(b));
                const defaultBulan = pickDefaultBulan(bulanList);
                renderKendaraanPage(kunci, kebersihan, defaultBulan);
            } else {
                showError('Gagal memuat data Kendaraan');
            }
        })
        .catch(err => showError('Error Kendaraan: ' + err.message));
}

function renderKendaraanPage(kunci, kebersihan, selectedBulan) {
    const allMonthsSet = new Set([...kunci.map(s => s.bulan), ...kebersihan.map(s => s.bulan)]);
    const bulanList = URUTAN_BULAN.filter(b => allMonthsSet.has(b));
    if (bulanList.length === 0) { showError('Belum ada data nilai Kendaraan'); return; }

    currentNilaiData = { kunci, kebersihan, units: UNITS_LIST, type: 'kendaraan' };

    const kF = kunci.filter(s => s.bulan === selectedBulan);
    const keF = kebersihan.filter(s => s.bulan === selectedBulan);
    const bulanLabel = selectedBulan;

    function unitAvg(scores, unit) {
        // FIX: filter harus cocok dengan unit yang sudah dinormalisasi
        const d = scores.filter(s => s.unit === unit);
        if (d.length === 0) return null;
        return d.reduce((s, x) => s + safeParseFloat(x.skorAkhir), 0) / d.length;
    }

    // FIX: gunakan UNITS_LIST sebagai dasar ranking
    const rankedKunci = UNITS_LIST.map(u => ({ unit: u, skor: unitAvg(kF, u) }))
        .sort((a, b) => (a.skor === null ? 1 : b.skor === null ? -1 : b.skor - a.skor));
    const rankedKe = UNITS_LIST.map(u => ({ unit: u, skor: unitAvg(keF, u) }))
        .sort((a, b) => (a.skor === null ? 1 : b.skor === null ? -1 : b.skor - a.skor));

    let html = chartHeader('Nilai Kendaraan Dinas',
        'Pengembalian kunci & kebersihan kendaraan dinas (maks. 5)',
        'month-select-kendaraan', bulanList, selectedBulan, 'updateKendaraanMonth');

    const topKunci = rankedKunci.filter(r => r.skor !== null).slice(0, 3);
    if (topKunci.length) {
        html += `<div style="margin-bottom:8px;"><h4 style="font-size:1rem;font-weight:700;color:${C.textDark};">Pengembalian Kunci — Top 3</h4></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-bottom:24px;">
            ${topKunci.map((r, i) => topCard(r, i, r.skor, 5, bulanLabel)).join('')}
        </div>`;
    }

    html += `<div class="dual-chart-grid">
        <div class="chart-section">
            <h4>Pengembalian Kunci</h4>
            <div class="chart-container-small"><canvas id="kunci-chart"></canvas></div>
            ${_scoreTableHtml(rankedKunci, 5)}
        </div>
        <div class="chart-section">
            <h4>Kebersihan Kendaraan</h4>
            <div class="chart-container-small"><canvas id="kebersihan-chart"></canvas></div>
            ${_scoreTableHtml(rankedKe, 5)}
        </div>
    </div>`;

    document.getElementById('nilai-content').innerHTML = html;
    document.getElementById('nilai-loading').style.display = 'none';
    document.getElementById('nilai-content').style.display = 'block';

    // FIX: _drawSimpleChart memakai UNITS_LIST (urutan tetap, sesuai backend)
    _drawSimpleChart('kunci-chart', 'kunciChart', UNITS_LIST, kF, 5);
    _drawSimpleChart('kebersihan-chart', 'kebersihanChart', UNITS_LIST, keF, 5);
}

function _scoreTableHtml(ranked, maxScore) {
    return `<div class="table-compact"><table>
        <thead><tr>
            <th style="width:44px;text-align:center;">Rank</th>
            <th>Unit</th>
            <th style="text-align:center;">Skor</th>
            <th style="min-width:100px;">Progress</th>
        </tr></thead>
        <tbody>${ranked.map((r, i) => r.skor === null
        ? `<tr style="opacity:.4;"><td style="text-align:center;">—</td>
               <td><strong>${r.unit.substring(0, 22)}</strong></td>
               <td colspan="2" style="text-align:center;color:${C.textLight};font-style:italic;">Belum dinilai</td></tr>`
        : `<tr>
               <td style="text-align:center;">${rankBadge(i)}</td>
               <td><strong>${r.unit.substring(0, 22)}</strong></td>
               <td style="text-align:center;"><span class="${nilaiClass(r.skor, maxScore)}">${r.skor.toFixed(2)}</span></td>
               <td>${progressBar(r.skor, maxScore)}</td></tr>`
    ).join('')}</tbody>
    </table></div>`;
}

function _drawSimpleChart(canvasId, winName, units, scores, maxScore) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (window[winName]) window[winName].destroy();
    // FIX: cari skor berdasarkan field unit yang sudah dinormalisasi
    const chartData = units.map(u => {
        const s = scores.find(x => x.unit === u);
        return s ? safeParseFloat(s.skorAkhir) : 0;
    });
    window[winName] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: units.map(u => u.length > 12 ? u.substring(0, 12) + '…' : u),
            datasets: [{
                data: chartData,
                backgroundColor: UNIT_GRAD_PALETTE.slice(0, units.length).map(g => g.top),
                borderRadius: 8,
                borderSkipped: false,
                borderWidth: 0,
            }]
        },
        options: {
            ...baseChartOptions(maxScore, 1, null, false),
            animation: {
                duration: 700,
                easing: 'easeOutQuart',
                onComplete: function (ctx) {
                    if (!ctx.initial) return;
                    applyGradientColors(this, units, scores, maxScore, true);
                }
            }
        }
    });
}

function updateKendaraanMonth(bulan) {
    if (!currentNilaiData) return;
    renderKendaraanPage(currentNilaiData.kunci, currentNilaiData.kebersihan, bulan);
}

// ============================================================
// 3. BBM
// ============================================================
function loadBBMScores() {
    jsonpFetch(ADMIN_GAS_URL, { action: 'getBBMScores' })
        .then(data => {
            if (data && data.success) {
                const scores = normalizeScores(data.scores || []);
                const bulanList = URUTAN_BULAN.filter(b => scores.some(s => s.bulan === b));
                const defaultBulan = pickDefaultBulan(bulanList);
                renderBBMScores(scores, defaultBulan);
            } else {
                showError('Gagal memuat data BBM');
            }
        })
        .catch(err => showError('Error BBM: ' + err.message));
}

function renderBBMScores(scores, selectedBulan) {
    currentNilaiData = { scores, units: UNITS_LIST, type: 'bbm' };
    renderSingleScorePage({
        scores, units: UNITS_LIST, maxScore: 5, stepY: 1,
        title: 'Nilai Voucher BBM',
        subtitle: 'Skor kinerja penggunaan voucher BBM (maks. 5)',
        chartId: 'bbm-chart', chartWindow: 'bbmChart',
        selectId: 'month-select-bbm', onChangeFn: 'updateBBMMonth', selectedBulan
    });
}

function updateBBMMonth(bulan) {
    if (!currentNilaiData) return;
    renderBBMScores(currentNilaiData.scores, bulan);
}

// ============================================================
// 4. DOKUMEN ARSIP
// ============================================================
function loadDokumenScores() {
    jsonpFetch(ADMIN_GAS_URL, { action: 'getDocuments' })
        .then(data => {
            if (Array.isArray(data)) {
                dokumenAllDocuments = normalizeDocs(data);
                const assessed = dokumenAllDocuments.filter(d => d.nilai && d.nilai !== '');
                const bulanList = URUTAN_BULAN.filter(b => assessed.some(d => d.bulan === b));
                const defaultBulan = pickDefaultBulan(bulanList);
                renderDokumenScores(dokumenAllDocuments, defaultBulan);
            } else {
                showError('Gagal memuat data Dokumen');
            }
        })
        .catch(err => showError('Error Dokumen: ' + err.message));
}

function updateDokumenMonth(bulan) {
    if (!dokumenAllDocuments) return;
    renderDokumenScores(dokumenAllDocuments, bulan);
}

function renderDokumenScores(documents, selectedBulan) {
    const assessed = documents.filter(d => d.nilai && d.nilai !== '');
    if (assessed.length === 0) { showError('Belum ada dokumen yang dinilai'); return; }

    const bulanList = URUTAN_BULAN.filter(b => assessed.some(d => d.bulan === b));
    const filtered = assessed.filter(d => d.bulan === selectedBulan);
    const bulanLabel = selectedBulan;

    const scoresByUnit = {};
    // FIX: iterasi UNITS_LIST bukan UNITS_DISPLAY
    UNITS_LIST.forEach(unit => {
        const docs = filtered.filter(d => d.unit === unit);
        if (docs.length > 0) {
            scoresByUnit[unit] = {
                count: docs.length,
                avgScore: docs.reduce((s, d) => s + safeParseFloat(d.nilai), 0) / docs.length
            };
        }
    });

    const ranked = UNITS_LIST.map(u => ({
        unit: u,
        skor: scoresByUnit[u] ? scoresByUnit[u].avgScore : null,
        count: scoresByUnit[u] ? scoresByUnit[u].count : 0
    })).sort((a, b) => (a.skor === null ? 1 : b.skor === null ? -1 : b.skor - a.skor));

    let html = chartHeader('Nilai Dokumen Arsip',
        'Rata-rata nilai dokumen yang telah dinilai (maks. 5)',
        'month-select-dokumen', bulanList, selectedBulan, 'updateDokumenMonth');

    const withData = ranked.filter(r => r.skor !== null);
    if (withData.length > 0) {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:24px;">
            ${withData.slice(0, 3).map((r, i) => topCard(r, i, r.skor, 5, `${r.count} dokumen · ${bulanLabel}`)).join('')}
        </div>`;
    }

    html += `<div class="chart-container"><canvas id="dokumen-chart"></canvas></div>`;

    html += `<div class="table-compact"><table>
        <thead><tr>
            <th style="width:52px;text-align:center;">Rank</th>
            <th>Unit Kerja</th>
            <th style="text-align:center;">Jumlah Dokumen</th>
            <th style="text-align:center;">Rata-rata Nilai</th>
            <th style="min-width:130px;">Progress</th>
        </tr></thead>
        <tbody>${ranked.map((r, i) => {
        if (r.skor === null) return `<tr style="opacity:.4;">
                <td style="text-align:center;">—</td><td><strong>${r.unit}</strong></td>
                <td colspan="3" style="text-align:center;color:${C.textLight};font-style:italic;">Belum dinilai</td></tr>`;
        return `<tr>
                <td style="text-align:center;">${rankBadge(i)}</td>
                <td><strong>${r.unit}</strong></td>
                <td style="text-align:center;">${r.count}</td>
                <td style="text-align:center;"><span class="${nilaiClass(r.skor, 5)}" style="font-size:1rem;">${r.skor.toFixed(2)}</span></td>
                <td>${progressBar(r.skor, 5)}</td>
            </tr>`;
    }).join('')}</tbody>
    </table></div>`;

    document.getElementById('nilai-content').innerHTML = html;
    document.getElementById('nilai-loading').style.display = 'none';
    document.getElementById('nilai-content').style.display = 'block';

    const ctx = document.getElementById('dokumen-chart');
    if (window.dokumenChart) window.dokumenChart.destroy();
    if (ctx) {
        // FIX: chart mengikuti UNITS_LIST
        const chartData = UNITS_LIST.map(u => scoresByUnit[u] ? scoresByUnit[u].avgScore : 0);
        window.dokumenChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: UNITS_LIST.map(u => u.length > 16 ? u.substring(0, 16) + '…' : u),
                datasets: [{
                    data: chartData,
                    backgroundColor: UNIT_GRAD_PALETTE.slice(0, UNITS_LIST.length).map(g => g.top),
                    borderRadius: 10,
                    borderSkipped: false,
                    borderWidth: 0,
                }]
            },
            options: {
                ...baseChartOptions(5, 1, 'Rata-rata Nilai (maks. 5)', false),
                animation: {
                    duration: 700,
                    easing: 'easeOutQuart',
                    onComplete: function (ctx) {
                        if (!ctx.initial) return;
                        applyGradientColors(this, UNITS_LIST, null, 5, true);
                    }
                }
            }
        });
    }
}

// ============================================================
// 5. SPJ KEUANGAN
// ============================================================
async function loadSPJKeuanganTransparansi() {
    try {
        const result = await jsonpFetch(SPJ_GAS_URL, { action: 'getSPJKeuangan' });
        if (!result.success) { showError('Gagal memuat data SPJ: ' + (result.message || '')); return; }
        spjAllData = (result.data || []).map(d => ({
            ...d,
            bulan: normalizeMonth(d.bulan),
            unit: normalizeUnit(d.unit)
        }));
        if (spjAllData.length === 0) { showError('Belum ada data penilaian SPJ Keuangan'); return; }
        const bulanList = URUTAN_BULAN.filter(b => new Set(spjAllData.map(d => d.bulan)).has(b));
        const defaultBulan = pickDefaultBulan(bulanList);
        renderSPJKeuanganPage(defaultBulan);
    } catch (err) { showError('Gagal menghubungi server SPJ: ' + err.message); }
}

function renderSPJKeuanganPage(selectedBulan) {
    const MAKS = 35;
    const data = spjAllData.filter(d => d.bulan === selectedBulan);
    const bulanList = URUTAN_BULAN.filter(b => new Set(spjAllData.map(d => d.bulan)).has(b));
    const bulanLabel = selectedBulan;

    // FIX: gunakan UNITS_LIST
    const unitSummary = UNITS_LIST.map(unit => {
        const ud = data.filter(d => d.unit === unit);
        if (ud.length === 0) return { unit, totalNilai: null };
        const l = [...ud].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))[0];
        return {
            unit,
            totalNilai: parseFloat(l.totalNilai) || 0,
            nilaiTepat: parseFloat(l.nilaiTepat) || 0,
            sanksi: parseFloat(l.sanksi) || 0,
            totalPengajuan: parseFloat(l.totalPengajuan) || 0,
            nominalTepat: parseFloat(l.nominalTepat) || 0,
            hariTerlambat: parseInt(l.hariTerlambat) || 0,
            catatan: l.catatan || '—',
            penilai: l.penilai || '—'
        };
    });

    const ranked = [...unitSummary].sort((a, b) => {
        if (a.totalNilai === null && b.totalNilai === null) return 0;
        if (a.totalNilai === null) return 1;
        if (b.totalNilai === null) return -1;
        return b.totalNilai - a.totalNilai;
    });

    const chartMap = {};
    unitSummary.forEach(u => { chartMap[u.unit] = u; });

    let html = chartHeader('Nilai SPJ Keuangan',
        'Penilaian ketepatan penyampaian SPJ (maks. 35 poin)',
        'month-select-spj', bulanList, selectedBulan, 'renderSPJKeuanganPage');

    const withData = ranked.filter(r => r.totalNilai !== null);
    if (withData.length > 0) {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:24px;">
            ${withData.slice(0, 3).map((r, i) => topCard(r, i, r.totalNilai, MAKS, bulanLabel)).join('')}
        </div>`;
    }

    html += `<div class="chart-container"><canvas id="spj-chart"></canvas></div>`;

    html += `<div class="table-compact"><table>
        <thead><tr>
            <th style="width:52px;text-align:center;">Rank</th><th>Unit Kerja</th>
            <th style="text-align:right;">Total Pengajuan</th>
            <th style="text-align:right;">Nominal Tepat</th>
            <th style="text-align:center;">Ketepatan</th>
            <th style="text-align:center;">Total Nilai</th>
            <th style="min-width:130px;">Progress</th>
            <th>Catatan</th>
        </tr></thead>
        <tbody>${ranked.map((r, i) => {
        if (r.totalNilai === null) return `<tr style="opacity:.4;">
                <td style="text-align:center;">—</td><td><strong>${r.unit}</strong></td>
                <td colspan="6" style="text-align:center;color:${C.textLight};font-style:italic;">Belum ada data</td></tr>`;
        const kls = nilaiClass(r.totalNilai, MAKS);
        const chip = r.hariTerlambat > 0
            ? `<span class="chip-terlambat">${r.hariTerlambat} hari terlambat</span>`
            : `<span class="chip-tepat">Tepat Waktu</span>`;
        return `<tr>
                <td style="text-align:center;">${rankBadge(i)}</td>
                <td><strong>${r.unit}</strong></td>
                <td style="text-align:right;white-space:nowrap;font-size:.875rem;">${fmtRp(r.totalPengajuan)}</td>
                <td style="text-align:right;white-space:nowrap;font-size:.875rem;">${fmtRp(r.nominalTepat)}</td>
                <td style="text-align:center;">${chip}</td>
                <td style="text-align:center;"><span class="${kls}" style="font-size:1rem;font-weight:700;">${r.totalNilai.toFixed(2)}</span></td>
                <td>${progressBar(r.totalNilai, MAKS)}</td>
                <td style="font-size:.8125rem;color:${C.textLight};max-width:160px;">${r.catatan}</td>
            </tr>`;
    }).join('')}</tbody>
    </table></div>`;

    document.getElementById('nilai-content').innerHTML = html;
    document.getElementById('nilai-loading').style.display = 'none';
    document.getElementById('nilai-content').style.display = 'block';

    const ctx = document.getElementById('spj-chart');
    if (ctx && window.spjChart) window.spjChart.destroy();
    if (ctx) {
        window.spjChart = new Chart(ctx, {
            type: 'bar',
            data: {
                // FIX: chart mengikuti UNITS_LIST
                labels: UNITS_LIST.map(u => u.length > 18 ? u.substring(0, 18) + '…' : u),
                datasets: [
                    {
                        label: 'Nilai Tepat Waktu',
                        data: UNITS_LIST.map(u => { const x = chartMap[u]; return x && x.totalNilai !== null ? x.nilaiTepat : 0; }),
                        backgroundColor: UNIT_GRAD_PALETTE.slice(0, UNITS_LIST.length).map(g => g.top),
                        borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 6, bottomRight: 6 }, stack: 's',
                        borderSkipped: false,
                    },
                    {
                        label: 'Komponen Lain',
                        data: UNITS_LIST.map(u => { const x = chartMap[u]; return x && x.totalNilai !== null ? Math.max(0, x.totalNilai - x.nilaiTepat) : 0; }),
                        backgroundColor: 'rgba(197,165,114,0.82)',
                        borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 }, stack: 's',
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                ...baseChartOptions(MAKS, 5, `Nilai (maks. ${MAKS})`, true),
                animation: {
                    duration: 700,
                    easing: 'easeOutQuart',
                    onComplete: function (ctx) {
                        if (!ctx.initial) return;
                        const chart = this;
                        const chartArea = chart.chartArea;
                        if (!chartArea) return;
                        const chartCtx = chart.ctx;
                        chart.data.datasets[0].backgroundColor = UNITS_LIST.map((u, i) => {
                            const g = UNIT_GRAD_PALETTE[i % UNIT_GRAD_PALETTE.length];
                            return makeGradient(chartCtx, chartArea, g.top, g.bottom);
                        });
                        const goldGrad = makeGradient(chartCtx, chartArea, '#c5a572', '#8a6030');
                        chart.data.datasets[1].backgroundColor = goldGrad;
                        chart.update('none');
                    }
                }
            }
        });
    }
}

// ============================================================
// 6. MONEV
// ============================================================
async function loadMonevTransparansi() {
    if (window.monevChart) { try { window.monevChart.destroy(); } catch (e) { } window.monevChart = null; }

    document.getElementById('nilai-content').innerHTML = `
        <div style="animation:tpulse 1.5s ease-in-out infinite;">
            <div style="height:72px;background:${C.border};border-radius:12px;margin-bottom:16px;opacity:.5;"></div>
            <div style="height:240px;background:${C.border};border-radius:12px;margin-bottom:20px;opacity:.4;"></div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
                ${[1, 2, 3].map(() => `<div style="height:110px;background:${C.border};border-radius:12px;opacity:.3;"></div>`).join('')}
            </div>
        </div>
        <style>@keyframes tpulse{0%,100%{opacity:1}50%{opacity:.5}}</style>`;
    document.getElementById('nilai-loading').style.display = 'none';
    document.getElementById('nilai-content').style.display = 'block';

    try {
        const result = await jsonpFetch(MONEV_GAS_URL, { action: 'getAllSheetData' });
        if (!result || result.status === 'error') { showError('Gagal memuat data Monev'); return; }
        monevAllData = result.data || {};
        if (Object.keys(monevAllData).length === 0) { showError('Belum ada data Monev'); return; }
        const tersedia = URUTAN_BULAN_UPPER.filter(b => monevAllData[b] && Object.keys(monevAllData[b]).length > 0);
        renderMonevPage(tersedia[tersedia.length - 1] || '');
    } catch (err) { showError('Gagal menghubungi server Monev: ' + err.message); }
}

function renderMonevPage(selectedBulan) {
    const MAKS = 40;
    const bulanList = URUTAN_BULAN_UPPER.filter(b => monevAllData[b] && Object.keys(monevAllData[b]).length > 0);
    const dataBulan = monevAllData[selectedBulan] || {};
    const bulanLabel = bulanUpperToTitle(selectedBulan);

    // FIX: gunakan UNITS_LIST
    const ranked = UNITS_LIST.map(unit => {
        const d = dataBulan[unit];
        if (!d) return { unit, total: null };
        return {
            unit, total: d.total || 0, waktu: d.waktu || 0, kelengkapan: d.kelengkapan || 0,
            fisik: d.fisik || 0, keuangan: d.keuangan || 0, partisipasi: d.partisipasi || 0,
            tindakLanjut: d.tindakLanjut || 0, catatan: d.catatan || '', penilai: d.penilai || '',
            linkBukti: d.linkBukti || '', hasBukti: !!(d.linkBukti && d.linkBukti.trim())
        };
    }).sort((a, b) => (a.total === null ? 1 : b.total === null ? -1 : b.total - a.total));

    const rankedMap = {};
    ranked.forEach(r => { rankedMap[r.unit] = r; });
    const withData = ranked.filter(r => r.total !== null);

    let html = `<div class="chart-header">
        <div>
            <h3>Nilai Monitoring &amp; Evaluasi</h3>
            <p>Penilaian kinerja Monev per unit (maks. 40 poin)</p>
        </div>
        <div class="month-selector">
            <label>Pilih Bulan:</label>
            <select id="month-select-monev" onchange="renderMonevPage(this.value)">
                ${bulanList.map(b => `<option value="${b}" ${selectedBulan === b ? 'selected' : ''}>${bulanUpperToTitle(b)}</option>`).join('')}
            </select>
        </div>
    </div>`;

    if (withData.length === 0) {
        html += `<div class="empty-state" style="padding:40px;">
            <p>Tidak ada data untuk bulan <strong>${bulanLabel}</strong>.</p></div>`;
        document.getElementById('nilai-content').innerHTML = html;
        document.getElementById('nilai-loading').style.display = 'none';
        document.getElementById('nilai-content').style.display = 'block';
        return;
    }

    html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:24px;">
        ${withData.slice(0, 3).map((r, i) => topCard(r, i, r.total, MAKS, bulanLabel)).join('')}
    </div>`;

    html += `<div class="chart-container"><canvas id="monev-chart"></canvas></div>`;

    html += `<div class="table-compact" style="overflow-x:auto;">
        <table style="min-width:860px;">
            <thead><tr>
                <th style="width:52px;text-align:center;">Rank</th><th>Unit Kerja</th>
                <th style="text-align:center;">Waktu<br><small style="font-weight:400;opacity:.6;">/5</small></th>
                <th style="text-align:center;">Lengkap<br><small style="font-weight:400;opacity:.6;">/5</small></th>
                <th style="text-align:center;">Fisik<br><small style="font-weight:400;opacity:.6;">/10</small></th>
                <th style="text-align:center;">Keuangan<br><small style="font-weight:400;opacity:.6;">/10</small></th>
                <th style="text-align:center;">Partisipasi<br><small style="font-weight:400;opacity:.6;">/5</small></th>
                <th style="text-align:center;">T.Lanjut<br><small style="font-weight:400;opacity:.6;">/5</small></th>
                <th style="text-align:center;">Total</th>
                <th style="min-width:120px;">Progress</th>
                <th>Penilai</th><th>Catatan</th>
                <th style="text-align:center;min-width:120px;">Bukti</th>
            </tr></thead>
            <tbody>${ranked.map((r, i) => {
        if (r.total === null) return `<tr style="opacity:.4;">
                    <td style="text-align:center;">—</td><td><strong>${r.unit}</strong></td>
                    <td colspan="11" style="text-align:center;color:${C.textLight};font-style:italic;">Belum ada data</td></tr>`;
        const kls = nilaiClass(r.total, MAKS);
        function cv(v, mx) {
            const col = v >= mx ? C.success : v >= mx * .5 ? C.warning : C.error;
            return `<span style="font-weight:700;color:${col};">${v}</span>`;
        }
        const buktiHtml = r.hasBukti
            ? `<a href="${r.linkBukti}" target="_blank" rel="noopener" class="btn-bukti">Lihat Bukti</a>`
            : `<span style="color:${C.border};">—</span>`;
        return `<tr>
                    <td style="text-align:center;">${rankBadge(i)}</td>
                    <td><strong>${r.unit}</strong></td>
                    <td style="text-align:center;">${cv(r.waktu, 5)}</td>
                    <td style="text-align:center;">${cv(r.kelengkapan, 5)}</td>
                    <td style="text-align:center;">${cv(r.fisik, 10)}</td>
                    <td style="text-align:center;">${cv(r.keuangan, 10)}</td>
                    <td style="text-align:center;">${cv(r.partisipasi, 5)}</td>
                    <td style="text-align:center;">${cv(r.tindakLanjut, 5)}</td>
                    <td style="text-align:center;"><span class="${kls}" style="font-size:1.1rem;font-weight:800;">${r.total}</span></td>
                    <td>${progressBar(r.total, MAKS)}</td>
                    <td style="font-size:.8125rem;color:${C.textLight};">${r.penilai || '—'}</td>
                    <td style="font-size:.8125rem;color:${C.textLight};max-width:150px;">${r.catatan || '—'}</td>
                    <td style="text-align:center;">${buktiHtml}</td>
                </tr>`;
    }).join('')}</tbody>
        </table>
    </div>`;

    document.getElementById('nilai-content').innerHTML = html;
    document.getElementById('nilai-loading').style.display = 'none';
    document.getElementById('nilai-content').style.display = 'block';

    const ctx = document.getElementById('monev-chart');
    if (ctx && window.monevChart) window.monevChart.destroy();
    if (ctx) {
        window.monevChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: UNITS_LIST.map(u => u.length > 18 ? u.substring(0, 18) + '…' : u),
                datasets: [{
                    label: 'Total Nilai Monev',
                    data: UNITS_LIST.map(u => { const r = rankedMap[u]; return r && r.total !== null ? r.total : 0; }),
                    backgroundColor: UNIT_GRAD_PALETTE.slice(0, UNITS_LIST.length).map(g => g.top),
                    borderRadius: 10,
                    borderSkipped: false,
                    borderWidth: 0,
                }]
            },
            options: {
                ...baseChartOptions(MAKS, 5, `Nilai (maks. ${MAKS})`, false),
                animation: {
                    duration: 700,
                    easing: 'easeOutQuart',
                    onComplete: function (ctx) {
                        if (!ctx.initial) return;
                        applyGradientColors(this, UNITS_LIST, null, MAKS, true);
                    }
                }
            }
        });
    }
}

// ============================================================
// HOME SUMMARY
// ============================================================
function calculateUnitAverageByMonth(scores, unit, month) {
    const f = scores.filter(s => s.unit === unit && (!month || s.bulan === month));
    if (f.length === 0) return 0;
    return f.reduce((s, x) => s + safeParseFloat(x.skorAkhir), 0) / f.length;
}

function calculateDocUnitAverage(docs, unit, month) {
    const a = docs.filter(d => d.nilai && d.nilai !== '' && d.unit === unit && (!month || d.bulan === month));
    if (a.length === 0) return 0;
    return a.reduce((s, d) => s + safeParseFloat(d.nilai), 0) / a.length;
}

function calculateSPJUnitAverage(spjData, unit, month) {
    const filtered = spjData.filter(d => d.unit === unit && (!month || d.bulan === month));
    if (filtered.length === 0) return 0;
    return filtered.reduce((s, d) => s + (parseFloat(d.totalNilai) || 0), 0) / filtered.length;
}

function calculateMonevUnitAverage(monevData, unit, month) {
    if (!monevData || Object.keys(monevData).length === 0) return 0;
    if (month) {
        const monthUpper = month.toUpperCase();
        const dataBulan = monevData[monthUpper];
        if (!dataBulan || !dataBulan[unit]) return 0;
        return dataBulan[unit].total || 0;
    }
    const bulanKeys = Object.keys(monevData);
    const values = bulanKeys
        .map(b => monevData[b][unit] ? (monevData[b][unit].total || 0) : null)
        .filter(v => v !== null);
    if (values.length === 0) return 0;
    return values.reduce((s, v) => s + v, 0) / values.length;
}

function loadHomeSummary() {
    Promise.all([
        jsonpFetch(ADMIN_GAS_URL, { action: 'getRoomScores' }),
        jsonpFetch(ADMIN_GAS_URL, { action: 'getVehicleScores', jenis: 'KUNCI' }),
        jsonpFetch(ADMIN_GAS_URL, { action: 'getVehicleScores', jenis: 'KEBERSIHAN' }),
        jsonpFetch(ADMIN_GAS_URL, { action: 'getBBMScores' }),
        jsonpFetch(ADMIN_GAS_URL, { action: 'getDocuments' }),
        jsonpFetch(SPJ_GAS_URL, { action: 'getSPJKeuangan' }),
        jsonpFetch(MONEV_GAS_URL, { action: 'getAllSheetData' })
    ])
        .then(([roomData, kunciData, kebersihanData, bbmData, docsData, spjData, monevData]) => {
            const nd = {
                room: { scores: normalizeScores(roomData.scores || []) },
                kunci: { scores: normalizeScores(kunciData.scores || []) },
                kebersihan: { scores: normalizeScores(kebersihanData.scores || []) },
                bbm: { scores: normalizeScores(bbmData.scores || []) },
                docs: normalizeDocs(docsData),
                spj: (spjData && spjData.success)
                    ? (spjData.data || []).map(d => ({
                        ...d,
                        bulan: normalizeMonth(d.bulan),
                        unit: normalizeUnit(d.unit)
                    }))
                    : [],
                monev: (monevData && monevData.status !== 'error')
                    ? (monevData.data || {})
                    : {}
            };
            homeSummaryAllData = nd;

            const allMonthsSet = new Set();
            [...nd.room.scores, ...nd.kunci.scores, ...nd.kebersihan.scores, ...nd.bbm.scores, ...nd.spj]
                .forEach(s => { if (s.bulan) allMonthsSet.add(s.bulan); });
            nd.docs.forEach(d => { if (d.bulan) allMonthsSet.add(d.bulan); });
            Object.keys(nd.monev).forEach(b => {
                const idx = URUTAN_BULAN_UPPER.indexOf(b);
                if (idx >= 0) allMonthsSet.add(URUTAN_BULAN[idx]);
            });

            const monthsArray = URUTAN_BULAN.filter(b => allMonthsSet.has(b));

            const summaryContainer = document.getElementById('summary-container');
            if (summaryContainer && !document.getElementById('summary-month-filter')) {
                summaryContainer.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:16px;
                        background:var(--bg-light);border-radius:10px;border:1px solid var(--border);">
                <label style="font-weight:600;color:var(--text-dark);white-space:nowrap;">Filter Bulan:</label>
                <select id="summary-month-filter" onchange="updateHomeSummaryByMonth(this.value)"
                    style="padding:8px 14px;border:2px solid var(--border);border-radius:8px;
                           font-size:.9375rem;font-weight:600;background:var(--white);
                           cursor:pointer;min-width:150px;">
                    <option value="">Semua Bulan</option>
                    ${monthsArray.map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
            </div>` + summaryContainer.innerHTML;
            }
            renderHomeSummary(nd, '');
        })
        .catch(err => {
            const el = document.getElementById('summary-loading');
            if (el) el.innerHTML = `<div style="text-align:center;padding:40px;color:${C.error};">
            <p>Gagal memuat data ringkasan: ${err.message}</p>
            <button onclick="loadHomeSummary()" class="btn-retry" style="margin-top:16px;">Coba Lagi</button>
        </div>`;
        });
}

function updateHomeSummaryByMonth(month) {
    if (!homeSummaryAllData) return;
    renderHomeSummary(homeSummaryAllData, month);
}

function renderHomeSummary(allData, filterMonth) {
    const filterMonthUpper = filterMonth
        ? URUTAN_BULAN_UPPER[URUTAN_BULAN.indexOf(filterMonth)] || filterMonth.toUpperCase()
        : '';

    const MAX_TOTAL = 100;

    // FIX: gunakan UNITS_LIST (urutan seragam dengan backend)
    const rankings = UNITS_LIST.map(unit => {
        const roomAvg = calculateUnitAverageByMonth(allData.room.scores || [], unit, filterMonth);
        const kunciAvg = calculateUnitAverageByMonth(allData.kunci.scores || [], unit, filterMonth);
        const kebersihanAvg = calculateUnitAverageByMonth(allData.kebersihan.scores || [], unit, filterMonth);
        const bbmAvg = calculateUnitAverageByMonth(allData.bbm.scores || [], unit, filterMonth);
        const docsAvg = calculateDocUnitAverage(Array.isArray(allData.docs) ? allData.docs : [], unit, filterMonth);
        const spjAvg = calculateSPJUnitAverage(allData.spj || [], unit, filterMonth);
        const monevVal = calculateMonevUnitAverage(allData.monev || {}, unit, filterMonthUpper);

        const totalScore = roomAvg + kunciAvg + kebersihanAvg + bbmAvg + docsAvg + spjAvg + monevVal;
        return { unit, totalScore, roomAvg, kunciAvg, kebersihanAvg, bbmAvg, docsAvg, spjAvg, monevVal };
    }).sort((a, b) => b.totalScore - a.totalScore);

    const tbody = document.getElementById('summary-table-body');
    if (tbody) {
        tbody.innerHTML = rankings.map((rank, i) => {
            const pct = rank.totalScore / MAX_TOTAL;
            const kategori = pct >= 0.9 ? 'excellent' : pct >= 0.75 ? 'good' : pct >= 0.5 ? 'fair' : 'poor';
            return `<tr>
                <td style="text-align:center;">${rankBadge(i)}</td>
                <td><strong>${rank.unit}</strong></td>
                <td style="text-align:center;">${rank.roomAvg.toFixed(1)}</td>
                <td style="text-align:center;">${rank.kunciAvg.toFixed(1)}</td>
                <td style="text-align:center;">${rank.kebersihanAvg.toFixed(1)}</td>
                <td style="text-align:center;">${rank.bbmAvg.toFixed(1)}</td>
                <td style="text-align:center;">${rank.docsAvg.toFixed(1)}</td>
                <td style="text-align:center;">${rank.spjAvg.toFixed(1)}</td>
                <td style="text-align:center;">${rank.monevVal.toFixed(1)}</td>
                <td class="nilai-${kategori}" style="text-align:center;"><strong>${rank.totalScore.toFixed(1)}</strong></td>
            </tr>`;
        }).join('');
    }

    const loadingEl = document.getElementById('summary-loading');
    const containerEl = document.getElementById('summary-container');
    if (loadingEl) loadingEl.style.display = 'none';
    if (containerEl) containerEl.style.display = 'block';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(loadHomeSummary, 500));
} else {
    setTimeout(loadHomeSummary, 500);
}

console.log('✅ transparansi-all.js (fixed: UNITS_LIST unified) loaded');