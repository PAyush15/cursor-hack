/**
 * AR Viewer - Landing Page Script
 * Handles QR code generation, uploaded models display, and animations
 */

// State
let uploadedModels = [];
let latestModelName = null;

document.addEventListener('DOMContentLoaded', () => {
    loadUploadedModels();
    initAnimations();
    checkForNewUpload();
});

/**
 * Check if user just uploaded a model and show notification
 */
function checkForNewUpload() {
    const params = new URLSearchParams(window.location.search);
    const uploadedName = params.get('uploaded');

    if (uploadedName) {
        // Show success notification
        showUploadNotification(uploadedName);

        // Clean up URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('uploaded');
        history.replaceState({}, '', newUrl);
    }
}

/**
 * Show upload success notification
 */
function showUploadNotification(modelName) {
    const notification = document.createElement('div');
    notification.className = 'upload-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">✓</span>
            <div>
                <strong>${modelName}</strong> uploaded successfully!
                <p>QR code updated • Model added to your list</p>
            </div>
        </div>
    `;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/**
 * Load the custom model from IndexedDB and initialize QR code
 */
function loadUploadedModels() {
    const request = indexedDB.open('ARViewerDB', 2);

    request.onerror = () => {
        console.log('IndexedDB not available, showing default QR code');
        initQRCode(null);
    };

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('models')) {
            db.createObjectStore('models', { keyPath: 'id' });
        }
    };

    request.onsuccess = (event) => {
        const db = event.target.result;

        // Check if models store exists
        if (!db.objectStoreNames.contains('models')) {
            initQRCode(null);
            return;
        }

        const transaction = db.transaction(['models'], 'readonly');
        const store = transaction.objectStore('models');
        const getRequest = store.get('customModel');

        getRequest.onsuccess = () => {
            const modelData = getRequest.result;

            if (modelData && modelData.name) {
                latestModelName = modelData.name;
                console.log('Found custom model:', latestModelName);

                // Initialize QR code with this model
                initQRCode(latestModelName);

                // Add to models grid
                renderCustomModel(modelData);
            } else {
                initQRCode(null);
            }
        };

        getRequest.onerror = () => {
            initQRCode(null);
        };
    };
}

/**
 * Render the custom model in the existing models grid (at the beginning)
 */
function renderCustomModel(modelData) {
    if (!modelData || !modelData.name) return;

    // Find the existing models grid
    const modelsGrid = document.querySelector('.models-grid');
    if (!modelsGrid) return;

    // Check if this model card already exists
    const existingCard = document.getElementById('custom-model-card');
    if (existingCard) {
        existingCard.remove();
    }

    // Get reference to the first existing model card
    const firstExistingCard = modelsGrid.querySelector('.model-card');

    const card = document.createElement('a');
    card.id = 'custom-model-card';
    card.href = 'viewer.html?model=custom';
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
            <h4>${modelData.name}</h4>
            <span class="view-link">View in AR →</span>
        </div>
    `;

    // Insert at the beginning of the grid
    if (firstExistingCard) {
        modelsGrid.insertBefore(card, firstExistingCard);
    } else {
        modelsGrid.appendChild(card);
    }

    // Animate in
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);
}

/**
 * Load a specific model by ID and redirect to viewer
 */
function loadModelById(modelId) {
    const request = indexedDB.open('ARViewerDB', 2);

    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['uploadedModels', 'models'], 'readwrite');
        const uploadedStore = transaction.objectStore('uploadedModels');
        const modelsStore = transaction.objectStore('models');

        const getRequest = uploadedStore.get(modelId);

        getRequest.onsuccess = () => {
            const model = getRequest.result;
            if (model) {
                // Copy to current custom model
                const currentModelData = {
                    id: 'customModel',
                    name: model.name,
                    blob: model.blob,
                    timestamp: Date.now()
                };
                modelsStore.put(currentModelData);

                transaction.oncomplete = () => {
                    window.location.href = 'viewer.html?model=custom';
                };
            }
        };
    };
}

/**
 * Initialize QR Code generation
 * Points to the latest uploaded model if available
 */
function initQRCode(latestModel) {
    const qrContainer = document.getElementById('qrcode');
    if (!qrContainer) return;

    // Use GitHub Pages URL for production, or current URL for local dev
    const GITHUB_PAGES_URL = 'https://payush15.github.io/cursor-hack';

    // Detect if we're on GitHub Pages or localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocalhost
        ? window.location.origin + window.location.pathname.replace('index.html', '').replace(/\/$/, '')
        : GITHUB_PAGES_URL;

    // If there's a latest model, point to custom viewer, otherwise default viewer
    let viewerUrl;
    if (latestModel) {
        viewerUrl = baseUrl + '/viewer.html?model=custom';
        // Update QR info text
        const qrInfo = document.querySelector('.qr-info h2');
        if (qrInfo) {
            qrInfo.textContent = `Scan to View: ${latestModel}`;
        }
    } else {
        viewerUrl = baseUrl + '/viewer.html';
    }

    // Log the URL for debugging
    console.log('AR Viewer URL:', viewerUrl);

    // Clear any existing QR code
    qrContainer.innerHTML = '';

    // Generate QR code
    if (typeof QRCode !== 'undefined') {
        try {
            if (typeof QRCode.toCanvas === 'function') {
                QRCode.toCanvas(viewerUrl, {
                    width: 200,
                    margin: 1,
                    color: { dark: '#000000', light: '#ffffff' },
                    errorCorrectionLevel: 'M'
                }, (error, canvas) => {
                    if (error) {
                        console.error('QR Code generation failed:', error);
                        fallbackQRCode(qrContainer, viewerUrl);
                        return;
                    }
                    canvas.style.borderRadius = '8px';
                    qrContainer.appendChild(canvas);
                    triggerLoadAnimation(qrContainer);
                });
            } else {
                new QRCode(qrContainer, {
                    text: viewerUrl,
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel ? QRCode.CorrectLevel.M : 1
                });
                triggerLoadAnimation(qrContainer);
            }
        } catch (e) {
            console.error('QR Code error:', e);
            fallbackQRCode(qrContainer, viewerUrl);
        }
    } else {
        fallbackQRCode(qrContainer, viewerUrl);
    }
}

/**
 * Fallback: show the URL as text if QR code fails
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

/**
 * Trigger the load animation
 */
function triggerLoadAnimation(container) {
    setTimeout(() => {
        container.classList.add('loaded');
    }, 100);
}

/**
 * Initialize page animations
 */
function initAnimations() {
    document.body.classList.add('loaded');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatableElements = document.querySelectorAll(
        '.device-card, .model-card, .step-card'
    );

    animatableElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

// Dynamic styles
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    #qrcode {
        opacity: 0;
        transform: scale(0.9);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    #qrcode.loaded {
        opacity: 1;
        transform: scale(1);
    }
    
    #your-models-section {
        margin-bottom: var(--spacing-xl);
    }
    
    #your-models-section .section-title {
        color: #22c55e;
    }
    
    .upload-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(34, 197, 94, 0.3);
        z-index: 1000;
        transform: translateX(120%);
        transition: transform 0.3s ease;
    }
    
    .upload-notification.show {
        transform: translateX(0);
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .notification-icon {
        font-size: 24px;
        font-weight: bold;
    }
    
    .notification-content p {
        margin: 4px 0 0;
        font-size: 0.85rem;
        opacity: 0.9;
    }
`;
document.head.appendChild(style);
