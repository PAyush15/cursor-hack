/**
 * AR Viewer - Viewer Page Script
 * Handles model display, controls, and AR viewing
 */

// Predefined models
const MODELS = {
    astronaut: {
        name: 'Astronaut',
        description: 'A detailed astronaut model from NASA. Perfect for space-themed AR experiences.',
        src: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
        poster: 'https://modelviewer.dev/shared-assets/models/Astronaut.png'
    },
    robot: {
        name: 'Shish Kebab',
        description: 'A delicious-looking shish kebab. Great for food visualization in AR.',
        src: 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
        poster: 'https://modelviewer.dev/assets/poster-shishkebab.png'
    },
    chair: {
        name: 'Modern Chair',
        description: 'A sleek modern chair design. Perfect for furniture visualization.',
        src: 'https://modelviewer.dev/shared-assets/models/Chair.glb',
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
    const srcUrl = params.get('src');
    const modelKey = params.get('model') || 'astronaut';
    const modelName = params.get('name');

    // Priority 1: Direct URL to GLB file (from GitHub models/ folder)
    if (srcUrl) {
        console.log('Loading model from src URL:', srcUrl);
        loadModelFromUrl(srcUrl, modelName);
        return;
    }

    // Priority 2: Load predefined model by key
    if (MODELS[modelKey]) {
        loadModel(modelKey);
        updateActiveThumb(modelKey);
    } else {
        // Fallback to astronaut
        loadModel('astronaut');
        updateActiveThumb('astronaut');
    }
}

/**
 * Load model from a direct URL (GitHub-hosted)
 */
function loadModelFromUrl(url, name) {
    console.log('Setting model-viewer src to:', url);

    // Extract filename from URL for display
    const filename = url.split('/').pop() || 'Custom Model';
    const displayName = name || filename.replace('.glb', '');

    modelViewer.setAttribute('src', url);
    modelViewer.removeAttribute('poster');
    modelViewer.removeAttribute('ios-src');

    if (modelTitle) modelTitle.textContent = displayName;
    if (modelDescription) modelDescription.textContent = 'Your custom 3D model. Tap "View in AR" to place it in your space.';

    // Clear active state from thumbnails
    modelThumbs.forEach(thumb => thumb.classList.remove('active'));
}

/**
 * Load a predefined model
 */
function loadModel(modelKey) {
    const model = MODELS[modelKey];
    if (!model) return;

    modelViewer.setAttribute('src', model.src);

    if (model.poster) {
        modelViewer.setAttribute('poster', model.poster);
    } else {
        modelViewer.removeAttribute('poster');
    }

    // Remove iOS-specific source for non-astronaut models
    if (modelKey !== 'astronaut') {
        modelViewer.removeAttribute('ios-src');
    }

    if (modelTitle) modelTitle.textContent = model.name;
    if (modelDescription) modelDescription.textContent = model.description;

    updateActiveThumb(modelKey);
}

/**
 * Update active thumbnail
 */
function updateActiveThumb(activeKey) {
    modelThumbs.forEach(thumb => {
        const isActive = thumb.dataset.model === activeKey;
        thumb.classList.toggle('active', isActive);
    });
}

/**
 * Initialize model controls
 */
function initControls() {
    const visibilityToggle = document.getElementById('visibility-toggle');
    const scaleUp = document.getElementById('scale-up');
    const scaleDown = document.getElementById('scale-down');

    let isVisible = true;
    let currentScale = 1;

    // Visibility toggle - show/hide the model
    if (visibilityToggle) {
        visibilityToggle.addEventListener('click', () => {
            isVisible = !isVisible;
            if (isVisible) {
                modelViewer.style.opacity = '1';
                visibilityToggle.querySelector('span').textContent = 'Visible';
                visibilityToggle.classList.add('active');
            } else {
                modelViewer.style.opacity = '0';
                visibilityToggle.querySelector('span').textContent = 'Hidden';
                visibilityToggle.classList.remove('active');
            }
        });
    }

    // Scale up - make model bigger
    if (scaleUp) {
        scaleUp.addEventListener('click', () => {
            currentScale = Math.min(currentScale * 1.25, 3);
            modelViewer.setAttribute('scale', `${currentScale} ${currentScale} ${currentScale}`);
        });
    }

    // Scale down - make model smaller
    if (scaleDown) {
        scaleDown.addEventListener('click', () => {
            currentScale = Math.max(currentScale * 0.8, 0.25);
            modelViewer.setAttribute('scale', `${currentScale} ${currentScale} ${currentScale}`);
        });
    }

    // Auto-rotate toggle
    if (rotateToggle) {
        let autoRotating = true;
        rotateToggle.addEventListener('click', () => {
            autoRotating = !autoRotating;
            if (autoRotating) {
                modelViewer.setAttribute('auto-rotate', '');
            } else {
                modelViewer.removeAttribute('auto-rotate');
            }
            rotateToggle.classList.toggle('active', autoRotating);
        });
    }

    // Reset view
    if (resetView) {
        resetView.addEventListener('click', () => {
            modelViewer.resetTurntableRotation();
            modelViewer.jumpCameraToGoal();
            currentScale = 1;
            modelViewer.setAttribute('scale', '1 1 1');
        });
    }
}

/**
 * Initialize model selector
 */
function initModelSelector() {
    modelThumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const modelKey = thumb.dataset.model;
            if (MODELS[modelKey]) {
                loadModel(modelKey);

                // Update URL without reload
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('model', modelKey);
                newUrl.searchParams.delete('src');
                history.replaceState({}, '', newUrl);
            }
        });
    });
}

/**
 * Initialize progress bar
 */
function initProgressBar() {
    modelViewer.addEventListener('progress', (event) => {
        const progressBar = modelViewer.querySelector('.update-bar');
        if (progressBar) {
            const progress = event.detail.totalProgress * 100;
            progressBar.style.width = `${progress}%`;
        }
    });

    modelViewer.addEventListener('load', () => {
        const progressBar = modelViewer.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.opacity = '0';
        }
    });
}

/**
 * Detect AR support
 */
function detectARSupport() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const arInstructions = document.getElementById('ar-instructions');
    const desktopNotice = document.getElementById('desktop-notice');

    if (isMobile) {
        if (arInstructions) arInstructions.style.display = 'flex';
        if (desktopNotice) desktopNotice.style.display = 'none';
    } else {
        if (arInstructions) arInstructions.style.display = 'none';
        if (desktopNotice) desktopNotice.style.display = 'flex';
    }
}
