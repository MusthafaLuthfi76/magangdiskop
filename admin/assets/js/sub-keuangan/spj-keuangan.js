// ============================================================
// spj-keuangan.js — Penilaian SPJ Keuangan section (SPA)
// Admin Panel — Dinas Koperasi UKM
// UPDATE:
//   1. Tab Rekap Triwulan (TW I-IV) + chart per TW
//   2. Filter bulan instant (no-loading) — data di-prefetch sekali,
//      semua switch filter berikutnya langsung dari cache.
// ============================================================
(function () {
    'use strict';

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw8U7fNHneCo2Mi-nWdP-oeeRl8JYydgyMD_ghmepNt4onT8XPixOVF3GQFWqIsVRkb/exec';
    const UNITS = [
        "Balai Layanan Usaha Terpadu KUMKM",
        "Bidang Kewirausahaan",
        "Bidang Koperasi",
        "Bidang UKM",
        "Bidang Usaha Mikro",
        "Sekretariat"
    ];
    const MONTHS = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
        "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    const SKOR_MAX = 35;

    const TRIWULAN = {
        "TW I":   ["JANUARI",  "FEBRUARI", "MARET"],
        "TW II":  ["APRIL",    "MEI",      "JUNI"],
        "TW III": ["JULI",     "AGUSTUS",  "SEPTEMBER"],
        "TW IV":  ["OKTOBER",  "NOVEMBER", "DESEMBER"]
    };

    const ICONS = {
        edit:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        trash:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
        plus:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    };

    // ── Charts ────────────────────────────────────────────────
    let chartTepat = null, chartTotal = null;
    let chartTwBar = null, chartTwTotal = null;

    // ── ALL-MONTHS cache (untuk instant switching & triwulan) ─
    // Format: { JANUARI: { unit: { nilaiTepat, sanksi, totalNilai } }, ... }
    let ALL_MONTHS_CACHE = null;
    let ALL_MONTHS_CACHE_TIME = null;
    const ALL_CACHE_DURATION = 5 * 60 * 1000; // 5 menit

    // ── Per-bulan rekap cache ─────────────────────────────────
    let SPJ_REKAP_CACHE = {};
    let SPJ_CACHE_TIME  = {};
    const CACHE_DURATION = 5 * 60 * 1000;

    // ── Local Storage ─────────────────────────────────────────
    function getLocalData() {
        const raw = localStorage.getItem('spj_keuangan_data');
        return raw ? JSON.parse(raw) : {};
    }
    function setLocalData(data) {
        localStorage.setItem('spj_keuangan_data', JSON.stringify(data));
    }

    // Pre-populate demo data
    (function initDemoData() {
        const existing = getLocalData();
        if (Object.keys(existing).length > 0) return;
        const demo = {
            "JANUARI": {
                "Balai Layanan Usaha Terpadu KUMKM": { totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0, nilaiTepat: 35.00, sanksi: 0.00, totalNilai: 35.00, catatan: "Tepat waktu" },
                "Bidang Kewirausahaan": { totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0, nilaiTepat: 35.00, sanksi: 0.00, totalNilai: 35.00, catatan: "" },
                "Bidang Koperasi": { totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0, nilaiTepat: 35.00, sanksi: 0.00, totalNilai: 35.00, catatan: "" },
                "Bidang UKM": { totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0, nilaiTepat: 35.00, sanksi: 0.00, totalNilai: 35.00, catatan: "" },
                "Bidang Usaha Mikro": { totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0, nilaiTepat: 35.00, sanksi: 0.00, totalNilai: 35.00, catatan: "" },
                "Sekretariat": { totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0, nilaiTepat: 35.00, sanksi: 0.00, totalNilai: 35.00, catatan: "" }
            },
            "FEBRUARI": {
                "Balai Layanan Usaha Terpadu KUMKM": { totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0, nilaiTepat: 35.00, sanksi: 0.00, totalNilai: 35.00, catatan: "" },
                "Bidang Kewirausahaan": { totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0, nilaiTepat: 35.00, sanksi: 0.00, totalNilai: 35.00, catatan: "" },
                "Bidang Koperasi": { totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0, nilaiTepat: 35.00, sanksi: 0.00, totalNilai: 35.00, catatan: "" },
                "Bidang UKM": { totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0, nilaiTepat: 35.00, sanksi: 0.00, totalNilai: 35.00, catatan: "" },
                "Bidang Usaha Mikro": { totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0, nilaiTepat: 35.00, sanksi: 0.00, totalNilai: 35.00, catatan: "" },
                "Sekretariat": { totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0, nilaiTepat: 35.00, sanksi: 0.00, totalNilai: 35.00, catatan: "" }
            }
        };
        setLocalData(demo);
    })();

    // ── Hari Sanksi per Bulan ─────────────────────────────────
    function getHariSanksi(bulan) {
        const tahun = new Date().getFullYear();
        const isKabisat = (tahun % 4 === 0 && tahun % 100 !== 0) || (tahun % 400 === 0);
        const mapHari = {
            'JANUARI': 31, 'FEBRUARI': isKabisat ? 29 : 28, 'MARET': 31,
            'APRIL': 30,   'MEI': 31,   'JUNI': 30,
            'JULI': 31,    'AGUSTUS': 31, 'SEPTEMBER': 30,
            'OKTOBER': 31, 'NOVEMBER': 30, 'DESEMBER': 31
        };
        return (mapHari[(bulan || '').toUpperCase()] || 30) - 25;
    }

    function getSanksiPerHari(bulan) {
        return 1 / getHariSanksi(bulan);
    }

    // ── Score Calc ────────────────────────────────────────────
    function calcSPJScores(totalPengajuan, nominalTepat, hariTerlambat, bulan) {
        const persen    = totalPengajuan > 0 ? (nominalTepat / totalPengajuan) : 1;
        const nilaiTepat = parseFloat((persen * SKOR_MAX).toFixed(2));
        const sisaBobot  = parseFloat((SKOR_MAX - nilaiTepat).toFixed(2));
        const sanksiRatePerHari = getSanksiPerHari(bulan);
        const sanksi    = parseFloat((hariTerlambat * sanksiRatePerHari * sisaBobot).toFixed(2));
        const totalNilai = Math.max(0, parseFloat((nilaiTepat + (sisaBobot - sanksi)).toFixed(2)));
        return { nilaiTepat, sisaBobot, sanksi, totalNilai };
    }

    // ── API Call ──────────────────────────────────────────────
    function callAPI(params) {
        return new Promise((resolve, reject) => {
            const cb = 'jsonp_spj_' + Date.now();
            window[cb] = data => { cleanup(); resolve(data); };
            const qs = new URLSearchParams({ ...params, callback: cb }).toString();
            const s = document.createElement('script');
            s.src = `${APPS_SCRIPT_URL}?${qs}`;
            const t = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 12000);
            function cleanup() { clearTimeout(t); if (s.parentNode) s.parentNode.removeChild(s); delete window[cb]; }
            s.onerror = () => { cleanup(); reject(new Error('network')); };
            document.body.appendChild(s);
        });
    }

    // ── Prefetch ALL months data (untuk instant filter & triwulan) ──
    async function prefetchAllMonths(force = false) {
        const now = Date.now();
        if (!force && ALL_MONTHS_CACHE && ALL_MONTHS_CACHE_TIME && (now - ALL_MONTHS_CACHE_TIME) < ALL_CACHE_DURATION) {
            return ALL_MONTHS_CACHE;
        }
        try {
            const res = await callAPI({ action: 'getAllMonthlySheetData' });
            if (res && res.success && res.rekap) {
                ALL_MONTHS_CACHE      = res.rekap;
                ALL_MONTHS_CACHE_TIME = now;
                // Merge ke SPJ_REKAP_CACHE per bulan juga
                Object.keys(res.rekap).forEach(b => {
                    SPJ_REKAP_CACHE[b] = res.rekap[b];
                    SPJ_CACHE_TIME[b]  = now;
                });
                return ALL_MONTHS_CACHE;
            }
        } catch (e) {
            console.warn('[SPJ] prefetchAllMonths failed:', e);
        }
        return ALL_MONTHS_CACHE || {};
    }

    // ── Tab Switching ─────────────────────────────────────────
    window.spjSwitchTab = function (name, btn) {
        document.querySelectorAll('#section-spj-keuangan .tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#section-spj-keuangan .tab-content').forEach(t => t.classList.remove('active'));
        if (btn && btn.classList) btn.classList.add('active');
        const content = document.getElementById('spj-tab-' + name);
        if (content) content.classList.add('active');
        if (name === 'rekap')     renderRekap();
        if (name === 'triwulan') renderTriwulan();
    };

    // ── Stats ─────────────────────────────────────────────────
    function updateStats(bulan) {
        const data = getLocalData();
        if (!bulan || !data[bulan]) {
            ['spj-avg-score', 'spj-units-assessed', 'spj-units-pending'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = id === 'spj-units-pending' ? '6' : (id === 'spj-units-assessed' ? '0' : '—');
            });
            return;
        }
        const unitData = data[bulan];
        const vals = Object.values(unitData).map(u => u.totalNilai);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        if (document.getElementById('spj-avg-score')) document.getElementById('spj-avg-score').textContent = isNaN(avg) ? '0' : avg.toFixed(2);
        if (document.getElementById('spj-units-assessed')) document.getElementById('spj-units-assessed').textContent = vals.length;
        if (document.getElementById('spj-units-pending')) document.getElementById('spj-units-pending').textContent = Math.max(0, 6 - vals.length);
    }

    // ── Currency helpers ──────────────────────────────────────
    function fmtCurrency(val) {
        if (!val && val !== 0) return '';
        return String(val).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    function parseCurrency(str) {
        return parseFloat(String(str).replace(/\./g, '')) || 0;
    }
    function attachCurrencyMask(el) {
        if (!el || el._currencyMasked) return;
        el._currencyMasked = true;
        el.addEventListener('input', function () {
            const raw = this.value.replace(/\./g, '').replace(/[^0-9]/g, '');
            const num = raw ? parseInt(raw, 10) : '';
            const formatted = num !== '' ? fmtCurrency(num) : '';
            const caretPos = this.selectionStart;
            const dotsBefore = (this.value.slice(0, caretPos).match(/\./g) || []).length;
            this.value = formatted;
            const dotsAfter = (formatted.slice(0, caretPos).match(/\./g) || []).length;
            try { this.setSelectionRange(caretPos + dotsAfter - dotsBefore, caretPos + dotsAfter - dotsBefore); } catch (e) { }
        });
    }

    function getBulanInput() {
        return (document.getElementById('spj-select-bulan-input')?.value || '').toUpperCase();
    }

    function getLabelSanksiPerHari(bulan) {
        if (!bulan) return '—';
        const hariSanksi = getHariSanksi(bulan);
        const pct = (100 / hariSanksi).toFixed(2);
        return `100%/${hariSanksi} hari ≈ ${pct}%/hari`;
    }

    // ═══════════════════════════════════════════════════════════
    // TAB 1: INPUT — render langsung dari cache (instant)
    // ═══════════════════════════════════════════════════════════
    window.spjRenderInputTable = async function (instant = false) {
        const bulan = document.getElementById('spj-select-bulan-input')?.value;
        const tbody = document.getElementById('spj-input-tbody');
        if (!tbody) return;
        if (!bulan) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Pilih bulan untuk melihat data</td></tr>';
            return;
        }

        // ── Render LANGSUNG dari localStorage dulu (instant, no spinner) ──
        _renderInputTableFromLocal(bulan);
        updateStats(bulan);

        // ── Lalu fetch dari server di background ──────────────────────────
        if (!instant) {
            try {
                const apiData = await callAPI({ action: 'getSPJKeuangan', bulan });
                if (apiData?.success && apiData?.data && apiData.data.length > 0) {
                    const localData = getLocalData();
                    if (!localData[bulan]) localData[bulan] = {};
                    apiData.data.forEach(item => {
                        localData[bulan][item.unit] = {
                            totalPengajuan: parseFloat(item.totalPengajuan) || 0,
                            nominalTepat:   parseFloat(item.nominalTepat)   || 0,
                            hariTerlambat:  parseFloat(item.hariTerlambat)  || 0,
                            nilaiTepat:     parseFloat(item.nilaiTepat)     || 0,
                            sanksi:         parseFloat(item.sanksi)         || 0,
                            totalNilai:     parseFloat(item.totalNilai)     || 0,
                            catatan:        item.catatan || ''
                        };
                    });
                    setLocalData(localData);
                } else {
                    const sheetData = await callAPI({ action: 'getMonthlySheetData', bulan });
                    if (sheetData?.success && sheetData?.data && Object.keys(sheetData.data).length > 0) {
                        const localData = getLocalData();
                        if (!localData[bulan]) localData[bulan] = {};
                        Object.entries(sheetData.data).forEach(([unit, val]) => {
                            if (!localData[bulan][unit] || localData[bulan][unit].totalNilai === 0) {
                                localData[bulan][unit] = {
                                    totalPengajuan: 0, nominalTepat: 0, hariTerlambat: 0,
                                    nilaiTepat:  val.nilaiTepat  ?? 0,
                                    sanksi:      val.sanksi      ?? 0,
                                    totalNilai:  val.totalNilai  ?? 0,
                                    catatan:     localData[bulan][unit]?.catatan || ''
                                };
                            }
                        });
                        setLocalData(localData);
                        // Update cache all-months
                        if (!ALL_MONTHS_CACHE) ALL_MONTHS_CACHE = {};
                        ALL_MONTHS_CACHE[bulan] = sheetData.data;
                    }
                }
                // Re-render dengan data terbaru (tanpa loading indicator)
                _renderInputTableFromLocal(bulan);
                updateStats(bulan);
            } catch (e) {
                console.warn('[SPJ] background fetch failed:', e);
            }
        }
    };

    function _renderInputTableFromLocal(bulan) {
        const tbody = document.getElementById('spj-input-tbody');
        if (!tbody) return;
        const data      = getLocalData();
        const monthData = data[bulan] || {};
        const fmt       = n => new Intl.NumberFormat('id-ID').format(n);

        tbody.innerHTML = UNITS.map(unit => {
            const u = monthData[unit];
            if (!u) {
                return `<tr>
                    <td style="font-weight:500;vertical-align:middle;">${unit}</td>
                    <td style="text-align:center;vertical-align:middle;">${bulan}</td>
                    <td style="text-align:right;vertical-align:middle;">—</td>
                    <td style="text-align:right;vertical-align:middle;">—</td>
                    <td style="text-align:center;vertical-align:middle;">—</td>
                    <td style="text-align:center;vertical-align:middle;">—</td>
                    <td style="text-align:center;vertical-align:middle;"><span class="badge" style="background:#f1f5f9;color:#94a3b8;">Belum Dinilai</span></td>
                    <td style="text-align:center;vertical-align:middle;">
                        <div class="action-buttons"><div class="btn-icon-group">
                            <button onclick="spjOpenEditModal('${unit}','${bulan}')" class="btn-icon btn-icon-approve" title="Isi Nilai">${ICONS.plus}</button>
                        </div></div>
                    </td>
                </tr>`;
            }
            const badgeClass = u.totalNilai >= 30 ? 'badge-approved' : u.totalNilai >= 20 ? 'badge-pending' : 'badge-rejected';
            return `<tr>
                <td style="font-weight:500;vertical-align:middle;">${unit}</td>
                <td style="text-align:center;vertical-align:middle;">${bulan}</td>
                <td style="text-align:right;vertical-align:middle;">${u.totalPengajuan > 0 ? 'Rp ' + fmt(u.totalPengajuan) : '—'}</td>
                <td style="text-align:right;vertical-align:middle;">${u.nominalTepat > 0 ? 'Rp ' + fmt(u.nominalTepat) : '—'}</td>
                <td style="text-align:center;vertical-align:middle;">${u.nilaiTepat?.toFixed(2)}</td>
                <td style="text-align:center;vertical-align:middle;color:#ef4444;">${u.sanksi > 0 ? '−' + u.sanksi?.toFixed(2) : '0.00'}</td>
                <td style="text-align:center;vertical-align:middle;"><span class="badge ${badgeClass}">${u.totalNilai?.toFixed(2)}</span></td>
                <td style="text-align:center;vertical-align:middle;">
                    <div class="action-buttons"><div class="btn-icon-group">
                        <button onclick="spjOpenEditModal('${unit}','${bulan}')" class="btn-icon btn-icon-edit" title="Edit">${ICONS.edit}</button>
                        <button onclick="spjDeleteEntry('${unit}','${bulan}')" class="btn-icon btn-icon-delete" title="Hapus">${ICONS.trash}</button>
                    </div></div>
                </td>
            </tr>`;
        }).join('');
    }

    window.spjOpenEditModal = function (unit, bulan) {
        const data = getLocalData();
        const u = (data[bulan] || {})[unit];
        document.getElementById('spj-modal-bulan-label').textContent = `Unit: ${unit} | Bulan: ${bulan}`;
        document.getElementById('spj-input-unit').value = unit;
        document.getElementById('spj-input-unit').disabled = true;

        const totalEl = document.getElementById('spj-input-total');
        const tepatEl = document.getElementById('spj-input-nominal-tepat');
        totalEl.value = u && u.totalPengajuan ? fmtCurrency(u.totalPengajuan) : '';
        tepatEl.value = u && u.nominalTepat ? fmtCurrency(u.nominalTepat) : '';
        document.getElementById('spj-input-hari-terlambat').value = u ? u.hariTerlambat : '';
        document.getElementById('spj-input-catatan').value = u ? u.catatan : '';

        const sanksiLabel = document.getElementById('spj-sanksi-rate-label');
        if (sanksiLabel) sanksiLabel.textContent = getLabelSanksiPerHari(bulan);

        attachCurrencyMask(totalEl);
        attachCurrencyMask(tepatEl);

        ['spj-input-total', 'spj-input-nominal-tepat', 'spj-input-hari-terlambat'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.borderColor = '';
        });
        const warn = document.getElementById('spj-hari-warning');
        if (warn) warn.style.display = 'none';

        spjUpdateModalScore();
        document.getElementById('spj-inputModal').style.display = 'flex';
    };

    window.spjUpdateModalScore = function () {
        const labelText = document.getElementById('spj-modal-bulan-label')?.textContent || '';
        const bulanMatch = labelText.match(/Bulan:\s*([A-Z]+)/i);
        const bulan = bulanMatch ? bulanMatch[1].toUpperCase() : getBulanInput();

        const total = parseCurrency(document.getElementById('spj-input-total').value);
        const tepat = parseCurrency(document.getElementById('spj-input-nominal-tepat').value);
        const hari  = parseFloat(document.getElementById('spj-input-hari-terlambat').value) || 0;

        const hariEl  = document.getElementById('spj-input-hari-terlambat');
        const warnEl  = document.getElementById('spj-hari-warning');
        const adaSelisih = total > 0 && tepat < total;
        if (adaSelisih && hari === 0) {
            if (hariEl) hariEl.style.borderColor = '#ef4444';
            if (warnEl) {
                warnEl.style.display = 'flex';
                warnEl.querySelector('span').textContent = `Ada Rp ${fmtCurrency(total - tepat)} yang tidak tepat waktu. Wajib isi hari terlambat!`;
            }
        } else {
            if (hariEl) hariEl.style.borderColor = '';
            if (warnEl) warnEl.style.display = 'none';
        }

        const setVals = (nilaiTepat, sisaBobot, sanksi, totalNilai) => {
            document.getElementById('spj-modal-total-nilai').textContent = totalNilai.toFixed(2);
            document.getElementById('spj-modal-nilai-tepat').textContent = nilaiTepat.toFixed(2);
            document.getElementById('spj-modal-sisa-bobot').textContent  = sisaBobot.toFixed(2);
            document.getElementById('spj-modal-sanksi').textContent      = sanksi.toFixed(2);
        };

        if (tepat === 0 && total === 0) {
            if (hari === 0) { setVals(35, 0, 0, 35); }
            else { const ss = calcSPJScores(1, 1, hari, bulan); setVals(ss.nilaiTepat, ss.sisaBobot, ss.sanksi, ss.totalNilai); }
            return;
        }
        const ss = calcSPJScores(total || tepat, tepat, hari, bulan);
        setVals(ss.nilaiTepat, ss.sisaBobot, ss.sanksi, ss.totalNilai);
    };

    window.spjSubmitInputNilai = async function () {
        const bulan  = document.getElementById('spj-select-bulan-input').value;
        const unit   = document.getElementById('spj-input-unit').value;
        if (!unit) { if (window.showToast) showToast('Pilih unit terlebih dahulu', 'error'); return; }

        const totalPengajuan = parseCurrency(document.getElementById('spj-input-total').value);
        const nominalTepat   = parseCurrency(document.getElementById('spj-input-nominal-tepat').value);
        const hariTerlambat  = parseFloat(document.getElementById('spj-input-hari-terlambat').value) || 0;
        const catatan        = document.getElementById('spj-input-catatan').value;

        if (totalPengajuan > 0 && nominalTepat < totalPengajuan && hariTerlambat === 0) {
            const selisih = fmtCurrency(totalPengajuan - nominalTepat);
            if (window.showToast) showToast(`Ada Rp ${selisih} yang tidak tepat waktu. Isi jumlah hari terlambat!`, 'error');
            const hariEl = document.getElementById('spj-input-hari-terlambat');
            if (hariEl) { hariEl.style.borderColor = '#ef4444'; hariEl.focus(); }
            return;
        }

        let nilaiTepat, sanksi, totalNilai, sisaBobot;
        if (totalPengajuan === 0 && nominalTepat === 0) {
            if (hariTerlambat === 0) { nilaiTepat = 35; sanksi = 0; totalNilai = 35; sisaBobot = 0; }
            else { const ss = calcSPJScores(1, 1, hariTerlambat, bulan); ({ nilaiTepat, sanksi, totalNilai, sisaBobot } = ss); }
        } else {
            const ss = calcSPJScores(totalPengajuan || nominalTepat, nominalTepat, hariTerlambat, bulan);
            ({ nilaiTepat, sanksi, totalNilai, sisaBobot } = ss);
        }

        const submitBtn = document.getElementById('spj-submit-input-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';

        const data = getLocalData();
        if (!data[bulan]) data[bulan] = {};
        data[bulan][unit] = { totalPengajuan, nominalTepat, hariTerlambat, nilaiTepat, sanksi, totalNilai, catatan };
        setLocalData(data);

        // Invalidate caches
        delete SPJ_REKAP_CACHE[bulan];
        delete SPJ_CACHE_TIME[bulan];
        if (ALL_MONTHS_CACHE) delete ALL_MONTHS_CACHE[bulan];

        const u = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() || {} : {};
        try {
            await callAPI({
                action: 'saveSPJKeuangan', bulan, unit,
                totalPengajuan, nominalTepat, hariTerlambat,
                nilaiTepat, sanksi, totalNilai, catatan,
                penilai: u.name || 'Admin'
            });
        } catch (e) { }

        document.getElementById('spj-input-unit').disabled = false;
        document.getElementById('spj-inputModal').style.display = 'none';
        spjRenderInputTable(true); // instant = true, skip background fetch
        if (window.showToast) showToast(`Nilai ${unit} bulan ${bulan} berhasil disimpan!`, 'success');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '💾 Simpan Penilaian';
    };

    window.spjDeleteEntry = function (unit, bulan) {
        showConfirmModal({
            icon: '🗑️', title: 'Hapus Penilaian SPJ?',
            message: `Unit: <strong>${unit}</strong><br>Bulan: <strong>${bulan}</strong><br><br><span style="color:#ef4444;font-weight:600;">Tindakan ini tidak dapat dibatalkan.</span>`,
            confirmText: 'Ya, Hapus', confirmClass: 'btn-danger',
        }, async () => {
            try {
                const res = await callAPI({ action: 'deleteSPJKeuangan', bulan, unit });
                if (!res || !res.success) throw new Error(res?.message || 'Gagal menghapus data');

                const data = getLocalData();
                if (data[bulan]) delete data[bulan][unit];
                setLocalData(data);

                delete SPJ_REKAP_CACHE[bulan];
                delete SPJ_CACHE_TIME[bulan];
                if (ALL_MONTHS_CACHE) delete ALL_MONTHS_CACHE[bulan];

                await spjRenderInputTable(true);
                const selectedBulan = document.getElementById('spj-select-bulan-rekap')?.value;
                if (selectedBulan && selectedBulan === bulan) await renderRekap();

                if (window.showToast) showToast('Data berhasil dihapus', 'success');
            } catch (err) {
                console.error(err);
                if (window.showToast) showToast(err.message || 'Gagal menghapus data', 'error');
            }
        });
    };

    // ═══════════════════════════════════════════════════════════
    // TAB 2: REKAPITULASI — instant dari cache
    // ═══════════════════════════════════════════════════════════
    async function renderRekap() {
        const bulan = document.getElementById('spj-select-bulan-rekap')?.value;
        const tbody = document.getElementById('spj-rekap-tbody');
        if (!tbody) return;

        // ── Tampilkan data dari cache dulu (instant) ──────────
        let monthData = SPJ_REKAP_CACHE[bulan] || {};
        _renderRekapTable(monthData, bulan);
        _renderRekapCharts(monthData);

        // ── Fetch di background ───────────────────────────────
        try {
            const res = await callAPI({ action: 'getMonthlySheetData', bulan });
            if (res?.success && res?.data) {
                monthData = res.data;
                SPJ_REKAP_CACHE[bulan] = res.data;
                SPJ_CACHE_TIME[bulan]  = Date.now();
                if (!ALL_MONTHS_CACHE) ALL_MONTHS_CACHE = {};
                ALL_MONTHS_CACHE[bulan] = res.data;
                _renderRekapTable(monthData, bulan);
                _renderRekapCharts(monthData);
            }
        } catch (err) { console.error(err); }
    }

    function _renderRekapTable(monthData, bulan) {
        const tbody = document.getElementById('spj-rekap-tbody');
        if (!tbody) return;
        const nilaiTepat    = UNITS.map(u => parseFloat(monthData[u]?.nilaiTepat || 0));
        const nilaiTerlambat= UNITS.map(u => parseFloat(monthData[u]?.sanksi     || 0));
        const totalNilai    = UNITS.map(u => parseFloat(monthData[u]?.totalNilai || 0));

        tbody.innerHTML = `
        <tr>
            <td style="text-align:center;">1</td>
            <td style="font-weight:500;">SPJ yang masuk tepat waktu</td>
            ${nilaiTepat.map(v => `<td style="text-align:center;">${v.toFixed(2)}</td>`).join('')}
        </tr>
        <tr>
            <td style="text-align:center;">2</td>
            <td style="font-weight:500;">SPJ yang terlambat (sanksi)</td>
            ${nilaiTerlambat.map(v => `<td style="text-align:center;color:${v > 0 ? '#ef4444' : '#64748b'};">${v > 0 ? '-' : ''}${v.toFixed(2)}</td>`).join('')}
        </tr>
        <tr style="background:#f8fafc;">
            <td></td>
            <td style="font-weight:700;">TOTAL NILAI</td>
            ${totalNilai.map(v => `<td style="text-align:center;font-weight:700;">${v.toFixed(2)}</td>`).join('')}
        </tr>`;
    }

    function _renderRekapCharts(monthData) {
        if (chartTepat) { chartTepat.destroy(); chartTepat = null; }
        if (chartTotal) { chartTotal.destroy(); chartTotal = null; }

        const shortUnits = ['BLUT', 'Kewirausahaan', 'Koperasi', 'UKM', 'Usaha Mikro', 'Sekretariat'];
        const nilaiTepat = UNITS.map(u => parseFloat(monthData[u]?.nilaiTepat || 0));
        const totalNilai = UNITS.map(u => parseFloat(monthData[u]?.totalNilai || 0));

        const ctTepat = document.getElementById('spj-chartTepat');
        if (ctTepat) {
            chartTepat = new Chart(ctTepat.getContext('2d'), {
                type: 'bar',
                data: { labels: shortUnits, datasets: [{ label: 'Nilai Tepat Waktu', data: nilaiTepat, borderRadius: 6, backgroundColor: '#3b82f6' }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 35, ticks: { stepSize: 5 } } } }
            });
        }
        const ctTotal = document.getElementById('spj-chartTotal');
        if (ctTotal) {
            chartTotal = new Chart(ctTotal.getContext('2d'), {
                type: 'bar',
                data: { labels: shortUnits, datasets: [{ label: 'Total Nilai', data: totalNilai, borderRadius: 6,
                    backgroundColor: totalNilai.map(v => v >= 30 ? '#10b981' : v >= 20 ? '#f59e0b' : v > 0 ? '#ef4444' : '#e2e8f0') }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 35, ticks: { stepSize: 5 } } } }
            });
        }
    }

    window.spjRenderRekap = renderRekap;

    // ═══════════════════════════════════════════════════════════
    // TAB 3: REKAP TRIWULAN
    // ═══════════════════════════════════════════════════════════
    async function renderTriwulan() {
        const container = document.getElementById('spj-triwulan-content');
        if (!container) return;

        // Tampilkan loading tipis dulu
        container.innerHTML = `<div style="text-align:center;padding:40px;color:#94a3b8;"><div class="spinner"></div><div style="margin-top:12px;font-size:13px;">Memuat data triwulan...</div></div>`;

        // Fetch/gunakan all-months cache
        const rekap = await prefetchAllMonths();
        // Merge dengan data localStorage (lebih fresh)
        const localData = getLocalData();
        MONTHS.forEach(b => {
            if (localData[b] && Object.keys(localData[b]).length > 0) {
                if (!rekap[b]) rekap[b] = {};
                Object.entries(localData[b]).forEach(([unit, v]) => {
                    if (!rekap[b][unit] || v.totalNilai > 0) {
                        rekap[b][unit] = { nilaiTepat: v.nilaiTepat || 0, sanksi: v.sanksi || 0, totalNilai: v.totalNilai || 0 };
                    }
                });
            }
        });

        _buildTriwulanUI(container, rekap);
    }

    function _buildTriwulanUI(container, rekap) {
        const twKeys   = Object.keys(TRIWULAN);
        const twColors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
        const twBgs    = ['#eff6ff', '#f0fdf4', '#fffbeb', '#fdf2f8'];

        const shortUnits = ['BLUT', 'Kewirausahaan', 'Koperasi', 'UKM', 'Usaha Mikro', 'Sekretariat'];
        const twSelected = document.getElementById('spj-tw-select')?.value || 'TW I';

        // Helper: rata-rata nilai unit untuk sekelompok bulan
        function calcUnitTW(unit, months) {
            const vals = months.map(m => rekap[m]?.[unit]?.totalNilai)
                               .filter(v => v !== undefined && v !== null && v > 0);
            return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;
        }

        // Helper: avg satu field (nilaiTepat / sanksi / totalNilai) per unit per bulan list
        function calcUnitTWField(unit, months, field) {
            const vals = months.map(m => rekap[m]?.[unit]?.[field])
                               .filter(v => v !== undefined && v !== null && v >= 0);
            return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
        }

        // Build grid: rows=UNITS, cols=TW
        const grid = UNITS.map(unit => {
            const twData = twKeys.map(tw => calcUnitTW(unit, TRIWULAN[tw]));
            const filled = twData.filter(v => v !== null);
            return { unit, twData, best: filled.length ? Math.max(...filled) : null, worst: filled.length ? Math.min(...filled) : null };
        });

        // Per-TW summary
        const twSummaries = twKeys.map((tw, twIdx) => {
            const vals = grid.map(r => ({ unit: r.unit, val: r.twData[twIdx] })).filter(r => r.val !== null);
            vals.sort((a, b) => b.val - a.val);
            return {
                tw,
                highest: vals[0] || null,
                lowest: vals[vals.length - 1] || null,
                avg: vals.length ? (vals.reduce((a, r) => a + r.val, 0) / vals.length).toFixed(2) : '—',
                assessed: vals.length
            };
        });

        // Chart data for selected TW
        const twMonths = TRIWULAN[twSelected];
        const chartNilaiTepat = UNITS.map(u => calcUnitTWField(u, twMonths, 'nilaiTepat'));
        const chartSanksi     = UNITS.map(u => calcUnitTWField(u, twMonths, 'sanksi'));
        const chartTotData    = UNITS.map(u => calcUnitTW(u, twMonths) || 0);

        // Summary cards HTML
        const summaryCards = twSummaries.map((s, i) => {
            const shortHigh = s.highest ? s.highest.unit.replace('Balai Layanan Usaha Terpadu KUMKM', 'BLUT').replace('Bidang ', '') : null;
            const shortLow  = s.lowest  ? s.lowest.unit.replace('Balai Layanan Usaha Terpadu KUMKM', 'BLUT').replace('Bidang ', '') : null;
            return `
            <div style="background:${twBgs[i]};border:1.5px solid ${twColors[i]}40;border-radius:12px;padding:16px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${twColors[i]};margin-bottom:4px;">${s.tw}</div>
                <div style="font-size:11px;color:#64748b;margin-bottom:12px;">${TRIWULAN[s.tw][0].slice(0,3)} – ${TRIWULAN[s.tw][2].slice(0,3)}</div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    <div style="background:white;border-radius:8px;padding:8px 10px;border:1px solid #e5e7eb;">
                        <div style="font-size:10px;color:#64748b;font-weight:600;margin-bottom:2px;">🏆 TERTINGGI</div>
                        ${s.highest
                            ? `<div style="font-size:12px;font-weight:700;color:#065f46;">${shortHigh}</div>
                               <div style="font-size:18px;font-weight:800;color:${twColors[i]};">${s.highest.val}<span style="font-size:11px;color:#94a3b8;">/35</span></div>`
                            : '<div style="color:#94a3b8;font-size:12px;">Belum ada data</div>'}
                    </div>
                    <div style="background:white;border-radius:8px;padding:8px 10px;border:1px solid #e5e7eb;">
                        <div style="font-size:10px;color:#64748b;font-weight:600;margin-bottom:2px;">📉 TERENDAH</div>
                        ${s.lowest && s.lowest !== s.highest
                            ? `<div style="font-size:12px;font-weight:700;color:#991b1b;">${shortLow}</div>
                               <div style="font-size:18px;font-weight:800;color:#ef4444;">${s.lowest.val}<span style="font-size:11px;color:#94a3b8;">/35</span></div>`
                            : '<div style="color:#94a3b8;font-size:12px;">Belum ada data</div>'}
                    </div>
                    <div style="text-align:center;padding:6px;background:white;border-radius:8px;border:1px solid #e5e7eb;">
                        <div style="font-size:10px;color:#64748b;margin-bottom:2px;">Rata-rata</div>
                        <div style="font-size:16px;font-weight:700;color:${twColors[i]};">${s.avg}</div>
                        <div style="font-size:10px;color:#94a3b8;">${s.assessed} unit dinilai</div>
                    </div>
                </div>
            </div>`;
        }).join('');

        // Detail table rows
        const tableRows = grid.map(row => {
            const shortUnit = row.unit.replace('Balai Layanan Usaha Terpadu KUMKM', 'BLUT').replace('Bidang ', '');
            const twCells = row.twData.map((val, i) => {
                if (val === null) return `<td style="text-align:center;color:#94a3b8;font-size:12px;">—</td>`;
                const isBest  = val === row.best  && row.best  !== null;
                const isWorst = val === row.worst && row.worst !== null && row.best !== row.worst;
                const color   = val >= 30 ? '#065f46' : val >= 20 ? '#92400e' : '#991b1b';
                return `<td style="text-align:center;">
                    <div style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;">
                        <span style="font-weight:700;color:${color};font-size:15px;">${val}</span>
                        ${isBest  ? '<span style="font-size:9px;background:#dcfce7;color:#15803d;padding:1px 5px;border-radius:6px;font-weight:600;">BEST</span>' : ''}
                        ${isWorst ? '<span style="font-size:9px;background:#fee2e2;color:#991b1b;padding:1px 5px;border-radius:6px;font-weight:600;">LOW</span>'  : ''}
                    </div>
                </td>`;
            }).join('');
            const filled = row.twData.filter(v => v !== null);
            const annualAvg   = filled.length ? (filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(2) : '—';
            const annualColor = parseFloat(annualAvg) >= 30 ? '#065f46' : parseFloat(annualAvg) >= 20 ? '#92400e' : '#991b1b';
            return `<tr>
                <td style="font-weight:600;font-size:13px;">${shortUnit}</td>
                ${twCells}
                <td style="text-align:center;"><strong style="font-size:15px;color:${annualColor};">${annualAvg}</strong></td>
            </tr>`;
        }).join('');

        const twHeaderCells = twKeys.map((tw, i) =>
            `<th style="text-align:center;background:${twBgs[i]};color:${twColors[i]};">${tw}<br><small style="opacity:.7;font-size:10px;">${TRIWULAN[tw][0].slice(0,3)}-${TRIWULAN[tw][2].slice(0,3)}</small></th>`
        ).join('');

        container.innerHTML = `
        <!-- Summary cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;margin-bottom:24px;">
            ${summaryCards}
        </div>

        <!-- Charts -->
        <div class="card" style="margin-bottom:20px;">
            <div class="card-header">
                <h3 class="card-title">📊 Chart Rekapitulasi Triwulan</h3>
                <div style="display:flex;align-items:center;gap:8px;">
                    <label style="font-size:13px;color:#64748b;font-weight:600;">Pilih Triwulan:</label>
                    <select class="select-input" id="spj-tw-select" onchange="spjRefreshTriwulanCharts()" style="min-width:130px;">
                        ${twKeys.map(tw => `<option value="${tw}" ${tw === twSelected ? 'selected' : ''}>${tw} (${TRIWULAN[tw][0].slice(0,3)}–${TRIWULAN[tw][2].slice(0,3)})</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="card-content">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div>
                        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:10px;">Nilai Tepat Waktu vs Sanksi — ${twSelected}</div>
                        <div class="chart-container"><canvas id="spj-tw-chartBar"></canvas></div>
                    </div>
                    <div>
                        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:10px;">Total Nilai Per Unit — ${twSelected}</div>
                        <div class="chart-container"><canvas id="spj-tw-chartTotal"></canvas></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Detail table -->
        <div class="card" style="margin-bottom:0;">
            <div class="card-header">
                <h3 class="card-title">📋 Rekap Nilai Per Triwulan — Semua Unit</h3>
                <span style="font-size:12px;color:#64748b;">Rata-rata nilai bulan yang sudah diisi · Maks 35</span>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left;padding:10px 12px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:700;min-width:130px;">Unit / Bidang</th>
                            ${twHeaderCells}
                            <th style="text-align:center;background:#1a2942;color:white;font-size:12px;padding:10px 12px;">Rata-rata<br>Tahunan</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
            <div style="padding:12px 16px;border-top:1px solid #f1f5f9;font-size:12px;color:#64748b;display:flex;gap:16px;flex-wrap:wrap;">
                <span>🏆 <strong>BEST</strong> = nilai TW tertinggi unit tsb</span>
                <span>📉 <strong>LOW</strong> = nilai TW terendah unit tsb</span>
                <span>≥30 = <span style="color:#065f46;font-weight:600;">Baik</span> · ≥20 = <span style="color:#92400e;font-weight:600;">Cukup</span> · &lt;20 = <span style="color:#991b1b;font-weight:600;">Kurang</span></span>
            </div>
        </div>`;

        // Render charts setelah DOM ready
        setTimeout(() => _renderTwCharts(twSelected, rekap), 80);
    }

    function _renderTwCharts(twSelected, rekap) {
        if (chartTwBar)   { chartTwBar.destroy();   chartTwBar   = null; }
        if (chartTwTotal) { chartTwTotal.destroy();  chartTwTotal = null; }

        const shortUnits  = ['BLUT', 'Kewirausahaan', 'Koperasi', 'UKM', 'Usaha Mikro', 'Sekretariat'];
        const twMonths    = TRIWULAN[twSelected];

        function avgField(unit, field) {
            const vals = twMonths.map(m => rekap?.[m]?.[unit]?.[field]).filter(v => v != null && v >= 0);
            return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
        }

        const chartNilaiTepat = UNITS.map(u => avgField(u, 'nilaiTepat'));
        const chartSanksi     = UNITS.map(u => avgField(u, 'sanksi'));
        const chartTotData    = UNITS.map(u => {
            const vals = twMonths.map(m => rekap?.[m]?.[u]?.totalNilai).filter(v => v != null && v > 0);
            return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
        });

        const ctx1 = document.getElementById('spj-tw-chartBar');
        if (ctx1) {
            chartTwBar = new Chart(ctx1.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: shortUnits,
                    datasets: [
                        { label: 'Nilai Tepat Waktu', data: chartNilaiTepat, backgroundColor: '#10b981', borderRadius: 4 },
                        { label: 'Sanksi',            data: chartSanksi,     backgroundColor: '#ef4444', borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } } },
                    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, max: 35, ticks: { stepSize: 5 } } }
                }
            });
        }
        const ctx2 = document.getElementById('spj-tw-chartTotal');
        if (ctx2) {
            chartTwTotal = new Chart(ctx2.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: shortUnits,
                    datasets: [{ label: 'Total Nilai', data: chartTotData, borderRadius: 6,
                        backgroundColor: chartTotData.map(v => v >= 30 ? '#10b981' : v >= 20 ? '#f59e0b' : v > 0 ? '#ef4444' : '#e2e8f0') }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `Nilai: ${ctx.parsed.y}/35` } } },
                    scales: { y: { beginAtZero: true, max: 35, ticks: { stepSize: 5 } }, x: { ticks: { font: { size: 10 } } } }
                }
            });
        }
    }

    // Dipanggil saat user ganti pilihan TW di dropdown
    window.spjRefreshTriwulanCharts = async function () {
        const rekap = await prefetchAllMonths();
        const localData = getLocalData();
        MONTHS.forEach(b => {
            if (localData[b]) {
                if (!rekap[b]) rekap[b] = {};
                Object.entries(localData[b]).forEach(([unit, v]) => {
                    if (!rekap[b][unit] || v.totalNilai > 0) {
                        rekap[b][unit] = { nilaiTepat: v.nilaiTepat || 0, sanksi: v.sanksi || 0, totalNilai: v.totalNilai || 0 };
                    }
                });
            }
        });
        const container = document.getElementById('spj-triwulan-content');
        if (container) _buildTriwulanUI(container, rekap);
    };

    // ── Tab 4: Kalkulator ─────────────────────────────────────
    window.spjRecalculate = function () {
        const total = parseFloat(document.getElementById('spj-calc-total').value) || 0;
        const tepat = parseFloat(document.getElementById('spj-calc-tepat').value) || 0;
        const hari  = parseFloat(document.getElementById('spj-calc-terlambat').value) || 0;
        const bulan = (document.getElementById('spj-calc-bulan')?.value || '').toUpperCase();
        if (tepat === 0 && total === 0) return;

        const base = total || tepat;
        const ss   = calcSPJScores(base, tepat, hari, bulan);
        const persen = base > 0 ? ((tepat / base) * 100).toFixed(1) : '100.0';
        const hariSanksi = bulan ? getHariSanksi(bulan) : 6;
        const pctPerHari = (100 / hariSanksi).toFixed(2);
        const infoSanksi = bulan ? `(100% ÷ ${hariSanksi} hari = ${pctPerHari}%/hari untuk ${bulan})` : '';

        document.getElementById('spj-res-persentase').textContent = `Persentase tepat waktu: ${persen}%`;
        document.getElementById('spj-res-nilai-tepat').textContent = `Nilai tepat waktu: ${ss.nilaiTepat.toFixed(2)}`;
        document.getElementById('spj-res-sanksi').textContent      = `Total sanksi: ${ss.sanksi.toFixed(2)} ${infoSanksi}`;
        document.getElementById('spj-res-total').textContent       = ss.totalNilai.toFixed(2);
    };

    // ═══════════════════════════════════════════════════════════
    // SECTION INIT & HTML INJECTION
    // ═══════════════════════════════════════════════════════════
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['spj-keuangan'] = function () {
        const section = document.getElementById('section-spj-keuangan');
        if (!section) return;

        section.innerHTML = `
<style>
.section-page-header { margin-bottom:28px; padding-bottom:20px; border-bottom:1px solid #f1f5f9; }
.section-page-title  { font-size:22px; font-weight:700; color:#0f172a; margin-bottom:4px; }
.section-page-subtitle { font-size:14px; color:#64748b; }

#section-spj-keuangan table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}
#section-spj-keuangan table th,
#section-spj-keuangan table td {
    vertical-align: middle;
    box-sizing: border-box;
    padding: 10px 12px;
}

#spj-input-table { table-layout: fixed; }
#spj-input-table th:nth-child(1), #spj-input-table td:nth-child(1) { width: 22%; white-space: normal; word-break: break-word; }
#spj-input-table th:nth-child(2), #spj-input-table td:nth-child(2) { width: 9%; text-align: center; }
#spj-input-table th:nth-child(3), #spj-input-table td:nth-child(3) { width: 14%; text-align: right; }
#spj-input-table th:nth-child(4), #spj-input-table td:nth-child(4) { width: 14%; text-align: right; }
#spj-input-table th:nth-child(5), #spj-input-table td:nth-child(5) { width: 11%; text-align: center; }
#spj-input-table th:nth-child(6), #spj-input-table td:nth-child(6) { width: 10%; text-align: center; }
#spj-input-table th:nth-child(7), #spj-input-table td:nth-child(7) { width: 12%; text-align: center; }
#spj-input-table th:nth-child(8), #spj-input-table td:nth-child(8) { width: 8%; text-align: center; white-space: nowrap; }

#spj-input-table .action-buttons,
#spj-input-table .btn-icon-group { display: flex; justify-content: center; align-items: center; gap: 4px; }
#spj-input-table .btn-icon { flex-shrink: 0; }

#spj-rekap-table { table-layout: fixed; }
#spj-rekap-table th:nth-child(1), #spj-rekap-table td:nth-child(1) { width: 4%; text-align: center; }
#spj-rekap-table th:nth-child(2), #spj-rekap-table td:nth-child(2) { width: 26%; }
#spj-rekap-table th:nth-child(n+3), #spj-rekap-table td:nth-child(n+3) { width: 11.67%; text-align: center; }

#spj-hari-warning {
    display: none;
    align-items: center;
    gap: 8px;
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 6px;
    padding: 8px 12px;
    margin-top: 8px;
    font-size: 12px;
    color: #b91c1c;
}
#spj-hari-warning svg { flex-shrink: 0; }

/* Chart container untuk triwulan */
#section-spj-keuangan .chart-container {
    position: relative;
    height: 240px;
}
</style>

<div class="container">

    <!-- Header -->
    <div class="section-page-header">
        <h1 class="section-page-title">Penilaian SPJ Keuangan</h1>
        <p class="section-page-subtitle">Monitoring ketepatan waktu penyampaian SPJ per unit bidang</p>
    </div>

    <div class="tabs">
        <button class="tab active" onclick="spjSwitchTab('input', this)">📥 Input Penilaian</button>
        <button class="tab" onclick="spjSwitchTab('rekap', this)">📊 Rekapitulasi</button>
        <button class="tab" onclick="spjSwitchTab('triwulan', this)">📅 Rekap Triwulan</button>
        <button class="tab" onclick="spjSwitchTab('rumus', this)">📐 Rumus & Kalkulator</button>
    </div>
    <div class="tabs-dropdown">
        <select onchange="spjSwitchTab(this.value, null)">
            <option value="input">📥 Input Penilaian</option>
            <option value="rekap">📊 Rekapitulasi</option>
            <option value="triwulan">📅 Rekap Triwulan</option>
            <option value="rumus">📐 Rumus & Kalkulator</option>
        </select>
    </div>

    <!-- ══ TAB 1: INPUT ══ -->
    <div id="spj-tab-input" class="tab-content active">
        <div class="stats-grid">
            <div class="stat-card" style="border-left:4px solid #1F4E79;"><div class="stat-label">Skor Maksimum</div><div class="stat-value">35</div></div>
            <div class="stat-card" style="border-left:4px solid #10b981;"><div class="stat-label">Rata-rata Bulan Ini</div><div class="stat-value" id="spj-avg-score">—</div></div>
            <div class="stat-card" style="border-left:4px solid #f59e0b;"><div class="stat-label">Unit Dinilai</div><div class="stat-value" id="spj-units-assessed">0</div></div>
            <div class="stat-card" style="border-left:4px solid #ef4444;"><div class="stat-label">Unit Belum Dinilai</div><div class="stat-value" id="spj-units-pending">6</div></div>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Input Nilai Kinerja SPJ Per Unit</h2>
                <div class="filter-container">
                    <select class="select-input" id="spj-select-bulan-input" onchange="spjRenderInputTable()">
                        <option value="">Pilih Bulan</option>
                        <option value="JANUARI">Januari</option><option value="FEBRUARI">Februari</option><option value="MARET">Maret</option>
                        <option value="APRIL">April</option><option value="MEI">Mei</option><option value="JUNI">Juni</option>
                        <option value="JULI">Juli</option><option value="AGUSTUS">Agustus</option><option value="SEPTEMBER">September</option>
                        <option value="OKTOBER">Oktober</option><option value="NOVEMBER">November</option><option value="DESEMBER">Desember</option>
                    </select>
                    <button onclick="spjRenderInputTable()" class="btn btn-sm" title="Refresh Data">${ICONS.refresh} Refresh</button>
                </div>
            </div>
            <div class="table-container">
                <table id="spj-input-table">
                    <thead>
                        <tr>
                            <th>Unit</th>
                            <th style="text-align:center;">Bulan</th>
                            <th style="text-align:right;">Total Pengajuan (Rp)</th>
                            <th style="text-align:right;">SPJ Tepat Waktu (Rp)</th>
                            <th style="text-align:center;">Nilai Tepat Waktu</th>
                            <th style="text-align:center;">Nilai Sanksi</th>
                            <th style="text-align:center;">Total Nilai (maks 35)</th>
                            <th style="text-align:center;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="spj-input-tbody">
                        <tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Pilih bulan untuk melihat data</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- ══ TAB 2: REKAPITULASI ══ -->
    <div id="spj-tab-rekap" class="tab-content">
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Rekapitulasi Nilai Kinerja Penyampaian SPJ Keuangan</h2>
                <div class="filter-container">
                    <select class="select-input" id="spj-select-bulan-rekap" onchange="spjRenderRekap()">
                        <option value="">Semua Bulan</option>
                        <option value="JANUARI">Januari</option><option value="FEBRUARI">Februari</option><option value="MARET">Maret</option>
                        <option value="APRIL">April</option><option value="MEI">Mei</option><option value="JUNI">Juni</option>
                        <option value="JULI">Juli</option><option value="AGUSTUS">Agustus</option><option value="SEPTEMBER">September</option>
                        <option value="OKTOBER">Oktober</option><option value="NOVEMBER">November</option><option value="DESEMBER">Desember</option>
                    </select>
                    <button onclick="spjRenderRekap()" class="btn btn-sm" title="Refresh Data">${ICONS.refresh} Refresh</button>
                </div>
            </div>
            <div class="card-content">
                <div class="charts-grid">
                    <div class="card" style="margin:0;">
                        <div class="card-header" style="padding:16px;"><h3 style="font-size:15px;font-weight:600;">Nilai Tepat Waktu Per Unit</h3></div>
                        <div class="card-content"><div class="chart-container"><canvas id="spj-chartTepat"></canvas></div></div>
                    </div>
                    <div class="card" style="margin:0;">
                        <div class="card-header" style="padding:16px;"><h3 style="font-size:15px;font-weight:600;">Total Nilai Per Unit (Maks 35)</h3></div>
                        <div class="card-content"><div class="chart-container"><canvas id="spj-chartTotal"></canvas></div></div>
                    </div>
                </div>
                <div class="table-container">
                    <table id="spj-rekap-table" class="rekap">
                        <thead>
                            <tr>
                                <th style="text-align:center;">No</th>
                                <th>Indikator Penilaian</th>
                                <th style="text-align:center;">BLUT</th>
                                <th style="text-align:center;">Bid. Kewirausahaan</th>
                                <th style="text-align:center;">Bid. Koperasi</th>
                                <th style="text-align:center;">Bid. UKM</th>
                                <th style="text-align:center;">Bid. Usaha Mikro</th>
                                <th style="text-align:center;">Sekretariat</th>
                            </tr>
                        </thead>
                        <tbody id="spj-rekap-tbody">
                            <tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Pilih bulan untuk melihat data</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- ══ TAB 3: REKAP TRIWULAN ══ -->
    <div id="spj-tab-triwulan" class="tab-content">
        <div class="card" style="margin-bottom:16px;">
            <div class="card-header">
                <h2 class="card-title">📅 Rekap Nilai Triwulanan SPJ Keuangan</h2>
                <button onclick="renderTriwulan && renderTriwulan()" class="btn btn-sm">${ICONS.refresh} Refresh</button>
            </div>
            <div class="card-content">
                <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:6px;padding:12px 16px;font-size:13px;color:#1e3a8a;">
                    📌 <strong>Kriteria:</strong> TW I = Jan–Mar · TW II = Apr–Jun · TW III = Jul–Sep · TW IV = Okt–Des.
                    Nilai triwulan = rata-rata bulan yang sudah diisi. Maks nilai per bulan = 35.
                </div>
            </div>
        </div>
        <div id="spj-triwulan-content">
            <div style="text-align:center;padding:60px;color:#94a3b8;"><div class="spinner"></div><div style="margin-top:12px;">Memuat rekap triwulan...</div></div>
        </div>
    </div>

    <!-- ══ TAB 4: RUMUS & KALKULATOR ══ -->
    <div id="spj-tab-rumus" class="tab-content">
        <div class="banner">
            <div class="banner-left">
                <div class="banner-title">📐 Rumus Penilaian SPJ Keuangan (Skor 35)</div>
                <div class="banner-sub">Subbag Keuangan — Dinas Koperasi dan UKM DIY</div>
            </div>
            <div class="banner-pills">
                <div class="pill"><div class="pill-dot" style="background:#10b981;"></div>Tepat Waktu: Penuh</div>
                <div class="pill"><div class="pill-dot" style="background:#f59e0b;"></div>Sanksi: 100% ÷ (Hari Sanksi Bulan Tsb)</div>
                <div class="pill"><div class="pill-dot" style="background:#ef4444;"></div>Batas Tepat: tgl 25</div>
            </div>
        </div>
        <div class="grid-2" style="margin-bottom:20px;">
            <div class="card" style="margin:0;">
                <div class="card-header"><h3 class="card-title">Komponen Penilaian</h3></div>
                <div class="card-content">
                    <div class="score-section">
                        <div class="score-section-title">1. Nilai SPJ Tepat Waktu</div>
                        <div style="font-size:14px;line-height:1.8;color:#475569;">= <strong>(Nominal Tepat / Total Pengajuan)</strong> × 100% × 35</div>
                        <div style="font-size:12px;color:#64748b;margin-top:8px;">Contoh: 30jt dari 40jt → (30/40) × 35 = <strong style="color:#10b981;">26.25</strong></div>
                    </div>
                    <div class="score-section" style="border-left-color:#ef4444;">
                        <div class="score-section-title">2. Sanksi Keterlambatan (dinamis per bulan)</div>
                        <div style="font-size:14px;line-height:1.8;color:#475569;">= <strong>(100% ÷ Hari Sanksi Bulan)</strong> per hari × Sisa Bobot × Hari Terlambat</div>
                        <div style="background:#fef9c3;border-radius:6px;padding:10px;margin-top:8px;font-size:12px;color:#713f12;line-height:1.9;">
                            <strong>Referensi sanksi per hari:</strong><br>
                            • Januari, Maret, Mei, Juli, Agustus, Oktober, Desember (31 hr) → 100%/6 ≈ <strong>16.67%/hari</strong><br>
                            • April, Juni, September, November (30 hr) → 100%/5 = <strong>20%/hari</strong><br>
                            • Februari normal (28 hr) → 100%/3 ≈ <strong>33.33%/hari</strong><br>
                            • Februari kabisat (29 hr) → 100%/4 = <strong>25%/hari</strong>
                        </div>
                    </div>
                    <div class="score-section" style="border-left-color:#10b981;">
                        <div class="score-section-title">3. Total Nilai Akhir</div>
                        <div style="font-size:14px;line-height:1.8;color:#475569;">= Nilai Tepat + (Sisa Bobot − Total Sanksi)</div>
                        <div style="font-size:12px;color:#64748b;margin-top:8px;">Batas tepat waktu: <strong>sebelum tgl 25</strong> · Periode sanksi: <strong>tgl 26 s.d. akhir bulan</strong></div>
                    </div>
                </div>
            </div>
            <div class="card" style="margin:0;">
                <div class="card-header"><h3 class="card-title">🧮 Kalkulator Nilai SPJ</h3></div>
                <div class="card-content">
                    <div class="form-group">
                        <label class="input-label">Bulan <span style="color:#ef4444;">*</span></label>
                        <select class="form-input" id="spj-calc-bulan" onchange="spjRecalculate()">
                            <option value="">Pilih Bulan</option>
                            <option value="JANUARI">Januari (31 hr → sanksi 100%/6 ≈ 16.67%/hr)</option>
                            <option value="FEBRUARI">Februari normal (28 hr → sanksi 100%/3 ≈ 33.33%/hr)</option>
                            <option value="FEBRUARI_KABISAT">Februari kabisat (29 hr → sanksi 100%/4 = 25%/hr)</option>
                            <option value="MARET">Maret (31 hr → sanksi 100%/6 ≈ 16.67%/hr)</option>
                            <option value="APRIL">April (30 hr → sanksi 100%/5 = 20%/hr)</option>
                            <option value="MEI">Mei (31 hr → sanksi 100%/6 ≈ 16.67%/hr)</option>
                            <option value="JUNI">Juni (30 hr → sanksi 100%/5 = 20%/hr)</option>
                            <option value="JULI">Juli (31 hr → sanksi 100%/6 ≈ 16.67%/hr)</option>
                            <option value="AGUSTUS">Agustus (31 hr → sanksi 100%/6 ≈ 16.67%/hr)</option>
                            <option value="SEPTEMBER">September (30 hr → sanksi 100%/5 = 20%/hr)</option>
                            <option value="OKTOBER">Oktober (31 hr → sanksi 100%/6 ≈ 16.67%/hr)</option>
                            <option value="NOVEMBER">November (30 hr → sanksi 100%/5 = 20%/hr)</option>
                            <option value="DESEMBER">Desember (31 hr → sanksi 100%/6 ≈ 16.67%/hr)</option>
                        </select>
                    </div>
                    <div class="form-group"><label class="input-label">Total Pengajuan Dana (Rp)</label><input type="number" class="form-input" id="spj-calc-total" placeholder="Contoh: 40000000" oninput="spjRecalculate()"></div>
                    <div class="form-group"><label class="input-label">Nominal SPJ Tepat Waktu (Rp)</label><input type="number" class="form-input" id="spj-calc-tepat" placeholder="Contoh: 30000000" oninput="spjRecalculate()"></div>
                    <div class="form-group"><label class="input-label">Jumlah Hari Terlambat</label><input type="number" class="form-input" id="spj-calc-terlambat" placeholder="0 jika tepat waktu" min="0" max="30" oninput="spjRecalculate()"></div>
                    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-top:4px;">
                        <div style="font-size:12px;color:#64748b;margin-bottom:8px;">Hasil Perhitungan</div>
                        <div id="spj-res-persentase" style="font-size:13px;color:#64748b;margin-bottom:4px;">Persentase tepat waktu: —</div>
                        <div id="spj-res-nilai-tepat" style="font-size:13px;color:#64748b;margin-bottom:4px;">Nilai tepat waktu: —</div>
                        <div id="spj-res-sanksi" style="font-size:13px;color:#ef4444;margin-bottom:12px;">Total sanksi: —</div>
                        <div id="spj-res-total" style="font-size:36px;font-weight:800;color:#1F4E79;">—</div>
                        <div style="font-size:11px;color:#64748b;">Total Nilai (maks 35)</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ══ MODAL INPUT ══ -->
<div id="spj-inputModal" class="modal-overlay" style="display:none;">
    <div class="modal">
        <div class="modal-header">
            <h2 class="modal-title">Input Penilaian SPJ Keuangan</h2>
            <p style="font-size:13px;color:#64748b;margin-top:4px;" id="spj-modal-bulan-label">—</p>
        </div>
        <div class="modal-content">
            <div class="score-section">
                <div class="score-section-title">Informasi Unit & Pengajuan</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="form-group" style="margin:0;">
                        <label class="input-label">Unit Bidang</label>
                        <select class="form-input" id="spj-input-unit">
                            <option value="">Pilih Unit</option>
                            <option value="Balai Layanan Usaha Terpadu KUMKM">Balai Layanan Usaha Terpadu KUMKM</option>
                            <option value="Bidang Kewirausahaan">Bidang Kewirausahaan</option>
                            <option value="Bidang Koperasi">Bidang Koperasi</option>
                            <option value="Bidang UKM">Bidang UKM</option>
                            <option value="Bidang Usaha Mikro">Bidang Usaha Mikro</option>
                            <option value="Sekretariat">Sekretariat</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label class="input-label">Total Pengajuan Dana (Rp)</label>
                        <input type="text" inputmode="numeric" class="form-input" id="spj-input-total" placeholder="Contoh: 40.000.000" oninput="spjUpdateModalScore()">
                    </div>
                </div>
            </div>
            <div class="score-section" style="border-left-color:#10b981;">
                <div class="score-section-title">Komponen 1: SPJ Tepat Waktu (sebelum tgl 25)</div>
                <div class="form-group" style="margin:0;">
                    <label class="input-label">Nominal SPJ yang masuk tepat waktu (Rp)</label>
                    <input type="text" inputmode="numeric" class="form-input" id="spj-input-nominal-tepat" placeholder="Contoh: 30.000.000" oninput="spjUpdateModalScore()">
                </div>
            </div>
            <div class="score-section" style="border-left-color:#ef4444;">
                <div class="score-section-title">Komponen 2: SPJ Terlambat (tgl 26 s.d. akhir bulan)</div>
                <div class="form-group" style="margin:0;">
                    <label class="input-label">Jumlah Hari Terlambat</label>
                    <input type="number" class="form-input" id="spj-input-hari-terlambat" placeholder="0 jika tidak ada keterlambatan" min="0" max="6" oninput="spjUpdateModalScore()">
                    <div style="font-size:12px;color:#64748b;margin-top:4px;" id="spj-sanksi-rate-label">Sanksi per hari = 100% ÷ hari sanksi bulan ini</div>
                    <div id="spj-hari-warning">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span></span>
                    </div>
                </div>
            </div>
            <div class="score-preview">
                <div class="score-preview-title">TOTAL NILAI</div>
                <div class="score-preview-value" id="spj-modal-total-nilai">—</div>
                <div style="font-size:12px;color:#64748b;margin-top:2px;">dari maksimal 35</div>
                <div class="score-breakdown">
                    <div class="score-item"><div class="score-item-label">Nilai Tepat Waktu</div><div class="score-item-value" id="spj-modal-nilai-tepat">—</div></div>
                    <div class="score-item"><div class="score-item-label">Sisa Nilai Bobot</div><div class="score-item-value" id="spj-modal-sisa-bobot">—</div></div>
                    <div class="score-item"><div class="score-item-label">Sanksi</div><div class="score-item-value" style="color:#ef4444;" id="spj-modal-sanksi">—</div></div>
                </div>
            </div>
            <div class="form-group">
                <label class="input-label">Keterangan Tambahan (opsional)</label>
                <textarea class="form-textarea" id="spj-input-catatan" placeholder="Catatan tambahan..."></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="document.getElementById('spj-inputModal').style.display='none';document.getElementById('spj-input-unit').disabled=false;" class="btn" style="flex:1;">Batal</button>
            <button onclick="spjSubmitInputNilai()" class="btn btn-success" style="flex:1;" id="spj-submit-input-btn">💾 Simpan Penilaian</button>
        </div>
    </div>
</div>`;

        window.addEventListener('click', e => {
            if (e.target.id === 'spj-inputModal') {
                e.target.style.display = 'none';
                const unit = document.getElementById('spj-input-unit');
                if (unit) unit.disabled = false;
            }
        });

        // Expose renderTriwulan ke global scope agar refresh btn bisa akses
        window.renderTriwulan = renderTriwulan;

        attachCurrencyMask(document.getElementById('spj-input-total'));
        attachCurrencyMask(document.getElementById('spj-input-nominal-tepat'));

        // Auto-set bulan saat ini
        const currentMonthIdx = new Date().getMonth();
        if (MONTHS[currentMonthIdx]) {
            const m = document.getElementById('spj-select-bulan-input');
            if (m) {
                m.value = MONTHS[currentMonthIdx];
                window.spjRenderInputTable(); // render dari local, lalu bg fetch
            }
        }

        // Prefetch data semua bulan di background (untuk triwulan & instant filter)
        setTimeout(() => prefetchAllMonths(), 500);
    };
})();