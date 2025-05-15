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
        updateFontSize();
    }
});

zoomOut.addEventListener('click', () => {
    if (fontSize > 12) {
        fontSize -= 2;
        updateFontSize();
    }
});

function updateFontSize() {
    document.querySelectorAll('section, section *').forEach(element => {
        element.style.fontSize = `${fontSize}px`;
    });
    // Ajuster les boutons de navigation pour qu'ils restent lisibles
    document.querySelectorAll('.prev-btn, .next-btn, .close-btn, .favorite').forEach(element => {
        element.style.fontSize = `${fontSize * 0.9}px`;
    });
}

// Navigation entre sections
const sections = document.querySelectorAll('section');
const links = document.querySelectorAll('#chapter-list a, #favorites-list a');
const closeButtons = document.querySelectorAll('.close-btn');

links.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
    });
});

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById('home').classList.add('active');
    });
});

document.getElementById('menu-btn').addEventListener('click', () => {
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById('home').classList.add('active');
});

// Navigation entre chapitres
const chapters = ['chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5'];
const prevButtons = document.querySelectorAll('.prev-btn');
const nextButtons = document.querySelectorAll('.next-btn');

prevButtons.forEach(button => {
    button.addEventListener('click', () => {
        const currentChapter = button.closest('section').id;
        const currentIndex = chapters.indexOf(currentChapter);
        if (currentIndex > 0) {
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(chapters[currentIndex - 1]).classList.add('active');
        }
    });
});

nextButtons.forEach(button => {
    button.addEventListener('click', () => {
        const currentChapter = button.closest('section').id;
        const currentIndex = chapters.indexOf(currentChapter);
        if (currentIndex < chapters.length - 1) {
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(chapters[currentIndex + 1]).classList.add('active');
        }
    });
});

// Gestion des favoris
const favoriteStars = document.querySelectorAll('.favorite');
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
    // Ré-attacher les événements de clic pour les nouveaux liens
    document.querySelectorAll('#favorites-list a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });
}

favoriteStars.forEach(star => {
    const chapterId = star.dataset.chapter;
    if (favorites.includes(chapterId)) {
        star.classList.add('active');
        star.textContent = '★';
    }
    star.addEventListener('click', () => {
        if (!favorites.includes(chapterId)) {
            favorites.push(chapterId);
            star.classList.add('active');
            star.textContent = '★';
        } else {
            favorites = favorites.filter(id => id !== chapterId);
            star.classList.remove('active');
            star.textContent = '⭐';
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoritesList();
    });
});

document.getElementById('favorites-btn').addEventListener('click', () => {
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById('favorites').classList.add('active');
});

updateFavoritesList();

// Gestion de la lecture vocale
const voiceToggle = document.getElementById('voice-toggle');
const voiceSelect = document.getElementById('voice-select');
let currentSpeech = null;
let currentChapter = null;
let voices = [];

function populateVoiceList() {
    voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = '<option value="">Voix par défaut</option>';
    voices.forEach((voice, index) => {
        if (voice.lang.startsWith('fr') || voice.lang.startsWith('en') || voice.lang.startsWith('ar')) {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        }
    });
}

// Charger les voix (peut nécessiter un délai sur certains navigateurs)
speechSynthesis.onvoiceschanged = populateVoiceList;
populateVoiceList();

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
                        currentLanguage === 'en' ? 'en-US' : 'ar-SA';
    if (voiceSelect.value) {
        currentSpeech.voice = voices[parseInt(voiceSelect.value)];
    }
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
const languages = ['fr', 'en', 'ar'];

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
    populateVoiceList();
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
            } else {
                h2.textContent = h2.textContent.replace(/Chapter|الفصل/, 'Chapitre');
            }
        }
    });
    const favoritesTitle = document.querySelector('#favorites h2');
    if (currentLanguage === 'en') {
        favoritesTitle.textContent = 'Your Favorite Chapters';
    } else if (currentLanguage === 'ar') {
        favoritesTitle.textContent = 'فصولك المفضلة';
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
