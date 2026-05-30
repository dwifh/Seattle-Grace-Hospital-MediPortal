// landing.js — OWNED BY AYUSH
// Handles all interactivity for landing.html:
// navbar scroll effect, active nav link tracking, and scroll reveal animations.

// ── NAVBAR SCROLL EFFECT ─────────────────────────────────────
// Adds a shadow to the navbar once the user scrolls past 20px.
// This gives the navbar visual depth without being distracting at the top.

const navbar = document.getElementById('navbar');

window.addEventListener('scroll', function() {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ── ACTIVE NAV LINK ON SCROLL ────────────────────────────────
// Uses IntersectionObserver to track which section is currently in view.
// When a section crosses the 40% threshold, its matching nav link is highlighted.
// This avoids having to manually calculate scroll positions with offsetTop.

const sections  = document.querySelectorAll('section[id], div[id]');
const navLinks  = document.querySelectorAll('.nav-link');

const navObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            navLinks.forEach(function(link) {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + entry.target.id) {
                    link.classList.add('active');
                }
            });
        }
    });
}, { threshold: 0.4 });

sections.forEach(function(section) {
    navObserver.observe(section);
});

// ── SCROLL REVEAL ────────────────────────────────────────────
// Any element with the class "reveal" starts invisible (opacity: 0, translateY: 24px).
// Once it enters the viewport past a 12% threshold, the "visible" class is added
// which transitions it to full opacity and its natural position.
// After becoming visible, the element is unobserved so the transition only fires once.

const revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(function(el) {
    revealObserver.observe(el);
});