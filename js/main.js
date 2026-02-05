
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
    renderFilmStrip();
    setupEventListeners();
}

function renderGallery() {
    galleryGrid.innerHTML = photoData.map(photo => `
        <article class="photo-card ${photo.type || ''}" data-id="${photo.id}">
            <div class="verified-badge" title="Verified Authentic">✓</div>
            <img src="${photo.src}" alt="${photo.title}" loading="lazy">
            <div class="photo-overlay">
                <h3>${photo.title}</h3>
                <p class="photographer-meta">${photo.photographer} <span style="opacity:0.6">• ${photo.gear}</span></p>
                
                <div class="interaction-bar">
                    <div class="tags-list">
                        ${photo.tags.map(tag => `<span class="photo-tag">${tag}</span>`).join('')}
                    </div>
                    <button class="vouch-btn" onclick="event.stopPropagation(); toggleVouch(this)">
                        Vouch (${photo.vouches})
                    </button>
                </div>
            </div>
        </article>
    `).join('');
}

function renderFilmStrip() {
    // Only if element exists (it might not if on submit page, but we are using modular JS so it's fine)
    if (!filmStripContainer) return;

    filmStripContainer.innerHTML = filmStripData.map(src => `
        <div class="film-item">
            <img src="${src}" alt="Analog Stream">
        </div>
    `).join('');
}

// Global Vouch Toggle
window.toggleVouch = function (btn) {
    // Mock Vouch Logic
    const isVouched = btn.classList.contains('vouched');
    let count = parseInt(btn.innerText.match(/\d+/)[0]);

    if (isVouched) {
        count--;
        btn.classList.remove('vouched');
    } else {
        count++;
        btn.classList.add('vouched');
    }

    btn.innerText = `Vouch (${count})`;
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
