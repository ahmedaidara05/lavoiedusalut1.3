// Protection contre le copier-coller et autres actions
document.addEventListener('contextmenu', (e) => e.preventDefault()); // Désactive le clic droit
document.addEventListener('copy', (e) => e.preventDefault()); // Désactive le copier
document.addEventListener('cut', (e) => e.preventDefault()); // Désactive le couper
document.addEventListener('dragstart', (e) => e.preventDefault()); // Désactive le glisser-déposer
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === 'p' || e.key === 's')) {
        e.preventDefault(); // Désactive Ctrl+P (imprimer) et Ctrl+S (enregistrer)
    }
});

// Gestion du mode sombre/clair
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    themeToggle.querySelector('.icon').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Charger le thème sauvegardé
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeToggle.querySelector('.icon').textContent = '☀️';
}

// Gestion du zoom
let fontSize = 16;
const zoomIn = document.getElementById('zoom-in');
const zoomOut = document.getElementById('zoom-out');

zoomIn.addEventListener('click', () => {
    if (fontSize < 24) {
        fontSize += 2;
        document.body.style.fontSize = `${fontSize}px`;
    }
});

zoomOut.addEventListener('click', () => {
    if (fontSize > 12) {
        fontSize -= 2;
        document.body.style.fontSize = `${fontSize}px`;
    }
});

// Navigation entre sections
const sections = document.querySelectorAll('section');
const links = document.querySelectorAll('#chapter-list a, #favorites-list a');

links.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
    });
});

// Gestion des favoris
const favoriteButtons = document.querySelectorAll('.favorite');
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function updateFavoritesList() {
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = '';
    favorites.forEach(chapterId => {
        const chapterTitle = document.getElementById(chapterId).querySelector('h2').textContent;
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${chapterId}">${chapterTitle}</a>`;
        favoritesList.appendChild(li);
    });
}

favoriteButtons.forEach(button => {
    button.addEventListener('click', () => {
        const chapterId = button.dataset.chapter;
        if (!favorites.includes(chapterId)) {
            favorites.push(chapterId);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            updateFavoritesList();
            button.textContent = 'Retirer des favoris ⭐';
        } else {
            favorites = favorites.filter(id => id !== chapterId);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            updateFavoritesList();
            button.textContent = 'Ajouter aux favoris ⭐';
        }
    });
});

// Afficher la page des favoris
document.getElementById('favorites-btn').addEventListener('click', () => {
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById('favorites').classList.add('active');
});

// Initialiser la liste des favoris
updateFavoritesList();

// Gestion de la lecture vocale
const readAloudButtons = document.querySelectorAll('.read-aloud');
let currentSpeech = null;

readAloudButtons.forEach(button => {
    button.addEventListener('click', () => {
        const chapterId = button.dataset.chapter;
        const chapter = document.getElementById(chapterId);
        const text = chapter.querySelectorAll('p').forEach(p => p.textContent).join(' ');

        if (currentSpeech && !currentSpeech.paused) {
            currentSpeech.pause();
            button.textContent = 'Reprendre la lecture';
            return;
        }

        if (currentSpeech && currentSpeech.paused) {
            currentSpeech.resume();
            button.textContent = 'Pause';
            return;
        }

        currentSpeech = new SpeechSynthesisUtterance(text);
        currentSpeech.lang = 'fr-FR';
        currentSpeech.onend = () => {
            button.textContent = 'Lire à haute voix';
            currentSpeech = null;
        };
        window.speechSynthesis.speak(currentSpeech);
        button.textContent = 'Pause';
    });
});

// Nettoyer la synthèse vocale lors du changement de page
window.addEventListener('beforeunload', () => {
    window.speechSynthesis.cancel();
});
