
// Mock Data for "OpticTruth"
const photoData = [
    {
        id: 1,
        src: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=800&sat=-100',
        title: 'Yosemite Winter',
        photographer: 'Ansel Tribute',
        gear: 'Hasselblad 500CM',
        type: 'wide',
        tags: ['Film', 'Tri-X 400', 'Yosemite'],
        vouches: 342
    },
    {
        id: 2,
        src: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800&sat=-100',
        title: 'Valley View',
        photographer: 'B&W Classic',
        gear: 'Leica M6',
        type: 'portrait',
        tags: ['Film', 'HP5', 'Landscape'],
        vouches: 189
    },
    {
        id: 3,
        // El Capitan replacement
        src: 'https://images.unsplash.com/photo-1519681393797-a129f26d44ad?auto=format&fit=crop&q=80&w=800&sat=-100',
        title: 'El Capitan Mist',
        photographer: 'Sierra Lens',
        gear: 'Nikon FM2',
        type: 'tall',
        tags: ['Film', 'Ilford', 'Mountains'],
        vouches: 256
    },
    {
        id: 4,
        src: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800&sat=-100',
        title: 'Film Camera',
        photographer: 'Casey Davis',
        gear: 'Canon AE-1',
        type: 'standard',
        tags: ['Film', 'Portra 400'],
        vouches: 45
    },
    {
        id: 5,
        src: 'https://images.unsplash.com/photo-1463947628408-f8581a2f4aca?auto=format&fit=crop&q=80&w=800&sat=-100',
        title: 'Half Dome Light',
        photographer: 'Nature Grain',
        gear: 'Mamiya 7',
        type: 'wide',
        tags: ['Film', 'Kodak Gold', 'Yosemite'],
        vouches: 512
    },
    {
        id: 6,
        // Sierra Waters replacement (River/Valley)
        src: 'https://images.unsplash.com/photo-1533158388470-9a56699990c6?auto=format&fit=crop&q=80&w=800&sat=-100',
        title: 'Sierra Waters',
        photographer: 'River Flow',
        gear: 'Pentax 67',
        type: 'standard',
        tags: ['Film', 'Velvia'],
        vouches: 112
    }
];

// Film Strip Data (Horizontal Scroll)
const filmStripData = [
    'https://images.unsplash.com/photo-1502700559166-5792585222ef?auto=format&fit=crop&q=80&w=500&sat=-100',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=500&sat=-100',
    'https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&q=80&w=500&sat=-100',
    'https://images.unsplash.com/photo-1533158388470-9a56699990c6?auto=format&fit=crop&q=80&w=500&sat=-100'
];

// DOM Elements
const galleryGrid = document.getElementById('main-content');
const filmStripContainer = document.getElementById('film-strip');
const modal = document.getElementById('photo-modal');
const modalImg = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalMeta = document.getElementById('modal-meta');
const closeBtn = document.querySelector('.close-btn');

function init() {
    renderGallery();
    loadHeroImage();
    renderFilmStrip();
    setupEventListeners();
}

// galleryGrid is already defined in global scope above


const galleryGrid = document.getElementById('main-content'); // Moved up to valid scope

function renderGallery() {
    // 1. Listen for real data 
    // Removed .orderBy('vouches', 'desc') to avoid Composite Index requirement for MVP
    firebase.firestore().collection('photos')
        .limit(50)
        .onSnapshot((snapshot) => {
            const photos = [];
            snapshot.forEach((doc) => {
                photos.push({ id: doc.id, ...doc.data() });
            });

            // 2. Sort Client-Side (Most Vouches First)
            photos.sort((a, b) => (b.vouches || 0) - (a.vouches || 0));

            // 3. Update Film Strip with Top 5 (or random 5)
            updateFilmStrip(photos.slice(0, 5));

            // 4. Render Grid
            if (photos.length === 0) {
                galleryGrid.innerHTML = '<p style="text-align:center; padding: 40px; color: #888;">No photos yet. Be the first to upload!</p>';
                return;
            }

            galleryGrid.innerHTML = photos.map(photo => `
                <article class="photo-card ${photo.type || ''}" data-id="${photo.id}">
                    <div class="verified-badge" title="Verified Authentic">✓</div>
                    <img src="${photo.src}" alt="${photo.title}" loading="lazy">
                    <div class="photo-overlay">
                        <h3>${photo.title}</h3>
                        <p class="photographer-meta">${photo.photographer} <span style="opacity:0.6">• ${photo.camera || 'Analog'}</span></p>
                        
                        <div class="interaction-bar">
                             <div class="tags-list">
                                ${(photo.tags || []).map(tag => `<span class="photo-tag">${tag}</span>`).join('')}
                            </div>
                            <button class="vouch-btn ${(photo.vouches > 0) ? '' : ''}" onclick="event.stopPropagation(); toggleVouch(this, '${photo.id}')">
                                <span class="vouch-icon">♡</span> <span class="vouch-count">${photo.vouches || 0}</span>
                            </button>
                        </div>
                    </div>
                </article>
            `).join('');

        }, (error) => {
            console.error("Error getting photos: ", error);
            galleryGrid.innerHTML = '<p style="text-align:center; padding: 40px; color: red;">Error loading feed. Try refreshing.</p>';
        });
}

function updateFilmStrip(topPhotos) {
    const filmStripContainer = document.getElementById('film-strip');
    if (!filmStripContainer || topPhotos.length === 0) return;

    filmStripContainer.innerHTML = topPhotos.map(photo => `
        <div class="film-item">
            <img src="${photo.src}" alt="Analog Stream" loading="lazy">
        </div>
    `).join('');
}

function loadHeroImage() {
    const heroImg = document.querySelector('.hero-card img');
    if (!heroImg) return;

    // Use same client-side sort strategy
    firebase.firestore().collection('photos')
        .limit(20)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const photos = [];
                querySnapshot.forEach(doc => photos.push(doc.data()));

                // Sort by vouches
                photos.sort((a, b) => (b.vouches || 0) - (a.vouches || 0));

                if (photos.length > 0) {
                    const topPhoto = photos[0];
                    heroImg.src = topPhoto.src;

                    // Optional: Update Badge
                    const badge = document.querySelector('.hero-meta .badge');
                    if (badge) badge.textContent = `Top Rated: ${topPhoto.title || 'Untitled'}`;
                }
            }
        })
        .catch((error) => {
            console.error("Error loading hero image: ", error);
        });
}

function renderFilmStrip() {
    // Only if element exists
    const filmStripContainer = document.getElementById('film-strip');
    if (!filmStripContainer) return;

    // We can also make this dynamic later
    const filmStripData = [
        'https://images.unsplash.com/photo-1502700559166-5792585222ef?auto=format&fit=crop&q=80&w=500&sat=-100',
        'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=500&sat=-100',
        'https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&q=80&w=500&sat=-100',
        'https://images.unsplash.com/photo-1533158388470-9a56699990c6?auto=format&fit=crop&q=80&w=500&sat=-100'
    ];

    filmStripContainer.innerHTML = filmStripData.map(src => `
        <div class="film-item">
            <img src="${src}" alt="Analog Stream">
        </div>
    `).join('');
}

// Global Vouch Toggle
// Global Vouch Toggle (Real Firestore Update)
// Global Vouch Toggle (Real Firestore Update)
window.toggleVouch = function (btn, docId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please sign in to vouch/like photos.");
        window.location.href = 'signin.html';
        return;
    }

    const isVouched = btn.classList.contains('vouched');
    const iconSpan = btn.querySelector('.vouch-icon');
    const countSpan = btn.querySelector('.vouch-count');

    // UI Optimistic Update (Instant feedback)
    let count = parseInt(countSpan.innerText) || 0;

    if (isVouched) {
        count = Math.max(0, count - 1);
        btn.classList.remove('vouched');
        iconSpan.innerText = '♡';
    } else {
        count++;
        btn.classList.add('vouched');
        iconSpan.innerText = '♥';
    }
    countSpan.innerText = count;

    // Firestore Update
    const increment = firebase.firestore.FieldValue.increment(isVouched ? -1 : 1);

    console.log(`Updating vouch for ${docId}, new val: ${count}`);

    firebase.firestore().collection('photos').doc(docId).update({
        vouches: increment
    }).catch(err => {
        console.error("Vouch failed", err);
        // Revert UI if needed - skipping for simplicity in MVP
        alert("Failed to update like. Check your connection.");
    });
}

// Event Listeners
function setupEventListeners() {
    // Hero Buttons
    const joinBtn = document.getElementById('join-btn');
    const viewBtn = document.getElementById('view-gallery-btn');

    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            window.location.href = 'signin.html';
        });
    }

    if (viewBtn) {
        viewBtn.addEventListener('click', () => {
            document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (galleryGrid) {
        galleryGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.photo-card');
            // If clicking vouch button, don't open modal (handled by stopPropagation, but safe check)
            if (card && !e.target.closest('.vouch-btn')) {
                const id = parseInt(card.dataset.id);
                openModal(id);
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
        if (e.key === 'Escape' && modal && modal.classList.contains('visible')) {
            closeModal();
        }
    });
}

function openModal(id) {
    const photo = photoData.find(p => p.id === id);
    if (!photo) return;

    if (modalImg) modalImg.src = photo.src;
    if (modalTitle) modalTitle.textContent = photo.title;
    if (modalMeta) modalMeta.textContent = `Captured by ${photo.photographer} on ${photo.gear}. Tags: ${photo.tags.join(', ')}`;

    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('visible');
    setTimeout(() => {
        modal.classList.add('hidden');
        if (modalImg) modalImg.src = '';
    }, 400);
    document.body.style.overflow = '';
}

init();
