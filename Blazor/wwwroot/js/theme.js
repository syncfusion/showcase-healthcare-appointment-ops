(function () {
    const STORAGE_KEY = 'healthops-theme';
    const DARK_QUERY = '(prefers-color-scheme: dark)';

    function readStoredMode() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'dark' || stored === 'system') return stored;
        } catch {
            // storage may be unavailable (private mode); ignore
        }
        return 'light';
    }

    function resolveMode(mode) {
        if (mode === 'system') {
            return window.matchMedia && window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
        }
        return mode;
    }

    function applyTheme(resolved) {
        document.documentElement.setAttribute('data-theme', resolved);
        document.body.classList.toggle('e-dark-mode', resolved === 'dark');
    }

    function initTheme() {
        applyTheme(resolveMode(readStoredMode()));
    }

    window.healthOpsTheme = {
        readStoredMode,
        resolveMode,
        applyTheme,
        initTheme,
        setMode: function (mode) {
            try {
                localStorage.setItem(STORAGE_KEY, mode);
            } catch {
                // ignore
            }
            applyTheme(resolveMode(mode));
        },
        isSystemDark: function () {
            return window.matchMedia && window.matchMedia(DARK_QUERY).matches;
        }
    };

    initTheme();
})();
