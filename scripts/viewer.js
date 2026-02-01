/**
 * AR Viewer - AR.js Implementation
 * Handles marker-based AR with A-Frame
 */

document.addEventListener('DOMContentLoaded', () => {
    initARExperience();
});

function initARExperience() {
    const loader = document.querySelector('.arjs-loader');
    const modelContainer = document.querySelector('#model-container');

    // Hide loader when scene is loaded
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', () => {
        console.log('AR Scene loaded');
        if (loader) loader.style.display = 'none';
    });

    // Load Model from URL
    const params = new URLSearchParams(window.location.search);
    const srcUrl = params.get('src');
    const modelUrl = srcUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

    console.log('Loading model:', modelUrl);

    // Create GLTF entity dynamically
    const modelEntity = document.createElement('a-entity');
    modelEntity.setAttribute('gltf-model', modelUrl);
    modelEntity.setAttribute('scale', '0.5 0.5 0.5'); // Default scale, maybe adjusting based on model size is needed
    modelEntity.setAttribute('position', '0 0.5 0'); // Slight offset from marker center
    modelEntity.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 10000; easing: linear');

    modelContainer.appendChild(modelEntity);

    // Setup Interactions
    setupButtons();
}

function setupButtons() {
    // Website Button
    const btnWebsite = document.querySelector('#btn-website');
    if (btnWebsite) {
        btnWebsite.addEventListener('click', () => {
            console.log('Website button clicked');
            // In AR.js/A-Frame with cursor, touch events map to clicks
            window.open('https://github.com/PAyush15', '_blank');
        });

        // Visual feedback
        btnWebsite.addEventListener('mouseenter', () => {
            btnWebsite.setAttribute('scale', '1.2 1.2 1.2');
        });
        btnWebsite.addEventListener('mouseleave', () => {
            btnWebsite.setAttribute('scale', '1 1 1');
        });
    }

    // Video Button
    const btnVideo = document.querySelector('#btn-video');
    if (btnVideo) {
        btnVideo.addEventListener('click', () => {
            console.log('Video button clicked');
            alert('Video Playback Feature\n(Placeholder for video content)');
        });

        btnVideo.addEventListener('mouseenter', () => {
            btnVideo.setAttribute('scale', '1.2 1.2 1.2');
        });
        btnVideo.addEventListener('mouseleave', () => {
            btnVideo.setAttribute('scale', '1 1 1');
        });
    }

    // Info Button
    const btnInfo = document.querySelector('#btn-info');
    if (btnInfo) {
        btnInfo.addEventListener('click', () => {
            console.log('Info button clicked');
            const params = new URLSearchParams(window.location.search);
            const modelName = params.get('src') ? params.get('src').split('/').pop() : 'Default Model';
            alert(`AR Viewer Info:\nModel: ${modelName}\nTracking: Hiro Marker`);
        });

        btnInfo.addEventListener('mouseenter', () => {
            btnInfo.setAttribute('scale', '1.2 1.2 1.2');
        });
        btnInfo.addEventListener('mouseleave', () => {
            btnInfo.setAttribute('scale', '1 1 1');
        });
    }
}
