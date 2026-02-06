
// DOM Elements
const grid = document.getElementById('my-grid');
const uploadCount = document.getElementById('upload-count');

// Load Data
// Load Data
function loadProfile() {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Please <a href="signin.html" style="text-decoration:underline;">sign in</a> to view your profile.</p>';
            return;
        }

        // Update Header
        document.getElementById('user-name').textContent = user.displayName || 'Photographer';
        document.getElementById('user-handle').textContent = user.email; // Using email as handle for now

        // Fetch Photos
        // Note: We removed .orderBy('createdAt', 'desc') because it requires a specific
        // Composite Index in Firestore (uid + createdAt). 
        // For now, we fetch validation-free to ensure they appear.
        firebase.firestore().collection('photos')
            .where('uid', '==', user.uid)
            .onSnapshot(snapshot => {
                const photos = [];
                snapshot.forEach(doc => photos.push({ id: doc.id, ...doc.data() }));

                // Sort manually in JS to avoid Index requirement
                photos.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

                uploadCount.textContent = photos.length;

                if (photos.length === 0) {
                    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; opacity: 0.5;">No captures submitted yet. <a href="submit.html" style="text-decoration:underline;">Submit your first photo</a>.</p>';
                    return;
                }

                grid.innerHTML = photos.map(photo => `
                    <article class="photo-card" style="aspect-ratio: 3/2; cursor: pointer;" onclick="openLightbox('${photo.id}')">
                        ${photo.visibility === 'private' ? '<div class="verified-badge" style="background:#444;">🔒</div>' : '<div class="verified-badge">✓</div>'}
                        
                        <button class="delete-btn" onclick="event.stopPropagation(); deletePhoto('${photo.id}')" title="Delete Capture">×</button>
                        <img src="${photo.src}" loading="lazy">
                        <div class="photo-overlay">
                            <div style="font-size: 0.9rem; font-weight: 500;">${photo.camera || 'Unknown Camera'}</div>
                            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 2px;">
                                ${photo.lens || ''} ${photo.iso ? '| ' + photo.iso : ''}
                            </div>
                            <div style="font-size: 0.75rem; opacity: 0.6; margin-top: 4px;">
                                 ${photo.exposure || ''} &bull; ${photo.dateCaptured || 'Unknown Date'}
                            </div>
                            <div style="margin-top: 8px; font-size: 0.8rem;">
                                ♥ ${photo.vouches || 0}
                            </div>
                        </div>
                    </article>
                `).join('');
            }, (error) => {
                console.error("Profile load error:", error);
                grid.innerHTML = '<p style="color:red; padding:40px;">Error loading profile: ' + error.message + '</p>';
            });
    });
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
    // For simplicity, we can fetch the doc or find it in the DOM if we stored data attached to element.
    // But let's just fetch it quickly or cache it. 
    // Actually, since we are inside a snapshot listener above, we could store 'currentPhotos' in a variable.
    // Let's do a direct fetch for simplicity if the id is passed.

    firebase.firestore().collection('photos').doc(id).get().then(doc => {
        if (!doc.exists) return;
        const photo = doc.data();

        currentPhotoId = id;

        lbImg.src = photo.src;
        lbTitle.textContent = photo.title || 'Untitled';
        lbCamera.textContent = photo.camera || '--';
        lbLens.textContent = photo.lens || '--';
        lbSettings.textContent = `${photo.exposure || ''} ${photo.iso ? 'ISO ' + photo.iso : ''}`;
        lbDate.textContent = photo.dateCaptured || '--';
        lbVisibility.value = photo.visibility || 'public';

        lightbox.style.display = 'flex';
    });
}

// ... close handlers ... existing ...

// Privacy Toggle
lbVisibility.addEventListener('change', (e) => {
    if (!currentPhotoId) return;
    const newVal = e.target.value;

    firebase.firestore().collection('photos').doc(currentPhotoId).update({
        visibility: newVal
    }).catch(err => console.error("Error updating visibility", err));
});

// Make globally available
window.deletePhoto = function (id) {
    if (!confirm('Are you sure you want to delete this capture?')) return;

    firebase.firestore().collection('photos').doc(id).delete()
        .then(() => {
            console.log("Document successfully deleted!");
            // UI updates automatically via onSnapshot
        })
        .catch((error) => {
            console.error("Error removing document: ", error);
        });
}

loadProfile();
