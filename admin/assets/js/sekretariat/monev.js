// ============================================================
// monev.js — Penilaian Monitoring & Evaluasi section (SPA)
// Admin Panel — Dinas Koperasi UKM
// UI: Setema dengan kearsipan.js
// ============================================================
(function () {
    'use strict';

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuQaHsIxxtmnTr4cPuyUQzdvdr23_3wK59JIF8VYA1ihhBm4ZeD3A0qzpginmmA9d-ng/exec';

    // ─── REVISI #3: Sekretariat dipecah jadi 3 sub-unit ──────
    // UNITS adalah daftar unit utama untuk tampilan tabel input
    const UNITS = [
        "Balai Layanan Usaha Terpadu KUMKM", "Bidang Kewirausahaan", "Bidang Koperasi",
        "Bidang UKM", "Bidang Usaha Mikro",
        // Sekretariat dipecah:
        "Sekretariat - Subbag Umum",
        "Sekretariat - Subbag Keuangan",
        "Sekretariat - Program"
    ];

    // Label pendek untuk chart rekap (SHORT_UNITS harus sesuai urutan UNITS)
    const SHORT_UNITS = ['BLUT', 'Kewirausahaan', 'Koperasi', 'UKM', 'Usaha Mikro', 'Sekre-Umum', 'Sekre-Keu', 'Sekre-Prog'];

    // Grup Sekretariat — dipakai untuk menampilkan sub-total gabungan di rekap
    const SEKRE_UNITS = [
        "Sekretariat - Subbag Umum",
        "Sekretariat - Subbag Keuangan",
        "Sekretariat - Program"
    ];

    const MONTHS = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const CACHE_KEY = 'monev_data_v4'; // versi baru agar cache lama tidak tabrakan

    let selectedBuktiFile = null;
    let selectedBuktiBase64 = null;
    let existingLinkBukti = '';
    let existingBuktiDeleted = false;
    let chartIndikator = null;
    let chartTotal = null;
    let currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // ── SVG Icons ──────────────────────────────────────────────
    const ICONS = {
        refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
        plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        eye: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
        link: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
        check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
        x: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        chart: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
        inbox: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
    };

    // ─── CACHE ───────────────────────────────────────────────
    function getLocalData() { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
    function setLocalData(d) { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); }

    // ─── STATUS BAR ──────────────────────────────────────────
    function setStatusBar(type, text) {
        const bar = document.getElementById('mnv-last-updated-bar');
        if (!bar) return;
        bar.className = 'last-updated-bar ' + type + (type ? ' visible' : '');
        bar.textContent = text;
    }

    // ─── INLINE TABLE LOADING ────────────────────────────────
    function showTableLoading() {
        const tbody = document.getElementById('mnv-input-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;"><div class="spinner"></div><div style="margin-top:12px;">Memuat data dari server...</div></td></tr>`;
    }

    // ─── SCORE CALC ──────────────────────────────────────────
    // REVISI #2: Tambah opsi efisiensi fisik (skor tetap 10)
    function calcScores(state) {
        let waktu = state.waktuOk ? 5 : Math.max(0, 5 - parseInt(state.selKeterlambatan || 3));
        let kelengkapan = state.kelengkapanOk ? 5 : Math.max(0, 5 - parseInt(state.selKualitas || 2));

        let fisik;
        if (state.fisikOk) {
            fisik = 10;
        } else if (state.selDeviasiFisik === 'efisiensi') {
            // Deviasi karena efisiensi tetap dapat skor penuh
            fisik = 10;
        } else {
            fisik = Math.max(0, 10 - parseInt(state.selDeviasiFisik || 5));
        }

        let keuangan = state.keuanganOk ? 10 : Math.max(0, 10 - parseInt(state.selDeviasiKeuangan || 5));
        let partisipasi = state.partisipasiOk ? 5 : (state.selPartisipasi === 'tidak-hadir' ? 0 : 3);
        let tindakLanjut = state.tindakLanjutOk ? 5 : 0;
        return { waktu, kelengkapan, fisik, keuangan, partisipasi, tindakLanjut, total: waktu + kelengkapan + fisik + keuangan + partisipasi + tindakLanjut };
    }

    // ─── JSONP GET ────────────────────────────────────────────
    function callAPIGet(params) {
        return new Promise((resolve, reject) => {
            const cbName = 'jsonp_mnv_' + Date.now();
            const timeout = setTimeout(() => { cleanup(); reject(new Error('Timeout 30 detik')); }, 30000);
            function cleanup() { clearTimeout(timeout); delete window[cbName]; const el = document.getElementById('script_' + cbName); if (el) el.remove(); }
            window[cbName] = function (data) { cleanup(); resolve(data); };
            const qs = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
            const script = document.createElement('script');
            script.id = 'script_' + cbName;
            script.src = APPS_SCRIPT_URL + '?' + qs + '&callback=' + cbName;
            script.onerror = () => { cleanup(); reject(new Error('Gagal koneksi ke server')); };
            document.head.appendChild(script);
        });
    }

    function callAPIPost(params) {
        return new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error('timeout')), 60000);
            const body = Object.keys(params)
                .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k] || ''))
                .join('&');
            fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body,
                redirect: 'follow'
            })
                .then(r => {
                    const contentType = r.headers.get('content-type') || '';
                    if (contentType.includes('text/html')) {
                        console.warn('Response adalah HTML, bukan JSON. Cek doPost.');
                    }
                    return r.text();
                })
                .then(text => {
                    clearTimeout(t);
                    console.log('Raw response dari server:', text.slice(0, 300));
                    try { resolve(JSON.parse(text)); }
                    catch (e) { resolve({ status: 'success', linkBukti: '' }); }
                })
                .catch(err => { clearTimeout(t); reject(err); });
        });
    }

    // ─── LOAD DATA DARI SERVER ────────────────────────────────
    window.mnvLoadDataFromServer = async function () {
        showTableLoading();
        try {
            const result = await callAPIGet({ action: 'getAllSheetData' });
            if (result && result.status === 'success') {
                setLocalData(result.data || {});
            } else {
                throw new Error((result && result.message) || 'Respons tidak valid');
            }
        } catch (err) {
            const cached = getLocalData();
            if (Object.keys(cached).length > 0) { /* pakai cache */ }
        } finally {
            const selectBulan = document.getElementById('mnv-select-bulan-input');
            const bulan = selectBulan ? selectBulan.value : '';
            if (bulan) { window.mnvRenderInputTable(bulan); window.mnvUpdateStats(bulan); }
            else {
                const tbody = document.getElementById('mnv-input-tbody');
                if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Pilih bulan untuk melihat data</td></tr>';
            }
            window.mnvRenderRekap();
        }
    };

    // ─── TAB SWITCHING ────────────────────────────────────────
    window.mnvSwitchTab = function (name, e) {
        document.querySelectorAll('#section-monev .tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#section-monev .tab-content').forEach(t => t.classList.remove('active'));
        if (e && e.target) e.target.classList.add('active');
        const tabContent = document.getElementById('mnv-tab-' + name);
        if (tabContent) tabContent.classList.add('active');
        if (name === 'rekap') window.mnvRenderRekap();
    };

    // ─── STATS ────────────────────────────────────────────────
    window.mnvUpdateStats = function (bulan) {
        if (!document.getElementById('mnv-avg-score-this-month')) return;
        const data = getLocalData();
        if (!bulan || !data[bulan]) {
            document.getElementById('mnv-avg-score-this-month').textContent = '—';
            document.getElementById('mnv-units-assessed').textContent = '0';
            document.getElementById('mnv-units-pending').textContent = UNITS.length;
            return;
        }
        const vals = Object.values(data[bulan]).map(u => u.total);
        document.getElementById('mnv-avg-score-this-month').textContent = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
        document.getElementById('mnv-units-assessed').textContent = vals.length;
        document.getElementById('mnv-units-pending').textContent = Math.max(0, UNITS.length - vals.length);
    };

    // ─── RENDER TABLE ─────────────────────────────────────────
    window.mnvRenderInputTable = function (bulan) {
        const tbody = document.getElementById('mnv-input-tbody');
        if (!tbody) return;
        if (!bulan) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Pilih bulan untuk melihat data</td></tr>';
            return;
        }
        const monthData = (getLocalData()[bulan]) || {};

        // Kelompokkan: unit non-sekre + row grup sekretariat
        let rows = '';

        // Unit non-sekretariat
        const nonSekre = UNITS.filter(u => !SEKRE_UNITS.includes(u));
        nonSekre.forEach(unit => {
            rows += renderUnitRow(unit, bulan, monthData);
        });

        // Grup Sekretariat — header baris grup
        rows += `<tr style="background:#f0f4fa;">
            <td colspan="8" style="padding:8px 14px;font-size:12px;font-weight:700;color:#1e40af;letter-spacing:.04em;text-transform:uppercase;">
                📂 Sekretariat (3 Sub-Bagian)
            </td>
        </tr>`;
        SEKRE_UNITS.forEach(unit => {
            rows += renderUnitRow(unit, bulan, monthData);
        });

        // Sub-total Sekretariat
        const sekreVals = SEKRE_UNITS.map(u => monthData[u]);
        const sekreDinilai = sekreVals.filter(Boolean);
        if (sekreDinilai.length > 0) {
            const avgTotal = (sekreDinilai.reduce((a, u) => a + (u.total || 0), 0) / sekreDinilai.length).toFixed(1);
            rows += `<tr style="background:#dbeafe;border-top:2px solid #93c5fd;">
                <td colspan="2" style="padding:8px 14px;font-size:12px;font-weight:700;color:#1e3a8a;">
                    Rata-rata Sekretariat (${sekreDinilai.length}/${SEKRE_UNITS.length} dinilai)
                </td>
                <td style="font-size:18px;font-weight:800;color:#1e3a8a;">${avgTotal}</td>
                <td colspan="5"></td>
            </tr>`;
        }

        tbody.innerHTML = rows;
    };

    function renderUnitRow(unit, bulan, monthData) {
        const u = monthData[unit];
        const isSekre = SEKRE_UNITS.includes(unit);
        const labelStyle = isSekre ? 'padding-left:24px;' : '';
        const label = isSekre ? unit.replace('Sekretariat - ', '') : unit;

        if (!u) return `
        <tr>
            <td style="${labelStyle}">
                <div style="font-weight:600;">${label}</div>
                ${isSekre ? '' : `<div style="font-size:12px;color:#64748b;margin-top:2px;">${bulan}</div>`}
            </td>
            <td colspan="2" style="color:#94a3b8;font-style:italic;font-size:13px;">Belum dinilai</td>
            <td><span class="mnv-badge-pending">Pending</span></td>
            <td colspan="2" style="color:#94a3b8;">—</td>
            <td>
                <div class="action-buttons"><div class="btn-icon-group">
                    <button onclick="mnvOpenInputModal('${esc(unit)}','${bulan}')" class="btn-icon btn-icon-approve" title="Isi Nilai">${ICONS.plus}</button>
                </div></div>
            </td>
        </tr>`;

        const badgeCls = u.total >= 35 ? 'mnv-badge-good' : u.total >= 25 ? 'mnv-badge-mid' : 'mnv-badge-bad';
        const scoreColor = u.total >= 35 ? '#10b981' : u.total >= 25 ? '#f59e0b' : '#ef4444';
        const buktiCell = u.linkBukti
            ? `<a href="${u.linkBukti}" target="_blank" class="mnv-link-btn">${ICONS.link} Lihat</a>`
            : `<span style="color:#94a3b8;font-size:13px;">—</span>`;
        return `
        <tr>
            <td style="${labelStyle}">
                <div style="font-weight:600;">${label}</div>
                ${isSekre ? '' : `<div style="font-size:12px;color:#64748b;margin-top:2px;">${bulan}</div>`}
            </td>
            <td style="font-size:13px;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;min-width:180px;">
                    <span style="font-size:11px;color:#64748b;">Waktu: <b>${u.waktu}</b></span>
                    <span style="font-size:11px;color:#64748b;">Klgkpn: <b>${u.kelengkapan}</b></span>
                    <span style="font-size:11px;color:#64748b;">Fisik: <b>${u.fisik}</b></span>
                    <span style="font-size:11px;color:#64748b;">Keuangan: <b>${u.keuangan}</b></span>
                    <span style="font-size:11px;color:#64748b;">Partisipasi: <b>${u.partisipasi}</b></span>
                    <span style="font-size:11px;color:#64748b;">Tindak Lanjut: <b>${u.tindakLanjut}</b></span>
                </div>
            </td>
            <td><strong style="font-size:20px;color:${scoreColor};">${u.total}</strong><span style="font-size:11px;color:#94a3b8;">/40</span></td>
            <td><span class="${badgeCls}">${u.total >= 35 ? 'Baik' : u.total >= 25 ? 'Cukup' : 'Kurang'}</span></td>
            <td>${buktiCell}</td>
            <td style="font-size:12px;color:#64748b;">${u.catatan ? (u.catatan.length > 40 ? u.catatan.slice(0, 40) + '…' : u.catatan) : '—'}</td>
            <td>
                <div class="action-buttons"><div class="btn-icon-group">
                    <button onclick="mnvOpenViewModal('${esc(unit)}','${bulan}')" class="btn-icon btn-icon-view" title="Lihat Detail">${ICONS.eye}</button>
                    <button onclick="mnvOpenInputModal('${esc(unit)}','${bulan}')" class="btn-icon btn-icon-edit" title="Edit Penilaian">${ICONS.edit}</button>
                    <button onclick="mnvDeleteEntry('${esc(unit)}','${bulan}')" class="btn-icon btn-icon-delete" title="Hapus">${ICONS.trash}</button>
                </div></div>
            </td>
        </tr>`;
    }

    function esc(s) { return s.replace(/'/g, "\\'"); }

    // ─── VIEW DETAIL MODAL ────────────────────────────────────
    window.mnvOpenViewModal = function (unit, bulan) {
        const data = getLocalData();
        const u = (data[bulan] || {})[unit];
        if (!u) return;
        document.getElementById('mnv-viewModal')?.remove();

        const total = u.total;
        const scoreColor = total >= 35 ? '#10b981' : total >= 25 ? '#f59e0b' : '#ef4444';
        const scoreBg = total >= 35 ? '#f0fdf4' : total >= 25 ? '#fffbeb' : '#fff1f2';
        const scoreBorder = total >= 35 ? '#86efac' : total >= 25 ? '#fde68a' : '#fecaca';

        const yesNo = (val) => val
            ? `<span style="display:inline-flex;align-items:center;gap:4px;color:#10b981;font-weight:600;font-size:13px;">${ICONS.check} Terpenuhi</span>`
            : `<span style="display:inline-flex;align-items:center;gap:4px;color:#ef4444;font-weight:600;font-size:13px;">${ICONS.x} Tidak</span>`;

        const st = u._state || {};

        // REVISI #2: label fisik menampilkan keterangan efisiensi bila berlaku
        const fisikEfisiensi = !st.fisikOk && st.selDeviasiFisik === 'efisiensi';

        const buktiSection = u.linkBukti ? `
            <div class="mnv-detail-section">
                <div class="mnv-detail-section-title"><span style="color:#3b82f6;">${ICONS.link}</span> File Bukti</div>
                <a href="${u.linkBukti}" target="_blank" rel="noopener noreferrer" class="krs-file-item">
                    <div class="krs-file-icon">${ICONS.link}</div>
                    <div class="krs-file-info">
                        <div class="krs-file-label">Bukti Penilaian Monev</div>
                        <div class="krs-file-url">${u.linkBukti.length > 55 ? u.linkBukti.slice(0, 55) + '…' : u.linkBukti}</div>
                    </div>
                    <div class="krs-file-arrow">›</div>
                </a>
            </div>` : '';

        const displayUnit = SEKRE_UNITS.includes(unit) ? unit.replace('Sekretariat - ', 'Sekretariat / ') : unit;

        const modal = document.createElement('div');
        modal.id = 'mnv-viewModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
        <div class="modal" style="max-width:600px;">
            <div class="modal-header">
                <h2 class="modal-title">Detail Penilaian Monev</h2>
            </div>
            <div class="modal-content" style="display:flex;flex-direction:column;gap:14px;">
                <div class="mnv-detail-section" style="flex-direction:row;align-items:flex-start;gap:14px;flex-wrap:wrap;">
                    <div style="flex:1;min-width:160px;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                            <div class="krs-detail-field-icon" style="background:#eff6ff;color:#3b82f6;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
                            </div>
                            <div>
                                <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.04em;">Unit / Bidang</div>
                                <div style="font-size:14px;font-weight:700;color:#1e293b;">${displayUnit}</div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <div style="width:30px;height:30px;border-radius:8px;background:#fefce8;color:#ca8a04;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            </div>
                            <div>
                                <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.04em;">Periode</div>
                                <div style="font-size:13px;font-weight:600;color:#1e293b;">${bulan}</div>
                            </div>
                        </div>
                    </div>
                    <div style="text-align:center;padding:16px 24px;background:${scoreBg};border:2px solid ${scoreBorder};border-radius:12px;min-width:110px;">
                        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${scoreColor};margin-bottom:4px;">Total Skor</div>
                        <div style="font-size:48px;font-weight:800;color:${scoreColor};line-height:1;">${total}</div>
                        <div style="font-size:12px;color:#64748b;margin-top:4px;">dari 40</div>
                    </div>
                </div>

                <div class="mnv-detail-section">
                    <div class="mnv-detail-section-title"><span style="color:#3b82f6;">📊</span> Rincian Penilaian</div>
                    <div class="krs-score-row">
                        <div class="krs-score-row-label"><span class="krs-score-badge" style="background:#eff6ff;color:#3b82f6;">1</span>Ket. Waktu</div>
                        <div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>Tepat waktu</span>${yesNo(st.waktuOk)}</div></div>
                        <div class="krs-score-chip" style="background:#eff6ff;color:#3b82f6;">${u.waktu}/5</div>
                    </div>
                    <div class="krs-score-row">
                        <div class="krs-score-row-label"><span class="krs-score-badge" style="background:#fdf4ff;color:#8b5cf6;">2</span>Kelengkapan</div>
                        <div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>Data lengkap</span>${yesNo(st.kelengkapanOk)}</div></div>
                        <div class="krs-score-chip" style="background:#fdf4ff;color:#8b5cf6;">${u.kelengkapan}/5</div>
                    </div>
                    <div class="krs-score-row">
                        <div class="krs-score-row-label"><span class="krs-score-badge" style="background:#f0fdf4;color:#10b981;">3</span>Capaian Fisik</div>
                        <div class="krs-score-row-detail">
                            <div class="krs-score-sub-row">
                                <span>Sesuai target${fisikEfisiensi ? ' <span style="font-size:10px;background:#dcfce7;color:#15803d;padding:1px 6px;border-radius:8px;font-weight:600;">Efisiensi ✓</span>' : ''}</span>
                                ${fisikEfisiensi ? `<span style="display:inline-flex;align-items:center;gap:4px;color:#10b981;font-weight:600;font-size:13px;">${ICONS.check} Efisiensi</span>` : yesNo(st.fisikOk)}
                            </div>
                        </div>
                        <div class="krs-score-chip" style="background:#f0fdf4;color:#10b981;">${u.fisik}/10</div>
                    </div>
                    <div class="krs-score-row">
                        <div class="krs-score-row-label"><span class="krs-score-badge" style="background:#fffbeb;color:#f59e0b;">4</span>Keuangan</div>
                        <div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>Sesuai anggaran</span>${yesNo(st.keuanganOk)}</div></div>
                        <div class="krs-score-chip" style="background:#fffbeb;color:#f59e0b;">${u.keuangan}/10</div>
                    </div>
                    <div class="krs-score-row">
                        <div class="krs-score-row-label"><span class="krs-score-badge" style="background:#fdf2f8;color:#ec4899;">5</span>Partisipasi</div>
                        <div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>PPTK hadir langsung</span>${yesNo(st.partisipasiOk)}</div></div>
                        <div class="krs-score-chip" style="background:#fdf2f8;color:#ec4899;">${u.partisipasi}/5</div>
                    </div>
                    <div class="krs-score-row">
                        <div class="krs-score-row-label"><span class="krs-score-badge" style="background:#ecfeff;color:#06b6d4;">6</span>Tindak Lanjut</div>
                        <div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>Sudah dilaksanakan</span>${yesNo(st.tindakLanjutOk)}</div></div>
                        <div class="krs-score-chip" style="background:#ecfeff;color:#06b6d4;">${u.tindakLanjut}/5</div>
                    </div>
                </div>

                ${u.catatan ? `
                <div class="mnv-detail-section">
                    <div class="mnv-detail-section-title"><span style="color:#3b82f6;">📝</span> Catatan</div>
                    <div style="font-size:13.5px;color:#374151;line-height:1.6;white-space:pre-line;">${u.catatan}</div>
                </div>` : ''}

                ${buktiSection}
            </div>
            <div class="modal-footer">
                <button onclick="document.getElementById('mnv-viewModal').remove()" class="btn" style="flex:1;">Tutup</button>
                <button onclick="document.getElementById('mnv-viewModal').remove();mnvOpenInputModal('${esc(unit)}','${bulan}')" class="btn btn-primary" style="flex:1;">✏️ Edit Penilaian</button>
            </div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
    };

    // ─── TOGGLE CHECK ─────────────────────────────────────────
    window.mnvToggleCheck = function (key, e) {
        if (e) e.stopPropagation();
        const cb = document.getElementById('mnv-check-' + key);
        if (cb) cb.checked = !cb.checked;
        window.mnvSyncCheckItem(key);
        window.mnvUpdateModalScore();
    };

    window.mnvSyncCheckItem = function (key) {
        const cb = document.getElementById('mnv-check-' + key);
        const item = document.getElementById('mnv-check-' + key + '-item');
        const sub = document.getElementById('mnv-sub-' + key);
        const badge = document.getElementById('mnv-badge-' + key);
        if (!cb || !item || !sub || !badge) return;
        const maxPoints = { waktu: 5, kelengkapan: 5, fisik: 10, keuangan: 10, partisipasi: 5, tindaklanjut: 5 };
        const mp = maxPoints[key];
        if (cb.checked) {
            item.classList.add('mnv-check-checked'); item.classList.remove('mnv-check-unchecked');
            badge.textContent = `+${mp} poin`; sub.classList.remove('show');
        } else {
            item.classList.remove('mnv-check-checked'); item.classList.add('mnv-check-unchecked');
            sub.classList.add('show'); window.mnvUpdateBadge(key);
        }
    };

    window.mnvUpdateBadge = function (key) {
        const badge = document.getElementById('mnv-badge-' + key);
        if (!badge) return;
        const scores = calcScores(mnvGetModalState());
        const map = { waktu: 'waktu', kelengkapan: 'kelengkapan', fisik: 'fisik', keuangan: 'keuangan', partisipasi: 'partisipasi', tindaklanjut: 'tindakLanjut' };
        const maxPoints = { waktu: 5, kelengkapan: 5, fisik: 10, keuangan: 10, partisipasi: 5, tindaklanjut: 5 };
        const val = scores[map[key]];
        badge.textContent = val === maxPoints[key] ? `+${val} poin` : `${val} poin ⬇`;
    };

    function mnvGetModalState() {
        return {
            waktuOk: document.getElementById('mnv-check-waktu')?.checked,
            kelengkapanOk: document.getElementById('mnv-check-kelengkapan')?.checked,
            fisikOk: document.getElementById('mnv-check-fisik')?.checked,
            keuanganOk: document.getElementById('mnv-check-keuangan')?.checked,
            partisipasiOk: document.getElementById('mnv-check-partisipasi')?.checked,
            tindakLanjutOk: document.getElementById('mnv-check-tindaklanjut')?.checked,
            selKeterlambatan: document.getElementById('mnv-sel-keterlambatan')?.value,
            selKualitas: document.getElementById('mnv-sel-kualitas')?.value,
            selDeviasiFisik: document.getElementById('mnv-sel-deviasi-fisik')?.value,
            selDeviasiKeuangan: document.getElementById('mnv-sel-deviasi-keuangan')?.value,
            selPartisipasi: document.getElementById('mnv-sel-partisipasi')?.value,
        };
    }

    window.mnvUpdateModalScore = function () {
        const s = calcScores(mnvGetModalState());
        const map = [
            ['mnv-score-waktu', s.waktu], ['mnv-score-kelengkapan', s.kelengkapan],
            ['mnv-score-fisik', s.fisik], ['mnv-score-keuangan', s.keuangan],
            ['mnv-score-partisipasi', s.partisipasi], ['mnv-score-tindak-lanjut', s.tindakLanjut],
            ['mnv-modal-total-nilai', s.total]
        ];
        map.forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.textContent = val; });
        ['waktu', 'kelengkapan', 'fisik', 'keuangan', 'partisipasi', 'tindaklanjut'].forEach(k => {
            if (!document.getElementById('mnv-check-' + k)?.checked) window.mnvUpdateBadge(k);
        });
    };

    // ─── OPEN INPUT/EDIT MODAL ────────────────────────────────
    window.mnvOpenInputModal = function (unit, bulan) {
        if (!bulan) {
            bulan = document.getElementById('mnv-select-bulan-input').value;
            if (!bulan) { if (window.showToast) showToast('Pilih bulan terlebih dahulu', 'error'); return; }
        }
        const data = getLocalData();
        const existing = (data[bulan] || {})[unit];
        const isEdit = !!existing;

        const state = (isEdit && existing._state) ? existing._state : {
            waktuOk: true, kelengkapanOk: true, fisikOk: true, keuanganOk: true,
            partisipasiOk: true, tindakLanjutOk: true,
            selKeterlambatan: '3', selKualitas: '2', selDeviasiFisik: '5',
            selDeviasiKeuangan: '5', selPartisipasi: 'diwakili'
        };

        document.getElementById('mnv-assessModal')?.remove();
        selectedBuktiFile = null; selectedBuktiBase64 = null; existingBuktiDeleted = false;
        existingLinkBukti = isEdit && existing?.linkBukti ? existing.linkBukti : '';

        const displayLabel = SEKRE_UNITS.includes(unit) ? unit.replace('Sekretariat - ', 'Sekretariat / ') : unit;

        const modal = document.createElement('div');
        modal.id = 'mnv-assessModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
        <div class="modal" style="max-width:620px;">
            <div class="modal-header">
                <h2 class="modal-title">${isEdit ? '✏️ Edit' : '✚ Input'} Penilaian Monev</h2>
                <p style="font-size:13px;color:#64748b;margin-top:2px;">Bulan: ${bulan}</p>
            </div>
            <div class="modal-content">
                <div class="info-box" style="margin-bottom:16px;">
                    <p style="font-weight:600;margin:0 0 4px;">${displayLabel}</p>
                    <p style="font-size:13px;color:#64748b;margin:0;">Penilaian Monitoring &amp; Evaluasi · ${bulan}</p>
                    ${isEdit ? '<span style="display:inline-block;margin-top:6px;background:#dbeafe;color:#1e40af;font-size:11px;font-weight:600;padding:3px 10px;border-radius:10px;">✏️ Mode Edit</span>' : ''}
                </div>
                <div class="alert alert-info" style="margin-bottom:16px;">
                    📊 <strong>Sistem Penilaian:</strong> Centang jika terpenuhi. Jika tidak, pilih kategori pengurangan.
                    Total maksimum <strong>40 poin</strong>.
                </div>

                <input type="hidden" id="mnv-input-unit" value="${unit}">

                <!-- 1. Ketepatan Waktu -->
                <div class="mnv-score-section">
                    <div class="score-section-title">1️⃣ Ketepatan Waktu <span style="font-weight:400;color:#64748b;font-size:13px;">(Maks 5 poin)</span></div>
                    <div class="mnv-check-item mnv-check-checked" id="mnv-check-waktu-item" onclick="mnvToggleCheck('waktu',event)">
                        <input type="checkbox" id="mnv-check-waktu" ${state.waktuOk ? 'checked' : ''} onclick="mnvToggleCheck('waktu',event)" style="pointer-events:none;">
                        <div class="mnv-check-body"><div class="mnv-check-label">Penyampaian data tepat waktu</div><div class="mnv-check-sub">Tidak melebihi batas waktu pelaporan</div></div>
                        <span class="mnv-check-badge" id="mnv-badge-waktu">+5 poin</span>
                    </div>
                    <div class="mnv-sub-group ${state.waktuOk ? '' : 'show'}" id="mnv-sub-waktu">
                        <label class="input-label">⏰ Kategori keterlambatan</label>
                        <select class="form-input" id="mnv-sel-keterlambatan" onchange="mnvUpdateModalScore()">
                            <option value="3" ${(state.selKeterlambatan || '3') === '3' ? 'selected' : ''}>Terlambat &lt; 5 hari (−3 poin → skor 2)</option>
                            <option value="5" ${(state.selKeterlambatan) === '5' ? 'selected' : ''}>Terlambat ≥ 5 hari (−5 poin → skor 0)</option>
                        </select>
                    </div>
                </div>

                <!-- 2. Kelengkapan Data -->
                <div class="mnv-score-section" style="border-left-color:#8b5cf6;">
                    <div class="score-section-title">2️⃣ Kelengkapan Data <span style="font-weight:400;color:#64748b;font-size:13px;">(Maks 5 poin)</span></div>
                    <div class="mnv-check-item mnv-check-checked" id="mnv-check-kelengkapan-item" onclick="mnvToggleCheck('kelengkapan',event)">
                        <input type="checkbox" id="mnv-check-kelengkapan" ${state.kelengkapanOk ? 'checked' : ''} onclick="mnvToggleCheck('kelengkapan',event)" style="pointer-events:none;">
                        <div class="mnv-check-body"><div class="mnv-check-label">Seluruh komponen data monev lengkap</div><div class="mnv-check-sub">Keterlisian &gt; 90%</div></div>
                        <span class="mnv-check-badge" id="mnv-badge-kelengkapan">+5 poin</span>
                    </div>
                    <div class="mnv-sub-group ${state.kelengkapanOk ? '' : 'show'}" id="mnv-sub-kelengkapan">
                        <label class="input-label">📋 Kategori kekurangan</label>
                        <select class="form-input" id="mnv-sel-kualitas" onchange="mnvUpdateModalScore()">
                            <option value="2" ${(state.selKualitas || '2') === '2' ? 'selected' : ''}>Keterlisian 50%–90% (−2 poin → skor 3)</option>
                            <option value="3" ${(state.selKualitas) === '3' ? 'selected' : ''}>Keterlisian &lt; 50% (−3 poin → skor 2)</option>
                        </select>
                    </div>
                </div>

                <!-- 3. Capaian Fisik — REVISI #2: tambah opsi efisiensi -->
                <div class="mnv-score-section" style="border-left-color:#10b981;">
                    <div class="score-section-title">3️⃣ Capaian Fisik <span style="font-weight:400;color:#64748b;font-size:13px;">(Maks 10 poin)</span></div>
                    <div class="mnv-check-item mnv-check-checked" id="mnv-check-fisik-item" onclick="mnvToggleCheck('fisik',event)">
                        <input type="checkbox" id="mnv-check-fisik" ${state.fisikOk ? 'checked' : ''} onclick="mnvToggleCheck('fisik',event)" style="pointer-events:none;">
                        <div class="mnv-check-body"><div class="mnv-check-label">Capaian fisik sesuai target</div><div class="mnv-check-sub">Deviasi &lt; 5% dari target</div></div>
                        <span class="mnv-check-badge" id="mnv-badge-fisik">+10 poin</span>
                    </div>
                    <div class="mnv-sub-group ${state.fisikOk ? '' : 'show'}" id="mnv-sub-fisik">
                        <label class="input-label">📊 Kategori deviasi fisik</label>
                        <select class="form-input" id="mnv-sel-deviasi-fisik" onchange="mnvUpdateModalScore()">
                            <option value="efisiensi" ${(state.selDeviasiFisik) === 'efisiensi' ? 'selected' : ''}>
                                Deviasi karena Efisiensi (skor tetap 10 ✓)
                            </option>
                            <option value="5" ${(!state.selDeviasiFisik || state.selDeviasiFisik === '5') ? 'selected' : ''}>Deviasi ≥ 5% – &lt; 10% (−5 poin → skor 5)</option>
                            <option value="8" ${(state.selDeviasiFisik) === '8' ? 'selected' : ''}>Deviasi ≥ 10% (−8 poin → skor 2)</option>
                        </select>
                    </div>
                </div>

                <!-- 4. Capaian Keuangan -->
                <div class="mnv-score-section" style="border-left-color:#f59e0b;">
                    <div class="score-section-title">4️⃣ Capaian Keuangan <span style="font-weight:400;color:#64748b;font-size:13px;">(Maks 10 poin)</span></div>
                    <div class="mnv-check-item mnv-check-checked" id="mnv-check-keuangan-item" onclick="mnvToggleCheck('keuangan',event)">
                        <input type="checkbox" id="mnv-check-keuangan" ${state.keuanganOk ? 'checked' : ''} onclick="mnvToggleCheck('keuangan',event)" style="pointer-events:none;">
                        <div class="mnv-check-body"><div class="mnv-check-label">Capaian keuangan sesuai anggaran</div><div class="mnv-check-sub">Deviasi &lt; 5% dari anggaran</div></div>
                        <span class="mnv-check-badge" id="mnv-badge-keuangan">+10 poin</span>
                    </div>
                    <div class="mnv-sub-group ${state.keuanganOk ? '' : 'show'}" id="mnv-sub-keuangan">
                        <label class="input-label">💰 Kategori deviasi keuangan</label>
                        <select class="form-input" id="mnv-sel-deviasi-keuangan" onchange="mnvUpdateModalScore()">
                            <option value="5" ${(state.selDeviasiKeuangan || '5') === '5' ? 'selected' : ''}>Deviasi ≥ 5% – &lt; 10% (−5 poin → skor 5)</option>
                            <option value="8" ${(state.selDeviasiKeuangan) === '8' ? 'selected' : ''}>Deviasi ≥ 10% (−8 poin → skor 2)</option>
                        </select>
                    </div>
                </div>

                <!-- 5. Partisipasi PPTK -->
                <div class="mnv-score-section" style="border-left-color:#ec4899;">
                    <div class="score-section-title">5️⃣ Partisipasi PPTK <span style="font-weight:400;color:#64748b;font-size:13px;">(Maks 5 poin)</span></div>
                    <div class="mnv-check-item mnv-check-checked" id="mnv-check-partisipasi-item" onclick="mnvToggleCheck('partisipasi',event)">
                        <input type="checkbox" id="mnv-check-partisipasi" ${state.partisipasiOk ? 'checked' : ''} onclick="mnvToggleCheck('partisipasi',event)" style="pointer-events:none;">
                        <div class="mnv-check-body"><div class="mnv-check-label">PPTK hadir langsung dalam Desk Timbal Balik</div><div class="mnv-check-sub">Tidak diwakilkan</div></div>
                        <span class="mnv-check-badge" id="mnv-badge-partisipasi">+5 poin</span>
                    </div>
                    <div class="mnv-sub-group ${state.partisipasiOk ? '' : 'show'}" id="mnv-sub-partisipasi">
                        <label class="input-label">👤 Kategori ketidakhadiran</label>
                        <select class="form-input" id="mnv-sel-partisipasi" onchange="mnvUpdateModalScore()">
                            <option value="diwakili" ${(state.selPartisipasi || 'diwakili') === 'diwakili' ? 'selected' : ''}>Diwakili Staf (−2 poin → skor 3)</option>
                            <option value="tidak-hadir" ${(state.selPartisipasi) === 'tidak-hadir' ? 'selected' : ''}>Tidak Hadir sama sekali (−5 poin → skor 0)</option>
                        </select>
                    </div>
                </div>

                <!-- 6. Tindak Lanjut -->
                <div class="mnv-score-section" style="border-left-color:#06b6d4;">
                    <div class="score-section-title">6️⃣ Tindak Lanjut <span style="font-weight:400;color:#64748b;font-size:13px;">(Maks 5 poin)</span></div>
                    <div class="mnv-check-item mnv-check-checked" id="mnv-check-tindaklanjut-item" onclick="mnvToggleCheck('tindaklanjut',event)">
                        <input type="checkbox" id="mnv-check-tindaklanjut" ${state.tindakLanjutOk ? 'checked' : ''} onclick="mnvToggleCheck('tindaklanjut',event)" style="pointer-events:none;">
                        <div class="mnv-check-body"><div class="mnv-check-label">Tindak lanjut pasca Desk Timbal Balik sudah dilaksanakan</div><div class="mnv-check-sub">Rekomendasi diimplementasikan</div></div>
                        <span class="mnv-check-badge" id="mnv-badge-tindaklanjut">+5 poin</span>
                    </div>
                    <div class="mnv-sub-group ${state.tindakLanjutOk ? '' : 'show'}" id="mnv-sub-tindaklanjut">
                        <p style="font-size:13px;color:#92400e;margin:0;padding:10px;background:#fef3c7;border-radius:6px;">⚠️ Tindak lanjut tidak dilaksanakan: <strong>0 poin</strong></p>
                    </div>
                </div>

                <!-- Score preview -->
                <div class="score-preview">
                    <div class="score-preview-title">TOTAL NILAI</div>
                    <div class="score-preview-value" id="mnv-modal-total-nilai">40</div>
                    <div style="font-size:12px;color:#94a3b8;text-align:center;margin-top:4px;">dari maksimal 40 poin</div>
                    <div class="score-breakdown" style="grid-template-columns:repeat(6,1fr);margin-top:16px;">
                        <div class="score-item"><div class="score-item-label">Waktu</div><div class="score-item-value" id="mnv-score-waktu">5</div></div>
                        <div class="score-item"><div class="score-item-label">Klgkpn</div><div class="score-item-value" id="mnv-score-kelengkapan">5</div></div>
                        <div class="score-item"><div class="score-item-label">Fisik</div><div class="score-item-value" id="mnv-score-fisik">10</div></div>
                        <div class="score-item"><div class="score-item-label">Keuangan</div><div class="score-item-value" id="mnv-score-keuangan">10</div></div>
                        <div class="score-item"><div class="score-item-label">Partisipasi</div><div class="score-item-value" id="mnv-score-partisipasi">5</div></div>
                        <div class="score-item"><div class="score-item-label">Tindak Lanjut</div><div class="score-item-value" id="mnv-score-tindak-lanjut">5</div></div>
                    </div>
                </div>

                <!-- Catatan -->
                <div class="form-group">
                    <label class="input-label">📝 Catatan Tambahan (Opsional)</label>
                    <textarea class="form-textarea" id="mnv-input-catatan" rows="3" placeholder="Catatan tambahan mengenai penilaian ini...">${existing ? existing.catatan || '' : ''}</textarea>
                </div>

                <!-- Bukti file -->
                <div style="background:#fafafa;border:1.5px dashed #cbd5e1;border-radius:10px;padding:16px;">
                    <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
                        📎 Bukti Penilaian
                        <span style="background:#fef3c7;color:#92400e;font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;">Opsional</span>
                    </div>
                    <div id="mnv-existing-bukti-panel" style="display:${existingLinkBukti ? 'block' : 'none'};margin-bottom:12px;">
                        <div style="font-size:12px;font-weight:600;color:#1e40af;margin-bottom:6px;">📌 File Bukti Tersimpan:</div>
                        <div style="display:flex;align-items:center;gap:12px;background:white;border:1.5px solid #bfdbfe;border-radius:8px;padding:12px;">
                            <div style="width:36px;height:36px;border-radius:8px;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">📎</div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-size:13px;font-weight:600;color:#1e293b;">File bukti tersimpan</div>
                                <a id="mnv-existing-bukti-link" href="${existingLinkBukti}" target="_blank" rel="noopener" style="font-size:12px;color:#3b82f6;text-decoration:none;">🔗 Lihat file di Google Drive</a>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0;">
                                <button onclick="mnvReplaceExistingBukti()" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:600;color:#0369a1;cursor:pointer;">🔄 Ganti</button>
                                <button onclick="mnvDeleteExistingBukti()" style="background:#fff1f2;border:1px solid #fecdd3;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:600;color:#be123c;cursor:pointer;">🗑️ Hapus</button>
                            </div>
                        </div>
                    </div>
                    <div id="mnv-new-file-upload-zone" style="display:${existingLinkBukti ? 'none' : 'block'};">
                        <div style="position:relative;cursor:pointer;">
                            <input type="file" id="mnv-bukti-file-input" accept=".jpg,.jpeg,.png,.pdf" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;z-index:2;" onchange="mnvHandleBuktiFileSelect(event)">
                            <div style="border:2px dashed #e2e8f0;border-radius:8px;padding:16px;text-align:center;background:white;">
                                <div style="font-size:24px;margin-bottom:4px;">📁</div>
                                <div style="font-size:13px;color:#64748b;"><strong style="color:#3b82f6;">Klik untuk pilih file</strong> atau drag &amp; drop</div>
                                <div style="font-size:11px;color:#94a3b8;margin-top:4px;">JPG · PNG · PDF | Maks. 10 MB</div>
                            </div>
                        </div>
                        <div id="mnv-bukti-file-error" style="display:none;font-size:12px;color:#ef4444;margin-top:6px;padding:6px 10px;background:#fee2e2;border-radius:5px;"></div>
                        <div id="mnv-bukti-file-preview" style="display:none;align-items:center;gap:12px;background:white;border:1.5px solid #e2e8f0;border-radius:8px;padding:12px;margin-top:10px;">
                            <div id="mnv-bukti-preview-icon" style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;background:#dbeafe;">📄</div>
                            <div style="flex:1;min-width:0;">
                                <div id="mnv-bukti-preview-name" style="font-size:13px;font-weight:600;">—</div>
                                <div id="mnv-bukti-preview-size" style="font-size:11px;color:#94a3b8;margin-top:2px;">—</div>
                            </div>
                            <button onclick="mnvCancelNewFile()" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:18px;padding:4px;">✕</button>
                        </div>
                    </div>
                    <div id="mnv-upload-progress" style="display:none;margin-top:10px;">
                        <div style="height:4px;background:#e5e7eb;border-radius:10px;overflow:hidden;">
                            <div id="mnv-upload-progress-fill" style="height:100%;background:linear-gradient(90deg,#3b82f6,#10b981);border-radius:10px;transition:width 0.3s;width:0%;"></div>
                        </div>
                        <div id="mnv-upload-progress-label" style="font-size:11px;color:#64748b;margin-top:4px;text-align:right;">Mengunggah...</div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="document.getElementById('mnv-assessModal').remove()" class="btn" style="flex:1;">Batal</button>
                <button onclick="mnvSubmitInputNilai()" id="mnv-submit-input-btn" class="btn ${isEdit ? 'btn-warning' : 'btn-success'}" style="flex:1;">
                    ${isEdit ? '💾 Update Penilaian' : '💾 Simpan Penilaian'}
                </button>
            </div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);

        ['waktu', 'kelengkapan', 'fisik', 'keuangan', 'partisipasi', 'tindaklanjut'].forEach(k => window.mnvSyncCheckItem(k));
        window.mnvUpdateModalScore();
    };

    window.mnvCloseInputModal = function () {
        document.getElementById('mnv-assessModal')?.remove();
    };

    // ─── HELPER: baca file sebagai base64 ────────────────────
    function mnvReadFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result.split(',')[1]);
            reader.onerror = () => reject(new Error('Gagal membaca file'));
            reader.readAsDataURL(file);
        });
    }

    // ─── SUBMIT ───────────────────────────────────────────────
    // REVISI #1: Perbaiki logika linkBukti agar hapus bukti benar-benar kosong
    window.mnvSubmitInputNilai = async function () {
        const bulan = document.getElementById('mnv-select-bulan-input').value;
        const unit = document.getElementById('mnv-input-unit').value;
        if (!unit || !bulan) {
            if (window.showToast) showToast('Data tidak lengkap', 'error');
            return;
        }

        const state = mnvGetModalState();
        const scores = calcScores(state);
        const catatan = document.getElementById('mnv-input-catatan').value;

        const submitBtn = document.getElementById('mnv-submit-input-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';

        // Tentukan linkBukti yang akan dikirim ke server SEBELUM hit API
        // Ini penting agar server menyimpan string kosong "" bila bukti dihapus
        let linkBuktiToSend = '';
        if (!selectedBuktiFile) {
            // Tidak ada file baru
            if (existingBuktiDeleted) {
                // User sengaja hapus bukti → kirim string kosong
                linkBuktiToSend = '';
            } else {
                // Pertahankan bukti lama
                linkBuktiToSend = existingLinkBukti || '';
            }
        }
        // Jika ada selectedBuktiFile, linkBuktiToSend akan diisi setelah upload berhasil

        const payload = {
            action: 'uploadAndSave',
            bulan, unit,
            waktu: scores.waktu,
            kelengkapan: scores.kelengkapan,
            fisik: scores.fisik,
            keuangan: scores.keuangan,
            partisipasi: scores.partisipasi,
            tindakLanjut: scores.tindakLanjut,
            total: scores.total,
            catatan,
            penilai: currentUser.name || 'Admin',
            fileName: '',
            mimeType: '',
            fileData: '',
            // REVISI #1: Kirim linkBukti eksplisit agar server bisa simpan ke log
            existingLinkBukti: linkBuktiToSend
        };

        // Proses file baru
        if (selectedBuktiFile) {
            try {
                window.mnvSetUploadProgress(20, 'Membaca file...');
                const base64 = await mnvReadFileAsBase64(selectedBuktiFile);
                const ext = selectedBuktiFile.name.split('.').pop().toLowerCase();
                const safeUnit = unit.replace(/[^a-zA-Z0-9]/g, '_');
                payload.fileName = `MONEV_${bulan}_${safeUnit}_${Date.now()}.${ext}`;
                payload.mimeType = selectedBuktiFile.type;
                payload.fileData = base64;
            } catch (readErr) {
                if (window.showToast) showToast('Gagal membaca file: ' + readErr.message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '💾 Simpan Penilaian';
                return;
            }
        }

        window.mnvSetUploadProgress(selectedBuktiFile ? 50 : 30, 'Mengirim ke server...');

        let linkBuktiFinal = linkBuktiToSend; // default: nilai yang sudah ditetapkan di atas
        try {
            const result = await callAPIPost(payload);
            console.log('Response dari server:', result);

            if (result && result.status === 'success') {
                window.mnvSetUploadProgress(100, 'Berhasil!');

                if (selectedBuktiFile) {
                    // Ambil link baru dari server
                    linkBuktiFinal = result.linkBukti || '';
                }
                // Jika tidak ada file baru, linkBuktiFinal sudah benar dari langkah sebelumnya
                // (kosong jika dihapus, atau nilai lama jika dipertahankan)

            } else {
                if (window.showToast) showToast('Gagal simpan: ' + (result?.message || 'Unknown error'), 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '💾 Simpan Penilaian';
                window.mnvHideUploadProgress();
                return;
            }
        } catch (err) {
            if (window.showToast) showToast('Gagal menghubungi server: ' + err.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '💾 Simpan Penilaian';
            window.mnvHideUploadProgress();
            return;
        }

        // Simpan ke cache lokal dengan linkBuktiFinal yang sudah pasti benar
        const localData = getLocalData();
        if (!localData[bulan]) localData[bulan] = {};
        localData[bulan][unit] = { ...scores, catatan, linkBukti: linkBuktiFinal, _state: state };
        setLocalData(localData);

        window.mnvHideUploadProgress();
        document.getElementById('mnv-assessModal')?.remove();

        if (window.showToast) showToast(`Nilai ${unit} bulan ${bulan} berhasil disimpan!`, 'success');

        window.mnvLoadDataFromServer();
    };

    // ─── DELETE ENTRY ─────────────────────────────────────────
    window.mnvDeleteEntry = function (unit, bulan) {
        showConfirmModal({
            icon: '🗑️',
            title: 'Hapus Penilaian Monev?',
            message: `Unit: <strong>${unit}</strong><br>Bulan: <strong>${bulan}</strong><br><br>Data akan dihapus dari spreadsheet. <span style="color:#ef4444;font-weight:600;">Tindakan ini tidak dapat dibatalkan.</span>`,
            confirmText: 'Ya, Hapus',
            confirmClass: 'btn-danger',
        }, async () => {
            const data = getLocalData();
            if (data[bulan]) delete data[bulan][unit];
            setLocalData(data);
            window.mnvRenderInputTable(bulan);
            window.mnvUpdateStats(bulan);
            try {
                const result = await callAPIPost({ action: 'deleteMonevData', bulan, unit });
                if (result && result.status === 'success') {
                    if (window.showToast) showToast(`Data ${unit} bulan ${bulan} berhasil dihapus.`, 'success');
                } else {
                    if (window.showToast) showToast('Hapus lokal berhasil, tapi gagal hapus di server', 'error');
                }
            } catch (err) {
                if (window.showToast) showToast('Hapus lokal berhasil, tapi gagal koneksi server', 'error');
            }
        });
    };

    // ─── REKAP ────────────────────────────────────────────────
    // REVISI #3: Rekap tampilkan sekre per sub-bagian + sub-total
    window.mnvRenderRekap = function () {
        const ct1 = document.getElementById('mnv-chartIndikator');
        const ct2 = document.getElementById('mnv-chartTotal');
        const tbody = document.getElementById('mnv-rekap-tbody');
        if (!ct1 || !ct2 || !tbody) return;

        const bulan = document.getElementById('mnv-select-bulan-rekap').value;
        const data = getLocalData();
        const monthData = (bulan && data[bulan]) ? data[bulan] : {};

        // Helper ambil nilai per unit
        const v = (unit, field) => (monthData[unit]?.[field]) || 0;

        // Data untuk chart — semua 8 unit (termasuk 3 sekre)
        const w   = UNITS.map(u => v(u, 'waktu'));
        const kl  = UNITS.map(u => v(u, 'kelengkapan'));
        const f   = UNITS.map(u => v(u, 'fisik'));
        const ke  = UNITS.map(u => v(u, 'keuangan'));
        const p   = UNITS.map(u => v(u, 'partisipasi'));
        const tl  = UNITS.map(u => v(u, 'tindakLanjut'));
        const tot = UNITS.map(u => v(u, 'total'));

        // Non-sekre rows
        const nonSekre = UNITS.filter(u => !SEKRE_UNITS.includes(u));
        const nonSekreTbodyRows = buildRekapRows(nonSekre, monthData, false);

        // Sekre rows + sub-total
        const sekreRows = buildRekapRows(SEKRE_UNITS, monthData, true);
        const sekreDinilai = SEKRE_UNITS.map(u => monthData[u]).filter(Boolean);
        let sekreSubTotal = '';
        if (sekreDinilai.length > 0) {
            const avg = field => (sekreDinilai.reduce((a, u) => a + (u[field] || 0), 0) / sekreDinilai.length).toFixed(1);
            const avgTot = parseFloat((sekreDinilai.reduce((a, u) => a + (u.total || 0), 0) / sekreDinilai.length).toFixed(1));
            const totColor = avgTot >= 35 ? '#065f46' : avgTot >= 25 ? '#92400e' : '#991b1b';
            sekreSubTotal = `
            <tr style="background:#dbeafe;border-top:2px solid #93c5fd;">
                <td colspan="2" style="font-weight:700;color:#1e3a8a;font-size:12px;text-align:left;padding:10px 12px;">
                    ∑ Rata-rata Sekretariat
                </td>
                <td class="rekap-good" style="font-size:12px;">${avg('waktu')}</td>
                <td class="rekap-good" style="font-size:12px;">${avg('kelengkapan')}</td>
                <td class="rekap-good" style="font-size:12px;">${avg('fisik')}</td>
                <td class="rekap-good" style="font-size:12px;">${avg('keuangan')}</td>
                <td class="rekap-good" style="font-size:12px;">${avg('partisipasi')}</td>
                <td class="rekap-good" style="font-size:12px;">${avg('tindakLanjut')}</td>
                <td style="font-weight:700;color:${totColor};font-size:14px;">${avgTot}</td>
            </tr>`;
        }

        tbody.innerHTML = nonSekreTbodyRows +
            `<tr style="background:#f0f4fa;">
                <td colspan="9" style="padding:6px 12px;font-size:12px;font-weight:700;color:#1e40af;letter-spacing:.04em;text-transform:uppercase;">
                    📂 Sekretariat — Breakdown Sub-Bagian
                </td>
            </tr>` +
            sekreRows + sekreSubTotal;

        if (chartIndikator) chartIndikator.destroy();
        if (chartTotal) chartTotal.destroy();

        chartIndikator = new Chart(ct1.getContext('2d'), {
            type: 'bar',
            data: {
                labels: SHORT_UNITS, datasets: [
                    { label: 'Ket.Waktu',    data: w,  backgroundColor: '#3b82f6' },
                    { label: 'Kelengkapan',  data: kl, backgroundColor: '#8b5cf6' },
                    { label: 'Fisik',        data: f,  backgroundColor: '#10b981' },
                    { label: 'Keuangan',     data: ke, backgroundColor: '#f59e0b' },
                    { label: 'Partisipasi',  data: p,  backgroundColor: '#ec4899' },
                    { label: 'Tindak Lanjut',data: tl, backgroundColor: '#06b6d4' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'bottom' } },
                scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, max: 40 } }
            }
        });

        chartTotal = new Chart(ct2.getContext('2d'), {
            type: 'bar',
            data: {
                labels: SHORT_UNITS,
                datasets: [{
                    label: 'Total', data: tot, borderRadius: 6,
                    backgroundColor: tot.map(v => v >= 35 ? '#10b981' : v >= 25 ? '#f59e0b' : '#ef4444')
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => `Nilai: ${ctx.parsed.y}/40` } }
                },
                scales: { y: { beginAtZero: true, max: 40, ticks: { stepSize: 5 } } }
            }
        });
    };

    function buildRekapRows(units, monthData, isSekre) {
        const v = (u, f) => (monthData[u]?.[f]) || 0;
        return units.map(unit => {
            const label = isSekre ? unit.replace('Sekretariat - ', '') : unit;
            const w   = v(unit, 'waktu');
            const kl  = v(unit, 'kelengkapan');
            const f_  = v(unit, 'fisik');
            const ke  = v(unit, 'keuangan');
            const pp  = v(unit, 'partisipasi');
            const tl_ = v(unit, 'tindakLanjut');
            const tot = v(unit, 'total');
            const totColor = tot >= 35 ? '#065f46' : tot >= 25 ? '#92400e' : '#991b1b';
            const padLeft = isSekre ? 'padding-left:24px;' : '';
            return `
            <tr>
                <td style="font-weight:500;text-align:left;${padLeft}">${label}</td>
                <td style="text-align:left;font-size:11px;color:#64748b;">${bulanLabel()}</td>
                <td class="${w  < 5  ? 'rekap-bad' : 'rekap-good'}">${w}</td>
                <td class="${kl < 5  ? 'rekap-bad' : 'rekap-good'}">${kl}</td>
                <td class="${f_ < 10 ? 'rekap-bad' : 'rekap-good'}">${f_}</td>
                <td class="${ke < 10 ? 'rekap-bad' : 'rekap-good'}">${ke}</td>
                <td class="${pp < 5  ? 'rekap-bad' : 'rekap-good'}">${pp}</td>
                <td class="${tl_< 5  ? 'rekap-bad' : 'rekap-good'}">${tl_}</td>
                <td style="font-weight:700;color:${totColor};">${tot}</td>
            </tr>`;
        }).join('');
    }

    function bulanLabel() {
        const el = document.getElementById('mnv-select-bulan-rekap');
        return el?.value || '—';
    }

    // ─── FILE HANDLING ────────────────────────────────────────
    window.mnvHandleBuktiFileSelect = function (event) {
        const file = event.target.files[0];
        const errEl = document.getElementById('mnv-bukti-file-error');
        errEl.style.display = 'none';
        if (!file) return;
        if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)) {
            errEl.textContent = '❌ Format tidak didukung. Gunakan JPG, PNG, atau PDF.';
            errEl.style.display = 'block'; event.target.value = ''; return;
        }
        if (file.size > MAX_FILE_SIZE) {
            errEl.textContent = `❌ Ukuran terlalu besar (${window.mnvFormatFileSize(file.size)}). Maks 10 MB.`;
            errEl.style.display = 'block'; event.target.value = ''; return;
        }
        selectedBuktiFile = file;
        document.getElementById('mnv-bukti-preview-name').textContent = file.name;
        document.getElementById('mnv-bukti-preview-size').textContent = window.mnvFormatFileSize(file.size);
        document.getElementById('mnv-bukti-preview-icon').textContent = file.type === 'application/pdf' ? '📄' : '🖼️';
        document.getElementById('mnv-bukti-file-preview').style.display = 'flex';
        const reader = new FileReader();
        reader.onload = e => { selectedBuktiBase64 = e.target.result.split(',')[1]; };
        reader.readAsDataURL(file);
    };

    window.mnvReplaceExistingBukti = function () {
        document.getElementById('mnv-existing-bukti-panel').style.display = 'none';
        document.getElementById('mnv-new-file-upload-zone').style.display = 'block';
    };

    window.mnvDeleteExistingBukti = function () {
        showConfirmModal({
            icon: '🗑️',
            title: 'Hapus Bukti Tersimpan?',
            message: 'File bukti yang tersimpan akan dihapus.',
            confirmText: 'Ya, Hapus',
            confirmClass: 'btn-danger',
        }, () => {
            existingLinkBukti = ''; existingBuktiDeleted = true;
            document.getElementById('mnv-existing-bukti-panel').style.display = 'none';
            document.getElementById('mnv-new-file-upload-zone').style.display = 'block';
        });
    };

    window.mnvCancelNewFile = function () {
        selectedBuktiFile = null; selectedBuktiBase64 = null;
        document.getElementById('mnv-bukti-file-input').value = '';
        document.getElementById('mnv-bukti-file-preview').style.display = 'none';
        document.getElementById('mnv-bukti-file-error').style.display = 'none';
        if (existingLinkBukti && !existingBuktiDeleted) {
            document.getElementById('mnv-existing-bukti-panel').style.display = 'block';
            document.getElementById('mnv-new-file-upload-zone').style.display = 'none';
        }
    };

    window.mnvFormatFileSize = function (b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(2) + ' MB';
    };

    window.mnvSetUploadProgress = function (pct, label) {
        document.getElementById('mnv-upload-progress').style.display = 'block';
        document.getElementById('mnv-upload-progress-fill').style.width = pct + '%';
        document.getElementById('mnv-upload-progress-label').textContent = label;
    };

    window.mnvHideUploadProgress = function () {
        document.getElementById('mnv-upload-progress').style.display = 'none';
        document.getElementById('mnv-upload-progress-fill').style.width = '0%';
    };

    // ═══ HTML Injection & Initialization ════════════════════════
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['monev'] = function () {
        const section = document.getElementById('section-monev');
        if (!section) return;

        section.innerHTML = `
<style>
/* ─── Monev: setema kearsipan ─────────────────── */
.mnv-score-section { background:#f8fafc; padding:16px; border-radius:8px; margin-bottom:14px; border-left:4px solid #3b82f6; }
.mnv-score-section .score-section-title { font-weight:600; color:#1e293b; margin-bottom:12px; font-size:15px; }

.mnv-check-item { display:flex; align-items:flex-start; gap:12px; padding:12px 14px; border-radius:8px; cursor:pointer; transition:background .15s; border:1.5px solid transparent; }
.mnv-check-checked  { background:#f0fdf4; border-color:#bbf7d0; }
.mnv-check-unchecked{ background:#fff7ed; border-color:#fed7aa; }
.mnv-check-item input[type="checkbox"] { appearance:none; -webkit-appearance:none; width:18px; height:18px; border-radius:5px; border:2px solid #cbd5e1; background:#fff; cursor:pointer; flex-shrink:0; margin-top:2px; transition:background .15s,border-color .15s; position:relative; }
.mnv-check-item input[type="checkbox"]:checked { background:#3b82f6; border-color:#3b82f6; }
.mnv-check-item input[type="checkbox"]:checked::after { content:''; position:absolute; top:2px; left:5px; width:5px; height:9px; border:2px solid #fff; border-top:none; border-left:none; transform:rotate(45deg); }
.mnv-check-body { flex:1; }
.mnv-check-label { font-size:14px; font-weight:600; color:#1e293b; }
.mnv-check-sub   { font-size:12px; color:#64748b; margin-top:2px; }
.mnv-check-badge { font-size:12px; font-weight:600; padding:3px 10px; border-radius:10px; background:#dcfce7; color:#15803d; white-space:nowrap; flex-shrink:0; margin-top:2px; }
.mnv-check-unchecked .mnv-check-badge { background:#fee2e2; color:#991b1b; }

.mnv-sub-group { display:none; margin-top:10px; padding:12px; background:white; border-radius:7px; border:1px solid #e5e7eb; }
.mnv-sub-group.show { display:block; }

.score-preview { background:white; padding:20px; border-radius:8px; margin:16px 0; border:2px solid #e5e7eb; }
.score-preview-title { font-size:13px; color:#64748b; margin-bottom:8px; text-align:center; text-transform:uppercase; letter-spacing:.05em; }
.score-preview-value { font-size:36px; font-weight:700; color:#0f172a; text-align:center; }
.score-breakdown { display:grid; gap:10px; margin-top:12px; }
.score-item { text-align:center; padding:10px 8px; background:#f8fafc; border-radius:6px; }
.score-item-label { font-size:10px; color:#64748b; margin-bottom:4px; }
.score-item-value { font-size:18px; font-weight:700; color:#1e293b; }

.info-box { background:#f8fafc; border:1px solid #e5e7eb; border-radius:6px; padding:14px 16px; }
.alert { padding:12px 16px; border-radius:6px; font-size:13px; }
.alert-info { background:#eff6ff; border-left:4px solid #3b82f6; color:#1e3a8a; }
.form-textarea { width:100%; padding:10px 12px; border:1px solid #e5e7eb; border-radius:6px; font-size:14px; font-family:inherit; resize:vertical; outline:none; transition:border-color .15s; box-sizing:border-box; }
.form-textarea:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.1); }

.mnv-badge-good    { background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; white-space:nowrap; }
.mnv-badge-mid     { background:#fef9c3; color:#a16207; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; white-space:nowrap; }
.mnv-badge-bad     { background:#fee2e2; color:#991b1b; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; white-space:nowrap; }
.mnv-badge-pending { background:#fef9c3; color:#a16207; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; white-space:nowrap; }

.mnv-link-btn { display:inline-flex; align-items:center; gap:4px; font-size:12px; color:#3b82f6; text-decoration:none; font-weight:600; }
.mnv-link-btn:hover { text-decoration:underline; }

.action-buttons { display:flex; gap:4px; }
.btn-icon-group { display:flex; gap:4px; }
.btn-icon { width:30px; height:30px; display:inline-flex; align-items:center; justify-content:center; border-radius:7px; border:none; cursor:pointer; transition:background .15s, transform .1s; }
.btn-icon:active { transform:scale(.93); }
.btn-icon-approve { background:#dcfce7; color:#15803d; }
.btn-icon-approve:hover { background:#bbf7d0; }
.btn-icon-view    { background:#dbeafe; color:#1e40af; }
.btn-icon-view:hover { background:#bfdbfe; }
.btn-icon-edit    { background:#fef9c3; color:#a16207; }
.btn-icon-edit:hover { background:#fde68a; }
.btn-icon-delete  { background:#fee2e2; color:#991b1b; }
.btn-icon-delete:hover { background:#fecaca; }

.mnv-detail-section { background:#f8fafc; border-radius:10px; padding:14px; border:1px solid #f1f5f9; display:flex; flex-direction:column; gap:8px; }
.mnv-detail-section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#94a3b8; margin-bottom:4px; display:flex; align-items:center; gap:6px; }

.krs-score-row { display:flex; align-items:flex-start; gap:10px; padding:10px; background:white; border-radius:8px; border:1px solid #f1f5f9; }
.krs-score-row-label { display:flex; align-items:center; gap:6px; font-weight:600; font-size:12px; color:#1e293b; min-width:100px; flex-shrink:0; }
.krs-score-badge { width:20px; height:20px; border-radius:50%; font-size:11px; font-weight:700; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }
.krs-score-row-detail { flex:1; display:flex; flex-direction:column; gap:4px; }
.krs-score-sub-row { display:flex; align-items:center; justify-content:space-between; font-size:12.5px; color:#64748b; }
.krs-score-chip { font-size:14px; font-weight:800; padding:5px 10px; border-radius:8px; flex-shrink:0; }

.krs-file-item { display:flex; align-items:center; gap:10px; padding:10px 12px; background:white; border:1px solid #e2e8f0; border-radius:8px; text-decoration:none; color:inherit; transition:border-color .15s, box-shadow .15s; }
.krs-file-item:hover { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.08); }
.krs-file-icon { width:32px; height:32px; border-radius:8px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.krs-file-info { flex:1; min-width:0; }
.krs-file-label { font-size:13px; font-weight:600; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.krs-file-url { font-size:11px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
.krs-file-arrow { font-size:18px; color:#cbd5e1; flex-shrink:0; }
.krs-file-item:hover .krs-file-arrow { color:#3b82f6; }

.krs-detail-field-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

/* Rekap table cells */
.rekap-table td, .rekap-table th { padding:8px 10px; text-align:center; border-bottom:1px solid #f1f5f9; font-size:12px; }
.rekap-table th { background:#f8fafc; font-weight:700; font-size:11px; color:#64748b; text-align:center; }
.rekap-table td:first-child, .rekap-table th:first-child { text-align:left; }
.rekap-good { color:#065f46; background:#f0fdf4; font-weight:600; }
.rekap-bad  { color:#991b1b; background:#fff1f2; font-weight:600; }
</style>

<div class="container">

    <div class="section-page-header">
        <h1 class="section-page-title">Penilaian Monitoring &amp; Evaluasi</h1>
        <p class="section-page-subtitle">Sistem penilaian 6 indikator: Ketepatan Waktu, Kelengkapan, Fisik, Keuangan, Partisipasi, Tindak Lanjut</p>
    </div>

    <div class="last-updated-bar" id="mnv-last-updated-bar"></div>

    <div class="stats-grid">
        <div class="stat-card" style="border-left:4px solid #1F4E79;">
            <div class="stat-label">Skor Maksimum</div>
            <div class="stat-value">40</div>
            <div class="stat-footer">Per unit per bulan</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #10b981;">
            <div class="stat-label">Rata-rata Bulan Ini</div>
            <div class="stat-value" id="mnv-avg-score-this-month">—</div>
            <div class="stat-footer">Dari unit dinilai</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #f59e0b;">
            <div class="stat-label">Unit Dinilai</div>
            <div class="stat-value" id="mnv-units-assessed">0</div>
            <div class="stat-footer">Bulan ini</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #ef4444;">
            <div class="stat-label">Unit Belum Dinilai</div>
            <div class="stat-value" id="mnv-units-pending">${UNITS.length}</div>
            <div class="stat-footer">Menunggu penilaian</div>
        </div>
    </div>

    <div class="tabs">
        <button class="tab active" onclick="mnvSwitchTab('input', event)">📥 Input Penilaian</button>
        <button class="tab" onclick="mnvSwitchTab('rekap', event)">📊 Rekapitulasi</button>
    </div>

    <!-- TAB INPUT -->
    <div id="mnv-tab-input" class="tab-content active">
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Nilai Kinerja Monev Per Unit</h2>
                <div class="filter-container">
                    <select class="select-input" id="mnv-select-bulan-input" onchange="mnvRenderInputTable(this.value); mnvUpdateStats(this.value);">
                        <option value="">Pilih Bulan</option>
                        ${MONTHS.map(m => `<option value="${m}">${m.charAt(0) + m.slice(1).toLowerCase()}</option>`).join('')}
                    </select>
                    <button onclick="mnvLoadDataFromServer()" class="btn btn-sm" title="Refresh Data">
                        ${ICONS.refresh} Refresh
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Unit / Bidang</th>
                            <th>Rincian Skor</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Bukti</th>
                            <th>Catatan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="mnv-input-tbody">
                        <tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;">
                            <div class="spinner"></div>
                            <div style="margin-top:12px;">Memuat data...</div>
                        </td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- TAB REKAP -->
    <div id="mnv-tab-rekap" class="tab-content">
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Rekapitulasi Nilai Kinerja Monitoring &amp; Evaluasi</h2>
                <div class="filter-container">
                    <select class="select-input" id="mnv-select-bulan-rekap" onchange="mnvRenderRekap()">
                        <option value="">Semua Bulan</option>
                        ${MONTHS.map(m => `<option value="${m}">${m.charAt(0) + m.slice(1).toLowerCase()}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="card-content">
                <div class="charts-grid">
                    <div class="card" style="margin:0;">
                        <div class="card-header" style="padding:16px;"><h3 style="font-size:15px;font-weight:600;">Distribusi Per Indikator</h3></div>
                        <div class="card-content"><div class="chart-container"><canvas id="mnv-chartIndikator"></canvas></div></div>
                    </div>
                    <div class="card" style="margin:0;">
                        <div class="card-header" style="padding:16px;"><h3 style="font-size:15px;font-weight:600;">Total Nilai Per Unit</h3></div>
                        <div class="card-content"><div class="chart-container"><canvas id="mnv-chartTotal"></canvas></div></div>
                    </div>
                </div>
                <div style="overflow-x:auto;margin-top:16px;">
                    <table class="rekap-table" style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr>
                                <th style="text-align:left;min-width:140px;">Unit / Bidang</th>
                                <th>Bulan</th>
                                <th>Waktu<br><small style="opacity:.6">/5</small></th>
                                <th>Klgkpn<br><small style="opacity:.6">/5</small></th>
                                <th>Fisik<br><small style="opacity:.6">/10</small></th>
                                <th>Keuangan<br><small style="opacity:.6">/10</small></th>
                                <th>Partisipasi<br><small style="opacity:.6">/5</small></th>
                                <th>Tindak Lanjut<br><small style="opacity:.6">/5</small></th>
                                <th>Total<br><small style="opacity:.6">/40</small></th>
                            </tr>
                        </thead>
                        <tbody id="mnv-rekap-tbody">
                            <tr><td colspan="9" style="text-align:center;padding:40px;color:#94a3b8;">
                                <div class="spinner"></div>
                                <div style="margin-top:12px;">Memuat data...</div>
                            </td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>`;

        // Set bulan saat ini
        const cMonthName = MONTHS[new Date().getMonth()];
        if (cMonthName) {
            const iMonth = document.getElementById('mnv-select-bulan-input');
            const rMonth = document.getElementById('mnv-select-bulan-rekap');
            if (iMonth) iMonth.value = cMonthName;
            if (rMonth) rMonth.value = cMonthName;
        }

        currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        window.mnvLoadDataFromServer();
    };

})();