// ============================================================
// ADMIN SIDEBAR JS — Shared sidebar logic
// Dinas Koperasi dan UKM DIY
// ============================================================

/**
 * Toggle sidebar open/close pada mobile
 */
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuButton = document.querySelector('.mobile-menu-toggle');
    if (!sidebar) return;

    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        if (menuButton) menuButton.classList.remove('sidebar-open');
    } else {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
        if (menuButton) menuButton.classList.add('sidebar-open');
    }
}

/**
 * Tutup sidebar (biasanya dipanggil dari overlay click atau tombol ✕)
 */
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuButton = document.querySelector('.mobile-menu-toggle');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    if (menuButton) menuButton.classList.remove('sidebar-open');
}

/**
 * Set nav item aktif berdasarkan URL file saat ini
 */
function setActiveNavItem() {
    const currentFile = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

    navItems.forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('href') || '';
        if (href && currentFile === href.split('/').pop()) {
            item.classList.add('active');
        }
    });
}

/**
 * Set nama dan email admin dari localStorage
 * (Info user biasanya disimpan oleh auth.js)
 */
function setAdminUserInfo() {
    const nameEl = document.getElementById('adminName');
    const emailEl = document.getElementById('adminEmail');

    try {
        const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (nameEl && user.name) nameEl.textContent = user.name;
        if (emailEl && user.email) emailEl.textContent = user.email;
    } catch (e) {
        // silently ignore
    }
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', function () {
    setActiveNavItem();
    setAdminUserInfo();

    // Close sidebar saat overlay diklik
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar saat ESC ditekan
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSidebar();
    });

    // Otomatis tutup sidebar saat nav item diklik (mobile)
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            if (window.innerWidth < 1024) {
                closeSidebar();
            }
        });
    });
});