
// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewImg = document.getElementById('preview-img');
const uploadText = document.querySelector('.upload-text');
const aiCheck = document.getElementById('ai-check');
const submitBtn = document.getElementById('submit-btn');

// Metadata Fields
const metaCamera = document.getElementById('meta-camera');
const metaLens = document.getElementById('meta-lens');
const metaExposure = document.getElementById('meta-exposure');
const metaIso = document.getElementById('meta-iso');
const metaDate = document.getElementById('meta-date');

// Drag & Drop
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');

    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

// AI Checkbox Logic
aiCheck.addEventListener('change', () => {
    validateForm();
});

// Flag to track if valid file is loaded
let isFileLoaded = false;

function validateForm() {
    // Only enable if file is loaded AND checkbox is checked
    if (isFileLoaded && aiCheck.checked) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    } else {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    }
}

function handleFile(file) {
    // 0. Handle HEIC/HEIF Conversion
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
        // Show Converting State
        metaCamera.value = 'Converting HEIC...';
        metaLens.value = 'Converting...';

        heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8
        }).then(function (conversionResult) {
            // conversionResult is a Blob (or array of blobs)
            const newFile = new File([conversionResult], file.name.replace(/\.heic$/i, ".jpg"), {
                type: "image/jpeg",
                lastModified: new Date().getTime()
            });
            handleFile(newFile);
        }).catch(function (e) {
            console.error(e);
            alert('Could not convert HEIC file. Please try a JPEG.');
            metaCamera.value = 'Conversion Failed';
            metaLens.value = 'Failed';
        });
        return;
    }

    if (!file.type.startsWith('image/')) return;

    // Reset UI to 'Scanning...' state
    metaCamera.value = 'Scanning...';
    metaLens.value = 'Scanning...';
    metaExposure.value = 'Scanning...';
    metaIso.value = 'Scanning...';
    metaDate.value = 'Scanning...';

    // Disable until scanned
    isFileLoaded = false;
    validateForm();

    const reader = new FileReader();
    reader.onload = (e) => {
        // Show Preview
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        uploadText.style.display = 'none';

        // 1. Check if supports EXIF (JPEG)
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            // Extract EXIF Data
            EXIF.getData(file, function () {
                const make = EXIF.getTag(this, "Make") || '';
                const model = EXIF.getTag(this, "Model") || '';
                const iso = EXIF.getTag(this, "ISOSpeedRatings");
                const fNumber = EXIF.getTag(this, "FNumber");
                const exposureTime = EXIF.getTag(this, "ExposureTime");
                const dateTime = EXIF.getTag(this, "DateTimeOriginal");
                const focalLength = EXIF.getTag(this, "FocalLength");

                // Format Data
                metaCamera.value = (make || model) ? `${make} ${model}`.trim() : '';

                // Lens
                let lensInfo = '';
                if (focalLength) lensInfo = `${focalLength.toFixed(0)}mm`;
                if (fNumber) lensInfo += ` f/${fNumber}`;
                metaLens.value = lensInfo;

                // Exposure
                let expText = '';
                if (exposureTime) {
                    if (exposureTime.numerator && exposureTime.denominator) {
                        expText = `${exposureTime.numerator}/${exposureTime.denominator}s`;
                    } else {
                        expText = `${exposureTime}s`;
                    }
                }
                if (fNumber) expText += ` at f/${fNumber}`;
                metaExposure.value = expText;

                // ISO
                metaIso.value = iso ? `ISO ${iso}` : '';

                // Date
                if (dateTime) {
                    const parts = dateTime.split(' ')[0].split(':');
                    if (parts.length === 3) {
                        metaDate.value = `${parts[1]}/${parts[2]}/${parts[0]}`;
                    } else {
                        metaDate.value = dateTime;
                    }
                } else {
                    metaDate.value = new Date().toLocaleDateString();
                }

                // Mark ready
                isFileLoaded = true;
                validateForm();
            });
        } else {
            // Non-JPEG (PNG, etc) - Clear "Scanning..." so user can type
            metaCamera.value = '';
            metaLens.value = '';
            metaExposure.value = '';
            metaIso.value = '';
            metaDate.value = new Date().toLocaleDateString();

            isFileLoaded = true;
            validateForm();
        }
    };
    reader.readAsDataURL(file);
}

// simulateMetadataExtraction removed as it is no longer needed
// function simulateMetadataExtraction() { ... } deleted implicitly by not including it or overwriting


// Save Functionality with Resizing (to avoid LocalStorage limits)
// Save Functionality (Firebase Storage + Firestore)
async function saveToProfile() {
    const user = firebase.auth().currentUser;

    if (!user) {
        alert("You must be signed in to upload.");
        window.location.href = 'signin.html';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';

    // 1. Get the file (we'll use the original or converted file)
    // For simplicity with HEIC conversion logic above, we can just grab the src from preview
    // convert it to blob, OR better: store the 'currentFile' in a global variable in handleFile
    // But since we have resize logic in the old one, let's keep the resize/canvas approach 
    // to keep uploads small/fast for this MVP.

    // Create canvas to resize/compress
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const MAX_WIDTH = 1200; // Better quality than 600
    let width = previewImg.naturalWidth;
    let height = previewImg.naturalHeight;

    if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(previewImg, 0, 0, width, height);

    // Get Blob
    canvas.toBlob(async (blob) => {
        try {
            // 2. Upload to Firebase Storage
            const filename = `photos/${user.uid}/${Date.now()}.jpg`;
            const storageRef = firebase.storage().ref().child(filename);
            const snapshot = await storageRef.put(blob);
            const downloadURL = await snapshot.ref.getDownloadURL();

            // 3. Save Metadata to Firestore
            await firebase.firestore().collection('photos').add({
                uid: user.uid,
                photographer: user.displayName || 'Anonymous',
                src: downloadURL, // The public link
                title: 'Untitled Capture',
                camera: metaCamera.value,
                lens: metaLens.value,
                iso: metaIso.value,
                exposure: metaExposure.value,
                dateCaptured: metaDate.value,
                vouches: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                tags: ['Film', 'Community'] // Default tags
            });

            alert('Photo uploaded successfully!');
            window.location.href = 'index.html'; // Go to feed to see it

        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed: " + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify & Publish';
        }
    }, 'image/jpeg', 0.85);
}
