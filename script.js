const currentFrame = index => `ezgif-frame-${(index).toString().padStart(3, '0')}.jpg`;

const images = [];
const TOTAL_FRAMES = 300;
let isLoaded = false;

// Preload all frames
async function preloadFrames() {
    let keepLoading = true;
    for (let index = 1; index <= TOTAL_FRAMES; index++) {
        if (!keepLoading) break;
        try {
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.src = currentFrame(index);
                img.onload = () => {
                    images[index - 1] = img;
                    if (index === 1) resizeCanvases();
                    resolve();
                };
                img.onerror = () => {
                    keepLoading = false;
                    reject();
                };
            });
        } catch (e) {
            // Error handling
        }
    }
    isLoaded = true;
}

preloadFrames();

// Canvas Setup
const canvas1 = document.getElementById('canvas-1');
const ctx1 = canvas1.getContext('2d');
const canvas2 = document.getElementById('canvas-2');
const ctx2 = canvas2.getContext('2d');

let currentWindowWidth = window.innerWidth;

function resizeCanvases() {
    // Cap pixel ratio at 2 to preserve frame rate on mobile devices
    const dpr = Math.min(window.devicePixelRatio, 2);
    const width = window.innerWidth * dpr;
    const height = window.innerHeight * dpr;
    
    canvas1.width = width;
    canvas1.height = height;
    canvas2.width = width;
    canvas2.height = height;
    
    drawToCanvas(canvas1, ctx1, currentFrameIndex1 || 0);
    drawToCanvas(canvas2, ctx2, currentFrameIndex2 || 150);
}

// On mobile, scrolling hides the address bar which triggers 'resize'.
// We ONLY want to resize the canvas if the WIDTH changes (e.g. rotating phone).
window.addEventListener('resize', () => {
    if (window.innerWidth !== currentWindowWidth) {
        currentWindowWidth = window.innerWidth;
        resizeCanvases();
    }
});

function drawToCanvas(canvas, ctx, frameIndex) {
    if (!images[frameIndex]) return;
    const img = images[frameIndex];
    
    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = img.width / img.height;
    
    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
    } else {
        drawWidth = canvas.height * imgRatio;
        drawHeight = canvas.height;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// Animation Logic Setup
const anim1Section = document.getElementById('anim-1');
const anim2Section = document.getElementById('anim-2');

let targetProgress1 = 0;
let currentProgress1 = 0;
let targetProgress2 = 0;
let currentProgress2 = 0;

function calculateSectionProgress(section) {
    const rect = section.getBoundingClientRect();
    // distance scrolled past the top of the section
    const scrollDistance = -rect.top; 
    // the total distance we can scroll while it is pinned
    const maxScrollDistance = rect.height - window.innerHeight; 
    const rawProgress = scrollDistance / maxScrollDistance;
    return Math.max(0, Math.min(1, rawProgress));
}

window.addEventListener('scroll', () => {
    targetProgress1 = calculateSectionProgress(anim1Section);
    targetProgress2 = calculateSectionProgress(anim2Section);
});

// Render Loop for Lerping
let currentFrameIndex1 = 0;
let currentFrameIndex2 = 150;

function renderLoop() {
    if (isLoaded) {
        // --- Anim 1 (Frames 0 to 149) ---
        currentProgress1 += (targetProgress1 - currentProgress1) * 0.08;
        currentFrameIndex1 = Math.floor(currentProgress1 * 149);
        drawToCanvas(canvas1, ctx1, currentFrameIndex1);
        
        // --- Anim 2 (Frames 150 to 299) ---
        currentProgress2 += (targetProgress2 - currentProgress2) * 0.08;
        currentFrameIndex2 = 150 + Math.floor(currentProgress2 * 149);
        drawToCanvas(canvas2, ctx2, currentFrameIndex2);
        
        // Handle Overlay Text Visibility via JS since CSS IntersectionObserver can be jittery with Lerp
        const overlay1 = anim1Section.querySelector('.overlay-text');
        if (currentProgress1 > 0.1 && currentProgress1 < 0.9) {
            overlay1.classList.add('is-visible');
        } else {
            overlay1.classList.remove('is-visible');
        }
        
        const overlay2 = anim2Section.querySelector('.overlay-text');
        if (currentProgress2 > 0.1 && currentProgress2 < 0.9) {
            overlay2.classList.add('is-visible');
        } else {
            overlay2.classList.remove('is-visible');
        }
    }
    
    requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);
