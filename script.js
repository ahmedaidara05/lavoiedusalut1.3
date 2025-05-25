function updateFavoritesList() {
    // ... (ton code avant)
    favorites.forEach(favId => {
        let chapterElement = document.getElementById(favId);
        if (chapterElement) {
            let favBtn = chapterElement.querySelector('.favorite');
            if (favBtn) {
                favBtn.classList.add('active');
            }
        }
    });
    // ... (ton code après)

document.addEventListener('DOMContentLoaded', () => {
    // Vérifier que firebase est chargé
    if (!window.firebase) {
        console.error('Firebase SDK non chargé. Vérifiez les scripts dans index.html.');
        return;
    }

    // Protection contre le copier-coller
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('copy', (e) => e.preventDefault());
    document.addEventListener('cut', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.key === 'p' || e.key === 's')) {
            e.preventDefault();
        }
    });

    // Gestion de l'état de l'utilisateur
    const userInfo = document.getElementById('user-info');
    const authForms = document.getElementById('auth-forms');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userStatus = document.getElementById('user-status');
    const authError = document.getElementById('auth-error');

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            userInfo.style.display = 'block';
            authForms.style.display = 'none';
            userName.textContent = user.displayName || 'Utilisateur';
            userEmail.textContent = user.email;
            userStatus.textContent = '🔵';
            // Charger les préférences depuis Firestore
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const data = userDoc.data();
                    currentLanguage = data.language || 'fr';
                    fontSize = data.fontSize || 16;
                    volume = data.volume || 100;
                    favorites = data.favorites || [];
                    progress = data.progress || {};
                    document.body.classList.toggle('dark', data.theme === 'dark');
                    updateLanguage();
                    updateFontSize();
                    updateFavoritesList();
                    if (profileLanguage) profileLanguage.value = currentLanguage;
                    if (profileFontSize) profileFontSize.value = fontSize;
                    if (fontSizeValue) fontSizeValue.textContent = `${fontSize}px`;
                    if (profileVolume) profileVolume.value = volume;
                    if (volumeValue) volumeValue.textContent = `${volume}%`;
                    if (themeToggle) themeToggle.querySelector('.icon').textContent = data.theme === 'dark' ? '☀️' : '🌙';
                    if (profileTheme) profileTheme.checked = data.theme === 'dark';
                }
            } catch (error) {
                console.error('Erreur Firestore:', error);
            }
        } else {
            userInfo.style.display = 'none';
            authForms.style.display = 'block';
            userStatus.textContent = '';
            currentLanguage = localStorage.getItem('language') || 'fr';
            fontSize = parseInt(localStorage.getItem('fontSize')) || 16;
            volume = parseInt(localStorage.getItem('volume')) || 100;
            favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            progress = JSON.parse(localStorage.getItem('progress')) || {};
            updateLanguage();
            updateFontSize();
            updateFavoritesList();
        }
    });

    // Gestion de l'inscription
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            console.log('Inscription:', email);
            try {
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                await userCredential.user.updateProfile({ displayName: name });
                await db.collection('users').doc(userCredential.user.uid).set({
                    language: currentLanguage,
                    theme: document.body.classList.contains('dark') ? 'dark' : 'light',
                    fontSize,
                    volume,
                    favorites,
                    progress
                });
                authError.textContent = '';
                signupForm.reset();
            } catch (error) {
                authError.textContent = error.message;
            }
        });
    }

    // Gestion de la connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            console.log('Connexion:', email);
            try {
                await firebase.auth().signInWithEmailAndPassword(email, password);
                authError.textContent = '';
                loginForm.reset();
            } catch (error) {
                authError.textContent = error.message;
            }
        });
    }

    // Gestion de la déconnexion
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            console.log('Déconnexion');
            try {
                await firebase.auth().signOut();
                authError.textContent = '';
            } catch (error) {
                authError.textContent = error.message;
            }
        });
    }

    // Réinitialisation du mot de passe
    const resetPasswordLink = document.getElementById('reset-password');
    if (resetPasswordLink) {
        resetPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            console.log('Réinitialisation mot de passe:', email);
            if (!email) {
                authError.textContent = 'Veuillez entrer votre e-mail.';
                return;
            }
            try {
                await firebase.auth().sendPasswordResetEmail(email);
                authError.textContent = 'E-mail de réinitialisation envoyé !';
            } catch (error) {
                authError.textContent = error.message;
            }
        });
    }

    // Gestion du mode sombre/clair
    const themeToggle = document.getElementById('theme-toggle');
    const profileTheme = document.getElementById('profile-theme');
    if (themeToggle && profileTheme) {
        themeToggle.addEventListener('click', () => {
            console.log('Clic mode sombre');
            toggleTheme();
        });
        profileTheme.addEventListener('change', () => {
            console.log('Changement thème profil');
            toggleTheme();
        });
    }

    async function updateLanguage() {
    document.querySelectorAll('.content').forEach(content => {
        const section = content.closest('section');
        if (section.classList.contains('active') && content.dataset.lang === currentLanguage) {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    });
    if (!document.querySelector(`section.active .content[data-lang="${currentLanguage}"]`)) {
        console.warn(`Aucun contenu trouvé pour la langue ${currentLanguage} dans la section active`);
    }
    localStorage.setItem('language', currentLanguage);
    if (profileLanguage) profileLanguage.value = currentLanguage;
    if (firebase.auth().currentUser) {
        try {
            await db.collection('users').doc(firebase.auth().currentUser.uid).update({ language: currentLanguage });
        } catch (error) {
            console.error('Erreur mise à jour langue:', error);
        }
    }
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
        profileFontSize.addEventListener('input', async () => {
            console.log('Changement taille police');
            fontSize = parseInt(profileFontSize.value);
            fontSizeValue.textContent = `${fontSize}px`;
            updateFontSize();
            localStorage.setItem('fontSize', fontSize);
            if (firebase.auth().currentUser) {
                try {
                    await db.collection('users').doc(firebase.auth().currentUser.uid).update({ fontSize });
                } catch (error) {
                    console.error('Erreur mise à jour police:', error);
                }
            }
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
        profileVolume.addEventListener('input', async () => {
            console.log('Changement volume');
            volume = parseInt(profileVolume.value);
            volumeValue.textContent = `${volume}%`;
            localStorage.setItem('volume', volume);
            if (currentSpeech) {
                currentSpeech.volume = volume / 100;
            }
            if (firebase.auth().currentUser) {
                try {
                    await db.collection('users').doc(firebase.auth().currentUser.uid).update({ volume });
                } catch (error) {
                    console.error('Erreur mise à jour volume:', error);
                }
            }
        });
    }

    // Gestion de la langue
    let currentLanguage = localStorage.getItem('language') || 'fr';
    const languageToggle = document.getElementById('language-toggle');
    const profileLanguage = document.getElementById('profile-language');
    if (languageToggle && profileLanguage) {
        profileLanguage.value = currentLanguage;
        languageToggle.addEventListener('click', async () => {
            console.log('Clic langue');
            currentLanguage = currentLanguage === 'fr' ? 'en' : currentLanguage === 'en' ? 'ar' : 'fr';
            await updateLanguage();
        });
        profileLanguage.addEventListener('change', async () => {
            console.log('Changement langue profil');
            currentLanguage = profileLanguage.value;
            await updateLanguage();
        });
    }

    async function updateLanguage() {
        document.querySelectorAll('.content').forEach(content => {
            content.style.display = content.dataset.lang === currentLanguage ? 'block' : 'none';
        });
        localStorage.setItem('language', currentLanguage);
        if (profileLanguage) profileLanguage.value = currentLanguage;
        if (firebase.auth().currentUser) {
            try {
                await db.collection('users').doc(firebase.auth().currentUser.uid).update({ language: currentLanguage });
            } catch (error) {
                console.error('Erreur mise à jour langue:', error);
            }
        }
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
        homeButton.addEventListener('click', () => {
            console.log('Clic accueil');
            goToHome();
        });
    }
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            console.log('Clic sommaire');
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById('table-of-contents').classList.add('active');
        });
    }
    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log('Clic commencer');
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById('table-of-contents').classList.add('active');
        });
    }
    if (profileButton) {
        profileButton.addEventListener('click', () => {
            console.log('Clic profil');
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById('profile').classList.add('active');
        });
    }
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Clic fermer');
            goToHome();
        });
    });

    function goToHome() {
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById('home').classList.add('active');
    }

    const links = document.querySelectorAll('#chapter-list a, #favorites-list a');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Clic lien chapitre');
            const targetId = link.getAttribute('href').substring(1);
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Navigation entre chapitres
    const chapters = [
    'preamble', 'foreword', 'chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5',
    'chapter6', 'chapter7', 'chapter8', 'chapter9', 'chapter10', 'chapter11', 'chapter12',
    'chapter13', 'chapter14', 'chapter15', 'chapter16', 'chapter17', 'chapter18', 'chapter19',
    'chapter20', 'chapter21', 'chapter22', 'chapter23', 'chapter24', 'chapter25', 'chapter26',
    'chapter27', 'chapter28', 'chapter29', 'chapter30', 'chapter31', 'chapter32', 'chapter33',
    'chapter34', 'chapter35', 'chapter36', 'chapter37', 'chapter38', 'chapter39', 'chapter40',
    'chapter41', 'chapter42'
];

function updateNavigation(currentChapterId) {
    const currentIndex = chapters.indexOf(currentChapterId);
    const prevButtons = document.querySelectorAll(`#${currentChapterId} .prev-btn`);
    const nextButtons = document.querySelectorAll(`#${currentChapterId} .next-btn`);

    prevButtons.forEach(btn => {
        btn.disabled = currentIndex === 0;
    });
    nextButtons.forEach(btn => {
        btn.disabled = currentIndex === chapters.length - 1;
    });
}

const prevButtons = document.querySelectorAll('.prev-btn');
const nextButtons = document.querySelectorAll('.next-btn');

prevButtons.forEach(button => {
    button.addEventListener('click', () => {
        console.log('Clic précédent');
        const currentChapter = button.closest('section').id;
        const currentIndex = chapters.indexOf(currentChapter);
        if (currentIndex > 0) {
            sections.forEach(section => section.classList.remove('active'));
            const prevChapterId = chapters[currentIndex - 1];
            document.getElementById(prevChapterId).classList.add('active');
            updateNavigation(prevChapterId);
        }
    });
});

nextButtons.forEach(button => {
    button.addEventListener('click', () => {
        console.log('Clic suivant');
        const currentChapter = button.closest('section').id;
        const currentIndex = chapters.indexOf(currentChapter);
        if (currentIndex < chapters.length - 1) {
            sections.forEach(section => section.classList.remove('active'));
            const nextChapterId = chapters[currentIndex + 1];
            document.getElementById(nextChapterId).classList.add('active');
            updateNavigation(nextChapterId);
        }
    });
});

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Clic suivant');
            const currentChapter = button.closest('section').id;
            const currentIndex = chapters.indexOf(currentChapter);
            if (currentIndex < chapters.length - 1) {
                sections.forEach(section => section.classList.remove('active'));
                document.getElementById(chapters[currentIndex + 1]).classList.add('active');
            }
        });
    });

    // Gestion des favoris et progression
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let progress = JSON.parse(localStorage.getItem('progress')) || {};
    const favoriteStars = document.querySelectorAll('.favorite');

    async function updateFavoritesList() {
        const favoritesList = document.getElementById('favorites-list');
        if (favoritesList) {
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
                    console.log('Clic favori');
                    const targetId = link.getAttribute('href').substring(1);
                    sections.forEach(section => section.classList.remove('active'));
                    document.getElementById(targetId).classList.add('active');
                });
            });
            if (firebase.auth().currentUser) {
                try {
                    await db.collection('users').doc(firebase.auth().currentUser.uid).update({ favorites });
                } catch (error) {
                    console.error('Erreur mise à jour favoris:', error);
                }
            }
        }
    }

    favoriteStars.forEach(star => {
        const chapterId = star.dataset.chapter;
        if (favorites.includes(chapterId)) {
            star.classList.add('active');
            star.textContent = '★';
        }
        star.addEventListener('click', async () => {
            console.log('Clic favori étoile');
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
            await updateFavoritesList();
        });
    });

    const favoritesButton = document.getElementById('favorites-btn');
    if (favoritesButton) {
        favoritesButton.addEventListener('click', () => {
            console.log('Clic favoris');
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById('favorites').classList.add('active');
        });
    }

    async function trackProgress() {
        const activeSection = document.querySelector('section.active');
        if (!activeSection || !activeSection.classList.contains('chapter') || activeSection.id === 'favorites' || activeSection.id === 'table-of-contents' || activeSection.id === 'profile') return;

        const chapterId = activeSection.id;
        const content = activeSection.querySelector('.content');
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const contentHeight = content.scrollHeight - window.innerHeight;
        const progressPercent = contentHeight > 0 ? Math.min(100, (scrollTop / contentHeight) * 100) : 100;

        progress[chapterId] = Math.max(progress[chapterId] || 0, progressPercent);
        localStorage.setItem('progress', JSON.stringify(progress));
        await updateFavoritesList();
        if (firebase.auth().currentUser) {
            try {
                await db.collection('users').doc(firebase.auth().currentUser.uid).update({ progress });
            } catch (error) {
                console.error('Erreur mise à jour progression:', error);
            }
        }
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
        if (voiceSelect) {
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
    }

    speechSynthesis.onvoiceschanged = populateVoiceList;
    populateVoiceList();

    if (voiceToggle) {
        voiceToggle.addEventListener('click', () => {
            console.log('Clic lecture vocale');
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

    // --- New Hamburger Menu Functionality ---
    const hamburgerMenuBtn = document.getElementById('hamburger-menu-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (hamburgerMenuBtn && dropdownMenu) {
        hamburgerMenuBtn.addEventListener('click', (event) => {
            console.log('Clic bouton hamburger');
            dropdownMenu.classList.toggle('show'); // Toggle the 'show' class
            event.stopPropagation(); // Prevent the click from immediately closing the menu
        });

        // Close the dropdown menu if a click occurs outside of it
        document.addEventListener('click', (event) => {
            if (!dropdownMenu.contains(event.target) && !hamburgerMenuBtn.contains(event.target)) {
                if (dropdownMenu.classList.contains('show')) {
                    dropdownMenu.classList.remove('show');
                    console.log('Menu hamburger fermé en cliquant à l\'extérieur.');
                }
            }
        });

        // Close the dropdown menu when an item inside it is clicked
        dropdownMenu.querySelectorAll('button, select').forEach(item => {
            item.addEventListener('click', () => {
                dropdownMenu.classList.remove('show');
                console.log('Menu hamburger fermé après sélection.');
            });
        });
    }
});

const apiKey = "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";

document.getElementById("chat-icon").onclick = () => {
  const window = document.getElementById("chat-window");
  window.style.display = window.style.display === "flex" ? "none" : "flex";
};

async function askBookAI() {
  const input = document.getElementById("chat-question");
  const messagesDiv = document.getElementById("chat-messages");
  const question = input.value.trim();
  input.value = "";
  if (!question) return;

  // Ajoute le message utilisateur
  const userMsg = document.createElement("div");
  userMsg.className = "message-user";
  userMsg.textContent = question;
  messagesDiv.appendChild(userMsg);

  // Message en attente
  const thinkingMsg = document.createElement("div");
  thinkingMsg.className = "message-ai";
  thinkingMsg.textContent = "Réfléchit...";
  messagesDiv.appendChild(thinkingMsg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  const bookContent = document.getElementById("book-content").innerText;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Tu es un assistant littéraire. Tu dois répondre uniquement selon le contenu du livre fourni par l'utilisateur."
          },
          {
            role: "user",
            content: `Voici le contenu du livre : """${bookText}"""\nVoici ma question : ${question}`
          }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "❌ Pas de réponse";

    thinkingMsg.remove(); // Retire "Réfléchit..."
    const aiMsg = document.createElement("div");
    aiMsg.className = "message-ai";
    aiMsg.textContent = reply;
    messagesDiv.appendChild(aiMsg);
  } catch (err) {
    thinkingMsg.textContent = "❌ Erreur de l'IA.";
  }

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Permet de déplacer le bouton
const chatIcon = document.getElementById("chat-icon");
let isDragging = false;

chatIcon.addEventListener("mousedown", (e) => {
  isDragging = true;
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  chatIcon.style.left = e.pageX - 30 + "px";
  chatIcon.style.top = e.pageY - 30 + "px";
  chatIcon.style.bottom = "auto";
  chatIcon.style.right = "auto";
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

// Variable pour suivre la slide actuelle du carrousel
let currentSlide = 0;
const carousel = document.querySelector('.carousel');
const slides = document.querySelectorAll('.carousel-slide');
const totalSlides = slides.length;
const prevButton = document.querySelector('.nav-button.prev');
const nextButton = document.querySelector('.nav-button.next');
const paginationDots = document.querySelectorAll('.pagination .dot');

// Fonction pour afficher une slide spécifique
function showSlide(index) {
    if (index >= totalSlides) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = totalSlides - 1;
    } else {
        currentSlide = index;
    }
    const offset = -currentSlide * 100;
    carousel.style.transform = `translateX(${offset}%)`;

    // Met à jour les indicateurs de pagination
    paginationDots.forEach((dot, i) => {
        dot.classList.remove('active');
        if (i === currentSlide) {
            dot.classList.add('active');
        }
    });

    // Masque/affiche les boutons de navigation (utile si pas de boucle)
    prevButton.disabled = currentSlide === 0;
    nextButton.disabled = currentSlide === totalSlides - 1;
}

// Gère le bouton suivant
function nextSlide() {
    showSlide(currentSlide + 1);
}

// Gère le bouton précédent
function prevSlide() {
    showSlide(currentSlide - 1);
}

// Initialise le carrousel
document.addEventListener('DOMContentLoaded', () => {
    showSlide(0); // Affiche la première slide au chargement

    // Écouteurs d'événements pour les boutons de navigation du carrousel
    nextButton.addEventListener('click', nextSlide);
    prevButton.addEventListener('click', prevSlide);

    // Écouteurs d'événements pour les points de pagination
    paginationDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            const slideIndex = parseInt(e.target.dataset.slide);
            showSlide(slideIndex);
        });
    });

    // Initialise l'affichage de la page d'accueil (le carrousel)
    // Assurez-vous que la div app-container est visible au départ.
    // Votre `showSection` va la cacher si une autre section est activée.
    document.querySelector('.app-container').style.display = 'block';

    // *** Intégration avec votre système de navigation existant ***

    // Fonction pour afficher une section et cacher les autres
    window.showSection = function(sectionId) {
        // Cacher toutes les sections, y compris le carrousel (app-container)
        document.querySelectorAll('main > *').forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Afficher la section demandée
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            // Si la section est un chapitre, assurez-vous de remonter en haut
            if (targetSection.classList.contains('chapter')) {
                targetSection.scrollTop = 0;
            }
        }
    };

    // Gestion du bouton "Commencer" du carrousel
    document.querySelector('.start-button').addEventListener('click', () => {
        showSection('table-of-contents');
    });

    // Gestion des boutons de la barre de navigation du bas
    document.getElementById('home-btn').addEventListener('click', () => {
        showSection('app-container'); // Retourne à l'accueil du carrousel
    });

    document.getElementById('menu-btn').addEventListener('click', () => {
        showSection('table-of-contents');
    });

    document.getElementById('favorites-btn').addEventListener('click', () => {
        showSection('favorites');
    });

    document.getElementById('profile-btn').addEventListener('click', () => {
        showSection('profile');
    });

    // Gérer les liens de chapitre dans le sommaire
    document.querySelectorAll('#chapter-list a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Empêche le défilement par défaut
            const chapterId = this.getAttribute('href').substring(1); // Supprime le '#'
            showSection(chapterId);
        });
    });

    // Gérer les boutons de fermeture des chapitres
    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', () => {
            showSection('app-container'); // Retourne à l'accueil du carrousel
        });
    });


    // ** Votre logique existante pour le mode sombre, la lecture vocale, etc. **
    // Elle devrait être intégrée ici ou dans firebase.js si elle est liée à Firebase.

    // Exemple de gestion du thème (à adapter à votre code existant)
    const themeToggle = document.getElementById('theme-toggle') || document.getElementById('profile-theme');
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
        });
        // Charger le thème sauvegardé
        if (localStorage.getItem('dark-mode') === 'true') {
            document.body.classList.add('dark-mode');
            if (themeToggle.type === 'checkbox') {
                themeToggle.checked = true;
            }
        }
    }

    // Initialisation de la lecture vocale (si présente dans votre code)
    // C'est un exemple, adaptez-le avec votre implémentation complète
    const voiceToggle = document.getElementById('voice-toggle');
    const voiceSelect = document.getElementById('voice-select');
    let utterance = null; // Déplacez utterance ici si c'est global

    function populateVoiceList() {
        if (typeof speechSynthesis === 'undefined') return;
        const voices = speechSynthesis.getVoices();
        voiceSelect.innerHTML = ''; // Nettoyer les options existantes
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = voice.name + ' (' + voice.lang + ')';
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        });
        // Sélectionnez la voix par défaut ou la dernière utilisée
        const savedVoiceURI = localStorage.getItem('selectedVoiceURI');
        if (savedVoiceURI) {
            voiceSelect.value = savedVoiceURI; // Ou une logique plus complexe pour la trouver par URI
        }
    }

    if (voiceSelect) {
        populateVoiceList();
        if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = populateVoiceList;
        }

        voiceSelect.addEventListener('change', () => {
            const selectedVoiceURI = voiceSelect.value;
            localStorage.setItem('selectedVoiceURI', selectedVoiceURI);
        });
    }

    if (voiceToggle) {
        voiceToggle.addEventListener('click', () => {
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            } else {
                const currentChapterContent = document.querySelector('.chapter.active .content[data-lang="fr"] p');
                if (currentChapterContent) {
                    const text = currentChapterContent.innerText;
                    utterance = new SpeechSynthesisUtterance(text);
                    const selectedVoiceName = voiceSelect.options[voiceSelect.selectedIndex].getAttribute('data-name');
                    const voices = speechSynthesis.getVoices();
                    utterance.voice = voices.find(voice => voice.name === selectedVoiceName) || voices.find(voice => voice.lang === 'fr-FR');
                    utterance.rate = 1; // Vitesse de lecture
                    utterance.pitch = 1; // Hauteur de la voix

                    speechSynthesis.speak(utterance);
                }
            }
        });
    }

    // Gestion de la traduction (si présente)
    const languageToggle = document.getElementById('language-toggle');
    const profileLanguageSelect = document.getElementById('profile-language');
    let currentLanguage = localStorage.getItem('appLanguage') || 'fr';

    function setLanguage(lang) {
        document.querySelectorAll('[data-lang]').forEach(element => {
            if (element.dataset.lang === lang) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
        localStorage.setItem('appLanguage', lang);
        currentLanguage = lang; // Mettre à jour la variable globale
    }

    if (languageToggle) {
        languageToggle.addEventListener('click', () => {
            // Basculer entre fr, en, ar
            const languages = ['fr', 'en', 'ar'];
            const currentIndex = languages.indexOf(currentLanguage);
            const nextIndex = (currentIndex + 1) % languages.length;
            setLanguage(languages[nextIndex]);
            if (profileLanguageSelect) {
                profileLanguageSelect.value = languages[nextIndex];
            }
        });
    }
    if (profileLanguageSelect) {
        profileLanguageSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
    // Appliquer la langue au chargement initial pour les chapitres
    setLanguage(currentLanguage);
    if (profileLanguageSelect) {
        profileLanguageSelect.value = currentLanguage;
    }

    // Gérer les favoris (à adapter à votre code Firebase)
    const favoritesBtn = document.getElementById('favorites-btn');
    document.querySelectorAll('.favorite').forEach(star => {
        star.addEventListener('click', function() {
            const chapterId = this.dataset.chapter;
            // Logique d'ajout/retrait aux favoris via Firebase ou localStorage
            console.log(`Toggle favorite for chapter: ${chapterId}`);
            this.classList.toggle('favorited'); // Ajoutez une classe pour changer le style
        });
    });


    // Gestion de la taille de la police (à adapter)
    const fontSizeControl = document.getElementById('profile-font-size');
    const fontSizeValueSpan = document.getElementById('font-size-value');

    if (fontSizeControl && fontSizeValueSpan) {
        fontSizeControl.addEventListener('input', () => {
            const fontSize = fontSizeControl.value;
            document.body.style.fontSize = `${fontSize}px`;
            fontSizeValueSpan.textContent = `${fontSize}px`;
            localStorage.setItem('fontSize', fontSize);
        });
        // Charger la taille de police sauvegardée
        const savedFontSize = localStorage.getItem('fontSize');
        if (savedFontSize) {
            document.body.style.fontSize = `${savedFontSize}px`;
            fontSizeControl.value = savedFontSize;
            fontSizeValueSpan.textContent = `${savedFontSize}px`;
        }
    }

    // Gestion du volume (à adapter)
    const volumeControl = document.getElementById('profile-volume');
    const volumeValueSpan = document.getElementById('volume-value');

    if (volumeControl && volumeValueSpan) {
        volumeControl.addEventListener('input', () => {
            const volume = volumeControl.value / 100; // Convertir en 0-1
            // Appliquer à l'objet SpeechSynthesisUtterance si la lecture est en cours
            if (utterance) {
                utterance.volume = volume;
            }
            // Mettre à jour l'affichage
            volumeValueSpan.textContent = `${volumeControl.value}%`;
            localStorage.setItem('volume', volumeControl.value);
        });
        // Charger le volume sauvegardé
        const savedVolume = localStorage.getItem('volume');
        if (savedVolume) {
            volumeControl.value = savedVolume;
            volumeValueSpan.textContent = `${savedVolume}%`;
        }
    }
});

// Fonction pour afficher les sections
function showSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    document.getElementById(sectionId).classList.add('active');
}

// Gestion des clics sur les boutons de navigation
document.addEventListener('DOMContentLoaded', function() {
    // Boutons du header
    document.getElementById('home-btn').addEventListener('click', () => showSection('home'));
    document.getElementById('menu-btn').addEventListener('click', () => showSection('table-of-contents'));
    document.getElementById('favorites-btn').addEventListener('click', () => showSection('favorites'));
    document.getElementById('profile-btn').addEventListener('click', () => showSection('profile'));
    
    // Boutons de fermeture dans les chapitres
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => showSection('home'));
    });
});


    
}
