document.addEventListener('DOMContentLoaded', () => {
    // Inicialização do Particles.js para efeito de celebração
    if (window.particlesJS) {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 120,
                    "density": { "enable": true, "value_area": 800 }
                },
                "color": { "value": ["#ffffff", "#fef08a", "#93c5fd", "#e0e7ff"] },
                "shape": { "type": ["circle", "star"] },
                "opacity": {
                    "value": 0.8,
                    "random": true,
                    "anim": { "enable": true, "speed": 1, "opacity_min": 0.1, "sync": false }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": { "enable": true, "speed": 2, "size_min": 0.1, "sync": false }
                },
                "line_linked": { "enable": false },
                "move": {
                    "enable": true,
                    "speed": 1.5,
                    "direction": "top",
                    "random": true,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": { "enable": true, "mode": "bubble" },
                    "onclick": { "enable": true, "mode": "repulse" },
                    "resize": true
                },
                "modes": {
                    "bubble": { "distance": 200, "size": 6, "duration": 2, "opacity": 1, "speed": 3 },
                    "repulse": { "distance": 200, "duration": 0.4 }
                }
            },
            "retina_detect": true
        });
    }

    const files = [
        "95f477e8-53eb-45f2-9664-7e9b3cb16274.jpg", "IMG_0484_1.JPG", "IMG_0556.JPG", "IMG_0567.JPG", "IMG_0584.JPG", 
        "IMG_0644.HEIC", "IMG_0690.HEIC", "IMG_0717.HEIC", "IMG_0733.HEIC", "IMG_0909_1.JPG", "IMG_1104.JPG", 
        "IMG_1280.HEIC", "IMG_1316_1.JPG", "IMG_1345.JPG", "IMG_1372.JPG", "IMG_1474.HEIC", "IMG_1487.HEIC", 
        "IMG_1592.MP4", "IMG_1803.MOV", "IMG_1821.JPG", "IMG_1823_1.JPG", "IMG_1843.JPG", "IMG_1935.JPG", 
        "IMG_20251224_181833477_HDR.jpg", "IMG_20251226_215826559_HDR.jpg", "IMG_20251231_194046763_HDR.jpg", 
        "IMG_20260104_180126445_HDR.jpg", "IMG_20260110_210736237_HDR_PORTRAIT.jpg", "IMG_20260114_195345937_HDR.jpg", 
        "IMG_20260201_134019782_HDR.jpg", "IMG_20260228_192628581_HDR.jpg", "IMG_20260503_204129710_HDR.jpg", 
        "IMG_20260503_204132478_HDR.jpg", "IMG_20260509_105352524_HDR.jpg", "IMG_20260515_212818177.jpg", 
        "IMG_20260516_125841794.jpg", "IMG_20260516_201947883_HDR.jpg", "IMG_20260516_201951030_HDR.jpg", 
        "IMG_2074.JPG", "IMG_2140.HEIC", "IMG_2370_1.JPG", "IMG_2383.JPG", "IMG_2563.MP4", "IMG_2578.JPG", 
        "IMG_2621_2.JPG", "IMG_2653.HEIC", "IMG_2654_1.MP4", "IMG_2667_1.JPG", "IMG_2819.JPG", "IMG_2965.HEIC", 
        "IMG_2984.HEIC", "IMG_3045_1.JPG", "IMG_3070.HEIC", "IMG_3103_2.JPG", "IMG_3138.HEIC", "IMG_3158_1.JPG", 
        "IMG_3214.HEIC", "IMG_3291_1.JPG", "IMG_3292.MP4", "IMG_3322.HEIC", "IMG_3330.HEIC", "IMG_3370_1.JPG", 
        "IMG_3380.HEIC", "IMG_3404.HEIC", "IMG_3432.MP4", "IMG_3436_1.JPG", "IMG_3486.HEIC", "IMG_3536.HEIC", 
        "IMG_3565.HEIC", "IMG_3569.HEIC", "IMG_3596.JPG", "IMG_3643_1.JPG", "IMG_3660_1.JPG", "IMG_3756_1.JPG", 
        "IMG_3838_1.JPG", "IMG_3844.JPG", "IMG_3903_1.JPG", "IMG_3920.MP4", "IMG_3934.HEIC", "IMG_3961_1.JPG", 
        "IMG_3995.HEIC", "VID_20251107_225147087.mp4", "VID_20260321_185511075.mp4", "VID_20260329_194711638.mp4", 
        "bfc4f00d-a60f-4d42-99ac-14202f30e287.jpg"
    ];

    const basePath = '../Fotos/';
    const startDate = new Date('2025-06-12').getTime();
    const endDate = new Date('2026-06-12').getTime();
    
    // Process files and guess dates
    let mediaItems = files.map(file => {
        let dateVal = 0;
        let isVideo = file.toLowerCase().endsWith('.mp4') || file.toLowerCase().endsWith('.mov');
        
        // Try to parse date from filename (like IMG_20251224_...)
        const dateMatch = file.match(/(?:IMG|VID)_(\d{4})(\d{2})(\d{2})_/i);
        if (dateMatch) {
            const [_, y, m, d] = dateMatch;
            dateVal = new Date(`${y}-${m}-${d}T12:00:00Z`).getTime();
        } else {
            // Assign random uniform date within the year range if no specific date
            dateVal = startDate + Math.random() * (endDate - startDate);
        }

        return {
            filename: file,
            path: basePath + file,
            date: dateVal,
            isVideo: isVideo
        };
    });

    // Sort by date
    mediaItems.sort((a, b) => a.date - b.date);

    // Format date beautifully
    const formatDate = (timestamp) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(timestamp).toLocaleDateString('pt-BR', options);
    };

    // Marquee Injection (Random 15 images)
    const marqueeTrack = document.getElementById('marquee-track');
    const shuffledForMarquee = [...mediaItems].filter(m => !m.isVideo).sort(() => 0.5 - Math.random()).slice(0, 15);
    
    shuffledForMarquee.forEach(item => {
        const div = document.createElement('div');
        div.className = 'marquee-item';
        div.innerHTML = `<img src="${item.path}" alt="Cosmo Memória" loading="lazy">`;
        div.onclick = () => openLightbox(item);
        marqueeTrack.appendChild(div);
    });

    // Duplicate marquee items for seamless loop
    shuffledForMarquee.forEach(item => {
        const div = document.createElement('div');
        div.className = 'marquee-item';
        div.innerHTML = `<img src="${item.path}" alt="Cosmo Memória" loading="lazy">`;
        div.onclick = () => openLightbox(item);
        marqueeTrack.appendChild(div);
    });

    // Timeline Injection
    const timeline = document.getElementById('timeline');
    
    mediaItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        
        const mediaContent = item.isVideo 
            ? `<video src="${item.path}#t=0.1" preload="metadata"></video><div class="video-icon"></div>`
            : `<img src="${item.path}" alt="Cosmo" loading="lazy">`;

        div.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content" onclick="openLightbox(${index})">
                <div class="timeline-date">${formatDate(item.date)}</div>
                <div class="media-container">
                    ${mediaContent}
                </div>
            </div>
        `;
        timeline.appendChild(div);
    });

    // Intersection Observer for Timeline Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.timeline-item').forEach(item => {
        observer.observe(item);
    });

    // Lightbox Logic
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxVideo = document.getElementById('lightbox-video');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.getElementById('close-btn');

    // Make functions globally available for inline onclick
    window.openLightbox = (target) => {
        let item = typeof target === 'number' ? mediaItems[target] : target;
        
        lightbox.classList.add('active');
        lightboxCaption.textContent = formatDate(item.date);
        
        if (item.isVideo) {
            lightboxImg.style.display = 'none';
            lightboxVideo.style.display = 'block';
            lightboxVideo.src = item.path;
            lightboxVideo.play();
        } else {
            lightboxVideo.style.display = 'none';
            lightboxVideo.pause();
            lightboxImg.style.display = 'block';
            lightboxImg.src = item.path;
        }
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        lightboxVideo.pause();
        lightboxVideo.src = '';
        lightboxImg.src = '';
        document.body.style.overflow = 'auto';
    };

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
});
