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

    // Gestion du carrousel
    const carousel = document.querySelector('.carousel');
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');
    let currentSlide = 0;
    let startX = 0;
    let isDragging = false;

    function updateCarousel() {
        carousel.style.transform = `translateX(-${currentSlide * 20}%)`;
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        prevButton.disabled = currentSlide === 0;
        nextButton.disabled = currentSlide === slides.length - 1;
    }

    prevButton.addEventListener('click', () => {
        if (currentSlide > 0) {
            currentSlide--;
            updateCarousel();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentSlide < slides.length - 1) {
            currentSlide++;
            updateCarousel();
        }
    });

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            currentSlide = parseInt(dot.getAttribute('data-slide'));
            updateCarousel();
        });
    });

    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    carousel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const diffX = startX - currentX;

        if (diffX > 50 && currentSlide < slides.length - 1) {
            currentSlide++;
            updateCarousel();
            isDragging = false;
        } else if (diffX < -50 && currentSlide > 0) {
            currentSlide--;
            updateCarousel();
            isDragging = false;
        }
    });

    carousel.addEventListener('touchend', () => {
        isDragging = false;
    });

    slides.forEach(slide => {
        const content = slide.querySelector('.content');
        const description = slide.querySelector('.description');
        content.style.opacity = 0;
        content.style.transform = 'translateY(20px)';
        description.style.opacity = 0;
        description.style.transform = 'translateY(20px)';
    });

    const firstContent = slides[0].querySelector('.content');
    const firstDescription = slides[0].querySelector('.description');
    firstContent.style.transition = 'opacity 0.8s, transform 0.8s';
    firstContent.style.opacity = 1;
    firstContent.style.transform = 'translateY(0)';
    firstDescription.style.transition = 'opacity 0.8s 0.2s, transform 0.8s 0.2s';
    firstDescription.style.opacity = 1;
    firstDescription.style.transform = 'translateY(0)';

    carousel.addEventListener('transitionend', () => {
        const currentContent = slides[currentSlide].querySelector('.content');
        const currentDescription = slides[currentSlide].querySelector('.description');
        currentContent.style.transition = 'opacity 0.8s, transform 0.8s';
        currentContent.style.opacity = 1;
        currentContent.style.transform = 'translateY(0)';
        currentDescription.style.transition = 'opacity 0.8s 0.2s, transform 0.8s 0.2s';
        currentDescription.style.opacity = 1;
        currentDescription.style.transform = 'translateY(0)';
    });

    updateCarousel();

    // Gestion des paramètres
    document.querySelectorAll('.settings-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('section').forEach(section => section.classList.remove('active'));
            document.getElementById('profile').classList.add('active');
        });
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

    const sections = document.querySelectorAll('section');
    const homeButton = document.getElementById('home-btn');
    const menuButton = document.getElementById('menu-btn');
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
