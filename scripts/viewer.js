/**
 * AR Viewer - Interaction & Permission Logic
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

    // Default model fallback
    const modelToLoad = srcUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

    console.log('Loading model:', modelToLoad);
    modelViewer.setAttribute('src', modelToLoad);
}

function initInteractions() {
    // 1. Permission Button -> Activate AR
    if (startArBtn) {
        startArBtn.addEventListener('click', () => {
            console.log('User granted permission. Activating AR...');
            // This direct user action allows the browser to enter AR/WebXR
            modelViewer.activateAR();
        });
    }

    // 2. Question Button Logic
    if (btnQuestion) {
        btnQuestion.addEventListener('click', (e) => {
            e.stopPropagation();
            animateButton(btnQuestion);
            alert('Help: Point your camera at a flat surface to place the model. Drag to rotate, pinch to scale.');
        });
    }

    // 3. Info Button Logic
    if (btnInfo) {
        btnInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            animateButton(btnInfo);
            // Example info - in a real app this could show a modal
            const modelName = modelViewer.src.split('/').pop();
            alert(`Model Information:\nFilename: ${modelName}\nLighting: Neutral Studio`);
        });
    }
}

function animateButton(btn) {
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
    }, 150);
}

function initARHandlers() {
    // When AR session starts, hide the permission overlay
    modelViewer.addEventListener('ar-status', (event) => {
        console.log('AR Status Change:', event.detail.status);

        if (event.detail.status === 'session-started' || event.detail.status === 'object-placed') {
            permissionOverlay.style.border = 'none'; // Visual cleanup
            permissionOverlay.style.display = 'none';
        } else if (event.detail.status === 'not-presenting') {
            // User exited AR -> Show permission screen again
            permissionOverlay.style.display = 'flex';
        }
    });

    modelViewer.addEventListener('error', (e) => {
        console.error('Model loading error:', e);
        const title = document.querySelector('.permission-title');
        if (title) title.textContent = 'Error Loading Model';
        const desc = document.querySelector('.permission-desc');
        if (desc) desc.textContent = 'Unable to display the 3D model. Please verify the URL.';
    });
}
