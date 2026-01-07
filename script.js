/**
 * Grok-Inspired Starfield with Real Star Positions
 * A mesmerizing dark space animation with twinkling stars based on actual astronomical data
 * and occasional shooting stars
 */

const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    // Display settings
    useRealStars: true,         // Use real star positions from catalog
    additionalRandomStars: 50,  // Extra random stars for density (reduced since we have ~2850 real stars)
    
    // Star appearance
    starMinSize: 0.5,
    starMaxSize: 3.0,
    
    // Twinkle/flicker settings
    flickerBaseOpacity: 0.4,
    flickerMaxOpacity: 0.6,
    flickerSpeed: 0.0015,
    
    // Sky rotation (simulating Earth's rotation)
    rotationSpeed: 0.0002,  // Radians per frame (~9 min full rotation)
    
    // Shooting star settings
    shootingStarChance: 0.008,
    shootingStarMinSpeed: 2,
    shootingStarMaxSpeed: 2,
    shootingStarMinLife: 100,
    shootingStarMaxLife: 150,
    shootingStarTailLength: 35,
    shootingStarMaxActive: 2,
    
    // Background
    backgroundColor: '#000000',
};

// ============================================
// STATE
// ============================================
let realStars = [];
let randomStars = [];
let shootingStars = [];
let animationId = null;
let rotationAngle = 0;
let centerRA = 180; // Center Right Ascension (degrees)
let centerDec = 20; // Center Declination (degrees) - northern hemisphere view

// ============================================
// CANVAS SETUP
// ============================================
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
}

// ============================================
// STAR COLOR from B-V index
// ============================================
function bvToColor(bv) {
    // Convert B-V color index to RGB
    // Range: -0.4 (blue) to 2.0 (red)
    let r, g, b;
    
    if (bv < -0.4) bv = -0.4;
    if (bv > 2.0) bv = 2.0;
    
    if (bv < 0) {
        // Blue to white
        r = 155 + (bv + 0.4) * 250;
        g = 176 + (bv + 0.4) * 200;
        b = 255;
    } else if (bv < 0.4) {
        // White
        r = 255;
        g = 255 - bv * 30;
        b = 255 - bv * 60;
    } else if (bv < 1.0) {
        // White to yellow
        r = 255;
        g = 255 - (bv - 0.4) * 80;
        b = 255 - (bv - 0.4) * 200;
    } else {
        // Yellow to orange/red
        r = 255;
        g = 200 - (bv - 1.0) * 100;
        b = 100 - (bv - 1.0) * 80;
    }
    
    return { r: Math.max(0, Math.min(255, r)), g: Math.max(0, Math.min(255, g)), b: Math.max(0, Math.min(255, b)) };
}

// ============================================
// MAGNITUDE to Size
// ============================================
function magnitudeToSize(mag) {
    // Brighter stars (lower magnitude) = larger size
    // Mag -1.5 (Sirius) -> ~3px, Mag 6 -> ~0.5px
    const minMag = -1.5;
    const maxMag = 5.5;
    const clampedMag = Math.max(minMag, Math.min(maxMag, mag));
    const normalized = 1 - (clampedMag - minMag) / (maxMag - minMag);
    return CONFIG.starMinSize + normalized * (CONFIG.starMaxSize - CONFIG.starMinSize);
}

// ============================================
// CELESTIAL to SCREEN coordinates
// ============================================
function celestialToScreen(ra, dec) {
    // Simple stereographic projection centered on (centerRA, centerDec)
    const raRad = (ra - centerRA - rotationAngle * 180 / Math.PI) * Math.PI / 180;
    const decRad = dec * Math.PI / 180;
    const centerDecRad = centerDec * Math.PI / 180;
    
    // Stereographic projection
    const cosDec = Math.cos(decRad);
    const sinDec = Math.sin(decRad);
    const cosCenterDec = Math.cos(centerDecRad);
    const sinCenterDec = Math.sin(centerDecRad);
    const cosRA = Math.cos(raRad);
    const sinRA = Math.sin(raRad);
    
    const d = sinCenterDec * sinDec + cosCenterDec * cosDec * cosRA;
    
    // Skip stars behind the viewer
    if (d < 0.1) return null;
    
    const scale = Math.min(canvas.width, canvas.height) * 0.8;
    const x = (cosDec * sinRA) / d * scale;
    const y = (cosCenterDec * sinDec - sinCenterDec * cosDec * cosRA) / d * scale;
    
    // Center on screen
    const screenX = canvas.width / 2 + x;
    const screenY = canvas.height / 2 - y;
    
    // Check if on screen
    if (screenX < -50 || screenX > canvas.width + 50 || screenY < -50 || screenY > canvas.height + 50) {
        return null;
    }
    
    return { x: screenX, y: screenY };
}

// ============================================
// STAR INITIALIZATION
// ============================================
function initStars() {
    // Initialize real stars from catalog
    if (CONFIG.useRealStars && typeof BRIGHT_STARS !== 'undefined') {
        realStars = BRIGHT_STARS.map((star, i) => ({
            ...star,
            flickerOffset: Math.random() * 1000,
            size: magnitudeToSize(star.mag),
            color: bvToColor(star.bv || 0),
        }));
    }
    
    // Add random background stars for density
    randomStars = [];
    for (let i = 0; i < CONFIG.additionalRandomStars; i++) {
        // Random position across the celestial sphere
        const ra = Math.random() * 360;
        const dec = (Math.asin(Math.random() * 2 - 1) * 180 / Math.PI); // Uniform on sphere
        const mag = 3 + Math.random() * 3; // Fainter stars (mag 3-6)
        
        randomStars.push({
            ra,
            dec,
            mag,
            bv: Math.random() * 0.8 - 0.2, // Slight color variation
            flickerOffset: Math.random() * 1000,
            size: magnitudeToSize(mag),
            color: bvToColor(Math.random() * 0.8 - 0.2),
        });
    }
}

// ============================================
// SHOOTING STARS
// ============================================
function spawnShootingStar() {
    if (shootingStars.length >= CONFIG.shootingStarMaxActive) return;
    if (Math.random() > CONFIG.shootingStarChance) return;
    
    const speed = CONFIG.shootingStarMinSpeed + Math.random() * CONFIG.shootingStarMaxSpeed;
    const life = CONFIG.shootingStarMinLife + Math.random() * CONFIG.shootingStarMaxLife;
    
    const edge = Math.floor(Math.random() * 4);
    let startX, startY, angle;
    const angleVariance = (Math.random() - 0.5) * (Math.PI / 1.5);
    
    switch (edge) {
        case 0:
            startX = Math.random() * canvas.width;
            startY = -10;
            angle = Math.PI / 2 + angleVariance;
            break;
        case 1:
            startX = canvas.width + 10;
            startY = Math.random() * canvas.height;
            angle = Math.PI + angleVariance;
            break;
        case 2:
            startX = Math.random() * canvas.width;
            startY = canvas.height + 10;
            angle = -Math.PI / 2 + angleVariance;
            break;
        case 3:
            startX = -10;
            startY = Math.random() * canvas.height;
            angle = 0 + angleVariance;
            break;
    }
    
    shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life,
        initialLife: life,
        width: 1.5 + Math.random() * 1.5,
    });
}

function updateShootingStars() {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.x += star.vx;
        star.y += star.vy;
        star.life -= 1;
        
        if (star.life <= 0 || star.x > canvas.width + 50 || star.x < -50 || 
            star.y > canvas.height + 50 || star.y < -50) {
            shootingStars.splice(i, 1);
        }
    }
}

function drawShootingStar(star) {
    const progress = star.life / star.initialLife;
    
    let opacity;
    if (progress > 0.9) {
        opacity = (1 - progress) * 10;
    } else if (progress < 0.3) {
        opacity = progress / 0.3;
    } else {
        opacity = 1;
    }
    
    const headColor = { r: 180, g: 180, b: 185 };
    const tailColor = { r: 120, g: 120, b: 125 };
    
    const tailX = star.x - star.vx * CONFIG.shootingStarTailLength;
    const tailY = star.y - star.vy * CONFIG.shootingStarTailLength;
    
    const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
    gradient.addColorStop(0, `rgba(${headColor.r}, ${headColor.g}, ${headColor.b}, ${opacity * 0.9})`);
    gradient.addColorStop(0.2, `rgba(${tailColor.r}, ${tailColor.g}, ${tailColor.b}, ${opacity * 0.5})`);
    gradient.addColorStop(0.6, `rgba(${tailColor.r}, ${tailColor.g}, ${tailColor.b}, ${opacity * 0.2})`);
    gradient.addColorStop(1, 'rgba(100, 100, 105, 0)');
    
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = star.width;
    ctx.lineCap = 'round';
    ctx.moveTo(star.x, star.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
    
    const headGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, 3);
    headGradient.addColorStop(0, `rgba(${headColor.r}, ${headColor.g}, ${headColor.b}, ${opacity * 0.8})`);
    headGradient.addColorStop(0.6, `rgba(${tailColor.r}, ${tailColor.g}, ${tailColor.b}, ${opacity * 0.3})`);
    headGradient.addColorStop(1, 'rgba(100, 100, 105, 0)');
    
    ctx.beginPath();
    ctx.fillStyle = headGradient;
    ctx.arc(star.x, star.y, 3, 0, Math.PI * 2);
    ctx.fill();
}

// ============================================
// DRAW STAR
// ============================================
function drawStar(star, screenPos, now) {
    const { x, y } = screenPos;
    const { r, g, b } = star.color;
    
    // Calculate flicker
    const flickerPhase = now * CONFIG.flickerSpeed + star.flickerOffset;
    const flicker = Math.sin(flickerPhase) * 0.5 + 0.5;
    const opacity = CONFIG.flickerBaseOpacity + flicker * CONFIG.flickerMaxOpacity;
    
    // Color shimmer effect - subtle color shifting during twinkle
    // Use different phases for each color channel to create rainbow shimmer
    const colorShift = 0.15; // Intensity of color shift (0-1)
    const rShift = Math.sin(flickerPhase * 1.3) * colorShift;
    const gShift = Math.sin(flickerPhase * 0.9 + 1) * colorShift;
    const bShift = Math.sin(flickerPhase * 1.1 + 2) * colorShift;
    
    // Apply color shifts while keeping colors in valid range
    const tr = Math.max(0, Math.min(255, Math.round(r + (255 - r) * rShift)));
    const tg = Math.max(0, Math.min(255, Math.round(g + (255 - g) * gShift)));
    const tb = Math.max(0, Math.min(255, Math.round(b + (255 - b) * bShift)));
    
    // Draw glow for brighter stars
    if (star.size > 1.5) {
        const glowSize = star.size * 2.5;
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        glowGradient.addColorStop(0, `rgba(${tr}, ${tg}, ${tb}, ${opacity * 0.6})`);
        glowGradient.addColorStop(0.4, `rgba(${tr}, ${tg}, ${tb}, ${opacity * 0.2})`);
        glowGradient.addColorStop(1, `rgba(${tr}, ${tg}, ${tb}, 0)`);
        
        ctx.beginPath();
        ctx.fillStyle = glowGradient;
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw star core
    ctx.beginPath();
    ctx.fillStyle = `rgba(${tr}, ${tg}, ${tb}, ${opacity})`;
    ctx.arc(x, y, star.size, 0, Math.PI * 2);
    ctx.fill();
}

// ============================================
// MAIN RENDER LOOP
// ============================================
function animate() {
    const now = Date.now();
    
    // Slowly rotate the sky (simulating Earth's rotation)
    rotationAngle += CONFIG.rotationSpeed;
    
    // Clear with background color
    ctx.fillStyle = CONFIG.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw real catalog stars
    realStars.forEach(star => {
        const screenPos = celestialToScreen(star.ra, star.dec);
        if (screenPos) {
            drawStar(star, screenPos, now);
        }
    });
    
    // Draw random background stars
    randomStars.forEach(star => {
        const screenPos = celestialToScreen(star.ra, star.dec);
        if (screenPos) {
            drawStar(star, screenPos, now);
        }
    });
    
    // Handle shooting stars
    spawnShootingStar();
    updateShootingStars();
    shootingStars.forEach(drawShootingStar);
    
    animationId = requestAnimationFrame(animate);
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
