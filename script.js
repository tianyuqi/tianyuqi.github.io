// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add active state to navigation based on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

function highlightNav() {
    let current = '';
    const scrollPosition = window.scrollY;

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.clientHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', highlightNav);

// Section number parallax — scroll slightly slower than body content
const sectionNumbers = document.querySelectorAll('.section-number');

function updateParallax() {
    sectionNumbers.forEach(el => {
        const parent = el.parentElement;
        const rect = parent.getBoundingClientRect();
        const centerVP = window.innerHeight / 2;
        const centerEl = rect.top + rect.height / 2;
        const delta = (centerVP - centerEl) * 0.04;
        el.style.transform = `translateY(${delta}px)`;
    });
}

window.addEventListener('scroll', updateParallax, { passive: true });
updateParallax();

// Console message
console.log('Tianyu Qi — Portfolio 2026');

// Enable the compact homepage navigation only when JavaScript is available.
const homeMenuToggle = document.querySelector('.home-menu-toggle');
if (homeMenuToggle) {
    const homeMenu = document.getElementById('home-menu');
    function setHomeMenuExpanded(expanded) {
        homeMenuToggle.setAttribute('aria-expanded', String(expanded));
        homeMenuToggle.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
    }

    homeMenuToggle.hidden = false;
    homeMenuToggle.addEventListener('click', () => {
        const expanded = homeMenuToggle.getAttribute('aria-expanded') === 'true';
        setHomeMenuExpanded(!expanded);
    });
    homeMenu.addEventListener('click', event => {
        if (event.target.closest('a')) {
            setHomeMenuExpanded(false);
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && homeMenuToggle.getAttribute('aria-expanded') === 'true') {
            setHomeMenuExpanded(false);
            homeMenuToggle.focus();
        }
    });
    document.addEventListener('click', event => {
        if (!event.target.closest('.home-nav')) {
            setHomeMenuExpanded(false);
        }
    });
    window.matchMedia('(max-width: 760px)').addEventListener('change', () => {
        setHomeMenuExpanded(false);
    });
}

// Rotate the homepage photos, keeping a static first image without JavaScript.
const homePhotos = Array.from(document.querySelectorAll('.home-photo'));
if (homePhotos.length > 1) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let currentPhoto = 0;
    let rotationTimer;

    function rotatePhoto() {
        // Only switch to a loaded image; failed or slow images leave no blank frame.
        for (let offset = 1; offset < homePhotos.length; offset++) {
            const nextPhoto = (currentPhoto + offset) % homePhotos.length;
            const photo = homePhotos[nextPhoto];
            if (photo.complete && photo.naturalWidth > 0) {
                homePhotos[currentPhoto].classList.remove('is-active');
                homePhotos[currentPhoto].setAttribute('aria-hidden', 'true');
                photo.classList.add('is-active');
                photo.removeAttribute('aria-hidden');
                currentPhoto = nextPhoto;
                break;
            }
        }
    }

    function updateRotation() {
        window.clearInterval(rotationTimer);
        if (!reducedMotion.matches && !document.hidden) {
            rotationTimer = window.setInterval(rotatePhoto, 6000);
        }
    }

    reducedMotion.addEventListener('change', updateRotation);
    document.addEventListener('visibilitychange', updateRotation);
    updateRotation();
}
