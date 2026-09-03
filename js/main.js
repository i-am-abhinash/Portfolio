/**
 * PORTFOLIO - MAIN JAVASCRIPT
 * Handles mobile navigation, scroll reveals, card tilt, and 3D background.
 */

// ==========================================
// 1. MOBILE NAVIGATION
// ==========================================
const mobileBtn = document.querySelector('.mobile-menu-btn');
const mobileNav = document.querySelector('.mobile-nav');
const mobileLinks = document.querySelectorAll('.mobile-link');
let isMenuOpen = false;

if (mobileBtn && mobileNav) {
    mobileBtn.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;
        if (isMenuOpen) {
            mobileNav.classList.add('is-open');
            // Animate hamburger to X (simplified here, usually done in CSS)
        } else {
            mobileNav.classList.remove('is-open');
        }
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            isMenuOpen = false;
            mobileNav.classList.remove('is-open');
        });
    });
}

// ==========================================
// 2. SCROLL REVEALS (Intersection Observer)
// ==========================================
// Respect prefers-reduced-motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => revealObserver.observe(el));
} else {
    // If reduced motion, show immediately
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}

// ==========================================
// 3. 3D CARD TILT INTERACTION
// ==========================================
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

if (!isTouchDevice && !prefersReducedMotion) {
    const tiltCards = document.querySelectorAll('.tilt-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Limit rotation to ~5 degrees
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
}

// ==========================================
// 4. THREE.JS BACKGROUND
// ==========================================
const canvasContainer = document.getElementById('canvas-container');

if (canvasContainer && typeof THREE !== 'undefined' && !prefersReducedMotion) {
    const scene = new THREE.Scene();
    
    // Add subtle fog to blend points into background
    scene.fog = new THREE.FogExp2(0x050508, 0.001);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 250;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    
    // Cap devicePixelRatio for performance
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasContainer.appendChild(renderer.domElement);

    // Create a network topology geometry
    const particleCount = window.innerWidth < 768 ? 40 : 100; // Reduce on mobile
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        // Spread particles across a wide area
        positions[i * 3] = (Math.random() - 0.5) * 800; // x
        positions[i * 3 + 1] = (Math.random() - 0.5) * 800; // y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 400; // z
        
        velocities.push({
            x: (Math.random() - 0.5) * 0.2,
            y: (Math.random() - 0.5) * 0.2,
            z: (Math.random() - 0.5) * 0.2
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Material for nodes (particles)
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x00D2B4,
        size: 2,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // Material for connections (edges)
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00D2B4,
        transparent: true,
        opacity: 0.05
    });
    
    // Initialize line geometry - will update dynamically
    const lineGeometry = new THREE.BufferGeometry();
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - window.innerWidth / 2) * 0.05;
        mouseY = (event.clientY - window.innerHeight / 2) * 0.05;
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        // Smooth camera movement based on mouse
        targetX = mouseX * 0.5;
        targetY = mouseY * 0.5;
        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.y += (-targetY - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        // Slow overall rotation
        particles.rotation.y += 0.0005;
        lines.rotation.y += 0.0005;
        
        particles.rotation.x += 0.0002;
        lines.rotation.x += 0.0002;

        // Move particles slightly
        const positions = particles.geometry.attributes.position.array;
        
        // Calculate connections (only update occasionally or efficiently)
        const linePositions = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Apply velocity
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;
            
            // Boundary check - bounce back
            if(Math.abs(positions[i*3]) > 400) velocities[i].x *= -1;
            if(Math.abs(positions[i*3+1]) > 400) velocities[i].y *= -1;
            if(Math.abs(positions[i*3+2]) > 200) velocities[i].z *= -1;

            // Connect nearby nodes
            for (let j = i + 1; j < particleCount; j++) {
                const dx = positions[i * 3] - positions[j * 3];
                const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
                const distSq = dx * dx + dy * dy + dz * dz;

                // Max connection distance squared
                if (distSq < 25000) { 
                    linePositions.push(
                        positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
                        positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
                    );
                }
            }
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Update lines
        lines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

        renderer.render(scene, camera);
    }

    animate();

    // Handle Window Resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, 200);
    });
}
