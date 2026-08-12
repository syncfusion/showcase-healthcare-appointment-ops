(function () {
    var popups = window.sf && window.sf.popups;

    function create(target, width) {
        if (!target || !popups) return;
        popups.createSpinner({ target: target, width: width ?? 28 });
    }

    function show(target) {
        if (!target || !popups) return;
        popups.showSpinner(target);
    }

    function hide(target) {
        if (!target || !popups) return;
        popups.hideSpinner(target);
    }

    window.healthOpsSpinner = { create, show, hide };
})();
