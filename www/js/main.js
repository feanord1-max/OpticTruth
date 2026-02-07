
// State
let realPhotos = [];
let currentUser = null;
let savedLikes = []; // Will be loaded based on user

// DOM Elements
const galleryGrid = document.getElementById('main-content');
const modal = document.getElementById('photo-modal');
const modalImg = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalMeta = document.getElementById('modal-meta');
const closeBtn = document.querySelector('.close-btn');

function init() {
    // Wait for auth to be determined before rendering fully user-dependent UI
    firebase.auth().onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            savedLikes = JSON.parse(localStorage.getItem(`optic-likes-${user.uid}`) || '[]');
        } else {
            savedLikes = [];
        }
        updateGalleryUI();
    });

    // Start listening to data immediately
    listenForPhotos();
    // loadHeroImage(); // Handled by listenForPhotos
    setupEventListeners();
}

function listenForPhotos() {
    firebase.firestore().collection('photos')
        .limit(50)
        .onSnapshot((snapshot) => {
            realPhotos = [];
            snapshot.forEach((doc) => {
                realPhotos.push({ id: doc.id, ...doc.data() });
            });
            // Sort: Most Vouches First
            realPhotos.sort((a, b) => (b.vouches || 0) - (a.vouches || 0));
            updateGalleryUI();
            updateHeroUI();
        }, (error) => {
            console.error("Error getting photos: ", error);
            if (galleryGrid) galleryGrid.innerHTML = '<p style="text-align:center; padding: 40px; color: red;">Error loading feed. Try refreshing.</p>';
        });
}

function updateGalleryUI() {
    if (!galleryGrid) return;

    if (realPhotos.length === 0) {
        galleryGrid.innerHTML = '<p style="text-align:center; padding: 40px; color: #888;">No photos yet. Be the first to upload!</p>';
        return;
    }

    galleryGrid.innerHTML = realPhotos.map(photo => {
        const isLiked = savedLikes.includes(photo.id);
        return `
        <article class="photo-card ${photo.type || ''}" data-id="${photo.id}">
            <div class="verified-badge" title="Verified Authentic">✓</div>
            <img src="${photo.src}" alt="${photo.title}" loading="lazy">
            <div class="photo-overlay">
                <h3>${photo.title || 'Untitled'}</h3>
                <p class="photographer-meta">${photo.photographer} <span style="opacity:0.6">• ${photo.camera || 'Analog'}</span></p>
                
                <div class="interaction-bar">
                        <div class="tags-list">
                        ${(photo.tags || []).map(tag => `<span class="photo-tag">${tag}</span>`).join('')}
                    </div>
                    <button class="vouch-btn ${isLiked ? 'vouched' : ''}" onclick="event.stopPropagation(); toggleVouch(this, '${photo.id}')">
                        <span class="vouch-icon">${isLiked ? '♥' : '♡'}</span> <span class="vouch-count">${photo.vouches || 0}</span>
                    </button>
                </div>
            </div>
        </article>
    `}).join('');
}

// function loadHeroImage() { ... } replaced by real-time updateHeroUI

function updateHeroUI() {
    const heroImg = document.querySelector('.hero-card img');
    if (!heroImg || realPhotos.length === 0) return;

    const topPhoto = realPhotos[0]; // Already sorted by vouches

    // Only update if source changes to prevent flickering, 
    // but ALWAYS update text in case likes/stats changed
    if (heroImg.src !== topPhoto.src) {
        heroImg.src = topPhoto.src;
    }

    const badge = document.querySelector('.hero-meta .badge');
    if (badge) badge.textContent = `Top Rated: ${topPhoto.title || 'Untitled'}`;

    const details = document.querySelector('.hero-meta .meta-details');
    if (details) {
        details.innerHTML = `
            <span>${topPhoto.exposure || 'Unknown Exposure'}</span> • 
            <span>${topPhoto.camera || 'Analog'}</span> • 
            <span>${topPhoto.photographer || 'Anonymous'}</span>
        `;
    }
}

window.toggleVouch = function (btn, docId) {
    if (!currentUser) {
        alert("Please sign in to vouch/like photos.");
        window.location.href = 'signin.html';
        return;
    }

    const iconSpan = btn.querySelector('.vouch-icon');
    const countSpan = btn.querySelector('.vouch-count');

    // Check Local State
    const index = savedLikes.indexOf(docId);
    const isVouched = index > -1;

    let count = parseInt(countSpan.innerText) || 0;

    if (isVouched) {
        // Unlike
        count = Math.max(0, count - 1);
        btn.classList.remove('vouched');
        iconSpan.innerText = '♡';
        savedLikes.splice(index, 1);
    } else {
        // Like
        count++;
        btn.classList.add('vouched');
        iconSpan.innerText = '♥';
        savedLikes.push(docId);
    }

    // Save Local State using UID Key
    localStorage.setItem(`optic-likes-${currentUser.uid}`, JSON.stringify(savedLikes));
    countSpan.innerText = count;

    // Firestore Update
    const increment = firebase.firestore.FieldValue.increment(isVouched ? -1 : 1);
    firebase.firestore().collection('photos').doc(docId).update({
        vouches: increment
    }).catch(err => console.error("Vouch failed", err));
}

function setupEventListeners() {
    // Hero Buttons
    const joinBtn = document.getElementById('join-btn');
    const viewBtn = document.getElementById('view-gallery-btn');

    if (galleryGrid) {
        galleryGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.photo-card');
            if (card && !e.target.closest('.vouch-btn')) {
                openModal(card.dataset.id);
            }
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal) closeModal();
    });
}

function openModal(id) {
    // Find in tracking array
    const photo = realPhotos.find(p => p.id === id);
    if (!photo) return;

    if (modalImg) modalImg.src = photo.src;
    if (modalTitle) modalTitle.textContent = photo.title || 'Untitled';
    if (modalMeta) {
        const tags = photo.tags ? photo.tags.join(', ') : '';
        modalMeta.textContent = `Captured by ${photo.photographer || 'Anonymous'} on ${photo.camera || 'Unknown Camera'}. ${tags}`;
    }

    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    if (!modal) return;
    modal.classList.remove('visible');
    setTimeout(() => {
        modal.classList.add('hidden');
        if (modalImg) modalImg.src = '';
    }, 400);
    document.body.style.overflow = '';
}

init();
