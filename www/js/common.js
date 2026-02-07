/**
 * Common JS for OpticTruth
 * Handles Auth State, Navigation Updates, and Shared Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    updateHeroState();
});

// function isLoggedIn() {
//     return !!localStorage.getItem('optic-user');
// }

// New Auth Logic: We rely on Firebase observer, but for synchronous UI checks, 
// we might need to wait or check current user. 
// Since Firebase is async, we'll listen for state changes.

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in.
        localStorage.setItem('optic-user', JSON.stringify({
            uid: user.uid,
            name: user.displayName,
            email: user.email
        }));
        updateNavigation(true);
        updateHeroState(true);
    } else {
        // User is signed out.
        localStorage.removeItem('optic-user');
        updateNavigation(false);
        updateHeroState(false);
    }
});

function isLoggedIn() {
    return !!firebase.auth().currentUser || !!localStorage.getItem('optic-user');
}

function updateNavigation(userLoggedIn) {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;

    // Use argument if provided, otherwise fallback
    const loggedIn = userLoggedIn !== undefined ? userLoggedIn : isLoggedIn();

    // 1. Check if we strictly need to add the Submit link
    const hasSubmit = nav.querySelector('a[href="submit.html"]');

    if (loggedIn) {
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
    // 2. Handle Sign In / Sign Out
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        // Clone to strip existing listeners (important for toggling state)
        const newLink = authLink.cloneNode(true);
        authLink.parentNode.replaceChild(newLink, authLink);

        if (loggedIn) {
            newLink.textContent = 'Sign Out';
            newLink.href = '#';
            newLink.classList.remove('active'); // Optional: remove active if on signin page

            newLink.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        } else {
            // Reset to Sign In state
            newLink.textContent = 'Sign In';
            newLink.href = 'signin.html';
            // Default behavior (navigate to href) applies
        }
        // 3. Handle Username Display
        let userDisplay = document.getElementById('user-display');

        if (loggedIn) {
            // Try to get user info
            let displayName = 'Photographer';
            try {
                const userStr = localStorage.getItem('optic-user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    displayName = user.name || user.email.split('@')[0] || 'Photographer';
                }
            } catch (e) { }

            if (!userDisplay) {
                userDisplay = document.createElement('span');
                userDisplay.id = 'user-display';
                userDisplay.className = 'nav-user-display'; // For potential CSS
                userDisplay.style.marginRight = 'var(--spacing-md)';
                userDisplay.style.fontWeight = '500';
                userDisplay.style.fontSize = '0.9rem';
                userDisplay.style.color = 'var(--color-text)';

                // Re-query auth link to ensure we have the live one (since we might have replaced it above)
                const currentAuthLink = document.getElementById('auth-link');
                if (currentAuthLink) {
                    nav.insertBefore(userDisplay, currentAuthLink);
                } else {
                    nav.appendChild(userDisplay);
                }
            }
            userDisplay.textContent = `Hi, ${displayName}`;
            userDisplay.style.display = 'inline';
        } else {
            if (userDisplay) {
                userDisplay.remove();
            }
        }
    }
}

function updateHeroState(userLoggedIn) {
    const uploadBtn = document.getElementById('hero-upload-btn');
    const createBtn = document.getElementById('hero-create-btn');
    const galleryBtn = document.getElementById('hero-gallery-btn');

    // If buttons don't exist (e.g. not on index.html), return
    if (!uploadBtn) return;

    const loggedIn = userLoggedIn !== undefined ? userLoggedIn : isLoggedIn();

    if (loggedIn) {
        // State: Logged In
        // Show: Upload, View Gallery
        // Hide: Create Account
        if (createBtn) createBtn.style.display = 'none';
        if (galleryBtn) galleryBtn.style.display = 'inline-block';

        // Ensure listeners function correctly
        uploadBtn.onclick = () => window.location.href = 'submit.html';
        if (galleryBtn) galleryBtn.onclick = () => window.location.href = 'profile.html';

    } else {
        // State: Logged Out
        // Show: Upload (leads to login), Create Account
        // Hide: View Gallery
        if (createBtn) createBtn.style.display = 'inline-block';
        if (galleryBtn) galleryBtn.style.display = 'none';

        // Listeners for Logged Out state
        uploadBtn.onclick = () => window.location.href = 'signin.html';
        if (createBtn) createBtn.onclick = () => window.location.href = 'signin.html';
    }
}

function logout() {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
        window.location.href = 'index.html';
    });
}
