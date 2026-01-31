/**
* AR Viewer - Viewer Page Script
* Handles model switching, controls, and device detection
*/

// Model configurations
const MODELS = {
    astronaut: {
        name: 'Astronaut',
        description: 'A detailed astronaut model from NASA. Perfect for space-themed AR experiences.',
        src: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
        iosSrc: 'https://modelviewer.dev/shared-assets/models/Astronaut.usdz',
        poster: 'https://modelviewer.dev/shared-assets/models/Astronaut.png'
    },
    robot: {
        name: 'Shish Kebab',
        description: 'A delicious-looking shish kebab. Great for food visualization in AR.',
        src: 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
        iosSrc: null,
        poster: 'https://modelviewer.dev/assets/poster-shishkebab.png'
    },
    chair: {
        name: 'Modern Chair',
        description: 'A sleek modern chair design. Perfect for furniture visualization.',
        src: 'https://modelviewer.dev/shared-assets/models/Chair.glb',
        iosSrc: null,
        poster: 'https://modelviewer.dev/assets/poster-chair.webp'
    }
};

// DOM Elements
let modelViewer;
let modelTitle;
let modelDescription;
let rotateToggle;
let resetView;
let modelThumbs;

document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initModelFromURL();
    initControls();
    initModelSelector();
    initProgressBar();
    detectARSupport();
});

/**
 * Initialize DOM element references
 */
function initElements() {
    modelViewer = document.getElementById('model-viewer');
    modelTitle = document.getElementById('model-title');
    modelDescription = document.getElementById('model-description');
    rotateToggle = document.getElementById('rotate-toggle');
    resetView = document.getElementById('reset-view');
    modelThumbs = document.querySelectorAll('.model-thumb');
}

/**
 * Load model from URL parameters
 */
function initModelFromURL() {
    const params = new URLSearchParams(window.location.search);
    const modelKey = params.get('model') || 'astronaut';

    if (MODELS[modelKey]) {
        loadModel(modelKey);
        updateActiveThumb(modelKey);
    }
}

/**
 * Load a specific model
 */
function loadModel(key) {
    const model = MODELS[key];
    if (!model) return;

    // Update model-viewer attributes
    modelViewer.setAttribute('src', model.src);
    modelViewer.setAttribute('poster', model.poster);

    if (model.iosSrc) {
        modelViewer.setAttribute('ios-src', model.iosSrc);
    } else {
        modelViewer.removeAttribute('ios-src');
    }

    // Update text content
    modelTitle.textContent = model.name;
    modelDescription.textContent = model.description;

    // Update URL without reloading
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('model', key);
    history.replaceState({}, '', newUrl);

    // Update active state
    updateActiveThumb(key);
}

/**
 * Update active thumbnail
 */
function updateActiveThumb(activeKey) {
    modelThumbs.forEach(thumb => {
        if (thumb.dataset.model === activeKey) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

/**
 * Initialize viewer controls
 */
function initControls() {
    // Auto-rotate toggle
    rotateToggle.addEventListener('click', () => {
        const isRotating = modelViewer.hasAttribute('auto-rotate');

        if (isRotating) {
            modelViewer.removeAttribute('auto-rotate');
            rotateToggle.classList.remove('active');
        } else {
            modelViewer.setAttribute('auto-rotate', '');
            rotateToggle.classList.add('active');
        }
    });

    // Set initial state
    if (modelViewer.hasAttribute('auto-rotate')) {
        rotateToggle.classList.add('active');
    }

    // Reset view
    resetView.addEventListener('click', () => {
        modelViewer.cameraOrbit = 'auto auto 105%';
        modelViewer.cameraTarget = 'auto auto auto';
        modelViewer.fieldOfView = 'auto';

        // Add a subtle animation feedback
        resetView.style.transform = 'scale(0.95)';
        setTimeout(() => {
            resetView.style.transform = '';
        }, 150);
    });
}

/**
 * Initialize model selector
 */
function initModelSelector() {
    modelThumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const modelKey = thumb.dataset.model;
            if (modelKey && MODELS[modelKey]) {
                loadModel(modelKey);
            }
        });
    });
}

/**
 * Initialize loading progress bar
 */
function initProgressBar() {
    const progressBar = document.querySelector('.update-bar');

    modelViewer.addEventListener('progress', (event) => {
        const progress = event.detail.totalProgress * 100;
        progressBar.style.width = `${progress}%`;
    });

    modelViewer.addEventListener('load', () => {
        // Hide progress bar after loading
        setTimeout(() => {
            progressBar.style.opacity = '0';
        }, 500);
    });
}

/**
 * Detect AR support and update UI accordingly
 */
function detectARSupport() {
    const arInstructions = document.getElementById('ar-instructions');
    const desktopNotice = document.getElementById('desktop-notice');

    // Check if AR is supported
    modelViewer.addEventListener('ar-status', (event) => {
        console.log('AR Status:', event.detail.status);
    });

    // Check for mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Check for AR capability
    if ('xr' in navigator) {
        navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
            console.log('WebXR AR supported:', supported);
        }).catch(() => {
            console.log('WebXR not available');
        });
    }

    // iOS AR Quick Look detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Update UI based on device
    if (isMobile) {
        if (arInstructions) arInstructions.style.display = 'flex';
        if (desktopNotice) desktopNotice.style.display = 'none';
    } else {
        if (arInstructions) arInstructions.style.display = 'none';
        if (desktopNotice) desktopNotice.style.display = 'flex';
    }

    // Log device info for debugging
    console.log('Device Info:', {
        isMobile,
        isIOS,
        userAgent: navigator.userAgent
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'r':
        case 'R':
            // Toggle rotation
            rotateToggle.click();
            break;
        case 'Escape':
            // Reset view
            resetView.click();
            break;
        case '1':
            loadModel('astronaut');
            break;
        case '2':
            loadModel('robot');
            break;
        case '3':
            loadModel('chair');
            break;
    }
});
