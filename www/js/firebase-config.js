const firebaseConfig = {
    apiKey: "AIzaSyAAb8MAbhkbozQw8ripBbvKP1uni2JsMhk",
    authDomain: "optictruth-654a6.firebaseapp.com",
    projectId: "optictruth-654a6",
    storageBucket: "optictruth-654a6.firebasestorage.app",
    messagingSenderId: "257578898685",
    appId: "1:257578898685:web:f632ea74a3a063fb049a94"
};

// Initialize Firebase (Compat)
// This makes sure 'firebase' global is ready for other scripts
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase Initialized");
} else {
    console.error("Firebase SDK not loaded");
}
