class InteractiveUI {
    constructor() {
        this.initLenis();
        this.initSpotlights();
        this.initMagnetic();
        this.initModal();
        this.initReveal();
        this.initMobileMenu();
        this.initUptime();
    }

    initLenis() {
        if(typeof Lenis === 'undefined') return;
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            smooth: true,
        });
        const raf = (time) => {
            this.lenis.raf(time);
            requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
    }

    initSpotlights() {
        document.querySelectorAll('[data-spotlight]').forEach((el) => {
            el.addEventListener('mouseenter', () => { el._cachedRect = el.getBoundingClientRect(); });
            el.addEventListener('mousemove', (e) => {
                const rect = el._cachedRect || el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                el.style.setProperty('--mouse-x', x + 'px');
                el.style.setProperty('--mouse-y', y + 'px');
            });
        });
    }

    initMagnetic() {
        const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isReducedMotion || window.innerWidth < 768) return;

        document.querySelectorAll('[data-magnetic]').forEach((el) => {
            el.addEventListener('mouseenter', () => {
                el.style.transition = 'none';
                el._cachedRect = el.getBoundingClientRect();
            });
            el.addEventListener('mousemove', (e) => {
                const rect = el._cachedRect || el.getBoundingClientRect();
                const hx = rect.left + rect.width / 2;
                const hy = rect.top + rect.height / 2;
                const dx = (e.clientX - hx) * 0.15;
                const dy = (e.clientY - hy) * 0.15;
                el.style.transform = "translate(" + dx + "px, " + dy + "px) perspective(1000px) rotateX(" + (-dy * 0.5) + "deg) rotateY(" + (dx * 0.5) + "deg) scale3d(1.02, 1.02, 1.02)";
            });
            el.addEventListener('mouseleave', () => {
                el.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s';
                el.style.transform = '';
            });
        });
    }

    initModal() {
        const modal = document.getElementById('projectModal');
        const closeBtn = document.getElementById('modalClose');
        window.openProjectModal = (title, desc, fullDesc, techs, link) => {
            document.getElementById('modalTitle').innerText = title;
            document.getElementById('modalDesc').innerText = desc;
            document.getElementById('modalFullDesc').innerText = fullDesc;
            document.getElementById('modalLink').href = link;
            const techList = document.getElementById('modalTechs');
            if(techList) {
                techList.innerHTML = '';
                techs.forEach(t => {
                    const li = document.createElement('li');
                    li.innerText = t;
                    techList.appendChild(li);
                });
            }
            if(modal) modal.classList.add('active');
            if(this.lenis) this.lenis.stop();
        };

        if(closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                if(this.lenis) this.lenis.start();
            });
        }
        if(modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    if(this.lenis) this.lenis.start();
                }
            });
        }
    }

    initReveal() {
        if(typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }

    initMobileMenu() {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        if(!menuBtn || !navLinks) return;

        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    initUptime() {
        const uptimeEl = document.getElementById('uptime');
        if(uptimeEl) {
            let seconds = 0;
            setInterval(() => {
                seconds++;
                const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
                const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
                const s = (seconds % 60).toString().padStart(2, '0');
                uptimeEl.innerText = h + ":" + m + ":" + s;
            }, 1000);
        }
    }
}

class WebGLScene {
    constructor() {
        this.container = document.getElementById('canvas-container');
        if (!this.container || typeof THREE === 'undefined') return;

        this.isMobile = window.innerWidth < 768;
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.mouse = new THREE.Vector2(-9999, -9999);
        this.targetMouse = new THREE.Vector2(-9999, -9999);
        this.scrollOffset = 0;

        this.initScene();
        if (!this.isReducedMotion) {
            this.initParticles();
            this.initHeroMesh();
        }
        this.initPostProcessing();
        this.addEvents();
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050508, 0.001);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.z = 800;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
    }

    initParticles() {
        const count = this.isMobile ? 150 : 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const randoms = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
            randoms[i] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

        this.particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector3(0, 0, 0) },
                uColor: { value: new THREE.Color('#00D2B4') }
            },
            vertexShader: `
                uniform float uTime;
                uniform vec3 uMouse;
                attribute float aRandom;
                varying float vAlpha;
                
                void main() {
                    vec3 pos = position;
                    pos.y += sin(uTime * 0.5 + aRandom * 10.0) * 20.0;
                    pos.x += cos(uTime * 0.3 + aRandom * 10.0) * 20.0;
                    
                    float dist = distance(pos.xy, uMouse.xy);
                    if(dist < 300.0) {
                        vec2 dir = normalize(pos.xy - uMouse.xy);
                        pos.xy += dir * (300.0 - dist) * 0.2;
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = (15.0 * aRandom) * (1000.0 / -mvPosition.z);
                    vAlpha = aRandom * 0.6 + 0.1;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vAlpha;
                void main() {
                    float d = distance(gl_PointCoord, vec2(0.5));
                    if(d > 0.5) discard;
                    gl_FragColor = vec4(uColor, vAlpha * (0.5 - d));
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, this.particleMaterial);
        this.scene.add(this.particles);
    }

    initHeroMesh() {
        const geometry = new THREE.IcosahedronGeometry(180, 1);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00D2B4, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.15 
        });
        this.heroMesh = new THREE.Mesh(geometry, material);
        this.heroMesh.position.set(window.innerWidth > 992 ? 400 : 0, 100, 0);
        this.scene.add(this.heroMesh);
    }

    initPostProcessing() {
        if(typeof THREE.EffectComposer !== 'undefined') {
            this.composer = new THREE.EffectComposer(this.renderer);
            this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

            if (!this.isMobile && !this.isReducedMotion) {
                const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.8, 0.2);
                this.composer.addPass(bloomPass);
            }
        }
    }

    addEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            if(this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
            if (this.heroMesh) {
                this.heroMesh.position.set(window.innerWidth > 992 ? 400 : 0, 100, 0);
            }
        });

        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX - window.innerWidth / 2) * 1.5;
            this.targetMouse.y = -(e.clientY - window.innerHeight / 2) * 1.5;
        });
        
        window.addEventListener('scroll', () => {
            this.scrollOffset = window.scrollY;
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        this.mouse.lerp(this.targetMouse, 0.3);

        if (this.particleMaterial) {
            this.particleMaterial.uniforms.uTime.value += 0.01;
            this.particleMaterial.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y + this.scrollOffset, 0);
        }

        if (this.heroMesh) {
            this.heroMesh.rotation.y += 0.002;
            this.heroMesh.rotation.x += 0.001;
            this.heroMesh.position.x += (this.mouse.x * 0.05 + (window.innerWidth > 992 ? 400 : 0) - this.heroMesh.position.x) * 0.05;
            this.heroMesh.position.y += (this.mouse.y * 0.05 + 100 + this.scrollOffset * 0.5 - this.heroMesh.position.y) * 0.05;
        }

        if (!this.isReducedMotion) {
            const targetCamY = -(this.scrollOffset * 0.5) + (this.mouse.y * 0.05);
            const targetCamX = (this.mouse.x * 0.05);
            this.camera.position.y += (targetCamY - this.camera.position.y) * 0.05;
            this.camera.position.x += (targetCamX - this.camera.position.x) * 0.05;
        }

        if(this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new InteractiveUI();
    new WebGLScene();
});






