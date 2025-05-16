document.addEventListener('DOMContentLoaded', () => {
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
    const profileTheme = document.getElementById('profile-theme');
    if (themeToggle && profileTheme) {
        themeToggle.addEventListener('click', toggleTheme);
        profileTheme.addEventListener('change', toggleTheme);
    }

    function toggleTheme() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        themeToggle.querySelector('.icon').textContent = isDark ? '☀️' : '🌙';
        profileTheme.checked = isDark;
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        if (themeToggle) themeToggle.querySelector('.icon').textContent = '☀️';
        if (profileTheme) profileTheme.checked = true;
    }

    // Gestion de la taille de la police
    let fontSize = parseInt(localStorage.getItem('fontSize')) || 16;
    const profileFontSize = document.getElementById('profile-font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    if (profileFontSize && fontSizeValue) {
        profileFontSize.value = fontSize;
        fontSizeValue.textContent = `${fontSize}px`;
        profileFontSize.addEventListener('input', () => {
            fontSize = parseInt(profileFontSize.value);
            fontSizeValue.textContent = `${fontSize}px`;
            updateFontSize();
            localStorage.setItem('fontSize', fontSize);
        });
    }

    function updateFontSize() {
        document.querySelectorAll('section, section *').forEach(element => {
            element.style.fontSize = `${fontSize}px`;
        });
        document.querySelectorAll('.prev-btn, .next-btn, .close-btn, .favorite').forEach(element => {
            element.style.fontSize = `${fontSize * 0.9}px`;
        });
    }

    updateFontSize();

    // Gestion du volume de la lecture vocale
    let volume = parseInt(localStorage.getItem('volume')) || 100;
    const profileVolume = document.getElementById('profile-volume');
    const volumeValue = document.getElementById('volume-value');
    if (profileVolume && volumeValue) {
        profileVolume.value = volume;
        volumeValue.textContent = `${volume}%`;
        profileVolume.addEventListener('input', () => {
            volume = parseInt(profileVolume.value);
            volumeValue.textContent = `${volume}%`;
            localStorage.setItem('volume', volume);
            if (currentSpeech) {
                currentSpeech.volume = volume / 100;
            }
        });
    }

    // Gestion de la langue
    let currentLanguage = localStorage.getItem('language') || 'fr';
    const languageToggle = document.getElementById('language-toggle');
    const profileLanguage = document.getElementById('profile-language');
    if (languageToggle && profileLanguage) {
        profileLanguage.value = currentLanguage;
        languageToggle.addEventListener('click', () => {
            currentLanguage = currentLanguage === 'fr' ? 'en' : currentLanguage === 'en' ? 'ar' : 'fr';
            updateLanguage();
        });
        profileLanguage.addEventListener('change', () => {
            currentLanguage = profileLanguage.value;
            updateLanguage();
        });
    }

    function updateLanguage() {
        document.querySelectorAll('.content').forEach(content => {
            content.style.display = content.dataset.lang === currentLanguage ? 'block' : 'none';
        });
        localStorage.setItem('language', currentLanguage);
        if (profileLanguage) profileLanguage.value = currentLanguage;
    }

    updateLanguage();

    // Navigation entre sections
    const sections = document.querySelectorAll('section');
    const homeButton = document.getElementById('home-btn');
    const menuButton = document.getElementById('menu-btn');
    const startButton = document.getElementById('start-btn');
    const profileButton = document.getElementById('profile-btn');
    const closeButtons = document.querySelectorAll('.close-btn');

    if (homeButton) {
        homeButton.addEventListener('click', goToHome);
    }
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById('table-of-contents').classList.add('active');
        });
    }
    if (startButton) {
        startButton.addEventListener('click', () => {
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById('table-of-contents').classList.add('active');
        });
    }
    if (profileButton) {
        profileButton.addEventListener('click', () => {
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById('profile').classList.add('active');
        });
    }
    closeButtons.forEach(button => {
        button.addEventListener('click', goToHome);
    });

    function goToHome() {
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById('home').classList.add('active');
    }

    const links = document.querySelectorAll('#chapter-list a, #favorites-list a');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
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

    // Gestion des favoris et progression
    const favoriteStars = document.querySelectorAll('.favorite');
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let progress = JSON.parse(localStorage.getItem('progress')) || {};

    function updateFavoritesList() {
        const favoritesList = document.getElementById('favorites-list');
        favoritesList.innerHTML = '';
        favorites.forEach(chapterId => {
            const chapterTitle = document.getElementById(chapterId).querySelector('h2').textContent;
            const progressPercent = progress[chapterId] || 0;
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="#${chapterId}">${chapterTitle}</a>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progressPercent}%"></div>
                </div>
            `;
            favoritesList.appendChild(li);
        });
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

    const favoritesButton = document.getElementById('favorites-btn');
    if (favoritesButton) {
        favoritesButton.addEventListener('click', () => {
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById('favorites').classList.add('active');
        });
    }

    function trackProgress() {
        const activeSection = document.querySelector('section.active');
        if (!activeSection || !activeSection.classList.contains('chapter') || activeSection.id === 'favorites' || activeSection.id === 'table-of-contents' || activeSection.id === 'profile') return;

        const chapterId = activeSection.id;
        const content = activeSection.querySelector('.content');
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const contentHeight = content.scrollHeight - window.innerHeight;
        const progressPercent = contentHeight > 0 ? Math.min(100, (scrollTop / contentHeight) * 100) : 100;

        progress[chapterId] = Math.max(progress[chapterId] || 0, progressPercent);
        localStorage.setItem('progress', JSON.stringify(progress));
        updateFavoritesList();
    }

    window.addEventListener('scroll', trackProgress);
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
        let voiceCounter = 1;
        voices.forEach((voice, index) => {
            if (voice.lang.startsWith('fr') || voice.lang.startsWith('en') || voice.lang.startsWith('ar')) {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `Voix ${voiceCounter} (${voice.lang})`;
                voiceSelect.appendChild(option);
                voiceCounter++;
            }
        });
    }

    speechSynthesis.onvoiceschanged = populateVoiceList;
    populateVoiceList();

    if (voiceToggle) {
        voiceToggle.addEventListener('click', () => {
            const activeSection = document.querySelector('section.active');
            if (!activeSection || activeSection.id === 'home' || activeSection.id === 'favorites' || activeSection.id === 'table-of-contents' || activeSection.id === 'profile') return;

            const chapterId = activeSection.id;
            const content = activeSection.querySelector(`.content[data-lang="${currentLanguage}"]`);
            const text = Array.from(content.querySelectorAll('p')).map(p => p.textContent).join(' ');

            if (currentSpeech && currentChapter === chapterId && !speechSynthesis.paused) {
                speechSynthesis.pause();
                currentSpeech.paused = true;
                voiceToggle.querySelector('.icon').textContent = '▶️';
            } else if (currentSpeech && currentSpeech.paused) {
                speechSynthesis.resume();
                currentSpeech.paused = false;
                voiceToggle.querySelector('.icon').textContent = '⏸️';
            } else {
                if (currentSpeech) {
                    speechSynthesis.cancel();
                }
                currentSpeech = new SpeechSynthesisUtterance(text);
                currentSpeech.lang = currentLanguage === 'fr' ? 'fr-FR' : currentLanguage === 'en' ? 'en-US' : 'ar-SA';
                currentSpeech.volume = volume / 100;
                if (voiceSelect.value) {
                    currentSpeech.voice = voices[parseInt(voiceSelect.value)];
                }
                currentSpeech.paused = false;
                currentChapter = chapterId;
                speechSynthesis.speak(currentSpeech);
                voiceToggle.querySelector('.icon').textContent = '⏸️';
                currentSpeech.onend = () => {
                    voiceToggle.querySelector('.icon').textContent = '🔊';
                    currentSpeech = null;
                    currentChapter = null;
                };
            }
        });
    }
});
