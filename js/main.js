document.addEventListener('DOMContentLoaded', function() {
    updateAge();

    initSeasons();

    initNavigation();
});

function updateAge() {
    const ageElement = document.getElementById('age');
    if (!ageElement) return;

    const [birthYear, birthMonth, birthDay] = ageElement.dataset.birthDate.split('-').map(Number);
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const month = today.getMonth() + 1;

    if (month < birthMonth || (month === birthMonth && today.getDate() < birthDay)) {
        age--;
    }

    ageElement.textContent = age;
}

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
