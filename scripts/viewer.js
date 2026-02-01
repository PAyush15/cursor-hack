/**
 * AR Viewer - Direct-to-AR Script
 * Optimized for one-tap AR entry and interactive controls
 */

let modelViewer;
let launchOverlay;
let arHideBtn;
let arRotateBtn;
let isVisible = true;
let isRotating = true;

document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initModelFromURL();
    initARHandlers();
});

function initElements() {
    modelViewer = document.getElementById('model-viewer');
    launchOverlay = document.getElementById('launch-overlay');
    arHideBtn = document.getElementById('ar-hide-btn');
    arRotateBtn = document.getElementById('ar-rotate-btn');

    // Launch AR on overlay click
    if (launchOverlay) {
        launchOverlay.addEventListener('click', () => {
            console.log('User-triggered AR activation');
            modelViewer.activateAR();
        });
    }

    // AR Visibility Toggle
    if (arHideBtn) {
        arHideBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isVisible = !isVisible;
            modelViewer.style.opacity = isVisible ? '1' : '0';
            arHideBtn.querySelector('span').textContent = isVisible ? 'Show' : 'Hide';
            arHideBtn.classList.toggle('active', !isVisible);
        });
    }

    // AR Rotation Toggle
    if (arRotateBtn) {
        arRotateBtn.classList.add('active'); // Default starting state
        arRotateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isRotating = !isRotating;
            if (isRotating) {
                modelViewer.setAttribute('auto-rotate', '');
                arRotateBtn.classList.add('active');
            } else {
                modelViewer.removeAttribute('auto-rotate');
                arRotateBtn.classList.remove('active');
            }
        });
    }
}

function initModelFromURL() {
    const params = new URLSearchParams(window.location.search);
    const srcUrl = params.get('src');

    // Default model if no src provided
    const modelToLoad = srcUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

    console.log('Loading model for AR:', modelToLoad);
    modelViewer.setAttribute('src', modelToLoad);

    // If source is specified, try to hide overlay automatically when loaded
    // (Though most browsers still need the click)
    modelViewer.addEventListener('load', () => {
        console.log('Model loaded and ready for AR');
        const launchText = document.querySelector('.launch-text');
        if (launchText) launchText.textContent = 'Ready! Tap to Start';
        const launchSubtext = document.querySelector('.launch-subtext');
        if (launchSubtext) launchSubtext.style.display = 'none';
    });
}

function initARHandlers() {
    // Detect when AR session starts
    modelViewer.addEventListener('ar-status', (event) => {
        console.log('AR Status:', event.detail.status);
        if (event.detail.status === 'session-started') {
            if (launchOverlay) launchOverlay.style.opacity = '0';
            setTimeout(() => {
                if (launchOverlay) launchOverlay.style.display = 'none';
            }, 500);
        } else if (event.detail.status === 'not-presenting') {
            // If user exits AR, show overlay again or redirect back?
            if (launchOverlay) {
                launchOverlay.style.display = 'flex';
                launchOverlay.style.opacity = '1';
                const launchText = document.querySelector('.launch-text');
                if (launchText) launchText.textContent = 'Enter AR Again';
            }
        }
    });

    // Error handling
    modelViewer.addEventListener('error', (e) => {
        console.error('Model Viewer Error:', e);
        alert('Failed to load 3D model. Please check the file URL.');
    });
}
