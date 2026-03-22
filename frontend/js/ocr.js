document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }

    const imageUpload = document.getElementById('imageUpload');
    const captureBtn = document.getElementById('captureBtn');
    const imagePreview = document.getElementById('imagePreview');
    const scanStatus = document.getElementById('scanStatus');
    const scanResults = document.getElementById('scanResults');
    const itemNameInput = document.getElementById('itemName');
    const expiryDateInput = document.getElementById('expiryDate');
    const addGroceryForm = document.getElementById('addGroceryForm');

    // ── Logout handler ──
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }

    // ── Drag and drop (uses CSS class instead of inline style) ──
    const uploadContainer = document.querySelector('.upload-container');

    uploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadContainer.classList.add('drag-over');
    });

    uploadContainer.addEventListener('dragleave', () => {
        uploadContainer.classList.remove('drag-over');
    });

    uploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadContainer.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    });

    // ── File input change ──
    imageUpload.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleImageFile(e.target.files[0]);
        }
    });

    // ── Choose Image — opens gallery (no camera) ──
    document.querySelector('label[for="imageUpload"]').addEventListener('click', () => {
        imageUpload.removeAttribute('capture'); // ensure gallery opens
    });

    // ── Capture button — opens rear camera on mobile ──
    captureBtn.addEventListener('click', () => {
        imageUpload.setAttribute('capture', 'environment');
        imageUpload.click();
    });

    // ── Handle selected image file ──
    function handleImageFile(file) {
        if (!file || !/^image\//i.test(file.type)) {
            scanStatus.textContent = 'Error: Please select a valid image file';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';

            // Compress image before uploading — speeds up mobile processing significantly
            compressImage(file, 1200, 0.8).then(compressedBlob => {
                // Convert blob to named File so multer's fileFilter passes
                const compressedFile = new File([compressedBlob], 'image.jpg', { type: 'image/jpeg' });
                uploadAndProcessImage(compressedFile);
            });
        };
        reader.readAsDataURL(file);
    }

    // ── Compress image using Canvas API ──
    // maxWidth: max dimension in px, quality: 0-1 JPEG quality
    function compressImage(file, maxWidth = 1200, quality = 0.8) {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);

                // Calculate new dimensions maintaining aspect ratio
                let width  = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width  = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width  = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };

            img.onerror = () => resolve(file); // fallback to original if error
            img.src = url;
        });
    }

    // ── Upload and process image with backend ──
    async function uploadAndProcessImage(file) {
        scanStatus.textContent = 'Uploading and processing image...';
        scanResults.textContent = '';

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/ocr/process', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                scanStatus.textContent = 'Processing complete!';
                scanResults.textContent = data.text;

                if (data.extractedInfo.productName) {
                    itemNameInput.value = data.extractedInfo.productName;
                }
                if (data.extractedInfo.expiryDate) {
                    expiryDateInput.value = data.extractedInfo.expiryDate;
                }
            } else {
                scanStatus.textContent = 'Error processing image';
                console.error(data.message);
            }
        } catch (err) {
            scanStatus.textContent = 'Error processing image';
            console.error('OCR processing error:', err);
        }
    }

    // ── Form submission ──
    addGroceryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const grocery = {
            name: itemNameInput.value,
            expiryDate: expiryDateInput.value
        };

        try {
            const response = await fetch('/api/groceries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(grocery)
            });

            if (response.ok) {
                scanStatus.textContent = 'Item added successfully! ✅';
                addGroceryForm.reset();
                imagePreview.style.display = 'none';
                scanResults.textContent = '';
                setTimeout(() => {
                    scanStatus.textContent = 'Ready to scan';
                }, 2000);
            } else {
                const data = await response.json();
                scanStatus.textContent = `Error: ${data.message || 'Failed to add item'}`;
            }
        } catch (err) {
            console.error(err);
            scanStatus.textContent = 'Error connecting to the server';
        }
    });
});