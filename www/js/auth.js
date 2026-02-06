/**
 * Auth JS
 * Handles Sign In and Sign Up using Firebase Auth
 */

const authForm = document.getElementById('auth-form');
const authToggle = document.getElementById('auth-toggle');
const toggleText = document.getElementById('toggle-text');
const submitBtn = document.getElementById('submit-btn');
const nameGroup = document.getElementById('name-group');
const errorMsg = document.getElementById('error-message');

let isSignUp = false;

// 1. Toggle between Sign In and Sign Up
authToggle.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUp = !isSignUp;

    if (isSignUp) {
        // Switch to Sign Up UI
        nameGroup.style.display = 'block';
        document.getElementById('name-input').required = true;
        submitBtn.textContent = 'Create Account';
        toggleText.textContent = 'Already have an account?';
        authToggle.textContent = 'Sign In';
        document.querySelector('.auth-title').textContent = 'Create Account';
    } else {
        // Switch to Sign In UI
        nameGroup.style.display = 'none';
        document.getElementById('name-input').required = false;
        submitBtn.textContent = 'Sign In';
        toggleText.textContent = 'No account?';
        authToggle.textContent = 'Create Account';
        document.querySelector('.auth-title').textContent = 'Join the Movement';
    }
});

// 2. Handle Form Submission
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const name = document.getElementById('name-input').value;

    try {
        if (isSignUp) {
            // Create User
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update Profile with Name
            await user.updateProfile({
                displayName: name
            });

            // (Optional) Create User Document in Firestore
            await firebase.firestore().collection('users').doc(user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                bio: 'Passionate photographer.',
                handle: '@' + name.replace(/\s+/g, '').toLowerCase()
            });

        } else {
            // Sign In
            await firebase.auth().signInWithEmailAndPassword(email, password);
        }

        // Redirect handled by onAuthStateChanged in common.js (or manual here)
        window.location.href = 'index.html';

    } catch (error) {
        console.error(error);
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
});
