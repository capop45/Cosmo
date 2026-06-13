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

    const basePath = '../Fotos/';

    // Manifesto gerado por scripts/build-manifest.mjs com as datas reais
    // (metadados EXIF/vídeo), já em ordem cronológica. Vídeos usam as versões
    // comprimidas *_web.mp4 (< 100 MB, aceitas pelo GitHub).
    const mediaItems = window.MEDIA_MANIFEST.map(entry => ({
        filename: entry.file,
        path: basePath + entry.file,
        date: new Date(entry.date).getTime(),
        isVideo: entry.type === 'video',
        estimated: !!entry.estimated
    }));

    // "ultima.jpeg" não está no manifesto: fecha a timeline no aniversário
    mediaItems.push({
        filename: 'ultima.jpeg',
        path: basePath + 'ultima.jpeg',
        date: new Date('2026-06-02T12:00:00').getTime(),
        isVideo: false,
        estimated: false
    });

    // Apenas a primeira e a última memória têm legenda
    mediaItems[0].caption = '2 de junho de 2025';
    mediaItems[mediaItems.length - 1].caption = '2 de junho de 2026';

    // Exposto para o slide show e o sistema de depoimentos (depoimentos.js)
    window.mediaItems = mediaItems;

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
        
        // Vídeos tocam sozinhos (mudos, em loop) quando entram na tela;
        // o som fica disponível no lightbox
        const mediaContent = item.isVideo
            ? `<video src="${item.path}" muted loop playsinline preload="metadata"></video>`
            : `<img src="${item.path}" alt="Cosmo" loading="lazy">`;

        const dateLabel = item.caption
            ? `<div class="timeline-date">${item.caption}</div>`
            : '';

        div.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content" onclick="openLightbox(${index})">
                ${dateLabel}
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

    // Autoplay dos vídeos: toca ao entrar na tela, pausa ao sair
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.muted = true; // exigido pelos navegadores para autoplay
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.25 });

    document.querySelectorAll('.media-container video').forEach(video => {
        videoObserver.observe(video);
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
        lightboxCaption.textContent = item.caption || '';

        // Atualiza o painel de depoimentos individuais da foto (depoimentos.js)
        window.currentLightboxItem = item;
        if (window.refreshFotoDepoimentos) window.refreshFotoDepoimentos(item);

        if (item.isVideo) {
            lightboxImg.style.display = 'none';
            lightboxVideo.style.display = 'block';
            lightboxVideo.src = item.path;
            lightboxVideo.muted = false; // no lightbox o vídeo tem som
            lightboxVideo.play().catch(() => {});
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
