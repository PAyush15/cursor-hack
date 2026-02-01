/**
 * AR Viewer - AR.js Implementation (Clean Geometry)
 * Handles marker-based AR with simple, reliable 3D buttons
 */

document.addEventListener('DOMContentLoaded', () => {
    initScene();
});

function initScene() {
    // 1. Load Model
    const params = new URLSearchParams(window.location.search);
    let modelSrc = params.get('src');

    // Fallback logic
    if (!modelSrc) {
        // Assume default structure if no param
        modelSrc = 'models/model.glb';
        console.log('No src param, defaulting to:', modelSrc);
    }

    const modelEntity = document.querySelector('#ar-model');
    if (modelEntity) {
        // Use gltf-model component
        modelEntity.setAttribute('gltf-model', modelSrc);

        // Error handling for model loading
        modelEntity.addEventListener('model-error', (e) => {
            console.error('Model failed to load:', e);
            alert('Error loading 3D model. Please check the file path.');
        });

        modelEntity.addEventListener('model-loaded', () => {
            console.log('Model loaded successfully');
        });
    }

    // 2. Setup Buttons
    setupInteractions();
}

function setupInteractions() {
    // Helper for hover effects
    const addHoverEffect = (id) => {
        const el = document.querySelector(id);
        if (!el) return;

        el.addEventListener('mouseenter', () => {
            el.setAttribute('scale', '1.1 1.1 1.1');
            // Change color of child plane if possible
            const plane = el.querySelector('a-plane');
            if (plane) plane.setAttribute('opacity', '1');
        });

        el.addEventListener('mouseleave', () => {
            el.setAttribute('scale', '1 1 1');
            const plane = el.querySelector('a-plane');
            if (plane) plane.setAttribute('opacity', '0.9');
        });
    };

    // WEBSITE
    const btnWebsite = document.querySelector('#btn-website');
    if (btnWebsite) {
        addHoverEffect('#btn-website');
        btnWebsite.addEventListener('click', () => {
            console.log('Website Clicked');
            // Assuming this is the user's github or site
            window.open('https://github.com/PAyush15', '_blank');
        });
    }

    // VIDEO
    const btnVideo = document.querySelector('#btn-video');
    if (btnVideo) {
        addHoverEffect('#btn-video');
        btnVideo.addEventListener('click', () => {
            console.log('Video Clicked');
            alert('Playing Video Content...');
        });
    }

    // INFO
    const btnInfo = document.querySelector('#btn-info');
    if (btnInfo) {
        addHoverEffect('#btn-info');
        btnInfo.addEventListener('click', () => {
            console.log('Info Clicked');
            alert('AR Viewer v2.0\nTracking: Hiro Marker\nEngine: A-Frame + AR.js');
        });
    }
}
