// Mobile / responsive helpers used by the AppointmentDetailPanel and MainLayout.
(function () {
    function isMobile(breakpoint) {
        if (typeof window === 'undefined') return false;
        return window.innerWidth < (breakpoint ?? 768);
    }

    function registerResizeListener(dotNetRef, breakpoint) {
        if (typeof window === 'undefined') return;
        let timeoutId;
        window.addEventListener('resize', () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                dotNetRef.invokeMethodAsync('OnViewportResized', isMobile(breakpoint));
            }, 150);
        });
    }

    window.healthOpsMedia = { isMobile, registerResizeListener };
})();
