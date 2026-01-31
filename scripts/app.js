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
});

/**
 * Load uploaded models from IndexedDB and initialize QR code
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
        if (!db.objectStoreNames.contains('uploadedModels')) {
            db.createObjectStore('uploadedModels', { keyPath: 'id' });
        }
    };

    request.onsuccess = (event) => {
        const db = event.target.result;

        // Check if uploadedModels store exists
        if (!db.objectStoreNames.contains('uploadedModels')) {
            initQRCode(null);
            return;
        }

        const transaction = db.transaction(['uploadedModels'], 'readonly');
        const store = transaction.objectStore('uploadedModels');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            uploadedModels = getAllRequest.result || [];
            // Sort by timestamp, newest first
            uploadedModels.sort((a, b) => b.timestamp - a.timestamp);

            if (uploadedModels.length > 0) {
                latestModelName = uploadedModels[0].name;
            }

            // Initialize QR code with latest model
            initQRCode(latestModelName);

            // Render uploaded models section
            renderUploadedModels();
        };

        getAllRequest.onerror = () => {
            initQRCode(null);
        };
    };
}

/**
 * Render uploaded models in the UI
 */
function renderUploadedModels() {
    if (uploadedModels.length === 0) return;

    const modelsSection = document.querySelector('.models-section');
    if (!modelsSection) return;

    // Create "Your Models" section
    let yourModelsSection = document.getElementById('your-models-section');

    if (!yourModelsSection) {
        yourModelsSection = document.createElement('section');
        yourModelsSection.id = 'your-models-section';
        yourModelsSection.className = 'models-section';
        yourModelsSection.innerHTML = `
            <h3 class="section-title">Your Uploaded Models</h3>
            <div id="your-models-grid" class="models-grid"></div>
        `;
        // Insert before the existing models section
        modelsSection.parentNode.insertBefore(yourModelsSection, modelsSection);
    }

    const grid = document.getElementById('your-models-grid');
    grid.innerHTML = '';

    // Only show last 4 models
    const modelsToShow = uploadedModels.slice(0, 4);

    modelsToShow.forEach((model, index) => {
        const card = document.createElement('a');
        card.href = `viewer.html?model=uploaded&id=${model.id}`;
        card.className = 'model-card glass-card';

        const isLatest = index === 0;

        card.innerHTML = `
            <div class="model-preview" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 120px;">
                <svg viewBox="0 0 24 24" fill="none" style="width: 48px; height: 48px; color: white;">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="model-info">
                <h4>${model.name}${isLatest ? ' <span style="font-size: 0.7em; color: #22c55e;">★ Latest</span>' : ''}</h4>
                <span class="view-link">View in AR →</span>
            </div>
        `;

        // Add click handler to load from IndexedDB
        card.addEventListener('click', (e) => {
            e.preventDefault();
            loadModelById(model.id);
        });

        grid.appendChild(card);
    });

    // Add animation
    const cards = grid.querySelectorAll('.model-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
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
`;
document.head.appendChild(style);
