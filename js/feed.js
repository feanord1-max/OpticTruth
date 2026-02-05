// Community Feed Logic

const feedGrid = document.getElementById('feed-grid');

// 1. Seed Mock Data if empty
function seedCommunityData() {
    const existing = localStorage.getItem('community-uploads');
    if (!existing) {
        const mockData = [
            {
                id: 101,
                user: 'Ansel A.',
                handle: '@ansel',
                src: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&q=80&w=1000',
                title: 'Yosemite Details',
                camera: 'Hasselblad 500CM',
                date: '2023-11-12',
                likes: 842,
                visibility: 'public'
            },
            {
                id: 102,
                user: 'Vivian M.',
                handle: '@vivstreet',
                src: 'https://images.unsplash.com/photo-1542038784456-1ea8c935640e?auto=format&fit=crop&q=80&w=1000',
                title: 'Chicago Shadows',
                camera: 'Rolleiflex 2.8F',
                date: '2024-01-15',
                likes: 124,
                visibility: 'public'
            },
            {
                id: 103,
                user: 'Henri C.',
                handle: '@bresson',
                src: 'https://images.unsplash.com/photo-1517724392603-60fcfdf590bd?auto=format&fit=crop&q=80&w=1000',
                title: 'The Decisive Moment',
                camera: 'Leica M3',
                date: '2024-02-01',
                likes: 56,
                visibility: 'public'
            },
            {
                id: 104,
                user: 'Steve M.',
                handle: '@mccurry',
                src: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&q=80&w=1000',
                title: 'Vibrant Culture',
                camera: 'Nikon FM2',
                date: '2024-02-10',
                likes: 210,
                visibility: 'public'
            }
        ];
        localStorage.setItem('community-uploads', JSON.stringify(mockData));
    }
}

// 2. Load & Merge Data
function loadFeed() {
    seedCommunityData();

    // Get Community Data
    const communityData = JSON.parse(localStorage.getItem('community-uploads') || '[]');

    // Get My Public Data
    const myUploads = JSON.parse(localStorage.getItem('my-uploads') || '[]');
    const myPublic = myUploads.filter(p => p.visibility !== 'private').map(p => ({
        ...p,
        user: 'You',
        handle: '@you',
        likes: p.likes || 0 // Ensure my uploads have a like field
    }));

    // Merge
    let allPosts = [...communityData, ...myPublic];

    // Sort by Likes (Desc)
    allPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));

    renderFeed(allPosts);
}

// 3. Render Feed
function renderFeed(posts) {
    if (posts.length === 0) {
        feedGrid.innerHTML = '<p style="opacity:0.6;">No photos yet. Be the first.</p>';
        return;
    }

    feedGrid.innerHTML = posts.map(post => `
        <article class="feed-card" style="display:flex; flex-direction:column; gap:12px;">
            <!-- Header -->
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:32px; height:32px; background:#eee; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700;">
                    ${post.user.charAt(0)}
                </div>
                <div>
                    <div style="font-weight:600; font-size:0.9rem;">${post.user}</div>
                    <div style="font-size:0.75rem; opacity:0.6;">${post.camera || 'Unknown Camera'}</div>
                </div>
                <div style="margin-left:auto; font-size:0.8rem; opacity:0.5;">${timeSince(post.date)}</div>
            </div>

            <!-- Image -->
            <div style="position:relative; aspect-ratio:3/2; overflow:hidden; border-radius:4px;">
                <img src="${post.src}" style="width:100%; height:100%; object-fit:cover;">
                <div class="verified-badge">✓</div>
            </div>

            <!-- Actions -->
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <button class="like-btn ${post.isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id}, '${post.handle === '@you' ? 'mine' : 'community'}')">
                    ♥ <span style="margin-left:4px; font-weight:600;">${post.likes || 0}</span>
                </button>
                <div style="font-size:0.8rem; font-weight:500;">${post.title || 'Untitled'}</div>
            </div>
        </article>
    `).join('');
}

// 4. Like Logic
window.toggleLike = function (id, source) {
    console.log('Liking', id, source);

    // We need to update the correct storage location
    const storageKey = source === 'mine' ? 'my-uploads' : 'community-uploads';
    const uploads = JSON.parse(localStorage.getItem(storageKey) || '[]');

    const postIndex = uploads.findIndex(p => p.id === id);
    if (postIndex > -1) {
        const post = uploads[postIndex];

        // Simple toggle (locally tracking "isLiked" isn't perfect without auth, but good for demo)
        if (post.isLiked) {
            post.likes--;
            post.isLiked = false;
        } else {
            post.likes = (post.likes || 0) + 1;
            post.isLiked = true;
        }

        uploads[postIndex] = post;
        localStorage.setItem(storageKey, JSON.stringify(uploads));

        // Re-render
        loadFeed();
    }
}

// Helper: Time Since
function timeSince(dateStr) {
    // Simple fallback logic since dates vary in format
    return dateStr || 'Recently';
}

// Init
loadFeed();
