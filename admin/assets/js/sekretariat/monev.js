// ============================================================
// monev.js — Penilaian Monitoring & Evaluasi section (SPA)
// Admin Panel — Dinas Koperasi UKM
// REVISI #5:
//   1. Tab Rekap Triwulan: ada chart (bar stacked & total) + summary cards
//   2. Sekretariat sub-bagian disimpan ke SEKRETARIAT_DATA (sheet terpisah);
//      sheet bulan (JAN/FEB/...) hanya simpan rata-rata via kolom "Sekretariat"
// ============================================================
(function () {
    'use strict';

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuQaHsIxxtmnTr4cPuyUQzdvdr23_3wK59JIF8VYA1ihhBm4ZeD3A0qzpginmmA9d-ng/exec';

    // Unit non-sekretariat
    const NON_SEKRE_UNITS = [
        "Balai Layanan Usaha Terpadu KUMKM",
        "Bidang Kewirausahaan",
        "Bidang Koperasi",
        "Bidang UKM",
        "Bidang Usaha Mikro"
    ];

    // Sub-bagian sekretariat (disimpan di SEKRETARIAT_DATA)
    const SEKRE_UNITS = [
        "Sekretariat - Subbag Umum",
        "Sekretariat - Subbag Keuangan",
        "Sekretariat - Program"
    ];

    // Semua unit untuk tampilan (termasuk sub-bagian individual)
    const UNITS = [...NON_SEKRE_UNITS, ...SEKRE_UNITS];

    const SHORT_UNITS = ['BLUT', 'Kewirausahaan', 'Koperasi', 'UKM', 'Usaha Mikro', 'Sekre-Umum', 'Sekre-Keu', 'Sekre-Prog'];
    const SHORT_NON_SEKRE = ['BLUT', 'Kewirausahaan', 'Koperasi', 'UKM', 'Usaha Mikro'];

    const MONTHS = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
                    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

    const TRIWULAN = {
        "TW I":  ["JANUARI", "FEBRUARI", "MARET"],
        "TW II": ["APRIL", "MEI", "JUNI"],
        "TW III":["JULI", "AGUSTUS", "SEPTEMBER"],
        "TW IV": ["OKTOBER", "NOVEMBER", "DESEMBER"]
    };

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const CACHE_KEY = 'monev_data_v5';

    let selectedBuktiFiles = [];
    let existingLinkBuktis = [];
    let chartIndikator = null;
    let chartTotal = null;
    let chartTwIndikator = null;
    let chartTwTotal = null;
    let sekreExpanded = false;
    let sekreRekapExpanded = false;
    let currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const ICONS = {
        refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
        plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        eye: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
        link: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
        check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
        x: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        chevronRight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    };

    // ─── CACHE ──────────────────────────────────────────────
    function getLocalData() { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
    function setLocalData(d) { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); }

    function isSekreSub(unit) { return SEKRE_UNITS.includes(unit); }

    // ─── STATUS BAR ─────────────────────────────────────────
    function setStatusBar(type, text) {
        const bar = document.getElementById('mnv-last-updated-bar');
        if (!bar) return;
        bar.className = 'last-updated-bar ' + type + (type ? ' visible' : '');
        bar.textContent = text;
    }

    function showTableLoading() {
        const tbody = document.getElementById('mnv-input-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;"><div class="spinner"></div><div style="margin-top:12px;">Memuat data dari server...</div></td></tr>`;
    }

    // ─── SCORE CALC ─────────────────────────────────────────
    function calcScores(state) {
        let waktu = state.waktuOk ? 5 : Math.max(0, 5 - parseInt(state.selKeterlambatan || 3));
        let kelengkapan = state.kelengkapanOk ? 5 : Math.max(0, 5 - parseInt(state.selKualitas || 2));
        let fisik;
        if (state.fisikOk) { fisik = 10; }
        else if (state.selDeviasiFisik === 'efisiensi') { fisik = 10; }
        else { fisik = Math.max(0, 10 - parseInt(state.selDeviasiFisik || 5)); }
        let keuangan = state.keuanganOk ? 10 : Math.max(0, 10 - parseInt(state.selDeviasiKeuangan || 5));
        let partisipasi = state.partisipasiOk ? 5 : (state.selPartisipasi === 'tidak-hadir' ? 0 : 3);
        let tindakLanjut = state.tindakLanjutOk ? 5 : 0;
        return { waktu, kelengkapan, fisik, keuangan, partisipasi, tindakLanjut, total: waktu + kelengkapan + fisik + keuangan + partisipasi + tindakLanjut };
    }

    // ─── API CALLS ──────────────────────────────────────────
    function callAPIGet(params) {
        return new Promise((resolve, reject) => {
            const cbName = 'jsonp_mnv_' + Date.now();
            const timeout = setTimeout(() => { cleanup(); reject(new Error('Timeout 30 detik')); }, 30000);
            function cleanup() { clearTimeout(timeout); delete window[cbName]; document.getElementById('script_' + cbName)?.remove(); }
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
            const body = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k] || '')).join('&');
            fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body, redirect: 'follow'
            })
            .then(r => r.text())
            .then(text => {
                clearTimeout(t);
                try { resolve(JSON.parse(text)); }
                catch (e) { resolve({ status: 'success', linkBukti: '' }); }
            })
            .catch(err => { clearTimeout(t); reject(err); });
        });
    }

    // ─── LOAD DATA ──────────────────────────────────────────
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
            // pakai cache bila ada
        } finally {
            const bulan = document.getElementById('mnv-select-bulan-input')?.value || '';
            if (bulan) { window.mnvRenderInputTable(bulan); window.mnvUpdateStats(bulan); }
            else {
                const tbody = document.getElementById('mnv-input-tbody');
                if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;">Pilih bulan untuk melihat data</td></tr>';
            }
            window.mnvRenderRekap();
            window.mnvRenderTriwulan();
        }
    };

    // ─── TAB SWITCHING ───────────────────────────────────────
    window.mnvSwitchTab = function (name, e) {
        document.querySelectorAll('#section-monev .tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#section-monev .tab-content').forEach(t => t.classList.remove('active'));
        if (e && e.target) e.target.classList.add('active');
        document.getElementById('mnv-tab-' + name)?.classList.add('active');
        if (name === 'rekap') window.mnvRenderRekap();
        if (name === 'triwulan') window.mnvRenderTriwulan();
    };

    // ─── STATS ──────────────────────────────────────────────
    window.mnvUpdateStats = function (bulan) {
        if (!document.getElementById('mnv-avg-score-this-month')) return;
        const data = getLocalData();
        const allUnitsThisMonth = [...NON_SEKRE_UNITS, ...SEKRE_UNITS];
        if (!bulan || !data[bulan]) {
            document.getElementById('mnv-avg-score-this-month').textContent = '—';
            document.getElementById('mnv-units-assessed').textContent = '0';
            document.getElementById('mnv-units-pending').textContent = allUnitsThisMonth.length;
            return;
        }
        const monthData = data[bulan];
        const assessed = allUnitsThisMonth.filter(u => monthData[u]);
        const vals = assessed.map(u => monthData[u].total);
        document.getElementById('mnv-avg-score-this-month').textContent = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
        document.getElementById('mnv-units-assessed').textContent = assessed.length;
        document.getElementById('mnv-units-pending').textContent = Math.max(0, allUnitsThisMonth.length - assessed.length);
    };

    // ─── TOGGLE SEKRETARIAT ACCORDION (Input Table) ──────────
    window.mnvToggleSekre = function () {
        sekreExpanded = !sekreExpanded;
        document.querySelectorAll('.mnv-sekre-sub-row').forEach(r => r.style.display = sekreExpanded ? '' : 'none');
        document.getElementById('mnv-sekre-subtotal-row')?.style && (document.getElementById('mnv-sekre-subtotal-row').style.display = sekreExpanded ? '' : 'none');
        const arrow = document.getElementById('mnv-sekre-arrow');
        if (arrow) arrow.style.transform = sekreExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
    };

    // ─── RENDER INPUT TABLE ──────────────────────────────────
    window.mnvRenderInputTable = function (bulan) {
        const tbody = document.getElementById('mnv-input-tbody');
        if (!tbody) return;
        if (!bulan) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;">Pilih bulan untuk melihat data</td></tr>';
            return;
        }
        const monthData = (getLocalData()[bulan]) || {};

        let rows = '';
        NON_SEKRE_UNITS.forEach(unit => { rows += renderUnitRow(unit, bulan, monthData, false); });

        // Accordion header sekretariat
        const sekreVals = SEKRE_UNITS.map(u => monthData[u]).filter(Boolean);
        const sekreDinilai = sekreVals.length;
        // FALLBACK: kalau tidak ada data sub-bagian individual, ambil dari rata-rata sheet bulan
        const sekreFallback = monthData['Sekretariat'];
        const sekreAvgNum = sekreDinilai > 0
            ? sekreVals.reduce((a, u) => a + (u.total || 0), 0) / sekreDinilai
            : (sekreFallback ? sekreFallback.total : null);
        const sekreAvg = sekreAvgNum !== null ? parseFloat(sekreAvgNum).toFixed(1) : '—';
        const sekreHasData = sekreDinilai > 0 || !!sekreFallback;
        const sekreBadgeCls = !sekreHasData ? 'mnv-badge-pending' : parseFloat(sekreAvg) >= 35 ? 'mnv-badge-good' : parseFloat(sekreAvg) >= 25 ? 'mnv-badge-mid' : 'mnv-badge-bad';

        rows += `
        <tr class="mnv-sekre-accordion-header" onclick="mnvToggleSekre()" style="cursor:pointer;background:#eff6ff;border-top:2px solid #bfdbfe;">
            <td style="padding:12px 14px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div id="mnv-sekre-arrow" style="transition:transform .2s;color:#1e40af;display:flex;align-items:center;">
                        ${ICONS.chevronRight}
                    </div>
                    <div>
                        <div style="font-weight:700;color:#1e3a8a;">📂 Sekretariat</div>
                        <div style="font-size:12px;color:#3b82f6;margin-top:2px;">${bulan} · 3 Sub-Bagian · Data disimpan di sheet terpisah</div>
                    </div>
                </div>
            </td>
            <td style="font-size:12px;color:#3b82f6;">
                ${sekreDinilai > 0
                    ? `<span style="font-size:11px;color:#64748b;">${sekreDinilai}/${SEKRE_UNITS.length} sub-bagian dinilai</span>`
                    : sekreFallback
                        ? `<span style="font-size:11px;color:#f59e0b;"></span>`
                        : '<span style="font-size:12px;color:#94a3b8;font-style:italic;">Belum ada penilaian</span>'}
            </td>
            <td>
                ${sekreHasData ? `<strong style="font-size:20px;color:#1e40af;">${sekreAvg}</strong><span style="font-size:11px;color:#94a3b8;">/40</span>` : '<span style="color:#94a3b8;">—</span>'}
            </td>
            <td><span class="${sekreBadgeCls}">${sekreHasData ? 'Rata-rata' : 'Pending'}</span></td>
            <td colspan="3" style="color:#3b82f6;font-size:12px;font-weight:600;">
                ${sekreExpanded ? '▲ Sembunyikan sub-bagian' : '▼ Lihat sub-bagian'}
            </td>
        </tr>`;

        SEKRE_UNITS.forEach(unit => { rows += renderUnitRow(unit, bulan, monthData, true, sekreFallback); });

        if (sekreHasData) {
            const subtotalLabel = sekreDinilai > 0
                ? `∑ Rata-rata Sekretariat (${sekreDinilai}/${SEKRE_UNITS.length} dinilai) <span style="font-size:11px;background:#bfdbfe;color:#1e40af;padding:2px 8px;border-radius:10px;margin-left:6px;">Tersimpan di SEKRETARIAT_DATA</span>`
                : `∑ Rata-rata Sekretariat <span style="font-size:11px;background:#fef9c3;color:#a16207;padding:2px 8px;border-radius:10px;margin-left:6px;"></span>`;
            rows += `
            <tr id="mnv-sekre-subtotal-row" class="mnv-sekre-sub-row" style="display:none;background:#dbeafe;border-bottom:2px solid #93c5fd;">
                <td colspan="2" style="padding:8px 14px 8px 44px;font-size:12px;font-weight:700;color:#1e3a8a;">
                    ${subtotalLabel}
                </td>
                <td style="font-size:18px;font-weight:800;color:#1e3a8a;">${sekreAvg}</td>
                <td colspan="4"></td>
            </tr>`;
        }

        tbody.innerHTML = rows;
        if (sekreExpanded) {
            document.querySelectorAll('.mnv-sekre-sub-row').forEach(r => r.style.display = '');
            const arrow = document.getElementById('mnv-sekre-arrow');
            if (arrow) arrow.style.transform = 'rotate(90deg)';
        }
    };

    function renderUnitRow(unit, bulan, monthData, isSekre, sekreFallback) {
        // Kalau sub-bagian tidak punya data individual, gunakan fallback rata-rata sheet bulan
        let u = monthData[unit];
        const usingFallback = !u && isSekre && sekreFallback;
        if (usingFallback) {
            u = sekreFallback; // tampilkan nilai rata-rata sebagai representasi
        }
        const subRowClass = isSekre ? 'mnv-sekre-sub-row' : '';
        const subRowStyle = isSekre ? 'display:none;' : '';
        const labelPad = isSekre ? 'padding-left:44px;' : '';
        const bgColor = isSekre ? 'background:#f8fafc;' : '';
        const label = isSekre ? unit.replace('Sekretariat - ', '') : unit;
        const subLabel = isSekre
            ? `<div style="font-size:11px;color:#3b82f6;margin-top:2px;font-weight:500;">Sub-Bagian · Data di sheet SEKRETARIAT_DATA</div>`
            : `<div style="font-size:12px;color:#64748b;margin-top:2px;">${bulan}</div>`;

        if (!u) return `
        <tr class="${subRowClass}" style="${subRowStyle}${bgColor}">
            <td style="${labelPad}">
                <div style="font-weight:600;${isSekre ? 'color:#1e40af;' : ''}">${label}</div>
                ${subLabel}
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
        const links = parseLinks(u.linkBukti);
        let buktiCell;
        if (links.length === 0) buktiCell = `<span style="color:#94a3b8;font-size:13px;">—</span>`;
        else if (links.length === 1) buktiCell = `<a href="${links[0]}" target="_blank" class="mnv-link-btn">${ICONS.link} Lihat</a>`;
        else buktiCell = `<div style="display:flex;flex-direction:column;gap:3px;">${links.map((l, i) => `<a href="${l}" target="_blank" class="mnv-link-btn" style="font-size:11px;">${ICONS.link} File ${i + 1}</a>`).join('')}</div>`;

        return `
        <tr class="${subRowClass}" style="${subRowStyle}${bgColor}">
            <td style="${labelPad}">
                <div style="font-weight:600;${isSekre ? 'color:#1e40af;' : ''}">${label}</div>
                ${subLabel}
            </td>
            <td style="font-size:13px;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;min-width:180px;">
                    <span style="font-size:11px;color:#64748b;">Waktu: <b>${u.waktu}</b></span>
                    <span style="font-size:11px;color:#64748b;">Klgkpn: <b>${u.kelengkapan}</b></span>
                    <span style="font-size:11px;color:#64748b;">Fisik: <b>${u.fisik}</b></span>
                    <span style="font-size:11px;color:#64748b;">Keuangan: <b>${u.keuangan}</b></span>
                    <span style="font-size:11px;color:#64748b;">Partisipasi: <b>${u.partisipasi}</b></span>
                    <span style="font-size:11px;color:#64748b;">TL: <b>${u.tindakLanjut}</b></span>
                </div>
            </td>
            <td><strong style="font-size:20px;color:${scoreColor};">${u.total}</strong><span style="font-size:11px;color:#94a3b8;">/40</span></td>
            <td><span class="${badgeCls}">${u.total >= 35 ? 'Baik' : u.total >= 25 ? 'Cukup' : 'Kurang'}</span></td>
            <td>${buktiCell}</td>
            <td style="font-size:12px;color:#64748b;">${u.catatan ? (u.catatan.length > 40 ? u.catatan.slice(0, 40) + '…' : u.catatan) : '—'}</td>
            <td>
                <div class="action-buttons"><div class="btn-icon-group">
                    <button onclick="mnvOpenViewModal('${esc(unit)}','${bulan}')" class="btn-icon btn-icon-view" title="Lihat Detail">${ICONS.eye}</button>
                    <button onclick="mnvOpenInputModal('${esc(unit)}','${bulan}')" class="btn-icon btn-icon-edit" title="Edit">${ICONS.edit}</button>
                    <button onclick="mnvDeleteEntry('${esc(unit)}','${bulan}')" class="btn-icon btn-icon-delete" title="Hapus">${ICONS.trash}</button>
                </div></div>
            </td>
        </tr>`;
    }

    function parseLinks(raw) {
        if (!raw) return [];
        try { const p = JSON.parse(raw); if (Array.isArray(p)) return p.filter(Boolean); } catch (e) {}
        if (raw.startsWith('http')) return [raw];
        return [];
    }
    function serializeLinks(arr) { return JSON.stringify(arr.filter(Boolean)); }
    function esc(s) { return s.replace(/'/g, "\\'"); }

    // ─── VIEW MODAL ──────────────────────────────────────────
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
        const fisikEfisiensi = !st.fisikOk && st.selDeviasiFisik === 'efisiensi';
        const links = parseLinks(u.linkBukti);
        const buktiSection = links.length > 0 ? `<div class="mnv-detail-section"><div class="mnv-detail-section-title">${ICONS.link} File Bukti (${links.length} file)</div>${links.map((link, i) => `<a href="${link}" target="_blank" rel="noopener noreferrer" class="krs-file-item" style="margin-top:6px;"><div class="krs-file-icon">${ICONS.link}</div><div class="krs-file-info"><div class="krs-file-label">Bukti Penilaian Monev #${i + 1}</div><div class="krs-file-url">${link.length > 55 ? link.slice(0, 55) + '…' : link}</div></div><div class="krs-file-arrow">›</div></a>`).join('')}</div>` : '';
        const displayUnit = isSekreSub(unit) ? unit.replace('Sekretariat - ', 'Sekretariat / ') : unit;
        const isSekreInfo = isSekreSub(unit) ? `<div style="margin-top:6px;background:#eff6ff;color:#1e40af;font-size:11px;padding:4px 10px;border-radius:6px;display:inline-block;">📋 Data tersimpan di sheet SEKRETARIAT_DATA</div>` : '';

        const modal = document.createElement('div');
        modal.id = 'mnv-viewModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
        <div class="modal" style="max-width:600px;">
            <div class="modal-header"><h2 class="modal-title">Detail Penilaian Monev</h2></div>
            <div class="modal-content" style="display:flex;flex-direction:column;gap:14px;">
                <div class="mnv-detail-section" style="flex-direction:row;align-items:flex-start;gap:14px;flex-wrap:wrap;">
                    <div style="flex:1;min-width:160px;">
                        <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;">Unit / Bidang</div>
                        <div style="font-size:14px;font-weight:700;color:#1e293b;margin-top:4px;">${displayUnit}</div>
                        ${isSekreInfo}
                        <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-top:10px;">Periode</div>
                        <div style="font-size:13px;font-weight:600;color:#1e293b;margin-top:2px;">${bulan}</div>
                    </div>
                    <div style="text-align:center;padding:16px 24px;background:${scoreBg};border:2px solid ${scoreBorder};border-radius:12px;min-width:110px;">
                        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${scoreColor};margin-bottom:4px;">Total Skor</div>
                        <div style="font-size:48px;font-weight:800;color:${scoreColor};line-height:1;">${total}</div>
                        <div style="font-size:12px;color:#64748b;margin-top:4px;">dari 40</div>
                    </div>
                </div>
                <div class="mnv-detail-section">
                    <div class="mnv-detail-section-title">📊 Rincian Penilaian</div>
                    <div class="krs-score-row"><div class="krs-score-row-label"><span class="krs-score-badge" style="background:#eff6ff;color:#3b82f6;">1</span>Ket. Waktu</div><div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>Tepat waktu</span>${yesNo(st.waktuOk)}</div></div><div class="krs-score-chip" style="background:#eff6ff;color:#3b82f6;">${u.waktu}/5</div></div>
                    <div class="krs-score-row"><div class="krs-score-row-label"><span class="krs-score-badge" style="background:#fdf4ff;color:#8b5cf6;">2</span>Kelengkapan</div><div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>Data lengkap</span>${yesNo(st.kelengkapanOk)}</div></div><div class="krs-score-chip" style="background:#fdf4ff;color:#8b5cf6;">${u.kelengkapan}/5</div></div>
                    <div class="krs-score-row"><div class="krs-score-row-label"><span class="krs-score-badge" style="background:#f0fdf4;color:#10b981;">3</span>Fisik</div><div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>Sesuai target${fisikEfisiensi ? ' <span style="font-size:10px;background:#dcfce7;color:#15803d;padding:1px 6px;border-radius:8px;font-weight:600;">Efisiensi</span>' : ''}</span>${fisikEfisiensi ? `<span style="color:#10b981;font-weight:600;font-size:13px;">${ICONS.check} Efisiensi</span>` : yesNo(st.fisikOk)}</div></div><div class="krs-score-chip" style="background:#f0fdf4;color:#10b981;">${u.fisik}/10</div></div>
                    <div class="krs-score-row"><div class="krs-score-row-label"><span class="krs-score-badge" style="background:#fffbeb;color:#f59e0b;">4</span>Keuangan</div><div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>Sesuai anggaran</span>${yesNo(st.keuanganOk)}</div></div><div class="krs-score-chip" style="background:#fffbeb;color:#f59e0b;">${u.keuangan}/10</div></div>
                    <div class="krs-score-row"><div class="krs-score-row-label"><span class="krs-score-badge" style="background:#fdf2f8;color:#ec4899;">5</span>Partisipasi</div><div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>PPTK hadir langsung</span>${yesNo(st.partisipasiOk)}</div></div><div class="krs-score-chip" style="background:#fdf2f8;color:#ec4899;">${u.partisipasi}/5</div></div>
                    <div class="krs-score-row"><div class="krs-score-row-label"><span class="krs-score-badge" style="background:#ecfeff;color:#06b6d4;">6</span>Tindak Lanjut</div><div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>Sudah dilaksanakan</span>${yesNo(st.tindakLanjutOk)}</div></div><div class="krs-score-chip" style="background:#ecfeff;color:#06b6d4;">${u.tindakLanjut}/5</div></div>
                </div>
                ${u.catatan ? `<div class="mnv-detail-section"><div class="mnv-detail-section-title">📝 Catatan</div><div style="font-size:13.5px;color:#374151;line-height:1.6;white-space:pre-line;">${u.catatan}</div></div>` : ''}
                ${buktiSection}
            </div>
            <div class="modal-footer">
                <button onclick="document.getElementById('mnv-viewModal').remove()" class="btn" style="flex:1;">Tutup</button>
                <button onclick="document.getElementById('mnv-viewModal').remove();mnvOpenInputModal('${esc(unit)}','${bulan}')" class="btn btn-primary" style="flex:1;">✏️ Edit</button>
            </div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
    };

    // ─── CHECK TOGGLE ────────────────────────────────────────
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
        [['mnv-score-waktu', s.waktu], ['mnv-score-kelengkapan', s.kelengkapan],
         ['mnv-score-fisik', s.fisik], ['mnv-score-keuangan', s.keuangan],
         ['mnv-score-partisipasi', s.partisipasi], ['mnv-score-tindak-lanjut', s.tindakLanjut],
         ['mnv-modal-total-nilai', s.total]].forEach(([id, val]) => {
            const el = document.getElementById(id); if (el) el.textContent = val;
        });
        ['waktu','kelengkapan','fisik','keuangan','partisipasi','tindaklanjut'].forEach(k => {
            if (!document.getElementById('mnv-check-' + k)?.checked) window.mnvUpdateBadge(k);
        });
    };

    // ─── OPEN INPUT MODAL ────────────────────────────────────
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
        selectedBuktiFiles = [];
        existingLinkBuktis = isEdit && existing?.linkBukti ? parseLinks(existing.linkBukti) : [];

        const displayLabel = isSekreSub(unit) ? unit.replace('Sekretariat - ', 'Sekretariat / ') : unit;
        const sekreNote = isSekreSub(unit) ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 12px;margin-top:10px;font-size:12px;color:#1e40af;"><strong>📋 Info:</strong> Data sub-bagian ini akan disimpan ke sheet <code>SEKRETARIAT_DATA</code> (terpisah dari sheet bulan). Sheet bulan hanya akan menyimpan rata-rata dari 3 sub-bagian.</div>` : '';

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
                    <p style="font-size:13px;color:#64748b;margin:0;">Penilaian Monitoring & Evaluasi · ${bulan}</p>
                    ${isEdit ? '<span style="display:inline-block;margin-top:6px;background:#dbeafe;color:#1e40af;font-size:11px;font-weight:600;padding:3px 10px;border-radius:10px;">✏️ Mode Edit</span>' : ''}
                    ${sekreNote}
                </div>
                <div class="alert alert-info" style="margin-bottom:16px;">
                    📊 <strong>Sistem Penilaian:</strong> Centang jika terpenuhi. Total maksimum <strong>40 poin</strong>.
                </div>
                <input type="hidden" id="mnv-input-unit" value="${unit}">

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
                            <option value="3" ${(state.selKeterlambatan||'3')==='3'?'selected':''}>Terlambat &lt; 5 hari (−3 poin → skor 2)</option>
                            <option value="5" ${state.selKeterlambatan==='5'?'selected':''}>Terlambat ≥ 5 hari (−5 poin → skor 0)</option>
                        </select>
                    </div>
                </div>

                <div class="mnv-score-section" style="border-left-color:#8b5cf6;">
                    <div class="score-section-title">2️⃣ Kelengkapan Data <span style="font-weight:400;color:#64748b;font-size:13px;">(Maks 5 poin)</span></div>
                    <div class="mnv-check-item mnv-check-checked" id="mnv-check-kelengkapan-item" onclick="mnvToggleCheck('kelengkapan',event)">
                        <input type="checkbox" id="mnv-check-kelengkapan" ${state.kelengkapanOk?'checked':''} onclick="mnvToggleCheck('kelengkapan',event)" style="pointer-events:none;">
                        <div class="mnv-check-body"><div class="mnv-check-label">Seluruh komponen data monev lengkap</div><div class="mnv-check-sub">Keterlisian &gt; 90%</div></div>
                        <span class="mnv-check-badge" id="mnv-badge-kelengkapan">+5 poin</span>
                    </div>
                    <div class="mnv-sub-group ${state.kelengkapanOk?'':'show'}" id="mnv-sub-kelengkapan">
                        <label class="input-label">📋 Kategori kekurangan</label>
                        <select class="form-input" id="mnv-sel-kualitas" onchange="mnvUpdateModalScore()">
                            <option value="2" ${(state.selKualitas||'2')==='2'?'selected':''}>Keterlisian 50%–90% (−2 poin → skor 3)</option>
                            <option value="3" ${state.selKualitas==='3'?'selected':''}>Keterlisian &lt; 50% (−3 poin → skor 2)</option>
                        </select>
                    </div>
                </div>

                <div class="mnv-score-section" style="border-left-color:#10b981;">
                    <div class="score-section-title">3️⃣ Capaian Fisik <span style="font-weight:400;color:#64748b;font-size:13px;">(Maks 10 poin)</span></div>
                    <div class="mnv-check-item mnv-check-checked" id="mnv-check-fisik-item" onclick="mnvToggleCheck('fisik',event)">
                        <input type="checkbox" id="mnv-check-fisik" ${state.fisikOk?'checked':''} onclick="mnvToggleCheck('fisik',event)" style="pointer-events:none;">
                        <div class="mnv-check-body"><div class="mnv-check-label">Capaian fisik sesuai target</div><div class="mnv-check-sub">Deviasi &lt; 5% dari target</div></div>
                        <span class="mnv-check-badge" id="mnv-badge-fisik">+10 poin</span>
                    </div>
                    <div class="mnv-sub-group ${state.fisikOk?'':'show'}" id="mnv-sub-fisik">
                        <label class="input-label">📊 Kategori deviasi fisik</label>
                        <select class="form-input" id="mnv-sel-deviasi-fisik" onchange="mnvUpdateModalScore()">
                            <option value="efisiensi" ${state.selDeviasiFisik==='efisiensi'?'selected':''}>Deviasi karena Efisiensi (skor tetap 10 ✓)</option>
                            <option value="5" ${(!state.selDeviasiFisik||state.selDeviasiFisik==='5')?'selected':''}>Deviasi ≥ 5% – &lt; 10% (−5 poin → skor 5)</option>
                            <option value="8" ${state.selDeviasiFisik==='8'?'selected':''}>Deviasi ≥ 10% (−8 poin → skor 2)</option>
                        </select>
                    </div>
                </div>

                <div class="mnv-score-section" style="border-left-color:#f59e0b;">
                    <div class="score-section-title">4️⃣ Capaian Keuangan <span style="font-weight:400;color:#64748b;font-size:13px;">(Maks 10 poin)</span></div>
                    <div class="mnv-check-item mnv-check-checked" id="mnv-check-keuangan-item" onclick="mnvToggleCheck('keuangan',event)">
                        <input type="checkbox" id="mnv-check-keuangan" ${state.keuanganOk?'checked':''} onclick="mnvToggleCheck('keuangan',event)" style="pointer-events:none;">
                        <div class="mnv-check-body"><div class="mnv-check-label">Capaian keuangan sesuai anggaran</div><div class="mnv-check-sub">Deviasi &lt; 5% dari anggaran</div></div>
                        <span class="mnv-check-badge" id="mnv-badge-keuangan">+10 poin</span>
                    </div>
                    <div class="mnv-sub-group ${state.keuanganOk?'':'show'}" id="mnv-sub-keuangan">
                        <label class="input-label">💰 Kategori deviasi keuangan</label>
                        <select class="form-input" id="mnv-sel-deviasi-keuangan" onchange="mnvUpdateModalScore()">
                            <option value="5" ${(state.selDeviasiKeuangan||'5')==='5'?'selected':''}>Deviasi ≥ 5% – &lt; 10% (−5 poin → skor 5)</option>
                            <option value="8" ${state.selDeviasiKeuangan==='8'?'selected':''}>Deviasi ≥ 10% (−8 poin → skor 2)</option>
                        </select>
                    </div>
                </div>

                <div class="mnv-score-section" style="border-left-color:#ec4899;">
                    <div class="score-section-title">5️⃣ Partisipasi PPTK <span style="font-weight:400;color:#64748b;font-size:13px;">(Maks 5 poin)</span></div>
                    <div class="mnv-check-item mnv-check-checked" id="mnv-check-partisipasi-item" onclick="mnvToggleCheck('partisipasi',event)">
                        <input type="checkbox" id="mnv-check-partisipasi" ${state.partisipasiOk?'checked':''} onclick="mnvToggleCheck('partisipasi',event)" style="pointer-events:none;">
                        <div class="mnv-check-body"><div class="mnv-check-label">PPTK hadir langsung dalam Desk Timbal Balik</div><div class="mnv-check-sub">Tidak diwakilkan</div></div>
                        <span class="mnv-check-badge" id="mnv-badge-partisipasi">+5 poin</span>
                    </div>
                    <div class="mnv-sub-group ${state.partisipasiOk?'':'show'}" id="mnv-sub-partisipasi">
                        <label class="input-label">👤 Kategori ketidakhadiran</label>
                        <select class="form-input" id="mnv-sel-partisipasi" onchange="mnvUpdateModalScore()">
                            <option value="diwakili" ${(state.selPartisipasi||'diwakili')==='diwakili'?'selected':''}>Diwakili Staf (−2 poin → skor 3)</option>
                            <option value="tidak-hadir" ${state.selPartisipasi==='tidak-hadir'?'selected':''}>Tidak Hadir sama sekali (−5 poin → skor 0)</option>
                        </select>
                    </div>
                </div>

                <div class="mnv-score-section" style="border-left-color:#06b6d4;">
                    <div class="score-section-title">6️⃣ Tindak Lanjut <span style="font-weight:400;color:#64748b;font-size:13px;">(Maks 5 poin)</span></div>
                    <div class="mnv-check-item mnv-check-checked" id="mnv-check-tindaklanjut-item" onclick="mnvToggleCheck('tindaklanjut',event)">
                        <input type="checkbox" id="mnv-check-tindaklanjut" ${state.tindakLanjutOk?'checked':''} onclick="mnvToggleCheck('tindaklanjut',event)" style="pointer-events:none;">
                        <div class="mnv-check-body"><div class="mnv-check-label">Tindak lanjut pasca Desk Timbal Balik sudah dilaksanakan</div><div class="mnv-check-sub">Rekomendasi diimplementasikan</div></div>
                        <span class="mnv-check-badge" id="mnv-badge-tindaklanjut">+5 poin</span>
                    </div>
                    <div class="mnv-sub-group ${state.tindakLanjutOk?'':'show'}" id="mnv-sub-tindaklanjut">
                        <p style="font-size:13px;color:#92400e;margin:0;padding:10px;background:#fef3c7;border-radius:6px;">⚠️ Tindak lanjut tidak dilaksanakan: <strong>0 poin</strong></p>
                    </div>
                </div>

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

                <div class="form-group">
                    <label class="input-label">📝 Catatan Tambahan (Opsional)</label>
                    <textarea class="form-textarea" id="mnv-input-catatan" rows="3" placeholder="Catatan tambahan...">${existing ? existing.catatan || '' : ''}</textarea>
                </div>

                <div style="background:#fafafa;border:1.5px dashed #cbd5e1;border-radius:10px;padding:16px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                        <div style="font-size:13px;font-weight:700;color:#374151;">📎 Bukti Penilaian <span style="background:#fef3c7;color:#92400e;font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;">Opsional · Multi-file</span></div>
                        <button onclick="mnvTriggerFileInput()" style="display:flex;align-items:center;gap:5px;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:600;color:#1e40af;cursor:pointer;">${ICONS.plus} Tambah File</button>
                    </div>
                    <input type="file" id="mnv-bukti-file-input" accept=".jpg,.jpeg,.png,.pdf" multiple style="display:none;" onchange="mnvHandleBuktiFileSelect(event)">
                    <div id="mnv-existing-files-list">${existingLinkBuktis.map((link, i) => renderExistingFileItem(link, i)).join('')}</div>
                    <div id="mnv-new-files-list" style="margin-top:${existingLinkBuktis.length > 0 ? '8px' : '0'}"></div>
                    <div id="mnv-drop-zone" style="border:2px dashed #e2e8f0;border-radius:8px;background:white;">
                        <div id="mnv-upload-empty-state" style="display:${existingLinkBuktis.length === 0 ? 'flex' : 'none'};flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;cursor:pointer;gap:6px;" onclick="mnvTriggerFileInput()">
                            <div style="font-size:30px;">📁</div>
                            <div style="font-size:13px;color:#64748b;text-align:center;"><strong style="color:#3b82f6;">Klik untuk pilih file</strong> atau seret ke sini</div>
                            <div style="font-size:11px;color:#94a3b8;">JPG · PNG · PDF | Maks. 10 MB per file</div>
                        </div>
                    </div>
                    <div id="mnv-bukti-file-error" style="display:none;font-size:12px;color:#ef4444;margin-top:6px;padding:6px 10px;background:#fee2e2;border-radius:5px;"></div>
                    <div id="mnv-upload-progress" style="display:none;margin-top:10px;">
                        <div style="height:4px;background:#e5e7eb;border-radius:10px;overflow:hidden;"><div id="mnv-upload-progress-fill" style="height:100%;background:linear-gradient(90deg,#3b82f6,#10b981);border-radius:10px;transition:width 0.3s;width:0%;"></div></div>
                        <div id="mnv-upload-progress-label" style="font-size:11px;color:#64748b;margin-top:4px;text-align:right;">Mengunggah...</div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="document.getElementById('mnv-assessModal').remove()" class="btn" style="flex:1;">Batal</button>
                <button onclick="mnvSubmitInputNilai()" id="mnv-submit-input-btn" class="btn ${isEdit ? 'btn-warning' : 'btn-success'}" style="flex:1;">${isEdit ? '💾 Update Penilaian' : '💾 Simpan Penilaian'}</button>
            </div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
        ['waktu','kelengkapan','fisik','keuangan','partisipasi','tindaklanjut'].forEach(k => window.mnvSyncCheckItem(k));
        window.mnvUpdateModalScore();
    };

    function renderExistingFileItem(link, index) {
        const short = link.length > 50 ? link.slice(0, 50) + '…' : link;
        return `<div id="mnv-existing-file-${index}" style="display:flex;align-items:center;gap:10px;background:white;border:1.5px solid #bfdbfe;border-radius:8px;padding:10px 12px;margin-bottom:6px;">
            <div style="width:32px;height:32px;border-radius:8px;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">📎</div>
            <div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:600;color:#1e293b;">File Bukti #${index + 1}</div><a href="${link}" target="_blank" rel="noopener" style="font-size:11px;color:#3b82f6;text-decoration:none;">🔗 ${short}</a></div>
            <button onclick="mnvDeleteExistingFile(${index})" style="background:#fff1f2;border:1px solid #fecdd3;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:600;color:#be123c;cursor:pointer;">🗑️</button>
        </div>`;
    }

    window.mnvTriggerFileInput = function () { document.getElementById('mnv-bukti-file-input').click(); };
    window.mnvDeleteExistingFile = function (index) {
        existingLinkBuktis.splice(index, 1);
        const list = document.getElementById('mnv-existing-files-list');
        if (list) list.innerHTML = existingLinkBuktis.map((l, i) => renderExistingFileItem(l, i)).join('');
        updateEmptyState();
    };
    window.mnvHandleBuktiFileSelect = function (event) {
        const files = Array.from(event.target.files);
        const errEl = document.getElementById('mnv-bukti-file-error');
        errEl.style.display = 'none';
        const allowed = ['image/jpeg','image/jpg','image/png','application/pdf'];
        files.forEach(file => {
            if (!allowed.includes(file.type)) { errEl.textContent = `❌ Format tidak didukung: ${file.name}`; errEl.style.display = 'block'; return; }
            if (file.size > MAX_FILE_SIZE) { errEl.textContent = `❌ File terlalu besar: ${file.name}`; errEl.style.display = 'block'; return; }
            const fileObj = { file, base64: null, id: 'nf_' + Date.now() + '_' + Math.random().toString(36).slice(2) };
            selectedBuktiFiles.push(fileObj);
            renderNewFileItem(fileObj);
            const reader = new FileReader();
            reader.onload = e => { fileObj.base64 = e.target.result.split(',')[1]; };
            reader.readAsDataURL(file);
        });
        event.target.value = '';
        updateEmptyState();
    };
    function renderNewFileItem(fileObj) {
        const list = document.getElementById('mnv-new-files-list');
        if (!list) return;
        const icon = fileObj.file.type === 'application/pdf' ? '📄' : '🖼️';
        const div = document.createElement('div');
        div.id = 'mnv-new-file-' + fileObj.id;
        div.style.cssText = 'display:flex;align-items:center;gap:10px;background:white;border:1.5px solid #bbf7d0;border-radius:8px;padding:10px 12px;margin-bottom:6px;';
        div.innerHTML = `<div style="width:32px;height:32px;border-radius:8px;background:#dcfce7;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${icon}</div><div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:600;color:#065f46;">${fileObj.file.name}</div><div style="font-size:11px;color:#94a3b8;">${window.mnvFormatFileSize(fileObj.file.size)} · Akan diupload</div></div><span style="font-size:11px;background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:10px;font-weight:600;">Baru</span><button onclick="mnvRemoveNewFile('${fileObj.id}')" style="background:#fff1f2;border:1px solid #fecdd3;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:600;color:#be123c;cursor:pointer;">✕</button>`;
        list.appendChild(div);
    }
    window.mnvRemoveNewFile = function (id) {
        selectedBuktiFiles = selectedBuktiFiles.filter(f => f.id !== id);
        document.getElementById('mnv-new-file-' + id)?.remove();
        updateEmptyState();
    };
    function updateEmptyState() {
        const emptyState = document.getElementById('mnv-upload-empty-state');
        if (!emptyState) return;
        emptyState.style.display = (existingLinkBuktis.length > 0 || selectedBuktiFiles.length > 0) ? 'none' : 'flex';
    }
    function mnvReadFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result.split(',')[1]);
            reader.onerror = () => reject(new Error('Gagal membaca file'));
            reader.readAsDataURL(file);
        });
    }

    // ─── SUBMIT ─────────────────────────────────────────────
    window.mnvSubmitInputNilai = async function () {
        const bulan = document.getElementById('mnv-select-bulan-input').value;
        const unit = document.getElementById('mnv-input-unit').value;
        if (!unit || !bulan) { if (window.showToast) showToast('Data tidak lengkap', 'error'); return; }

        const state = mnvGetModalState();
        const scores = calcScores(state);
        const catatan = document.getElementById('mnv-input-catatan').value;

        const submitBtn = document.getElementById('mnv-submit-input-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';

        let finalLinks = [...existingLinkBuktis];

        if (selectedBuktiFiles.length > 0) {
            window.mnvSetUploadProgress(10, 'Membaca file...');
            for (let i = 0; i < selectedBuktiFiles.length; i++) {
                const fileObj = selectedBuktiFiles[i];
                try {
                    let base64 = fileObj.base64 || (await mnvReadFileAsBase64(fileObj.file));
                    const pct = 10 + Math.round(((i + 1) / selectedBuktiFiles.length) * 70);
                    window.mnvSetUploadProgress(pct, `Mengunggah file ${i + 1}/${selectedBuktiFiles.length}...`);
                    const ext = fileObj.file.name.split('.').pop().toLowerCase();
                    const safeUnit = unit.replace(/[^a-zA-Z0-9]/g, '_');
                    const payload = {
                        action: 'uploadAndSave', bulan, unit,
                        waktu: scores.waktu, kelengkapan: scores.kelengkapan,
                        fisik: scores.fisik, keuangan: scores.keuangan,
                        partisipasi: scores.partisipasi, tindakLanjut: scores.tindakLanjut,
                        total: scores.total, catatan, penilai: currentUser.name || 'Admin',
                        fileName: `MONEV_${bulan}_${safeUnit}_${Date.now()}.${ext}`,
                        mimeType: fileObj.file.type, fileData: base64,
                        existingLinkBukti: serializeLinks(finalLinks)
                    };
                    const result = await callAPIPost(payload);
                    if (result && result.status === 'success' && result.linkBukti) finalLinks.push(result.linkBukti);
                    else if (result && result.status !== 'success') if (window.showToast) showToast(`Gagal upload file ${i+1}: ${result?.message||''}`, 'error');
                } catch (err) { if (window.showToast) showToast(`Gagal upload file ${i+1}: ${err.message}`, 'error'); }
            }
        }

        window.mnvSetUploadProgress(90, 'Menyimpan data...');
        try {
            const savePayload = {
                action: 'uploadAndSave', bulan, unit,
                waktu: scores.waktu, kelengkapan: scores.kelengkapan,
                fisik: scores.fisik, keuangan: scores.keuangan,
                partisipasi: scores.partisipasi, tindakLanjut: scores.tindakLanjut,
                total: scores.total, catatan, penilai: currentUser.name || 'Admin',
                fileName: '', mimeType: '', fileData: '',
                existingLinkBukti: serializeLinks(finalLinks)
            };
            const result = await callAPIPost(savePayload);
            if (result && result.status !== 'success') {
                if (window.showToast) showToast('Gagal simpan: ' + (result?.message || ''), 'error');
                submitBtn.disabled = false; submitBtn.innerHTML = '💾 Simpan Penilaian';
                window.mnvHideUploadProgress(); return;
            }
        } catch (err) {
            if (window.showToast) showToast('Gagal menghubungi server: ' + err.message, 'error');
            submitBtn.disabled = false; submitBtn.innerHTML = '💾 Simpan Penilaian';
            window.mnvHideUploadProgress(); return;
        }

        const localData = getLocalData();
        if (!localData[bulan]) localData[bulan] = {};
        localData[bulan][unit] = { ...scores, catatan, linkBukti: serializeLinks(finalLinks), _state: state };

        // Update rata-rata sekretariat di local cache jika unit adalah sub-bagian
        if (isSekreSub(unit)) {
            const sekreVals = SEKRE_UNITS.map(u => localData[bulan][u]).filter(Boolean);
            if (sekreVals.length > 0) {
                const avgTotal = sekreVals.reduce((a, u) => a + (u.total || 0), 0) / sekreVals.length;
                localData[bulan]['Sekretariat'] = {
                    waktu: parseFloat((sekreVals.reduce((a,u)=>a+(u.waktu||0),0)/sekreVals.length).toFixed(2)),
                    kelengkapan: parseFloat((sekreVals.reduce((a,u)=>a+(u.kelengkapan||0),0)/sekreVals.length).toFixed(2)),
                    fisik: parseFloat((sekreVals.reduce((a,u)=>a+(u.fisik||0),0)/sekreVals.length).toFixed(2)),
                    keuangan: parseFloat((sekreVals.reduce((a,u)=>a+(u.keuangan||0),0)/sekreVals.length).toFixed(2)),
                    partisipasi: parseFloat((sekreVals.reduce((a,u)=>a+(u.partisipasi||0),0)/sekreVals.length).toFixed(2)),
                    tindakLanjut: parseFloat((sekreVals.reduce((a,u)=>a+(u.tindakLanjut||0),0)/sekreVals.length).toFixed(2)),
                    total: parseFloat(avgTotal.toFixed(2)),
                    catatan: '', penilai: '', linkBukti: '', isAverage: true
                };
            }
        }
        setLocalData(localData);

        window.mnvHideUploadProgress();
        document.getElementById('mnv-assessModal')?.remove();
        if (window.showToast) showToast(`Nilai ${unit} bulan ${bulan} berhasil disimpan!`, 'success');
        window.mnvLoadDataFromServer();
    };

    // ─── DELETE ──────────────────────────────────────────────
    window.mnvDeleteEntry = function (unit, bulan) {
        showConfirmModal({
            icon: '🗑️', title: 'Hapus Penilaian Monev?',
            message: `Unit: <strong>${unit}</strong><br>Bulan: <strong>${bulan}</strong><br><br><span style="color:#ef4444;font-weight:600;">Tindakan ini tidak dapat dibatalkan.</span>`,
            confirmText: 'Ya, Hapus', confirmClass: 'btn-danger',
        }, async () => {
            const data = getLocalData();
            if (data[bulan]) {
                delete data[bulan][unit];
                // Recalculate sekretariat average
                if (isSekreSub(unit)) {
                    const sekreVals = SEKRE_UNITS.map(u => data[bulan] && data[bulan][u]).filter(Boolean);
                    if (sekreVals.length > 0) {
                        data[bulan]['Sekretariat'] = { total: parseFloat((sekreVals.reduce((a,u)=>a+(u.total||0),0)/sekreVals.length).toFixed(2)), isAverage: true };
                    } else {
                        delete data[bulan]['Sekretariat'];
                    }
                }
            }
            setLocalData(data);
            window.mnvRenderInputTable(bulan); window.mnvUpdateStats(bulan);
            try {
                const result = await callAPIPost({ action: 'deleteMonevData', bulan, unit });
                if (result && result.status === 'success') { if (window.showToast) showToast(`Data ${unit} bulan ${bulan} berhasil dihapus.`, 'success'); }
                else if (window.showToast) showToast('Hapus lokal berhasil, tapi gagal di server', 'error');
            } catch (err) { if (window.showToast) showToast('Hapus lokal berhasil, tapi gagal koneksi server', 'error'); }
        });
    };

    // ─── REKAP (Tab 2) ───────────────────────────────────────
    window.mnvRenderRekap = function () {
        const ct1 = document.getElementById('mnv-chartIndikator');
        const ct2 = document.getElementById('mnv-chartTotal');
        const tbody = document.getElementById('mnv-rekap-tbody');
        if (!ct1 || !ct2 || !tbody) return;

        const bulan = document.getElementById('mnv-select-bulan-rekap').value;
        const data = getLocalData();
        const monthData = (bulan && data[bulan]) ? data[bulan] : {};

        const v = (unit, field) => (monthData[unit]?.[field]) || 0;
        const w  = UNITS.map(u => v(u, 'waktu'));
        const kl = UNITS.map(u => v(u, 'kelengkapan'));
        const f  = UNITS.map(u => v(u, 'fisik'));
        const ke = UNITS.map(u => v(u, 'keuangan'));
        const p  = UNITS.map(u => v(u, 'partisipasi'));
        const tl = UNITS.map(u => v(u, 'tindakLanjut'));
        const tot= UNITS.map(u => v(u, 'total'));

        const nonSekreRows = buildRekapRows(NON_SEKRE_UNITS, monthData, false, bulan);
        const sekreVals = SEKRE_UNITS.map(u => monthData[u]).filter(Boolean);
        const sekreDinilai = sekreVals.length;
        const sekreFallback = monthData['Sekretariat'];
        const sekreAvgRekap = sekreDinilai > 0
            ? (sekreVals.reduce((a,u)=>a+(u.total||0),0)/sekreDinilai).toFixed(1)
            : sekreFallback ? sekreFallback.total.toFixed(1) : '—';
        const sekreRows = buildRekapRows(SEKRE_UNITS, monthData, true, bulan, sekreFallback);

        let sekreSubTotal = '';
        if (sekreDinilai > 0) {
            const avg = field => (sekreVals.reduce((a,u)=>a+(u[field]||0),0)/sekreDinilai).toFixed(1);
            const avgTot = parseFloat((sekreVals.reduce((a,u)=>a+(u.total||0),0)/sekreDinilai).toFixed(1));
            const totColor = avgTot>=35?'#065f46':avgTot>=25?'#92400e':'#991b1b';
            sekreSubTotal = `<tr id="mnv-rekap-sekre-subtotal" class="mnv-rekap-sekre-sub" style="display:none;background:#dbeafe;border-top:2px solid #93c5fd;">
                <td colspan="2" style="font-weight:700;color:#1e3a8a;font-size:12px;padding:10px 12px 10px 36px;">∑ Rata-rata Sekretariat (${sekreDinilai}/${SEKRE_UNITS.length} sub-bagian)</td>
                <td class="rekap-good">${avg('waktu')}</td><td class="rekap-good">${avg('kelengkapan')}</td>
                <td class="rekap-good">${avg('fisik')}</td><td class="rekap-good">${avg('keuangan')}</td>
                <td class="rekap-good">${avg('partisipasi')}</td><td class="rekap-good">${avg('tindakLanjut')}</td>
                <td style="font-weight:700;color:${totColor};">${avgTot}</td>
            </tr>`;
        }

        tbody.innerHTML = nonSekreRows +
            `<tr class="mnv-rekap-sekre-header" onclick="mnvToggleRekapSekre()" style="cursor:pointer;background:#eff6ff;border-top:2px solid #bfdbfe;">
                <td colspan="2" style="padding:10px 12px;font-weight:700;color:#1e3a8a;font-size:12px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span id="mnv-rekap-sekre-arrow" style="transition:transform .2s;display:inline-flex;">${ICONS.chevronRight}</span>
                        📂 Sekretariat (3 Sub-Bagian) ${sekreDinilai>0?`· Rata-rata: <span style="color:#1e40af;">${sekreAvg}</span>`:''}
                        <span style="font-size:10px;background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:8px;">Data di SEKRETARIAT_DATA</span>
                    </div>
                </td>
                <td colspan="7" style="font-size:11px;color:#3b82f6;font-weight:500;">${sekreRekapExpanded?'▲ Sembunyikan':'▼ Klik untuk detail'}</td>
            </tr>` + sekreRows + sekreSubTotal;

        if (sekreRekapExpanded) {
            document.querySelectorAll('.mnv-rekap-sekre-sub').forEach(r => r.style.display = '');
            const arrow = document.getElementById('mnv-rekap-sekre-arrow');
            if (arrow) arrow.style.transform = 'rotate(90deg)';
        }

        if (chartIndikator) chartIndikator.destroy();
        if (chartTotal) chartTotal.destroy();

        chartIndikator = new Chart(ct1.getContext('2d'), {
            type: 'bar',
            data: {
                labels: SHORT_UNITS,
                datasets: [
                    { label: 'Ket.Waktu',     data: w,  backgroundColor: '#3b82f6' },
                    { label: 'Kelengkapan',   data: kl, backgroundColor: '#8b5cf6' },
                    { label: 'Fisik',         data: f,  backgroundColor: '#10b981' },
                    { label: 'Keuangan',      data: ke, backgroundColor: '#f59e0b' },
                    { label: 'Partisipasi',   data: p,  backgroundColor: '#ec4899' },
                    { label: 'Tindak Lanjut', data: tl, backgroundColor: '#06b6d4' }
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
                datasets: [{ label: 'Total', data: tot, borderRadius: 6,
                    backgroundColor: tot.map(v => v >= 35 ? '#10b981' : v >= 25 ? '#f59e0b' : v > 0 ? '#ef4444' : '#e2e8f0') }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `Nilai: ${ctx.parsed.y}/40` } } },
                scales: { y: { beginAtZero: true, max: 40, ticks: { stepSize: 5 } } }
            }
        });
    };

    window.mnvToggleRekapSekre = function () {
        sekreRekapExpanded = !sekreRekapExpanded;
        document.querySelectorAll('.mnv-rekap-sekre-sub').forEach(r => r.style.display = sekreRekapExpanded ? '' : 'none');
        const arrow = document.getElementById('mnv-rekap-sekre-arrow');
        if (arrow) arrow.style.transform = sekreRekapExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
        const hdr = document.querySelector('.mnv-rekap-sekre-header td:last-child');
        if (hdr) hdr.textContent = sekreRekapExpanded ? '▲ Sembunyikan' : '▼ Klik untuk detail';
    };

    function buildRekapRows(units, monthData, isSekre, bulan, sekreFallback) {
        const v = (u, f) => {
            if (monthData[u]) return monthData[u][f] || 0;
            if (isSekre && sekreFallback) return sekreFallback[f] || 0; // fallback rata-rata
            return 0;
        };
        const subClass = isSekre ? 'mnv-rekap-sekre-sub' : '';
        const subStyle = isSekre ? 'display:none;' : '';
        return units.map(unit => {
            const label = isSekre ? unit.replace('Sekretariat - ', '') : unit;
            const padLeft = isSekre ? 'padding-left:28px;' : '';
            const bgStyle = isSekre ? 'background:#f8fafc;' : '';
            const sekreTag = isSekre ? '<span style="font-size:10px;background:#dbeafe;color:#1e40af;padding:1px 6px;border-radius:6px;margin-left:4px;">SEKRETARIAT_DATA</span>' : '';
            const w=v(unit,'waktu'),kl=v(unit,'kelengkapan'),f_=v(unit,'fisik'),
                  ke=v(unit,'keuangan'),pp=v(unit,'partisipasi'),tl_=v(unit,'tindakLanjut'),tot=v(unit,'total');
            const totColor = tot>=35?'#065f46':tot>=25?'#92400e':'#991b1b';
            return `<tr class="${subClass}" style="${subStyle}${bgStyle}">
                <td style="font-weight:500;text-align:left;${padLeft}">${label}${sekreTag}</td>
                <td style="text-align:left;font-size:11px;color:#64748b;">${bulan||'—'}</td>
                <td class="${w<5?'rekap-bad':'rekap-good'}">${w}</td>
                <td class="${kl<5?'rekap-bad':'rekap-good'}">${kl}</td>
                <td class="${f_<10?'rekap-bad':'rekap-good'}">${f_}</td>
                <td class="${ke<10?'rekap-bad':'rekap-good'}">${ke}</td>
                <td class="${pp<5?'rekap-bad':'rekap-good'}">${pp}</td>
                <td class="${tl_<5?'rekap-bad':'rekap-good'}">${tl_}</td>
                <td style="font-weight:700;color:${totColor};">${tot}</td>
            </tr>`;
        }).join('');
    }

    // ─── REKAP TRIWULAN (Tab 3) — WITH CHARTS ────────────────
    window.mnvRenderTriwulan = function () {
        const container = document.getElementById('mnv-triwulan-content');
        if (!container) return;

        const data = getLocalData();
        const twKeys = Object.keys(TRIWULAN);
        const twColors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
        const twBgs   = ['#eff6ff', '#f0fdf4', '#fffbeb', '#fdf2f8'];

        // Semua unit untuk tampilan triwulan (non-sekre + sekretariat sebagai rata-rata)
        const displayUnits = [
            ...NON_SEKRE_UNITS,
            'Sekretariat' // combined average
        ];
        const displayShort = ['BLUT', 'Kewirausahaan', 'Koperasi', 'UKM', 'Usaha Mikro', 'Sekretariat'];

        // Helper: rata-rata total unit untuk sekumpulan bulan
        function calcUnitTW(unit, months) {
            if (unit === 'Sekretariat') {
                // Rata-rata dari sub-bagian yang ada datanya
                const subAvgs = SEKRE_UNITS.map(sub => {
                    const vals = months.map(m => data[m]?.[sub]?.total).filter(v => v !== undefined && v !== null && v > 0);
                    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
                }).filter(v => v !== null);
                return subAvgs.length ? parseFloat((subAvgs.reduce((a,b)=>a+b,0)/subAvgs.length).toFixed(1)) : null;
            }
            const vals = months.map(m => data[m]?.[unit]?.total).filter(v => v !== undefined && v !== null && v > 0);
            return vals.length ? parseFloat((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)) : null;
        }

        // Helper: rata-rata per indikator untuk sekumpulan bulan
        function calcUnitTWIndikator(unit, months, field) {
            if (unit === 'Sekretariat') {
                const subAvgs = SEKRE_UNITS.map(sub => {
                    const vals = months.map(m => data[m]?.[sub]?.[field]).filter(v => v !== undefined && v !== null && v > 0);
                    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
                }).filter(v => v !== null);
                return subAvgs.length ? parseFloat((subAvgs.reduce((a,b)=>a+b,0)/subAvgs.length).toFixed(1)) : 0;
            }
            const vals = months.map(m => data[m]?.[unit]?.[field]).filter(v => v !== undefined && v !== null);
            return vals.length ? parseFloat((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)) : 0;
        }

        // Build grid data
        const grid = displayUnits.map(unit => {
            const twData = twKeys.map(tw => calcUnitTW(unit, TRIWULAN[tw]));
            const allVals = twData.filter(v => v !== null);
            return { unit, twData, best: allVals.length ? Math.max(...allVals) : null, worst: allVals.length ? Math.min(...allVals) : null };
        });

        // Per TW summary
        const twSummaries = twKeys.map((tw, twIdx) => {
            const vals = grid.map(r => ({ unit: r.unit, val: r.twData[twIdx] })).filter(r => r.val !== null);
            vals.sort((a,b) => b.val - a.val);
            return { tw, highest: vals[0]||null, lowest: vals[vals.length-1]||null, avg: vals.length?(vals.reduce((a,r)=>a+r.val,0)/vals.length).toFixed(1):'—', assessed: vals.length };
        });

        // Chart data per TW
        const twSelected = document.getElementById('mnv-tw-select')?.value || 'TW I';
        const twSelectedMonths = TRIWULAN[twSelected];

        const chartWaktu   = displayUnits.map(u => calcUnitTWIndikator(u, twSelectedMonths, 'waktu'));
        const chartKlgkpn  = displayUnits.map(u => calcUnitTWIndikator(u, twSelectedMonths, 'kelengkapan'));
        const chartFisik   = displayUnits.map(u => calcUnitTWIndikator(u, twSelectedMonths, 'fisik'));
        const chartKeuangan= displayUnits.map(u => calcUnitTWIndikator(u, twSelectedMonths, 'keuangan'));
        const chartPart    = displayUnits.map(u => calcUnitTWIndikator(u, twSelectedMonths, 'partisipasi'));
        const chartTL      = displayUnits.map(u => calcUnitTWIndikator(u, twSelectedMonths, 'tindakLanjut'));
        const chartTotData = displayUnits.map(u => calcUnitTW(u, twSelectedMonths) || 0);

        // Summary cards
        const summaryCards = twSummaries.map((s, i) => `
        <div style="background:${twBgs[i]};border:1.5px solid ${twColors[i]}33;border-radius:12px;padding:16px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${twColors[i]};margin-bottom:6px;">${s.tw}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:10px;">${TRIWULAN[s.tw][0].slice(0,3)} – ${TRIWULAN[s.tw][2].slice(0,3)}</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="background:white;border-radius:8px;padding:8px 10px;border:1px solid #e5e7eb;">
                    <div style="font-size:10px;color:#64748b;font-weight:600;margin-bottom:2px;">🏆 TERTINGGI</div>
                    ${s.highest?`<div style="font-size:12px;font-weight:700;color:#065f46;">${s.highest.unit==='Sekretariat'?'Sekretariat':s.highest.unit.replace('Bidang ','').replace('Balai Layanan Usaha Terpadu KUMKM','BLUT')}</div><div style="font-size:18px;font-weight:800;color:${twColors[i]};">${s.highest.val}<span style="font-size:11px;color:#94a3b8;">/40</span></div>`:'<div style="color:#94a3b8;font-size:12px;">Belum ada data</div>'}
                </div>
                <div style="background:white;border-radius:8px;padding:8px 10px;border:1px solid #e5e7eb;">
                    <div style="font-size:10px;color:#64748b;font-weight:600;margin-bottom:2px;">📉 TERENDAH</div>
                    ${s.lowest&&s.lowest!==s.highest?`<div style="font-size:12px;font-weight:700;color:#991b1b;">${s.lowest.unit==='Sekretariat'?'Sekretariat':s.lowest.unit.replace('Bidang ','').replace('Balai Layanan Usaha Terpadu KUMKM','BLUT')}</div><div style="font-size:18px;font-weight:800;color:#ef4444;">${s.lowest.val}<span style="font-size:11px;color:#94a3b8;">/40</span></div>`:'<div style="color:#94a3b8;font-size:12px;">Belum ada data</div>'}
                </div>
                <div style="text-align:center;padding:6px;background:white;border-radius:8px;border:1px solid #e5e7eb;">
                    <div style="font-size:10px;color:#64748b;margin-bottom:2px;">Rata-rata</div>
                    <div style="font-size:16px;font-weight:700;color:${twColors[i]};">${s.avg}</div>
                    <div style="font-size:10px;color:#94a3b8;">${s.assessed} unit dinilai</div>
                </div>
            </div>
        </div>`).join('');

        // Detail table rows
        const tableRows = grid.map(row => {
            const shortUnit = row.unit === 'Sekretariat' ? '📂 Sekretariat' : row.unit.replace('Balai Layanan Usaha Terpadu KUMKM','BLUT').replace('Bidang ','');
            const twCells = row.twData.map((val, i) => {
                if (val === null) return `<td style="text-align:center;color:#94a3b8;font-size:12px;">—</td>`;
                const isBest = val === row.best && row.best !== null;
                const isWorst = val === row.worst && row.worst !== null && row.best !== row.worst;
                const color = val>=35?'#065f46':val>=25?'#92400e':'#991b1b';
                return `<td style="text-align:center;">
                    <div style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;">
                        <span style="font-weight:700;color:${color};font-size:15px;">${val}</span>
                        ${isBest?'<span style="font-size:9px;background:#dcfce7;color:#15803d;padding:1px 5px;border-radius:6px;font-weight:600;">BEST</span>':''}
                        ${isWorst?'<span style="font-size:9px;background:#fee2e2;color:#991b1b;padding:1px 5px;border-radius:6px;font-weight:600;">LOW</span>':''}
                    </div>
                </td>`;
            }).join('');
            const filledVals = row.twData.filter(v => v !== null);
            const annualAvg = filledVals.length ? (filledVals.reduce((a,b)=>a+b,0)/filledVals.length).toFixed(1) : '—';
            const annualColor = parseFloat(annualAvg)>=35?'#065f46':parseFloat(annualAvg)>=25?'#92400e':'#991b1b';
            return `<tr>
                <td style="font-weight:600;font-size:13px;">${shortUnit}</td>
                ${twCells}
                <td style="text-align:center;"><strong style="font-size:15px;color:${annualColor};">${annualAvg}</strong></td>
            </tr>`;
        }).join('');

        const twHeaderCells = twKeys.map((tw, i) => `<th style="text-align:center;background:${twBgs[i]};color:${twColors[i]};">${tw}<br><small style="opacity:.7;font-size:10px;">${TRIWULAN[tw][0].slice(0,3)}-${TRIWULAN[tw][2].slice(0,3)}</small></th>`).join('');

        container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px;">
            ${summaryCards}
        </div>

        <!-- CHART SECTION -->
        <div class="card" style="margin-bottom:20px;">
            <div class="card-header">
                <h3 class="card-title">📊 Chart Rekapitulasi Triwulan</h3>
                <div style="display:flex;align-items:center;gap:8px;">
                    <label style="font-size:13px;color:#64748b;font-weight:600;">Pilih Triwulan:</label>
                    <select class="select-input" id="mnv-tw-select" onchange="mnvRenderTriwulan()" style="min-width:120px;">
                        ${twKeys.map(tw => `<option value="${tw}" ${tw===twSelected?'selected':''}>${tw} (${TRIWULAN[tw][0].slice(0,3)}–${TRIWULAN[tw][2].slice(0,3)})</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="card-content">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div>
                        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:10px;">Distribusi Per Indikator — ${twSelected}</div>
                        <div class="chart-container"><canvas id="mnv-tw-chartIndikator" role="img" aria-label="Chart indikator triwulan">Distribusi indikator per unit pada ${twSelected}.</canvas></div>
                    </div>
                    <div>
                        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:10px;">Total Nilai Per Unit — ${twSelected}</div>
                        <div class="chart-container"><canvas id="mnv-tw-chartTotal" role="img" aria-label="Chart total nilai triwulan">Total nilai per unit pada ${twSelected}.</canvas></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- DETAIL TABLE -->
        <div class="card" style="margin-bottom:0;">
            <div class="card-header">
                <h3 class="card-title">📋 Rekap Nilai Per Triwulan — Semua Unit</h3>
                <span style="font-size:12px;color:#64748b;">Rata-rata nilai dari bulan-bulan yang sudah diisi</span>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left;padding:10px 12px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:700;min-width:140px;">Unit / Bidang</th>
                            ${twHeaderCells}
                            <th style="text-align:center;background:#1a2942;color:white;font-size:12px;">Rata-rata<br>Tahunan</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
            <div style="padding:12px 16px;border-top:1px solid #f1f5f9;font-size:12px;color:#64748b;display:flex;gap:16px;flex-wrap:wrap;">
                <span>🏆 <strong>BEST</strong> = nilai tertinggi unit tsb dalam setahun</span>
                <span>📉 <strong>LOW</strong> = nilai terendah unit tsb</span>
                <span>≥35 = <span style="color:#065f46;font-weight:600;">Baik</span> · ≥25 = <span style="color:#92400e;font-weight:600;">Cukup</span> · &lt;25 = <span style="color:#991b1b;font-weight:600;">Kurang</span></span>
                <span style="color:#3b82f6;">📋 Data Sekretariat bersumber dari sheet SEKRETARIAT_DATA</span>
            </div>
        </div>`;

        // Render charts setelah DOM ada
        setTimeout(() => {
            if (chartTwIndikator) chartTwIndikator.destroy();
            if (chartTwTotal) chartTwTotal.destroy();

            const ctx1 = document.getElementById('mnv-tw-chartIndikator');
            const ctx2 = document.getElementById('mnv-tw-chartTotal');
            if (!ctx1 || !ctx2) return;

            chartTwIndikator = new Chart(ctx1.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: displayShort,
                    datasets: [
                        { label: 'Ket.Waktu',     data: chartWaktu,    backgroundColor: '#3b82f6' },
                        { label: 'Kelengkapan',   data: chartKlgkpn,   backgroundColor: '#8b5cf6' },
                        { label: 'Fisik',         data: chartFisik,    backgroundColor: '#10b981' },
                        { label: 'Keuangan',      data: chartKeuangan, backgroundColor: '#f59e0b' },
                        { label: 'Partisipasi',   data: chartPart,     backgroundColor: '#ec4899' },
                        { label: 'Tindak Lanjut', data: chartTL,       backgroundColor: '#06b6d4' }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } } },
                    scales: { x: { stacked: true, ticks: { font: { size: 10 } } }, y: { stacked: true, beginAtZero: true, max: 40 } }
                }
            });

            chartTwTotal = new Chart(ctx2.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: displayShort,
                    datasets: [{ label: 'Total', data: chartTotData, borderRadius: 6,
                        backgroundColor: chartTotData.map(v => v >= 35 ? '#10b981' : v >= 25 ? '#f59e0b' : v > 0 ? '#ef4444' : '#e2e8f0') }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `Nilai: ${ctx.parsed.y.toFixed(1)}/40` } } },
                    scales: { y: { beginAtZero: true, max: 40, ticks: { stepSize: 5 } }, x: { ticks: { font: { size: 10 } } } }
                }
            });
        }, 100);
    };

    // ─── FILE HELPERS ────────────────────────────────────────
    window.mnvFormatFileSize = function (b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(2) + ' MB';
    };
    window.mnvSetUploadProgress = function (pct, label) {
        document.getElementById('mnv-upload-progress')?.style && (document.getElementById('mnv-upload-progress').style.display = 'block');
        const fill = document.getElementById('mnv-upload-progress-fill');
        if (fill) fill.style.width = pct + '%';
        const lbl = document.getElementById('mnv-upload-progress-label');
        if (lbl) lbl.textContent = label;
    };
    window.mnvHideUploadProgress = function () {
        document.getElementById('mnv-upload-progress')?.style && (document.getElementById('mnv-upload-progress').style.display = 'none');
        const fill = document.getElementById('mnv-upload-progress-fill');
        if (fill) fill.style.width = '0%';
    };

    // ─── HTML INJECTION & INIT ───────────────────────────────
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['monev'] = function () {
        const section = document.getElementById('section-monev');
        if (!section) return;

        section.innerHTML = `
<style>
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
.action-buttons { display:flex; gap:4px; }
.btn-icon-group { display:flex; gap:4px; }
.btn-icon { width:30px; height:30px; display:inline-flex; align-items:center; justify-content:center; border-radius:7px; border:none; cursor:pointer; transition:background .15s, transform .1s; }
.btn-icon:active { transform:scale(.93); }
.btn-icon-approve { background:#dcfce7; color:#15803d; } .btn-icon-approve:hover { background:#bbf7d0; }
.btn-icon-view    { background:#dbeafe; color:#1e40af; } .btn-icon-view:hover { background:#bfdbfe; }
.btn-icon-edit    { background:#fef9c3; color:#a16207; } .btn-icon-edit:hover { background:#fde68a; }
.btn-icon-delete  { background:#fee2e2; color:#991b1b; } .btn-icon-delete:hover { background:#fecaca; }
.mnv-sekre-accordion-header:hover { background:#dbeafe !important; }
.mnv-detail-section { background:#f8fafc; border-radius:10px; padding:14px; border:1px solid #f1f5f9; display:flex; flex-direction:column; gap:8px; }
.mnv-detail-section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#94a3b8; margin-bottom:4px; display:flex; align-items:center; gap:6px; }
.krs-score-row { display:flex; align-items:flex-start; gap:10px; padding:10px; background:white; border-radius:8px; border:1px solid #f1f5f9; }
.krs-score-row-label { display:flex; align-items:center; gap:6px; font-weight:600; font-size:12px; color:#1e293b; min-width:100px; flex-shrink:0; }
.krs-score-badge { width:20px; height:20px; border-radius:50%; font-size:11px; font-weight:700; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }
.krs-score-row-detail { flex:1; display:flex; flex-direction:column; gap:4px; }
.krs-score-sub-row { display:flex; align-items:center; justify-content:space-between; font-size:12.5px; color:#64748b; }
.krs-score-chip { font-size:14px; font-weight:800; padding:5px 10px; border-radius:8px; flex-shrink:0; }
.krs-file-item { display:flex; align-items:center; gap:10px; padding:10px 12px; background:white; border:1px solid #e2e8f0; border-radius:8px; text-decoration:none; color:inherit; }
.krs-file-item:hover { border-color:#3b82f6; }
.krs-file-icon { width:32px; height:32px; border-radius:8px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.krs-file-info { flex:1; min-width:0; }
.krs-file-label { font-size:13px; font-weight:600; color:#1e293b; }
.krs-file-url { font-size:11px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.krs-file-arrow { font-size:18px; color:#cbd5e1; flex-shrink:0; }
.rekap-table td, .rekap-table th { padding:8px 10px; text-align:center; border-bottom:1px solid #f1f5f9; font-size:12px; }
.rekap-table th { background:#f8fafc; font-weight:700; font-size:11px; color:#64748b; }
.rekap-table td:first-child, .rekap-table th:first-child { text-align:left; }
.rekap-good { color:#065f46; background:#f0fdf4; font-weight:600; }
.rekap-bad  { color:#991b1b; background:#fff1f2; font-weight:600; }
.mnv-rekap-sekre-header:hover { background:#dbeafe !important; }
</style>

<div class="container">
    <div class="section-page-header">
        <h1 class="section-page-title">Penilaian Monitoring &amp; Evaluasi</h1>
        <p class="section-page-subtitle">Sistem penilaian 6 indikator. Data sub-bagian Sekretariat tersimpan di sheet terpisah (SEKRETARIAT_DATA).</p>
    </div>
    <div class="last-updated-bar" id="mnv-last-updated-bar"></div>
    <div class="stats-grid">
        <div class="stat-card" style="border-left:4px solid #1F4E79;"><div class="stat-label">Skor Maksimum</div><div class="stat-value">40</div><div class="stat-footer">Per unit per bulan</div></div>
        <div class="stat-card" style="border-left:4px solid #10b981;"><div class="stat-label">Rata-rata Bulan Ini</div><div class="stat-value" id="mnv-avg-score-this-month">—</div><div class="stat-footer">Dari unit dinilai</div></div>
        <div class="stat-card" style="border-left:4px solid #f59e0b;"><div class="stat-label">Unit Dinilai</div><div class="stat-value" id="mnv-units-assessed">0</div><div class="stat-footer">Bulan ini</div></div>
        <div class="stat-card" style="border-left:4px solid #ef4444;"><div class="stat-label">Unit Belum Dinilai</div><div class="stat-value" id="mnv-units-pending">${UNITS.length}</div><div class="stat-footer">Menunggu penilaian</div></div>
    </div>
    <div class="tabs">
        <button class="tab active" onclick="mnvSwitchTab('input', event)">📥 Input Penilaian</button>
        <button class="tab" onclick="mnvSwitchTab('rekap', event)">📊 Rekapitulasi</button>
        <button class="tab" onclick="mnvSwitchTab('triwulan', event)">📅 Rekap Triwulan</button>
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
                    <button onclick="mnvLoadDataFromServer()" class="btn btn-sm" title="Refresh">${ICONS.refresh} Refresh</button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Unit / Bidang</th><th>Rincian Skor</th><th>Total</th>
                            <th>Status</th><th>Bukti</th><th>Catatan</th><th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="mnv-input-tbody">
                        <tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;"><div class="spinner"></div><div style="margin-top:12px;">Memuat data...</div></td></tr>
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
                    <div class="card" style="margin:0;"><div class="card-header" style="padding:16px;"><h3 style="font-size:15px;font-weight:600;">Distribusi Per Indikator</h3></div><div class="card-content"><div class="chart-container"><canvas id="mnv-chartIndikator"></canvas></div></div></div>
                    <div class="card" style="margin:0;"><div class="card-header" style="padding:16px;"><h3 style="font-size:15px;font-weight:600;">Total Nilai Per Unit</h3></div><div class="card-content"><div class="chart-container"><canvas id="mnv-chartTotal"></canvas></div></div></div>
                </div>
                <div style="overflow-x:auto;margin-top:16px;">
                    <table class="rekap-table" style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr>
                                <th style="text-align:left;min-width:140px;">Unit / Bidang</th><th>Bulan</th>
                                <th>Waktu<br><small style="opacity:.6">/5</small></th>
                                <th>Klgkpn<br><small style="opacity:.6">/5</small></th>
                                <th>Fisik<br><small style="opacity:.6">/10</small></th>
                                <th>Keuangan<br><small style="opacity:.6">/10</small></th>
                                <th>Partisipasi<br><small style="opacity:.6">/5</small></th>
                                <th>Tindak Lanjut<br><small style="opacity:.6">/5</small></th>
                                <th>Total<br><small style="opacity:.6">/40</small></th>
                            </tr>
                        </thead>
                        <tbody id="mnv-rekap-tbody"><tr><td colspan="9" style="text-align:center;padding:40px;color:#94a3b8;"><div class="spinner"></div></td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- TAB TRIWULAN -->
    <div id="mnv-tab-triwulan" class="tab-content">
        <div class="card" style="margin-bottom:16px;">
            <div class="card-header">
                <h2 class="card-title">📅 Rekap Nilai Triwulanan</h2>
                <button onclick="mnvRenderTriwulan()" class="btn btn-sm">${ICONS.refresh} Refresh</button>
            </div>
            <div class="card-content">
                <div class="alert alert-info" style="margin-bottom:0;">
                    📌 <strong>Kriteria:</strong> TW I = Jan–Mar · TW II = Apr–Jun · TW III = Jul–Sep · TW IV = Okt–Des.
                    Nilai triwulan = rata-rata bulan yang sudah diisi. Data Sekretariat = rata-rata 3 sub-bagian dari sheet SEKRETARIAT_DATA.
                </div>
            </div>
        </div>
        <div id="mnv-triwulan-content">
            <div style="text-align:center;padding:60px;color:#94a3b8;"><div class="spinner"></div><div style="margin-top:12px;">Memuat rekap triwulan...</div></div>
        </div>
    </div>
</div>`;

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