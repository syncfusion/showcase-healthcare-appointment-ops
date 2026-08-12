window.healthOpsThemeSwitcher = {
    init: function (rootElement, dotNetRef) {
        function onDocClick(e) {
            if (!rootElement.contains(e.target)) {
                dotNetRef.invokeMethodAsync('CloseDropdown');
            }
        }
        document.addEventListener('click', onDocClick);
        return function () { document.removeEventListener('click', onDocClick); };
    }
};
