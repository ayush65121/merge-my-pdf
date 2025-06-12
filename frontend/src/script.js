// DOM elements
const dropZone = document.getElementById('dropZone');
const browseBtn = document.getElementById('browseBtn');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileList = document.getElementById('fileList');
const fileListItems = document.getElementById('fileListItems');
const fileCount = document.getElementById('fileCount');
const mergeBtn = document.getElementById('mergeBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const results = document.getElementById('results');
const filesMerged = document.getElementById('filesMerged');
const mergedSize = document.getElementById('mergedSize');
const downloadBtn = document.getElementById('downloadBtn');
const themeToggle = document.getElementById('themeToggle');
const feedbackBtn = document.getElementById('feedbackBtn');

// Global variables
let selectedFiles = [];
let mergedFile = null;
let mergedFileName = "merged.pdf";
let mergedFileSize = 0;

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    themeToggle.innerHTML = isDark 
        ? '<i class="fas fa-sun"></i><span>Light Mode</span>' 
        : '<i class="fas fa-moon"></i><span>Dark Mode</span>';
    
    // Save theme preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Check saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
}

// File handling
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);

// Drag and drop handling
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropZone.classList.add('drag-over');
}

function unhighlight() {
    dropZone.classList.remove('drag-over');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) {
        handleFiles(files);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length) {
        handleFiles(files);
    }
}

function handleFiles(files) {
    // Filter only PDF files
    const pdfFiles = Array.from(files).filter(file => 
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
        alert('Please select PDF files.');
        return;
    }

    // Add to selected files
    selectedFiles = [...selectedFiles, ...pdfFiles];
    updateFileList();
}

function updateFileList() {
    if (selectedFiles.length > 0) {
        // Update file info
        fileCount.textContent = `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`;
        fileInfo.classList.remove('hidden');
        dropZone.classList.add('file-selected');
        
        // Update file list
        fileList.classList.remove('hidden');
        fileListItems.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.className = 'mb-1 flex justify-between items-center';
            li.innerHTML = `
                <span class="truncate max-w-[70%]">${file.name}</span>
                <button class="remove-file text-danger text-sm" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fileListItems.appendChild(li);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-file').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                removeFile(index);
            });
        });
    } else {
        fileInfo.classList.add('hidden');
        fileList.classList.add('hidden');
        dropZone.classList.remove('file-selected');
    }
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
}

// Merge button click
mergeBtn.addEventListener('click', async () => {
    if (selectedFiles.length < 2) {
        alert('Please select at least 2 PDF files to merge.');
        return;
    }
    
    // Show progress
    progressContainer.classList.remove('hidden');
    mergeBtn.disabled = true;
    progressFill.style.width = '0%';
    progressText.textContent = 'Processing your files...';
    
    try {
        // Create FormData
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });
        
        // Simulate progress (will be replaced with actual progress events if backend supports)
        simulateProgress();
        
        // Send to backend
        // IMPORTANT: Replace with your actual backend URL
        const response = await fetch('https://merge-my-pdf-backend-1.onrender.com', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        
        // Get the merged file
        const blob = await response.blob();
        mergedFile = blob;
        mergedFileSize = blob.size;
        mergedFileName = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'merged.pdf';
        
        // Update results
        filesMerged.textContent = selectedFiles.length;
        mergedSize.textContent = formatFileSize(mergedFileSize);
        
        // Show results
        results.classList.remove('hidden');
        
    } catch (error) {
        console.error('Merge failed:', error);
        progressText.textContent = 'Error: ' + error.message;
    } finally {
        mergeBtn.disabled = false;
    }
});

// Download button
downloadBtn.addEventListener('click', () => {
    if (!mergedFile) return;
    
    const url = URL.createObjectURL(mergedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = mergedFileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
});

// Simulate progress for demo purposes
function simulateProgress() {
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += 5;
        if (progress > 100) {
            clearInterval(interval);
            progressFill.style.width = '100%';
            progressText.textContent = 'Merge complete!';
        } else {
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Processing... ${progress}%`;
        }
    }, 200);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Feedback button
feedbackBtn.addEventListener('click', () => {
    alert('Thanks for your feedback! This feature would connect to a real feedback system in a production environment.');
});
