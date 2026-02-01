/**
 * AR Viewer - Landing Page Script
 * QR code points directly to model.glb in the models folder
 */

// Configuration
const GITHUB_PAGES_URL = 'https://payush15.github.io/cursor-hack';
const MODEL_FILENAME = 'model.glb';

document.addEventListener('DOMContentLoaded', () => {
    initQRCode();
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
 * Initialize QR Code - points directly to viewer with model.glb
 */
function initQRCode() {
    const qrContainer = document.getElementById('qrcode');
    const qrTitle = document.getElementById('qr-title');
    const qrSubtitle = document.getElementById('qr-subtitle');

    if (!qrContainer) return;

    const baseUrl = getBaseUrl();
    const modelUrl = `${baseUrl}/models/${MODEL_FILENAME}`;
    const viewerUrl = `${baseUrl}/viewer.html?src=${encodeURIComponent(modelUrl)}`;

    console.log('QR Code URL:', viewerUrl);

    if (qrTitle) qrTitle.textContent = 'Scan to View in AR';
    if (qrSubtitle) qrSubtitle.textContent = 'Point your phone camera at the QR code';

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
            setTimeout(() => qrContainer.classList.add('loaded'), 100);
        } catch (e) {
            console.error('QR Code error:', e);
            showFallbackUrl(qrContainer, viewerUrl);
        }
    } else {
        showFallbackUrl(qrContainer, viewerUrl);
    }
}

function showFallbackUrl(container, url) {
    container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <p style="color: var(--text-secondary); margin-bottom: 10px;">QR Code unavailable</p>
            <a href="${url}" style="color: var(--accent-primary); word-break: break-all; font-size: 12px;">${url}</a>
        </div>
    `;
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
`;
document.head.appendChild(style);
