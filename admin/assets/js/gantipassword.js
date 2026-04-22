// ============================================================
// gantipassword.js — Ganti Password Section (SPA)
// Admin Panel — Dinas Koperasi UKM
//
// Aturan:
//  - Semua role (termasuk superadmin) dapat melihat section ini
//  - Role selain superadmin: bisa ganti password sendiri
//  - Role superadmin: hanya bisa melihat password akun sendiri,
//    TIDAK bisa mengubah password orang lain
//  - Jika lupa password, harus bertanya langsung ke Super Admin
// ============================================================
(function () {
    'use strict';

    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzabqfFCmZGQ-gRhWMlazSXwnRICNdfu5zT9qzWyXVnAeHAeSVLzzPLcCaC-IAnKXq7/exec';
    const STYLE_ID = 'ganti-password-styles';

    // ── SHA-256 (Web Crypto API) ─────────────────────────────
    async function sha256(str) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ── GAS request helper (fetch — menggantikan JSONP) ──────
    // Menggunakan fetch() agar tidak ada masalah CSP / script injection
    // yang menyebabkan "Error: Network error" pada JSONP lama.
    function gasRequest(payload) {
        const url = new URL(GAS_URL);
        Object.entries(payload).forEach(([k, v]) => url.searchParams.set(k, v));

        return fetch(url.toString(), {
            method: 'GET',
            redirect: 'follow',
        })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP error: ' + res.status);
                return res.json();
            })
            .catch(function (err) {
                // Jika fetch gagal total (misal CORS), fallback ke JSONP
                console.warn('[gantipassword] fetch gagal, fallback ke JSONP:', err.message);
                return gasRequestJSONP(payload);
            });
    }

    // ── Fallback JSONP (jika fetch benar-benar tidak bisa) ───
    function gasRequestJSONP(payload) {
        return new Promise(function (resolve, reject) {
            const cb = '__gp_' + Date.now() + '_' + (Math.random() * 9999 | 0);
            const s = document.createElement('script');
            let done = false;
            const clean = function () {
                done = true;
                delete window[cb];
                if (s.parentNode) s.parentNode.removeChild(s);
            };
            window[cb] = function (d) { clean(); resolve(d); };
            s.onerror = function () { clean(); reject(new Error('Network error (JSONP fallback juga gagal). Periksa deployment GAS Anda.')); };
            setTimeout(function () {
                if (!done) { clean(); reject(new Error('Request timeout')); }
            }, 20000);
            const qs = new URLSearchParams(Object.assign({}, payload, { callback: cb })).toString();
            s.src = GAS_URL + '?' + qs;
            document.head.appendChild(s);
        });
    }

    // ── Inject CSS ────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
/* ── Ganti Password Section ───────────────────────────────── */
.gp-wrapper {
    max-width: 520px;
    margin: 0 auto;
}
.gp-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(0,0,0,.07);
    padding: 32px;
    margin-bottom: 20px;
}
.gp-avatar {
    width: 72px; height: 72px;
    border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 26px; color: #fff;
    margin: 0 auto 20px;
    box-shadow: 0 4px 16px rgba(0,0,0,.15);
}
.gp-user-name {
    font-size: 20px; font-weight: 700; color: #0f172a;
    text-align: center; margin-bottom: 4px;
}
.gp-user-meta {
    font-size: 13px; color: #64748b;
    text-align: center; margin-bottom: 6px;
}
.gp-role-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 12px; font-weight: 600;
    margin: 0 auto 24px;
}
.gp-divider {
    border: none; border-top: 1px solid #f1f5f9;
    margin: 24px 0;
}
.gp-field-group { margin-bottom: 18px; }
.gp-label {
    display: block;
    font-size: 13px; font-weight: 600; color: #374151;
    margin-bottom: 6px;
}
.gp-input-wrap {
    position: relative;
}
.gp-input {
    width: 100%; padding: 11px 44px 11px 14px;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px; font-family: inherit;
    background: #f8fafc;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    box-sizing: border-box;
}
.gp-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,.1);
    background: #fff;
}
.gp-input.error { border-color: #ef4444; }
.gp-eye-btn {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #94a3b8; padding: 4px;
    display: flex; align-items: center;
    transition: color .15s;
}
.gp-eye-btn:hover { color: #475569; }
.gp-hint {
    font-size: 12px; color: #64748b; margin-top: 5px;
}
.gp-error-msg {
    font-size: 12px; color: #ef4444;
    margin-top: 5px; display: none;
}
.gp-strength-bar {
    height: 4px; border-radius: 2px; margin-top: 8px;
    background: #e5e7eb; overflow: hidden;
}
.gp-strength-fill {
    height: 100%; border-radius: 2px;
    transition: width .3s, background .3s;
    width: 0%;
}
.gp-strength-label {
    font-size: 11px; font-weight: 600; margin-top: 4px;
}
.gp-submit-btn {
    width: 100%; padding: 13px;
    background: #0f172a; color: #fff;
    border: none; border-radius: 10px;
    font-size: 15px; font-weight: 600;
    cursor: pointer; margin-top: 8px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .15s, transform .1s;
}
.gp-submit-btn:hover:not(:disabled) { background: #1e293b; }
.gp-submit-btn:active:not(:disabled) { transform: scale(.98); }
.gp-submit-btn:disabled { opacity: .6; cursor: not-allowed; }
.gp-info-box {
    display: flex; gap: 12px;
    background: #eff6ff; border: 1px solid #bfdbfe;
    border-radius: 10px; padding: 14px 16px;
    font-size: 13px; color: #1e40af;
    margin-bottom: 20px;
    align-items: flex-start;
}
.gp-info-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.gp-warning-box {
    background: #fffbeb; border: 1px solid #fbbf24;
    border-radius: 10px; padding: 14px 16px;
    font-size: 13px; color: #92400e;
    margin-bottom: 20px;
    display: flex; gap: 12px; align-items: flex-start;
}
.gp-pw-show-wrap {
    background: #f8fafc; border: 1.5px solid #e5e7eb;
    border-radius: 10px; padding: 14px 16px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; margin-top: 8px;
}
.gp-pw-show-dots {
    font-size: 22px; letter-spacing: 4px; color: #1e293b;
    font-family: monospace;
}
.gp-pw-show-text {
    font-size: 15px; color: #1e293b;
    font-family: monospace; word-break: break-all;
    display: none;
}
.gp-toggle-show-btn {
    background: #f1f5f9; border: 1px solid #e5e7eb;
    border-radius: 8px; padding: 7px 12px;
    font-size: 12px; font-weight: 600; color: #374151;
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
    display: flex; align-items: center; gap: 6px;
    transition: background .15s;
}
.gp-toggle-show-btn:hover { background: #e2e8f0; }
.gp-success-banner {
    display: none;
    background: #f0fdf4; border: 1.5px solid #6ee7b7;
    border-radius: 10px; padding: 16px 20px;
    font-size: 14px; font-weight: 600; color: #065f46;
    margin-bottom: 20px; text-align: center;
}
        `;
        document.head.appendChild(style);
    }

    // ── Avatar helpers ─────────────────────────────────────────
    const AV_COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9', '#14b8a6', '#f97316'];
    function avColor(email) {
        let h = 0;
        for (const c of (email || '')) h = (h << 5) - h + c.charCodeAt(0);
        return AV_COLORS[Math.abs(h) % AV_COLORS.length];
    }
    function initials(name) {
        return (name || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
    }

    // ── Role badge config ─────────────────────────────────────
    const ROLE_CONFIG = {
        superadmin: {
            label: 'Super Admin',
            icon: '🛡️', color: '#1e293b', bg: '#f1f5f9', border: '#cbd5e1'
        },
        subkendaraan: {
            label: 'Subbag Kendaraan & Ruang Rapat',
            icon: '🚗', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe'
        },
        subvoucher: {
            label: 'Subbag Voucher BBM',
            icon: '⛽', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc'
        },
        subkearsipan: {
            label: 'Subbag Kearsipan',
            icon: '📁', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe'
        },
        subkeuangan: {
            label: 'Subbag Keuangan',
            icon: '💰', color: '#15803d', bg: '#f0fdf4', border: '#86efac'
        },
        program: {
            label: 'Program',
            icon: '📊', color: '#b45309', bg: '#fffbeb', border: '#fde68a'
        },
        penilai_sekretariat: {
            label: 'Penilai Sekretariat',
            icon: '✍️', color: '#6b21a8', bg: '#faf5ff', border: '#d8b4fe'
        },
        penilai_ketua: {
            label: 'Penilai Ketua',
            icon: '👑', color: '#92400e', bg: '#fef3c7', border: '#fcd34d'
        },
        penilai_koperasi: {
            label: 'Penilai Bidang Koperasi',
            icon: '🤝', color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7'
        },
        penilai_ukm: {
            label: 'Penilai Bidang UKM',
            icon: '🏪', color: '#1e40af', bg: '#dbeafe', border: '#93c5fd'
        },
        penilai_usaha_mikro: {
            label: 'Penilai Bidang Usaha Mikro',
            icon: '🏬', color: '#9a3412', bg: '#fff7ed', border: '#fdba74'
        },
        penilai_kewirausahaan: {
            label: 'Penilai Bidang Kewirausahaan',
            icon: '💡', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd'
        },
        penilai_blut: {
            label: 'Penilai BLUT KUMKM',
            icon: '🏢', color: '#4338ca', bg: '#eef2ff', border: '#a5b4fc'
        },
        // --- Alias backward-compat (akun lama di spreadsheet) ---
        subumum:     { label: 'Subbag Kendaraan & Ruang Rapat', icon: '🚗', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
        sekretariat: { label: 'Program', icon: '📊', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
    };

    // ── Password strength ─────────────────────────────────────
    function checkStrength(pw) {
        if (!pw) return { score: 0, label: '', color: '' };
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
        if (/\d/.test(pw)) score++;
        if (/[^a-zA-Z0-9]/.test(pw)) score++;
        const map = [
            { label: 'Sangat Lemah', color: '#ef4444', pct: '20%' },
            { label: 'Lemah', color: '#f97316', pct: '40%' },
            { label: 'Sedang', color: '#f59e0b', pct: '60%' },
            { label: 'Kuat', color: '#22c55e', pct: '80%' },
            { label: 'Sangat Kuat', color: '#15803d', pct: '100%' },
        ];
        return { ...map[score], score };
    }

    // ── Eye toggle helper ─────────────────────────────────────
    function makeEyeIcon(visible) {
        return visible
            ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
            : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    }

    // ── Build HTML: non-superadmin (ganti password sendiri) ───
    function buildChangeForm(user, role) {
        const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.subkendaraan;
        const color = avColor(user.email);

        return `
<div class="gp-wrapper">
    <div class="section-page-header">
        <h1 class="section-page-title">🔑 Ganti Password</h1>
        <p class="section-page-subtitle">Ubah password akun Anda. Gunakan kombinasi huruf, angka, dan simbol untuk keamanan optimal.</p>
    </div>

    <div id="gp-success-banner" class="gp-success-banner">
        ✅ Password berhasil diperbarui! Silakan login ulang jika diminta.
    </div>

    <div class="gp-card">
        <!-- Profil user -->
        <div class="gp-avatar" style="background:${color};">${initials(user.name)}</div>
        <div class="gp-user-name">${user.name || '—'}</div>
        <div class="gp-user-meta">${user.email || '—'}</div>
        <div style="text-align:center;">
            <span class="gp-role-badge" style="color:${cfg.color};background:${cfg.bg};border:1px solid ${cfg.border};">
                ${cfg.icon} ${cfg.label}
            </span>
        </div>

        <hr class="gp-divider">

        <div class="gp-info-box">
            <span class="gp-info-icon">💡</span>
            <div>Jika Anda lupa password lama, hubungi <strong>Super Admin</strong> untuk mendapatkan password sementara.</div>
        </div>

        <!-- Form -->
        <div class="gp-field-group">
            <label class="gp-label" for="gp-old-pw">Password Lama</label>
            <div class="gp-input-wrap">
                <input class="gp-input" type="password" id="gp-old-pw" placeholder="Masukkan password saat ini" autocomplete="current-password">
                <button type="button" class="gp-eye-btn" id="gp-eye-old" onclick="gpToggleEye('gp-old-pw','gp-eye-old')" title="Tampilkan/sembunyikan">
                    ${makeEyeIcon(false)}
                </button>
            </div>
            <div class="gp-error-msg" id="gp-err-old">Password lama tidak cocok</div>
        </div>

        <div class="gp-field-group">
            <label class="gp-label" for="gp-new-pw">Password Baru</label>
            <div class="gp-input-wrap">
                <input class="gp-input" type="password" id="gp-new-pw" placeholder="Min. 8 karakter" autocomplete="new-password" oninput="gpUpdateStrength()">
                <button type="button" class="gp-eye-btn" id="gp-eye-new" onclick="gpToggleEye('gp-new-pw','gp-eye-new')" title="Tampilkan/sembunyikan">
                    ${makeEyeIcon(false)}
                </button>
            </div>
            <div class="gp-strength-bar"><div class="gp-strength-fill" id="gp-strength-fill"></div></div>
            <div class="gp-strength-label" id="gp-strength-label" style="color:#94a3b8;"></div>
            <div class="gp-error-msg" id="gp-err-new">Password baru minimal 8 karakter</div>
        </div>

        <div class="gp-field-group">
            <label class="gp-label" for="gp-confirm-pw">Konfirmasi Password Baru</label>
            <div class="gp-input-wrap">
                <input class="gp-input" type="password" id="gp-confirm-pw" placeholder="Ketik ulang password baru" autocomplete="new-password">
                <button type="button" class="gp-eye-btn" id="gp-eye-confirm" onclick="gpToggleEye('gp-confirm-pw','gp-eye-confirm')" title="Tampilkan/sembunyikan">
                    ${makeEyeIcon(false)}
                </button>
            </div>
            <div class="gp-error-msg" id="gp-err-confirm">Konfirmasi password tidak cocok</div>
        </div>

        <button class="gp-submit-btn" id="gp-submit-btn" onclick="gpSubmitChange()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Simpan Password Baru
        </button>
    </div>
</div>`;
    }

    // ── Build HTML: superadmin (hanya lihat password sendiri) ──
    function buildSuperAdminView(user) {
        const color = avColor(user.email);
        const cfg = ROLE_CONFIG.superadmin;

        return `
<div class="gp-wrapper">
    <div class="section-page-header">
        <h1 class="section-page-title">🔐 Password Saya</h1>
        <p class="section-page-subtitle">Sebagai Super Admin, Anda hanya dapat melihat password akun Anda sendiri. Untuk mengubah password pengguna lain, gunakan menu <strong>Manajemen Akun</strong>.</p>
    </div>

    <div class="gp-card">
        <!-- Profil -->
        <div class="gp-avatar" style="background:${color};">${initials(user.name)}</div>
        <div class="gp-user-name">${user.name || '—'}</div>
        <div class="gp-user-meta">${user.email || '—'}</div>
        <div style="text-align:center;">
            <span class="gp-role-badge" style="color:${cfg.color};background:${cfg.bg};border:1px solid ${cfg.border};">
                ${cfg.icon} ${cfg.label}
            </span>
        </div>

        <hr class="gp-divider">

        <div class="gp-warning-box">
            <span style="font-size:18px;flex-shrink:0;">⚠️</span>
            <div>Super Admin <strong>tidak dapat mengubah password</strong> dari halaman ini. Perubahan password pengguna dilakukan melalui <strong>Manajemen Akun</strong>. Jika ada yang lupa password, mereka harus menghubungi Anda secara langsung.</div>
        </div>

        <div class="gp-field-group">
            <label class="gp-label">Password Akun Anda</label>
            <div class="gp-info-box" style="margin-bottom:10px;">
                <span class="gp-info-icon">🔒</span>
                <div>Password tersimpan dalam bentuk terenkripsi (SHA-256). Tampilan di bawah adalah hash — bukan password asli.</div>
            </div>
            <div class="gp-pw-show-wrap">
                <span class="gp-pw-show-dots" id="gp-sa-dots">••••••••</span>
                <span class="gp-pw-show-text" id="gp-sa-text" style="font-size:11px;color:#64748b;">${user.password || '(tidak tersedia)'}</span>
                <button class="gp-toggle-show-btn" id="gp-sa-toggle-btn" onclick="gpToggleSaPassword()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Tampilkan
                </button>
            </div>
        </div>

        <div style="background:#f8fafc;border-radius:10px;padding:16px;margin-top:8px;">
            <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Informasi Akun</div>
            <div style="display:grid;gap:8px;">
                <div style="display:flex;justify-content:space-between;font-size:13px;">
                    <span style="color:#64748b;">Nama</span>
                    <span style="font-weight:600;color:#1e293b;">${user.name || '—'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:13px;">
                    <span style="color:#64748b;">Email</span>
                    <span style="font-weight:600;color:#1e293b;">${user.email || '—'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:13px;">
                    <span style="color:#64748b;">Role</span>
                    <span style="font-weight:600;color:#1e293b;">Super Admin</span>
                </div>
            </div>
        </div>

        <button class="gp-submit-btn" style="margin-top:20px;background:#1d4ed8;" onclick="showSection('manageacc')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Ke Manajemen Akun
        </button>
    </div>
</div>`;
    }

    // ── Password eye toggle ───────────────────────────────────
    window.gpToggleEye = function (inputId, btnId) {
        const inp = document.getElementById(inputId);
        const btn = document.getElementById(btnId);
        if (!inp || !btn) return;
        const nowVisible = inp.type === 'text';
        inp.type = nowVisible ? 'password' : 'text';
        btn.innerHTML = makeEyeIcon(!nowVisible);
    };

    // ── Super admin: toggle show hash ─────────────────────────
    window.gpToggleSaPassword = function () {
        const dots = document.getElementById('gp-sa-dots');
        const text = document.getElementById('gp-sa-text');
        const btn = document.getElementById('gp-sa-toggle-btn');
        if (!dots || !text || !btn) return;
        const nowHidden = dots.style.display !== 'none';
        dots.style.display = nowHidden ? 'none' : '';
        text.style.display = nowHidden ? '' : 'none';
        btn.innerHTML = nowHidden
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg> Sembunyikan`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Tampilkan`;
    };

    // ── Strength meter ────────────────────────────────────────
    window.gpUpdateStrength = function () {
        const pw = document.getElementById('gp-new-pw')?.value || '';
        const { label, color, pct } = checkStrength(pw);
        const fill = document.getElementById('gp-strength-fill');
        const lbl = document.getElementById('gp-strength-label');
        if (fill) { fill.style.width = pct || '0%'; fill.style.background = color || '#e5e7eb'; }
        if (lbl) { lbl.textContent = label || ''; lbl.style.color = color || '#94a3b8'; }
    };

    // ── Validate & submit ─────────────────────────────────────
    window.gpSubmitChange = async function () {
        const oldPwEl = document.getElementById('gp-old-pw');
        const newPwEl = document.getElementById('gp-new-pw');
        const confirmEl = document.getElementById('gp-confirm-pw');
        const submitBtn = document.getElementById('gp-submit-btn');
        const errOld = document.getElementById('gp-err-old');
        const errNew = document.getElementById('gp-err-new');
        const errConfirm = document.getElementById('gp-err-confirm');
        const banner = document.getElementById('gp-success-banner');

        // Reset errors
        [errOld, errNew, errConfirm].forEach(e => { if (e) e.style.display = 'none'; });
        [oldPwEl, newPwEl, confirmEl].forEach(i => { if (i) i.classList.remove('error'); });

        const oldPw = oldPwEl?.value.trim() || '';
        const newPw = newPwEl?.value || '';
        const confirmPw = confirmEl?.value || '';

        let valid = true;

        if (!oldPw) {
            if (errOld) { errOld.textContent = 'Password lama wajib diisi'; errOld.style.display = 'block'; }
            if (oldPwEl) oldPwEl.classList.add('error');
            valid = false;
        }

        if (newPw.length < 8) {
            if (errNew) errNew.style.display = 'block';
            if (newPwEl) newPwEl.classList.add('error');
            valid = false;
        }

        if (newPw !== confirmPw) {
            if (errConfirm) errConfirm.style.display = 'block';
            if (confirmEl) confirmEl.classList.add('error');
            valid = false;
        }

        if (!valid) return;

        // ── Loading state ─────────────────────────────────────
        const origHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="gcm-spinner"></span> Memperbarui...`;

        try {
            const user = AUTH.getUser();
            if (!user || !user.id) throw new Error('Data sesi tidak ditemukan. Silakan login ulang.');

            const oldHash = await sha256(oldPw);
            const newHash = await sha256(newPw);

            const res = await gasRequest({
                action: 'changePassword',
                id: user.id,
                oldPassword: oldHash,
                newPassword: newHash,
            });

            if (res && res.status === 'success') {
                if (banner) { banner.style.display = 'block'; }
                if (window.showToast) showToast('Password berhasil diperbarui!', 'success');
                // Clear fields
                if (oldPwEl) oldPwEl.value = '';
                if (newPwEl) newPwEl.value = '';
                if (confirmEl) confirmEl.value = '';
                gpUpdateStrength();
            } else if (res && res.status === 'wrong_password') {
                if (errOld) { errOld.textContent = 'Password lama salah'; errOld.style.display = 'block'; }
                if (oldPwEl) oldPwEl.classList.add('error');
                if (window.showToast) showToast('Password lama tidak sesuai', 'error');
            } else {
                throw new Error(res?.message || 'Terjadi kesalahan pada server');
            }

        } catch (err) {
            if (window.showToast) showToast('Error: ' + err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHtml;
        }
    };

    // ── Section init ──────────────────────────────────────────
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['ganti-password'] = function () {
        const section = document.getElementById('section-ganti-password');
        if (!section) return;

        injectStyles();

        const user = AUTH.getUser();
        if (!user) { window.location.replace('login.html'); return; }

        const role = AUTH.normalizeRole(user.role);

        if (role === 'superadmin') {
            section.innerHTML = buildSuperAdminView(user);
        } else {
            section.innerHTML = buildChangeForm(user, role);
        }
    };

})();