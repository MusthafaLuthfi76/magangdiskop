/**
 * auth.js — Modul Otorisasi Frontend
 * Dinas Koperasi dan UKM
 *
 * ROLE (v2):
 *  superadmin          → Super Admin
 *  subkendaraan        → Subbag Kendaraan & Ruang Rapat
 *  subvoucher          → Subbag Voucher BBM
 *  subkearsipan        → Subbag Kearsipan
 *  subkeuangan         → Subbag Keuangan
 *  program             → Program (dulu: sekretariat)
 *  penilai_sekretariat → Penilai Sekretariat
 *  penilai_ketua       → Penilai Ketua
 *  penilai_koperasi    → Penilai Bidang Koperasi
 *  penilai_ukm         → Penilai Bidang UKM
 *  penilai_usaha_mikro → Penilai Bidang Usaha Mikro
 *  penilai_kewirausahaan → Penilai Bidang Kewirausahaan
 *  penilai_blut        → Penilai Balai Layanan Usaha Terpadu KUMKM
 *
 * CATATAN MIGRASI:
 *  - 'subumum'     → dipecah ke subkendaraan / subvoucher / subkearsipan
 *  - 'sekretariat' → diganti menjadi 'program'
 */

const AUTH = (() => {

    (function () {
        const currentFile = window.location.pathname.split('/').pop() || 'index.html';
        if (currentFile === 'login.html') return;

        const s = document.createElement('style');
        s.setAttribute('data-auth-temp', '');
        s.textContent = `
            body { visibility: hidden !important; }
            .sidebar-nav { opacity: 0; transition: opacity 0.1s ease-in; }
            .sidebar-nav .nav-item { display: none !important; }
        `;
        document.documentElement.appendChild(s);
    })();

    /* ── Definisi halaman ── */
    const PAGES = {
        'admin-dashboard.html': 'dashboard',
        'admin-manageacc.html': 'manajemen_akun',
    };

    const SECTIONS = {
        'dashboard':        'dashboard',
        'requests':         'kendaraan',
        'ruang-rapat':      'ruang_rapat',
        'voucher-bbm':      'voucher',
        'kearsipan':        'kearsipan',
        'spj-keuangan':     'penilaian_spj',
        'spj-pengumpulan':  'pengumpulan_spj',
        'pengajuan-dana':   'pengajuan_dana',
        'monev':            'penilaian_monev',
        'penilaian-orang':  'penilaian_orang',
        'manageacc':        'manajemen_akun',
        'ganti-password':   'ganti_password',
        'diklat':           'diklat',
    };

    /* ── Akses per role ── */
    const ROLE_ACCESS = {
        superadmin: [
            'dashboard', 'kendaraan', 'voucher', 'ruang_rapat', 'kearsipan',
            'penilaian_spj', 'pengumpulan_spj', 'pengajuan_dana',
            'penilaian_monev', 'penilaian_orang', 'manajemen_akun', 'diklat',
            'ganti_password'
        ],
        // Sub Bagian Umum — dipecah 3 role
        subkendaraan: [
            'dashboard', 'kendaraan', 'ruang_rapat', 'ganti_password'
        ],
        subvoucher: [
            'dashboard', 'voucher', 'ganti_password'
        ],
        subkearsipan: [
            'dashboard', 'kearsipan', 'diklat', 'ganti_password'
        ],
        // Keuangan
        subkeuangan: [
            'dashboard', 'pengumpulan_spj', 'penilaian_spj', 'pengajuan_dana', 'ganti_password'
        ],
        // Program (dulu: sekretariat)
        program: [
            'dashboard', 'penilaian_monev', 'ganti_password'
        ],
        // Role penilai — hanya akses penilaian per orang (+ dashboard)
        penilai_sekretariat: [
            'dashboard', 'penilaian_orang', 'ganti_password'
        ],
        penilai_ketua: [
            'dashboard', 'penilaian_orang', 'ganti_password'
        ],
        penilai_koperasi: [
            'dashboard', 'penilaian_orang', 'ganti_password'
        ],
        penilai_ukm: [
            'dashboard', 'penilaian_orang', 'ganti_password'
        ],
        penilai_usaha_mikro: [
            'dashboard', 'penilaian_orang', 'ganti_password'
        ],
        penilai_kewirausahaan: [
            'dashboard', 'penilaian_orang', 'ganti_password'
        ],
        penilai_blut: [
            'dashboard', 'penilaian_orang', 'ganti_password'
        ],
    };

    /* ── Label tampilan role ── */
    const ROLE_LABELS = {
        superadmin:             'Super Admin',
        subkendaraan:           'Subbag Kendaraan & Ruang Rapat',
        subvoucher:             'Subbag Voucher BBM',
        subkearsipan:           'Subbag Kearsipan',
        subkeuangan:            'Subbag Keuangan',
        program:                'Program',
        penilai_sekretariat:    'Penilai Sekretariat',
        penilai_ketua:          'Penilai Ketua',
        penilai_koperasi:       'Penilai Bidang Koperasi',
        penilai_ukm:            'Penilai Bidang UKM',
        penilai_usaha_mikro:    'Penilai Bidang Usaha Mikro',
        penilai_kewirausahaan:  'Penilai Bidang Kewirausahaan',
        penilai_blut:           'Penilai BLUT KUMKM',
    };

    /* ── Halaman default per role ── */
    const ROLE_HOME = {
        superadmin:             'index.html#dashboard',
        subkendaraan:           'index.html#dashboard',
        subvoucher:             'index.html#voucher-bbm',
        subkearsipan:           'index.html#kearsipan',
        subkeuangan:            'index.html#spj-pengumpulan',
        program:                'index.html#monev',
        penilai_sekretariat:    'index.html#penilaian-orang',
        penilai_ketua:          'index.html#penilaian-orang',
        penilai_koperasi:       'index.html#penilaian-orang',
        penilai_ukm:            'index.html#penilaian-orang',
        penilai_usaha_mikro:    'index.html#penilaian-orang',
        penilai_kewirausahaan:  'index.html#penilaian-orang',
        penilai_blut:           'index.html#penilaian-orang',
    };

    /* ── Alias mapping (backward-compat & toleran typo) ── */
    const ROLE_ALIASES = {
        // superadmin
        'superadmin':   'superadmin',
        'super admin':  'superadmin',
        'super_admin':  'superadmin',

        // --- ROLE LAMA (backward-compat) ---
        // subumum lama → default ke subkendaraan
        'subumum':          'subkendaraan',
        'sub umum':         'subkendaraan',
        'sub_umum':         'subkendaraan',
        'subbag umum':      'subkendaraan',
        'subbagumum':       'subkendaraan',
        // sekretariat lama → program
        'sekretariat':      'program',

        // --- ROLE BARU ---
        'subkendaraan':         'subkendaraan',
        'sub kendaraan':        'subkendaraan',
        'kendaraan':            'subkendaraan',

        'subvoucher':           'subvoucher',
        'sub voucher':          'subvoucher',
        'voucher':              'subvoucher',
        'subbbm':               'subvoucher',
        'sub bbm':              'subvoucher',

        'subkearsipan':         'subkearsipan',
        'sub kearsipan':        'subkearsipan',
        'kearsipan':            'subkearsipan',

        'subkeuangan':          'subkeuangan',
        'sub keuangan':         'subkeuangan',
        'sub_keuangan':         'subkeuangan',
        'subbag keuangan':      'subkeuangan',

        'program':              'program',

        // penilai
        'penilai_sekretariat':          'penilai_sekretariat',
        'penilai sekretariat':          'penilai_sekretariat',

        'penilai_ketua':                'penilai_ketua',
        'penilai ketua':                'penilai_ketua',

        'penilai_koperasi':             'penilai_koperasi',
        'penilai koperasi':             'penilai_koperasi',
        'penilai bidang koperasi':      'penilai_koperasi',

        'penilai_ukm':                  'penilai_ukm',
        'penilai ukm':                  'penilai_ukm',
        'penilai bidang ukm':           'penilai_ukm',

        'penilai_usaha_mikro':          'penilai_usaha_mikro',
        'penilai usaha mikro':          'penilai_usaha_mikro',
        'penilai bidang usaha mikro':   'penilai_usaha_mikro',

        'penilai_kewirausahaan':            'penilai_kewirausahaan',
        'penilai kewirausahaan':            'penilai_kewirausahaan',
        'penilai bidang kewirausahaan':     'penilai_kewirausahaan',

        'penilai_blut':                             'penilai_blut',
        'penilai blut':                             'penilai_blut',
        'penilai balai':                            'penilai_blut',
        'penilai balai layanan usaha terpadu kumkm':'penilai_blut',
    };

    function normalizeRole(raw) {
        if (!raw) return null;
        const r = String(raw).toLowerCase().trim();
        if (ROLE_ACCESS[r]) return r;
        const aliased = ROLE_ALIASES[r];
        if (aliased && ROLE_ACCESS[aliased]) return aliased;
        return null;
    }

    /* ─────────────────────────────────────────── */
    function getUser() {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); }
        catch { return null; }
    }

    function saveUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    }

    function getCurrentPage() {
        const path = window.location.pathname;
        const file = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

        if (file === 'index.html' || file === '') {
            const hash = window.location.hash.replace('#', '') || 'dashboard';
            return { file: `index.html#${hash}`, key: SECTIONS[hash] || null };
        }
        return { file, key: PAGES[file] || null };
    }

    function guard() {
        const raw = getUser();

        if (!raw) {
            const currentFile = getCurrentPage().file;
            if (currentFile !== 'login.html') {
                console.warn('[AUTH] Belum login → redirect login');
                window.location.replace('login.html');
            }
            return false;
        }

        const role = normalizeRole(raw.role);
        const { file, key } = getCurrentPage();

        if (!role) {
            console.error('[AUTH] Role tidak dikenal:', raw.role);
            showRoleError(raw.role);
            return false;
        }

        if (key === null) {
            console.log('[AUTH] Halaman "' + file + '" tidak terdaftar di PAGES → diizinkan');
            return true;
        }

        if (!ROLE_ACCESS[role].includes(key)) {
            console.warn('[AUTH] Role "' + role + '" tidak bisa akses "' + file + '"');
            showAccessDenied(role);
            return false;
        }

        console.log('[AUTH] OK — role "' + role + '" boleh akses "' + file + '"');
        return true;
    }

    function showRoleError(rawRole) {
        const validList = Object.keys(ROLE_ACCESS).join(', ');
        document.body.innerHTML = [
            '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;',
            'font-family:Inter,sans-serif;background:#f8f9fa;">',
            '<div style="background:white;border-radius:12px;padding:48px 40px;',
            'box-shadow:0 4px 24px rgba(0,0,0,.1);text-align:center;max-width:480px;">',
            '<div style="font-size:64px;margin-bottom:16px;">⚠️</div>',
            '<h2 style="font-size:22px;font-weight:700;color:#1e293b;margin-bottom:8px;">Role Tidak Dikenal</h2>',
            '<p style="color:#64748b;font-size:14px;margin-bottom:8px;">',
            'Akun Anda memiliki role <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">',
            (rawRole || '(kosong)'),
            '</code> yang tidak dikenali sistem.</p>',
            '<p style="color:#64748b;font-size:12px;margin-bottom:24px;">',
            'Role valid: <code style="font-size:11px;">' + validList + '</code></p>',
            '<button onclick="AUTH.logout()" style="background:#ef4444;color:white;border:none;',
            'border-radius:8px;padding:12px 28px;font-size:14px;font-weight:600;cursor:pointer;">',
            'Keluar & Login Ulang</button>',
            '</div></div>'
        ].join('');
    }

    function showAccessDenied(role) {
        const home = ROLE_HOME[role] || 'login.html';
        const label = ROLE_LABELS[role] || role;
        document.body.innerHTML = [
            '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;',
            'font-family:Inter,sans-serif;background:#f8f9fa;">',
            '<div style="background:white;border-radius:12px;padding:48px 40px;',
            'box-shadow:0 4px 24px rgba(0,0,0,.1);text-align:center;max-width:420px;">',
            '<div style="font-size:64px;margin-bottom:16px;">🔒</div>',
            '<h2 style="font-size:22px;font-weight:700;color:#1e293b;margin-bottom:8px;">Akses Ditolak</h2>',
            '<p style="color:#64748b;font-size:14px;margin-bottom:24px;">',
            'Halaman ini tidak tersedia untuk role <strong>' + label + '</strong>.</p>',
            '<button onclick="window.location.replace(\'' + home + '\')" ',
            'style="background:#0f172a;color:white;border:none;border-radius:8px;',
            'padding:12px 28px;font-size:14px;font-weight:600;cursor:pointer;">',
            'Kembali ke Beranda</button> ',
            '<button onclick="AUTH.logout()" style="background:none;color:#64748b;',
            'border:1px solid #e2e8f0;border-radius:8px;padding:12px 28px;',
            'font-size:14px;font-weight:500;cursor:pointer;">Keluar</button>',
            '</div></div>'
        ].join('');
    }

    function renderSidebar() {
        const raw = getUser();
        if (!raw) return;

        const role = normalizeRole(raw.role);
        const allowed = ROLE_ACCESS[role] || [];

        document.querySelectorAll('.nav-item[data-section]').forEach(function (link) {
            const sec = link.getAttribute('data-section');
            const pageKey = SECTIONS[sec];
            link.style.display = (!pageKey || allowed.includes(pageKey)) ? 'flex' : 'none';
        });

        const roleEl = document.getElementById('sidebarRole')
            || document.querySelector('.sidebar-subtitle');
        if (roleEl && ROLE_LABELS[role]) roleEl.textContent = ROLE_LABELS[role];

        const nameEl = document.getElementById('adminName') || document.getElementById('admin-name');
        const emailEl = document.getElementById('adminEmail') || document.getElementById('admin-email');
        if (nameEl) nameEl.textContent = raw.name || 'Pengguna';
        if (emailEl) emailEl.textContent = raw.email || '';

        const tempStyle = document.querySelector('style[data-auth-temp]');
        if (tempStyle) tempStyle.remove();

        document.body.style.visibility = 'visible';

        const sidebarNav = document.querySelector('.sidebar-nav');
        if (sidebarNav) sidebarNav.style.opacity = '1';
    }

    function logout() {
        if (typeof window.showConfirmModal === 'function') {
            showConfirmModal({
                icon: '🚪',
                title: 'Keluar dari Sistem?',
                message: 'Sesi Anda akan diakhiri dan Anda akan diarahkan ke halaman login.',
                confirmText: 'Ya, Keluar',
                loadingText: 'Keluar...',
                confirmClass: 'btn-danger',
            }, function () {
                localStorage.clear();
                window.location.replace('login.html');
            });
        } else {
            localStorage.clear();
            window.location.replace('login.html');
        }
    }

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _doInit);
        } else {
            _doInit();
        }
    }

    function _doInit() {
        if (!guard()) return;
        renderSidebar();
    }

    function redirectAfterLogin(user) {
        const role = normalizeRole(user.role);
        if (!role) {
            console.error('[AUTH] redirectAfterLogin: role tidak dikenal →', user.role);
            alert(
                'Role akun Anda ("' + user.role + '") tidak dikenali sistem.\n' +
                'Hubungi administrator.\n\n' +
                'Role valid: ' + Object.keys(ROLE_ACCESS).join(', ')
            );
            localStorage.clear();
            return;
        }
        const normalizedUser = Object.assign({}, user, { role: role });
        saveUser(normalizedUser);
        const home = ROLE_HOME[role] || 'index.html#dashboard';
        console.log('[AUTH] Login sebagai "' + role + '" → ' + home);
        window.location.replace(home);
    }

    function checkAlreadyLoggedIn() {
        const raw = getUser();
        if (!raw) return;
        const role = normalizeRole(raw.role);
        if (role) window.location.replace(ROLE_HOME[role] || 'index.html#dashboard');
    }

    return {
        init,
        guard,
        renderSidebar,
        logout,
        redirectAfterLogin,
        checkAlreadyLoggedIn,
        getUser,
        saveUser,
        normalizeRole,
        ROLE_LABELS,
        ROLE_HOME,
        ROLE_ACCESS,
        SECTIONS,
    };

})();