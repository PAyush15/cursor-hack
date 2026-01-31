/**
 * AR Viewer - Landing Page Script
 * Handles QR code generation and dynamic URL creation
 */

document.addEventListener('DOMContentLoaded', () => {
    initQRCode();
    initAnimations();
});

/**
 * Initialize QR Code generation
 * Creates a QR code that points to the viewer page
 */
function initQRCode() {
    const qrContainer = document.getElementById('qrcode');
    if (!qrContainer) return;

    // Determine the viewer URL
    const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '').replace(/\/$/, '');
    const viewerUrl = baseUrl + '/viewer.html';

    // Log the URL for debugging
    console.log('AR Viewer URL:', viewerUrl);

    // Try the canvas-based QRCode library API first
    if (typeof QRCode !== 'undefined') {
        try {
            // qrcode.min.js from jsdelivr uses this API
            if (typeof QRCode.toCanvas === 'function') {
                // Node-style qrcode library
                QRCode.toCanvas(viewerUrl, {
                    width: 200,
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    },
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
                // QRCode.js library (class-based)
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
`;
document.head.appendChild(style);
