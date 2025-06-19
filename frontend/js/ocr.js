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
    
    // Setup drag and drop
    const uploadContainer = document.querySelector('.upload-container');
    
    uploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadContainer.style.borderColor = '#4CAF50';
    });
    
    uploadContainer.addEventListener('dragleave', () => {
        uploadContainer.style.borderColor = '#ccc';
    });
    
    uploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadContainer.style.borderColor = '#ccc';
        
        if (e.dataTransfer.files.length) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    });
    
    // Setup file input
    imageUpload.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleImageFile(e.target.files[0]);
        }
    });
    
    // Setup capture button for mobile
    captureBtn.addEventListener('click', () => {
        // For mobile devices, specifically request camera
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            imageUpload.setAttribute('capture', 'environment');
        }
        imageUpload.click();
    });
    
    // Handle the selected image file
    function handleImageFile(file) {
        // Validate file
        if (!file || !/^image\//i.test(file.type)) {
            scanStatus.textContent = 'Error: Please select a valid image file';
            return;
        }
        
        // Display preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            
            // Upload image for OCR processing
            uploadAndProcessImage(file);
        };
        reader.readAsDataURL(file);
    }
    
    // Upload and process image with backend
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
                
                // Populate form with extracted info
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
    
    // Handle form submission
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
                alert('Item added successfully!');
                
                // Reset form and preview
                addGroceryForm.reset();
                imagePreview.style.display = 'none';
                scanResults.textContent = '';
                scanStatus.textContent = 'Ready to scan';
                
                // Optionally redirect to home page
                // window.location.href = 'home.html';
            } else {
                const data = await response.json();
                alert(`Error: ${data.message || 'Failed to add item'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to the server');
        }
    });
});