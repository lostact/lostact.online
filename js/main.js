document.addEventListener('DOMContentLoaded', function() {
    initSeasons();

    initNavigation();
});

function initSeasons() {
    if (typeof initSeasonalSystem === 'function') {
        initSeasonalSystem();
    }
}

function initNavigation() {
    if (typeof initNavSystem === 'function') {
        initNavSystem();
    }
}