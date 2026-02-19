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

// Update minutes since June 28, 1989 at noon
function updateTime() {
    const referenceDate = new Date('1989-06-28T12:00:00');
    const now = new Date();
    const diffMs = now - referenceDate;
    const diffMinutes = diffMs / (1000 * 60);
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = diffMinutes.toFixed(1);
    }
}

// Update time every second
updateTime();
setInterval(updateTime, 1000);

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
