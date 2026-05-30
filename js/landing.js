// landing.js — OWNED BY AYUSH
// Handles all interactivity for landing.html:
// navbar scroll effect, active nav link tracking, and scroll reveal animations.

//NAVBAR SCROLL EFFECT 
// Adds a shadow to the navbar once the user scrolls past 20px.
// This gives the navbar visual depth without being distracting at the top.

const navbar = document.getElementById('navbar');

window.addEventListener('scroll', function() {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
});

//ACTIVE NAV LINK ON SCROLL

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

// SCROLL REVEAL

const revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

// use "reveal" in tag for smooth reveal animation
document.querySelectorAll('.reveal').forEach(function(el) {
    revealObserver.observe(el);
});