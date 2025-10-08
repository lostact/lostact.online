// Seasonal Background Animation System

const SEASON_CONFIG = {
    autumn: {
        count: (w) => Math.min(50, Math.floor(w / 10)),
        particle: {
            size: () => Math.random() * 20 + 15,
            velocity: () => ({ x: (Math.random() - 0.5) * 0.2, y: Math.random() * 0.7 + 0.8 }),
            sway: () => ({ amplitude: Math.random() * 30 + 20, speed: Math.random() * 0.003 + 0.001 }),
            rotation: () => (Math.random() - 1) * 0.01,
            opacity: () => 0.3 + Math.random(),
            swayMultiplier: 0.01,
            opacityTimeSpeed: 0.0005,
            minOpacity: 0.1,
            resetOffset: 100
        },
        imgId: 'leaf',
        aspectRatio: 12/26
    },
    winter: {
        count: (w) => Math.min(150, Math.floor(w / 10)),
        particle: {
            size: () => Math.random() * 15 + 10,
            velocity: () => ({ x: (Math.random() - 0.5) * 0.3, y: Math.random() * 1.5 + 0.5 }),
            sway: () => ({ amplitude: Math.random() * 15 + 10, speed: Math.random() * 0.002 + 0.0005 }),
            rotation: () => (Math.random() - 0.5) * 0.005,
            opacity: () => 0.4 + Math.random() * 0.6,
            swayMultiplier: 0.008,
            opacityTimeSpeed: 0.0003,
            minOpacity: 0.2,
            resetOffset: 80
        },
        imgId: 'snowflake',
        aspectRatio: 1
    },
    spring: {
        count: (w) => Math.min(250, Math.floor(w / 12)),
        particle: {
            size: () => Math.random() * 0.5 + 0.4,
            velocity: () => ({ x: (Math.random() - 0.5) * 2, y: Math.random() * 15 + 8 }),
            color: '#87CEEB',
            length: () => Math.random() * 20 + 15
        }
    }
};

class Particle {
    constructor(x, y, season) {
        this.x = x;
        this.y = y;
        this.season = season;
        this.canvas = document.getElementById('particle-canvas');
        this.config = SEASON_CONFIG[season];
        this.img = document.getElementById(this.config?.imgId);
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = -Math.random() * 200 - 10;
        
        if (!this.config) return;
        
        const { particle } = this.config;
        
        if (this.season === 'spring') {
            const velocity = particle.velocity();
            Object.assign(this, {
                size: particle.size(),
                length: particle.length(),
                color: particle.color,
                vx: velocity.x,
                vy: velocity.y
            });
        } else {
            const w = particle.size();
            const aspectRatio = (this.img?.height && this.img?.width)
                ? this.img.height / this.img.width
                : this.config.aspectRatio;
            
            Object.assign(this, {
                w, h: w * aspectRatio,
                vx: particle.velocity().x,
                vy: particle.velocity().y,
                swayAmplitude: particle.sway().amplitude,
                swaySpeed: particle.sway().speed,
                swayOffset: Math.random() * Math.PI * 2,
                rotationSpeed: particle.rotation(),
                baseOpacity: particle.opacity(),
                rotation: 0,
                fallAngle: Math.random() * 30 - 15
            });
        }
    }

    update() {
        if (!this.config) return;
        
        const time = Date.now();
        this.y += this.vy;
        
        if (this.season === 'spring') {
            this.x += this.vx;
            this.opacity = Math.max(0.6, 1 - (this.y / this.canvas.height) * 0.3);
            if (this.y > this.canvas.height + 20) this.reset();
            return;
        }

        const { particle } = this.config;
        const swayX = Math.sin(time * this.swaySpeed + this.swayOffset) * this.swayAmplitude * particle.swayMultiplier;
        this.x += this.vx + swayX;

        if (this.season === 'autumn') {
            const movementRotation = Math.sin(time * 0.002 + this.swayOffset) * this.fallAngle * Math.PI / 180;
            this.rotation += this.rotationSpeed + movementRotation * 0.1;
        } else {
            this.rotation += this.rotationSpeed;
        }

        const opacityVar = Math.sin(time * particle.opacityTimeSpeed + this.swayOffset) * 0.1;
        this.opacity = Math.min(1, Math.max(particle.minOpacity, this.baseOpacity + opacityVar));

        if (this.y > this.canvas.height + 50) {
            this.reset();
            this.x += (Math.random() - 0.5) * particle.resetOffset;
            this.x = Math.max(-20, Math.min(this.canvas.width + 20, this.x));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.season === 'spring') {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 1;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, -this.length);
            ctx.lineTo(0, this.length);
            ctx.stroke();
        } else if (this.img?.complete && this.img.naturalWidth > 0) {
            ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
        }

        ctx.restore();
    }
}

class SeasonalSystem {
    constructor() {
        this.canvas = document.getElementById('particle-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.currentSeason = this.detectSeason();
        this.animationId = null;
        this.isVisible = true;
        this.wheelRotation = 0; // Track cumulative wheel rotation

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        this.updateSeasonTheme();
        this.initializeWithImageLoading();
    }

    initializeWithImageLoading() {
        const config = SEASON_CONFIG[this.currentSeason];
        if (!config?.imgId) {
            this.initParticles();
            this.animate();
            return;
        }

        const img = document.getElementById(config.imgId);
        const startAnimation = () => {
            this.initParticles();
            this.animate();
        };

        if (img?.complete && img.naturalWidth > 0) {
            startAnimation();
        } else {
            img?.addEventListener('load', startAnimation);
            img?.addEventListener('error', startAnimation);
            setTimeout(startAnimation, 3000); // Fallback
        }
    }

    detectSeason() {
        const urlSeason = new URLSearchParams(window.location.search).get('season');
        const validSeasons = ['spring', 'summer', 'autumn', 'winter'];
        
        if (validSeasons.includes(urlSeason)) return urlSeason;
        
        const month = new Date().getMonth() + 1;
        if (month >= 9 && month <= 11) return 'autumn';
        if (month >= 12 || month <= 2) return 'winter';
        if (month >= 3 && month <= 5) return 'spring';
        return 'summer';
    }

    switchToNextSeason() {
        const seasons = ['spring', 'summer', 'autumn', 'winter'];
        this.currentSeason = seasons[(seasons.indexOf(this.currentSeason) + 1) % seasons.length];
        
        // Increment rotation by 90 degrees clockwise each time
        this.wheelRotation += 90;
        
        this.animationId && cancelAnimationFrame(this.animationId);
        this.updateSeasonTheme();
        this.initializeWithImageLoading();
        
        const url = new URL(window.location);
        url.searchParams.set('season', this.currentSeason);
        window.history.pushState({}, '', url);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initParticles() {
        const config = SEASON_CONFIG[this.currentSeason];
        if (!config) return;
        
        const count = config.count(window.innerWidth);
        this.particles = Array.from({ length: count }, (_, i) => {
            const x = Math.random() * (this.canvas.width + 100) - 50;
            const y = Math.random() * (this.canvas.height + 600) - 300;
            const particle = new Particle(x, y, this.currentSeason);
            particle.y = y;
            return particle;
        });
    }

    updateSeasonTheme() {
        document.body.setAttribute('data-season', this.currentSeason);
    }

    handleVisibilityChange() {
        this.isVisible = !document.hidden;
        this.isVisible ? this.animate() : cancelAnimationFrame(this.animationId);
    }

    animate = () => {
        if (!this.isVisible) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.currentSeason === 'summer') {
            this.drawSunRays();
        } else {
            this.particles.forEach(particle => {
                particle.update();
                particle.draw(this.ctx);
            });
        }

        this.animationId = requestAnimationFrame(this.animate);
    }

    drawSunRays() {
        const [sunX, sunY] = [this.canvas.width + 50, -50];
        const time = Date.now() * 0.001;
        const maxDistance = Math.sqrt(sunX ** 2 + (sunY + this.canvas.height) ** 2);
        
        this.ctx.save();
        
        const layers = [
            { count: 15, opacity: 0.12, width: 6 },
            { count: 10, opacity: 0.2, width: 4 },
            { count: 6, opacity: 0.3, width: 2 }
        ];

        layers.forEach((layer, layerIndex) => {
            for (let i = 0; i < layer.count; i++) {
                const topLeftAngle = Math.atan2(-sunY, -sunX);
                const bottomRightAngle = Math.atan2(this.canvas.height - sunY, this.canvas.width - sunX);
                const angleRange = bottomRightAngle - topLeftAngle;
                const angle = topLeftAngle + (angleRange * i) / layer.count +
                            Math.sin(time * 0.8 + i + layerIndex) * 0.03;
                
                const length = maxDistance * (0.8 + Math.sin(time * 1.2 + i * 0.7) * 0.2);
                const [endX, endY] = [sunX + Math.cos(angle) * length, sunY + Math.sin(angle) * length];
                const dynamicOpacity = layer.opacity * (0.6 + Math.sin(time * 1.5 + i) * 0.4);
                
                // Find screen entry point
                let [startX, startY] = [sunX, sunY];
                const t1 = (this.canvas.width - sunX) / (endX - sunX);
                const t2 = -sunY / (endY - sunY);
                
                if (t1 >= 0 && t1 <= 1) {
                    const intersectY = sunY + t1 * (endY - sunY);
                    if (intersectY >= 0 && intersectY <= this.canvas.height) {
                        [startX, startY] = [this.canvas.width, intersectY];
                    }
                }
                if (t2 >= 0 && t2 <= 1) {
                    const intersectX = sunX + t2 * (endX - sunX);
                    if (intersectX >= 0 && intersectX <= this.canvas.width) {
                        [startX, startY] = [intersectX, 0];
                    }
                }
                
                const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
                const stops = [
                    [0, `rgba(255, 220, 100, ${dynamicOpacity * 0.9})`],
                    [0.3, `rgba(253, 216, 53, ${dynamicOpacity * 0.7})`],
                    [0.7, `rgba(255, 200, 50, ${dynamicOpacity * 0.4})`],
                    [1, `rgba(255, 180, 30, 0)`]
                ];
                stops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
                
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = layer.width;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            }
        });

        this.ctx.restore();
    }
}

let seasonalSystem;

const initSeasonalSystem = () => {
    seasonalSystem = new SeasonalSystem();
    
    const wheelButton = document.getElementById('wheel-of-time-btn');
    wheelButton?.addEventListener('click', () => {
        const wheelIcon = wheelButton.querySelector('.wheel-icon');
        if (!wheelIcon) return;

        // Calculate next rotation (90 degrees clockwise)
        const targetRotation = seasonalSystem.wheelRotation + 90;

        // Animate button scale and wheel rotation
        wheelButton.style.transform = 'scale(1.05)';
        wheelIcon.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        wheelIcon.style.transform = `rotate(${targetRotation}deg)`;
        
        // Switch season after animation starts
        setTimeout(() => {
            seasonalSystem?.switchToNextSeason();
            wheelButton.style.transform = 'scale(1)';
        }, 100);
    });
};

window.initSeasonalSystem = initSeasonalSystem;