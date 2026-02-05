/**
 * Common JS for OpticTruth
 * Handles Auth State, Navigation Updates, and Shared Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    updateHeroState();
});

function isLoggedIn() {
    return !!localStorage.getItem('optic-user');
}

function updateNavigation() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;

    // We need to preserve the "active" class logic, so we'll just append/modify links
    // Ideally we would rebuild the nav, but let's just inject the 'Submit' link if missing

    // 1. Check if we strictly need to add the Submit link
    const hasSubmit = nav.querySelector('a[href="submit.html"]');

    if (isLoggedIn()) {
        if (!hasSubmit) {
            // Insert Submit after Gallery (index of 1 usually) or just append
            const submitLink = document.createElement('a');
            submitLink.href = 'submit.html';
            submitLink.textContent = 'Submit';

            // Insert after 'Gallery' if possible for better order
            const galleryLink = nav.querySelector('a[href="index.html"]');
            if (galleryLink) {
                galleryLink.after(submitLink);
            } else {
                nav.appendChild(submitLink);
            }
        }
    }

    // 2. Handle Sign In / Sign Out
    // Look for existing Sign In link
    const signinLink = nav.querySelector('a[href="signin.html"]');
    if (signinLink) {
        if (isLoggedIn()) {
            signinLink.textContent = 'Sign Out';
            signinLink.href = '#';
            signinLink.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    }
}

function updateHeroState() {
    const heroBtn = document.getElementById('join-btn');
    if (!heroBtn) return;

    if (isLoggedIn()) {
        heroBtn.textContent = 'Upload Photo';
        // Remove old listeners (by cloning) or just update behavior if we handled it in main.js
        // Since main.js adds a listener, let's just override the behavior if we can,
        // but easier: just change the ID or handle the click logic based on text/state in main.js
        // OR: simpler here, we assume main.js navigates to signin.html. 
        // We can overwrite the onclick if it was set via property, but it was set via addEventListener.
        // Let's replace the node to clear listeners.

        const newBtn = heroBtn.cloneNode(true);
        heroBtn.parentNode.replaceChild(newBtn, heroBtn);

        newBtn.addEventListener('click', () => {
            window.location.href = 'submit.html';
        });
    }
}

function logout() {
    localStorage.removeItem('optic-user');
    window.location.href = 'index.html';
}
