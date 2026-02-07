// State
let realPhotos = [];
let currentUser = null;
let savedLikes = [];
let savedCollection = [];

// DOM Elements
const galleryGrid = document.getElementById('main-content');
const modal = document.getElementById('photo-modal');
const modalImg = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalMeta = document.getElementById('modal-meta');
const closeBtn = document.querySelector('.close-btn');

function init() {
    firebase.auth().onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            // Load Likes
            try {
                savedLikes = JSON.parse(localStorage.getItem(`optic-likes-${user.uid}`) || '[]');
                if (!Array.isArray(savedLikes)) savedLikes = [];
            } catch (e) { savedLikes = []; }

            // Load Collection
            try {
                savedCollection = JSON.parse(localStorage.getItem(`optic-collection-${user.uid}`) || '[]');
                if (!Array.isArray(savedCollection)) savedCollection = [];
            } catch (e) { savedCollection = []; }
        } else {
            savedLikes = [];
            savedCollection = [];
        }
        updateGalleryUI();
    });

    listenForPhotos();
    setupEventListeners();

    // Search Listener
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = realPhotos.filter(photo => {
                const title = (photo.title || '').toLowerCase();
                const tags = (photo.tags || []).join(' ').toLowerCase();
                const photographer = (photo.photographer || '').toLowerCase();
                const camera = (photo.camera || '').toLowerCase();
                return title.includes(query) || tags.includes(query) || photographer.includes(query) || camera.includes(query);
            });
            updateGalleryUI(filtered);
        });
    }
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

// Update UI
function updateGalleryUI(photosToRender = realPhotos) {
    if (!galleryGrid) return;

    if (photosToRender.length === 0) {
        galleryGrid.innerHTML = '<p style="text-align:center; padding: 40px; color: #888;">No photos found.</p>';
        return;
    }

    galleryGrid.innerHTML = photosToRender.map(photo => {
        const isLiked = savedLikes.includes(photo.id);
        const isCollected = savedCollection.includes(photo.id);

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
                    <div style="display: flex; gap: 8px;">
                        <button class="vouch-btn ${isCollected ? 'collected' : ''}" 
                            title="${isCollected ? 'Remove from Collection' : 'Add to Collection'}"
                            onclick="event.stopPropagation(); toggleCollection(this, '${photo.id}')"
                            style="background: rgba(255,255,255,0.2);">
                            <span>${isCollected ? '★' : '☆'}</span>
                        </button>
                        <button class="vouch-btn ${isLiked ? 'vouched' : ''}" onclick="event.stopPropagation(); toggleVouch(this, '${photo.id}')">
                            <span class="vouch-icon">${isLiked ? '♥' : '♡'}</span> <span class="vouch-count">${photo.vouches || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `}).join('');
}

// Hero Logic
function updateHeroUI() {
    const heroImg = document.querySelector('.hero-card img');
    if (!heroImg) return; // Added check for heroImg
    if (realPhotos.length === 0) return;

    const topPhoto = realPhotos[0]; // Already sorted by vouches

    if (heroImg.src !== topPhoto.src) {
        heroImg.src = topPhoto.src;
    }

    const badge = document.querySelector('.hero-meta .badge');
    if (badge) {
        badge.textContent = `🏆 Community Favorite: ${topPhoto.title || 'Untitled'}`;
        badge.style.background = 'var(--color-text)';
        badge.style.color = 'var(--color-bg)';
    }

    const details = document.querySelector('.hero-meta .meta-details');
    if (details) {
        details.innerHTML = `
            <span>${topPhoto.exposure || 'Unknown Exposure'}</span> • 
            <span>${topPhoto.camera || 'Analog'}</span> • 
            <span>${topPhoto.photographer || 'Anonymous'}</span>
        `;
    }
}

// Collection Logic
window.toggleCollection = function (btn, docId) {
    if (!currentUser) {
        alert("Please sign in to create a collection.");
        window.location.href = 'signin.html';
        return;
    }

    const index = savedCollection.indexOf(docId);
    const isCollected = index > -1;

    if (isCollected) {
        savedCollection.splice(index, 1);
        btn.classList.remove('collected');
        btn.querySelector('span').innerText = '☆';
    } else {
        savedCollection.push(docId);
        btn.classList.add('collected');
        btn.querySelector('span').innerText = '★';
    }

    localStorage.setItem(`optic-collection-${currentUser.uid}`, JSON.stringify(savedCollection));
}

// Export Logic
window.exportCollection = function () {
    if (savedCollection.length === 0) {
        alert("Your collection is empty. Star some photos first!");
        return;
    }

    const collectionData = realPhotos
        .filter(p => savedCollection.includes(p.id))
        .map(p => ({
            title: p.title,
            photographer: p.photographer,
            camera: p.camera,
            tags: p.tags,
            date: p.dateCaptured,
            link: p.src
        }));

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collectionData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "optic_truth_collection.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Vouch Logic
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
    // Export Button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCollection);
    }

    // Hero Buttons
    const heroCreateBtn = document.getElementById('hero-create-btn');
    if (heroCreateBtn) {
        heroCreateBtn.addEventListener('click', () => window.location.href = 'signin.html');
    }
    const heroUploadBtn = document.getElementById('hero-upload-btn');
    if (heroUploadBtn) {
        heroUploadBtn.addEventListener('click', () => window.location.href = 'submit.html');
    }

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

// Start Init
init();
