/**
 * AR Viewer - Landing Page Script
 * Loads models from models.json and generates QR codes
 */

// Configuration
const GITHUB_PAGES_URL = 'https://payush15.github.io/cursor-hack';

// State
let modelsData = null;
let currentModelUrl = null;

document.addEventListener('DOMContentLoaded', () => {
    loadModelsConfig();
    initCustomModelInput();
    initAnimations();
});

/**
 * Get base URL (GitHub Pages or localhost)
 */
function getBaseUrl() {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocalhost
        ? window.location.origin + window.location.pathname.replace('index.html', '').replace(/\/$/, '')
        : GITHUB_PAGES_URL;
}

/**
 * Load models configuration from models.json
 */
async function loadModelsConfig() {
    try {
        const response = await fetch('models.json');
        modelsData = await response.json();
        console.log('Models config loaded:', modelsData);

        // Check if there's a custom model set
        if (modelsData.customModel) {
            initQRCode(modelsData.customModel);
            displayCustomModelCard(modelsData.customModel);
        } else {
            initQRCode(null);
        }
    } catch (error) {
        console.error('Failed to load models.json:', error);
        initQRCode(null);
    }
}

/**
 * Display custom model card in the models grid
 */
function displayCustomModelCard(filename) {
    const modelsGrid = document.querySelector('.models-grid');
    if (!modelsGrid) return;

    // Remove any existing custom model card
    const existing = document.getElementById('custom-model-card');
    if (existing) existing.remove();

    const baseUrl = getBaseUrl();
    const modelUrl = `${baseUrl}/models/${filename}`;
    const viewerUrl = `${baseUrl}/viewer.html?src=${encodeURIComponent(modelUrl)}`;
    const modelName = filename.replace('.glb', '');

    const card = document.createElement('a');
    card.id = 'custom-model-card';
    card.href = viewerUrl;
    card.className = 'model-card glass-card';

    card.innerHTML = `
        <div class="model-preview" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); min-height: 120px; position: relative;">
            <svg viewBox="0 0 24 24" fill="none" style="width: 48px; height: 48px; color: white;">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span style="position: absolute; top: 8px; right: 8px; background: white; color: #22c55e; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">YOUR MODEL</span>
        </div>
        <div class="model-info">
            <h4>${modelName}</h4>
            <span class="view-link">View in AR →</span>
        </div>
    `;

    // Insert at beginning
    const firstCard = modelsGrid.querySelector('.model-card');
    if (firstCard) {
        modelsGrid.insertBefore(card, firstCard);
    } else {
        modelsGrid.appendChild(card);
    }

    // Animate
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);
}

/**
 * Initialize QR Code
 */
function initQRCode(customModelFilename = null) {
    const qrContainer = document.getElementById('qrcode');
    const qrTitle = document.getElementById('qr-title');
    const qrSubtitle = document.getElementById('qr-subtitle');

    if (!qrContainer) return;

    const baseUrl = getBaseUrl();
    let viewerUrl;

    if (customModelFilename) {
        // Point to custom model in models/ folder
        const modelUrl = `${baseUrl}/models/${customModelFilename}`;
        viewerUrl = `${baseUrl}/viewer.html?src=${encodeURIComponent(modelUrl)}`;

        const modelName = customModelFilename.replace('.glb', '');
        if (qrTitle) qrTitle.textContent = `Scan to View: ${modelName}`;
        if (qrSubtitle) qrSubtitle.textContent = 'Your custom 3D model in AR';
    } else {
        // Default viewer
        viewerUrl = `${baseUrl}/viewer.html`;
        if (qrTitle) qrTitle.textContent = 'Scan to View in AR';
        if (qrSubtitle) qrSubtitle.textContent = 'Point your phone camera at the QR code';
    }

    currentModelUrl = viewerUrl;
    console.log('QR Code URL:', viewerUrl);

    // Clear and generate QR code
    qrContainer.innerHTML = '';

    if (typeof QRCode !== 'undefined') {
        try {
            new QRCode(qrContainer, {
                text: viewerUrl,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel ? QRCode.CorrectLevel.M : 1
            });
            triggerLoadAnimation(qrContainer);
        } catch (e) {
            console.error('QR Code error:', e);
            fallbackQRCode(qrContainer, viewerUrl);
        }
    } else {
        fallbackQRCode(qrContainer, viewerUrl);
    }
}

/**
 * Initialize custom model input handler
 */
function initCustomModelInput() {
    const input = document.getElementById('modelFilename');
    const button = document.getElementById('generateQRBtn');

    if (!button || !input) return;

    button.addEventListener('click', () => {
        const filename = input.value.trim();
        if (filename) {
            const glbFilename = filename.endsWith('.glb') ? filename : filename + '.glb';
            initQRCode(glbFilename);
            displayCustomModelCard(glbFilename);
            showNotification(`QR code updated for: ${glbFilename}`);
        } else {
            alert('Please enter a filename');
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') button.click();
    });
}

/**
 * Show notification
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'upload-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">✓</span>
            <div>${message}</div>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Fallback QR code display
 */
function fallbackQRCode(container, url) {
    container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <p style="color: var(--text-secondary); margin-bottom: 10px;">QR Code unavailable</p>
            <a href="${url}" style="color: var(--accent-primary); word-break: break-all; font-size: 12px;">${url}</a>
        </div>
    `;
    triggerLoadAnimation(container);
}

function triggerLoadAnimation(container) {
    setTimeout(() => container.classList.add('loaded'), 100);
}

/**
 * Initialize animations
 */
function initAnimations() {
    document.body.classList.add('loaded');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.device-card, .model-card, .step-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

// Dynamic styles
const style = document.createElement('style');
style.textContent = `
    .animate-in { opacity: 1 !important; transform: translateY(0) !important; }
    #qrcode { opacity: 0; transform: scale(0.9); transition: opacity 0.5s ease, transform 0.5s ease; }
    #qrcode.loaded { opacity: 1; transform: scale(1); }
    .upload-notification {
        position: fixed; top: 20px; right: 20px;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white; padding: 16px 24px; border-radius: 12px;
        box-shadow: 0 10px 40px rgba(34, 197, 94, 0.3);
        z-index: 1000; transform: translateX(120%); transition: transform 0.3s ease;
    }
    .upload-notification.show { transform: translateX(0); }
    .notification-content { display: flex; align-items: center; gap: 12px; }
    .notification-icon { font-size: 24px; font-weight: bold; }
`;
document.head.appendChild(style);
