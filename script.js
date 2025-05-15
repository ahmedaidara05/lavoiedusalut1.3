// Protection contre le copier-coller et autres actions
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('copy', (e) => e.preventDefault());
document.addEventListener('cut', (e) => e.preventDefault());
document.addEventListener('dragstart', (e) => e.preventDefault());
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === 'p' || e.key === 's')) {
        e.preventDefault();
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
const backButtons = document.querySelectorAll('.back-btn');

links.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
    });
});

backButtons.forEach(button => {
    button.addEventListener('click', () => {
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById('home').classList.add('active');
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

document.getElementById('favorites-btn').addEventListener('click', () => {
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById('favorites').classList.add('active');
});

updateFavoritesList();

// Gestion de la lecture vocale
const voiceToggle = document.getElementById('voice-toggle');
let currentSpeech = null;
let currentChapter = null;

voiceToggle.addEventListener('click', () => {
    const activeSection = document.querySelector('section.active');
    if (!activeSection || activeSection.id === 'home' || activeSection.id === 'favorites') return;

    const chapterId = activeSection.id;
    const content = activeSection.querySelector(`.content[data-lang="${currentLanguage}"]`);
    const text = Array.from(content.querySelectorAll('p')).map(p => p.textContent).join(' ');

    if (currentSpeech && !currentSpeech.paused) {
        currentSpeech.pause();
        voiceToggle.querySelector('.icon').textContent = '🔊';
        return;
    }

    if (currentSpeech && currentSpeech.paused) {
        currentSpeech.resume();
        voiceToggle.querySelector('.icon').textContent = '⏸️';
        return;
    }

    currentSpeech = new SpeechSynthesisUtterance(text);
    currentSpeech.lang = currentLanguage === 'fr' ? 'fr-FR' :
                        currentLanguage === 'en' ? 'en-US' :
                        currentLanguage === 'ar' ? 'ar-SA' :
                        currentLanguage === 'es' ? 'es-ES' :
                        currentLanguage === 'de' ? 'de-DE' : 'it-IT';
    currentSpeech.onend = () => {
        voiceToggle.querySelector('.icon').textContent = '🔊';
        currentSpeech = null;
        currentChapter = null;
    };
    window.speechSynthesis.speak(currentSpeech);
    currentChapter = chapterId;
    voiceToggle.querySelector('.icon').textContent = '⏸️';
});

// Gestion de la langue
let currentLanguage = 'fr';
const languageToggle = document.getElementById('language-toggle');
const languages = ['fr', 'en', 'ar', 'es', 'de', 'it'];

languageToggle.addEventListener('click', () => {
    const currentIndex = languages.indexOf(currentLanguage);
    currentLanguage = languages[(currentIndex + 1) % languages.length];
    updateLanguage();
    if (currentSpeech) {
        window.speechSynthesis.cancel();
        voiceToggle.querySelector('.icon').textContent = '🔊';
        currentSpeech = null;
        currentChapter = null;
    }
});

function updateLanguage() {
    sections.forEach(section => {
        const contents = section.querySelectorAll('.content');
        contents.forEach(content => {
            content.style.display = content.dataset.lang === currentLanguage ? 'block' : 'none';
        });
        if (section.id.startsWith('chapter')) {
            const h2 = section.querySelector('h2');
            if (currentLanguage === 'en') {
                h2.textContent = h2.textContent.replace('Chapitre', 'Chapter');
            } else if (currentLanguage === 'ar') {
                h2.textContent = h2.textContent.replace('Chapitre', 'الفصل');
            } else if (currentLanguage === 'es') {
                h2.textContent = h2.textContent.replace('Chapitre', 'Capítulo');
            } else if (currentLanguage === 'de') {
                h2.textContent = h2.textContent.replace('Chapitre', 'Kapitel');
            } else if (currentLanguage === 'it') {
                h2.textContent = h2.textContent.replace('Chapitre', 'Capitolo');
            } else {
                h2.textContent = h2.textContent.replace(/Chapter|الفصل|Capítulo|Kapitel|Capitolo/, 'Chapitre');
            }
        }
    });
    const favoritesTitle = document.querySelector('#favorites h2');
    if (currentLanguage === 'en') {
        favoritesTitle.textContent = 'Your Favorite Chapters';
    } else if (currentLanguage === 'ar') {
        favoritesTitle.textContent = 'فصولك المفضلة';
    } else if (currentLanguage === 'es') {
        favoritesTitle.textContent = 'Tus capítulos favoritos';
    } else if (currentLanguage === 'de') {
        favoritesTitle.textContent = 'Ihre Lieblingskapitel';
    } else if (currentLanguage === 'it') {
        favoritesTitle.textContent = 'I tuoi capitoli preferiti';
    } else {
        favoritesTitle.textContent = 'Vos Chapitres Favoris';
    }
    updateFavoritesList();
}

updateLanguage();

// Nettoyer la synthèse vocale lors du changement de page
window.addEventListener('beforeunload', () => {
    window.speechSynthesis.cancel();
});
