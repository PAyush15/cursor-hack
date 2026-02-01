/**
 * AR Viewer - Seamless Permission Flow
 * Handles "Scan -> Permission -> AR" flow and interactive buttons
 */

let modelViewer;
let permissionOverlay;
let startArBtn;
let btnQuestion;
let btnInfo;

document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initModelFromURL();
    initInteractions();
    initARHandlers();
});

function initElements() {
    modelViewer = document.getElementById('model-viewer');
    permissionOverlay = document.getElementById('permission-overlay');
    startArBtn = document.getElementById('start-ar-btn');
    btnQuestion = document.getElementById('btn-question');
    btnInfo = document.getElementById('btn-info');
}

function initModelFromURL() {
    const params = new URLSearchParams(window.location.search);
    const srcUrl = params.get('src');

    // Default model if no src provided (fallback)
    const modelToLoad = srcUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

    console.log('Setting up AR model:', modelToLoad);
    modelViewer.setAttribute('src', modelToLoad);
}

function initInteractions() {
    // 1. Permission / Start Button -> Launch AR
    if (startArBtn) {
        startArBtn.addEventListener('click', () => {
            console.log('Requesting AR Session...');
            // This tap satisfies the browser's user gesture requirement
            modelViewer.activateAR();
        });
    }

    // 2. Interactive Button: Question Mark
    if (btnQuestion) {
        btnQuestion.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent clicks passing through to AR scene
            toggleButtonState(btnQuestion);
            console.log('Question button clicked');
            // Future feature: Show help overlay
        });
    }

    // 3. Interactive Button: Info
    if (btnInfo) {
        btnInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleButtonState(btnInfo);
            console.log('Info button clicked');
            // Future feature: Show model info card
        });
    }
}

function toggleButtonState(btn) {
    // Simple visual feedback for "interaction"
    btn.classList.toggle('active');

    // Reset after a short delay to simulate a click/action
    setTimeout(() => {
        btn.classList.remove('active');
    }, 200);
}

function initARHandlers() {
    // Hide the permission overlay as soon as the session starts
    modelViewer.addEventListener('ar-status', (event) => {
        console.log('AR Status:', event.detail.status);

        if (event.detail.status === 'session-started') {
            permissionOverlay.style.display = 'none';
        } else if (event.detail.status === 'not-presenting') {
            // User exited AR - show permission screen again to allow re-entry
            permissionOverlay.style.display = 'flex';
        }
    });

    modelViewer.addEventListener('error', (e) => {
        console.error('AR Error:', e);
        // If error, update UI to show message
        const title = document.querySelector('.permission-title');
        const desc = document.querySelector('.permission-desc');
        if (title) title.textContent = 'Error Loading Model';
        if (desc) desc.textContent = 'Please check your internet connection or the file validity.';
    });
}
