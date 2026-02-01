/**
 * AR Viewer - Landing Page Script
 * Handles QR code generation for GitHub-hosted models
 */

// GitHub Pages base URL
const GITHUB_PAGES_URL = 'https://payush15.github.io/cursor-hack';

// State
let currentModelUrl = null;

document.addEventListener('DOMContentLoaded', () => {
    initQRCode();
    initCustomModelInput();
    initAnimations();
});

/**
 * Initialize QR Code with default viewer URL
 */
function initQRCode(customModelFilename = null) {
    const qrContainer = document.getElementById('qrcode');
    const qrTitle = document.getElementById('qr-title');
    const qrSubtitle = document.getElementById('qr-subtitle');

    if (!qrContainer) return;

    // Detect if we're on localhost or GitHub Pages
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocalhost
        ? window.location.origin + window.location.pathname.replace('index.html', '').replace(/\/$/, '')
        : GITHUB_PAGES_URL;

    let viewerUrl;

    if (customModelFilename) {
        // Generate URL for custom GitHub-hosted model
        const modelUrl = `${baseUrl}/models/${customModelFilename}`;
        viewerUrl = `${baseUrl}/viewer.html?src=${encodeURIComponent(modelUrl)}`;

        // Update title to show custom model name
        const modelName = customModelFilename.replace('.glb', '');
        if (qrTitle) qrTitle.textContent = `Scan to View: ${modelName}`;
        if (qrSubtitle) qrSubtitle.textContent = 'Your custom 3D model in AR';
    } else {
        // Default viewer URL (shows model selector)
        viewerUrl = `${baseUrl}/viewer.html`;
        if (qrTitle) qrTitle.textContent = 'Scan to View in AR';
        if (qrSubtitle) qrSubtitle.textContent = 'Point your phone camera at the QR code';
    }

    currentModelUrl = viewerUrl;
    console.log('QR Code URL:', viewerUrl);

    // Clear existing QR code
    qrContainer.innerHTML = '';

    // Generate QR code
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
            // Ensure .glb extension
            const glbFilename = filename.endsWith('.glb') ? filename : filename + '.glb';
            initQRCode(glbFilename);

            // Show success message
            showNotification(`QR code updated for: ${glbFilename}`);
        } else {
            alert('Please enter a filename');
        }
    });

    // Allow Enter key to generate
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            button.click();
        }
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
`;
document.head.appendChild(style);
