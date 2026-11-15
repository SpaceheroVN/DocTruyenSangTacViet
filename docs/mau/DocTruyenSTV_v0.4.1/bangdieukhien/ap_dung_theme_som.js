// Áp dụng sớm chủ đề tránh chớp nền trắng
(() => {
    try {
        const chu_de_luu = localStorage.getItem('stv_theme_cache');
        const chu_de = (chu_de_luu === 'light' || chu_de_luu === 'dark')
            ? chu_de_luu
            : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.setAttribute('data-theme', chu_de);
    } catch (_) {
        // Bỏ qua nếu không truy cập được localStorage
    }
})();
