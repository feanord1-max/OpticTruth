
// DOM Elements
const grid = document.getElementById('my-grid');
const uploadCount = document.getElementById('upload-count');

// Load Data
function loadProfile() {
    const uploads = JSON.parse(localStorage.getItem('my-uploads') || '[]');
    uploadCount.textContent = uploads.length;

    if (uploads.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; opacity: 0.5;">No captures submitted yet. <a href="submit.html" style="text-decoration:underline;">Submit your first photo</a>.</p>';
        return;
    }

    // Updated render with privacy indicator and click handler
    grid.innerHTML = uploads.map(photo => `
        <article class="photo-card" style="aspect-ratio: 3/2; cursor: pointer;" onclick="openLightbox(${photo.id})">
            ${photo.visibility === 'private' ? '<div class="verified-badge" style="background:#444;">🔒</div>' : '<div class="verified-badge">✓</div>'}
            
            <button class="delete-btn" onclick="event.stopPropagation(); deletePhoto(${photo.id})" title="Delete Capture">×</button>
            <img src="${photo.src}" loading="lazy">
            <div class="photo-overlay">
                <!-- Data-heavy overlay style -->
                <div style="font-size: 0.9rem; font-weight: 500;">${photo.camera || 'Unknown Camera'}</div>
                <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 2px;">
                    ${photo.lens || ''} ${photo.iso ? '| ' + photo.iso : ''}
                </div>
                <div style="font-size: 0.75rem; opacity: 0.6; margin-top: 4px;">
                     ${photo.exposure || ''} &bull; ${photo.date}
                </div>
            </div>
        </article>
    `).join('');
}

// Lightbox Logic
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
const lbTitle = document.getElementById('lightbox-title');
const lbCamera = document.getElementById('lb-camera');
const lbLens = document.getElementById('lb-lens');
const lbSettings = document.getElementById('lb-settings');
const lbDate = document.getElementById('lb-date');
const lbVisibility = document.getElementById('lb-visibility');
const lbClose = document.getElementById('lightbox-close');

let currentPhotoId = null;

window.openLightbox = function (id) {
    const uploads = JSON.parse(localStorage.getItem('my-uploads') || '[]');
    const photo = uploads.find(p => p.id === id);
    if (!photo) return;

    currentPhotoId = id;

    lbImg.src = photo.src;
    lbTitle.textContent = photo.title || 'Untitled';
    lbCamera.textContent = photo.camera || '--';
    lbLens.textContent = photo.lens || '--';
    lbSettings.textContent = `${photo.exposure || ''} ${photo.iso ? 'ISO ' + photo.iso : ''}`;
    lbDate.textContent = photo.date;
    lbVisibility.value = photo.visibility || 'public';

    lightbox.style.display = 'flex';
}

// Close handlers
if (lbClose) {
    lbClose.addEventListener('click', () => {
        lightbox.style.display = 'none';
        currentPhotoId = null;
    });
}
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        lightbox.style.display = 'none';
        currentPhotoId = null;
    }
});

// Privacy Toggle
lbVisibility.addEventListener('change', (e) => {
    if (!currentPhotoId) return;

    const newVal = e.target.value;
    let uploads = JSON.parse(localStorage.getItem('my-uploads') || '[]');
    const photoIndex = uploads.findIndex(p => p.id === currentPhotoId);

    if (photoIndex > -1) {
        uploads[photoIndex].visibility = newVal;
        localStorage.setItem('my-uploads', JSON.stringify(uploads));

        // Re-render grid to update lock icon
        loadProfile();
    }
});

// Make globally available
window.deletePhoto = function (id) {
    // Confirmation skipped for smoother UX (or add custom modal later)
    // if (!confirm('Are you sure?')) return; 

    let uploads = JSON.parse(localStorage.getItem('my-uploads') || '[]');
    uploads = uploads.filter(p => p.id !== id);
    localStorage.setItem('my-uploads', JSON.stringify(uploads));

    // Refresh
    loadProfile();
}

loadProfile();
