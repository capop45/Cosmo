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

    // Embaralha (Fisher-Yates) sem alterar o array original
    const shuffle = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    // Caminhos de arquivo do WhatsApp têm espaços e parênteses: cada segmento
    // precisa ser codificado para virar uma URL válida.
    const toPath = (file) => basePath + file.split('/').map(encodeURIComponent).join('/');

    // Manifesto gerado por scripts/build-manifest.mjs. Sem ordem cronológica:
    // três coleções (nascimento, festa, geral). Vídeos usam as versões
    // comprimidas *_web.mp4 (< 100 MB, aceitas pelo GitHub).
    const toItems = (arr, collection) => arr.map(entry => ({
        filename: entry.file,
        path: toPath(entry.file),
        isVideo: entry.type === 'video',
        collection
    }));

    const M = window.MEDIA_MANIFEST || { nascimento: [], festa: [], geral: [] };
    const nascimentoItems = toItems(M.nascimento, 'nascimento');
    const festaItems = toItems(M.festa, 'festa');
    const geralItems = toItems(M.geral, 'geral');

    // Todas as mídias — para o slide show e o sistema de depoimentos
    const mediaItems = [...nascimentoItems, ...geralItems, ...festaItems];
    window.mediaItems = mediaItems;

    // Marquee Injection (fotos aleatórias da nuvem)
    const marqueeTrack = document.getElementById('marquee-track');
    const shuffledForMarquee = shuffle(geralItems.filter(m => !m.isVideo)).slice(0, 15);

    const addMarquee = (item) => {
        const div = document.createElement('div');
        div.className = 'marquee-item';
        div.innerHTML = `<img src="${item.path}" alt="Cosmo Memória" loading="lazy">`;
        div.onclick = () => openLightbox(item);
        marqueeTrack.appendChild(div);
    };
    shuffledForMarquee.forEach(addMarquee);
    shuffledForMarquee.forEach(addMarquee); // duplica para loop contínuo

    // Nuvem de fotos: a coleção geral embaralhada, em mosaico (masonry)
    const cloud = document.getElementById('photo-cloud');
    shuffle(geralItems).forEach(item => {
        const fig = document.createElement('figure');
        fig.className = 'cloud-item';
        fig.innerHTML = item.isVideo
            ? `<video src="${item.path}" muted loop playsinline preload="metadata"></video>`
            : `<img src="${item.path}" alt="Memória de Cosmo" loading="lazy">`;
        fig.addEventListener('click', () => openLightbox(item));
        cloud.appendChild(fig);
    });

    // Revela os itens da nuvem ao entrarem na tela
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll('.cloud-item').forEach(item => observer.observe(item));

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

    document.querySelectorAll('.cloud-item video').forEach(video => {
        videoObserver.observe(video);
    });

    // ====================================================
    //  Galeria das coleções (Nascimento / Festa)
    // ====================================================
    const galleryOverlay = document.getElementById('gallery-overlay');
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryTitle = document.getElementById('gallery-title');
    const gallerySub = document.getElementById('gallery-sub');
    const galleryClose = document.getElementById('gallery-close');

    const openGallery = (items, title, sub) => {
        galleryTitle.textContent = title;
        gallerySub.textContent = sub;
        galleryGrid.innerHTML = '';
        items.forEach(item => {
            const fig = document.createElement('figure');
            fig.className = 'gallery-cell';
            fig.innerHTML = item.isVideo
                ? `<video src="${item.path}" muted loop playsinline preload="metadata"></video>`
                : `<img src="${item.path}" alt="${title}" loading="lazy">`;
            fig.addEventListener('click', () => openLightbox(item));
            galleryGrid.appendChild(fig);
        });
        galleryOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeGallery = () => {
        galleryOverlay.classList.remove('active');
        galleryGrid.innerHTML = '';
        if (!lightbox.classList.contains('active')) {
            document.body.style.overflow = 'auto';
        }
    };

    document.getElementById('portal-nascimento').addEventListener('click', () => {
        openGallery(nascimentoItems, 'Nascimento', '02 de junho de 2025');
    });
    document.getElementById('portal-festa').addEventListener('click', () => {
        openGallery(festaItems, 'A Festa', '1 ano depois...');
    });
    galleryClose.addEventListener('click', closeGallery);
    galleryOverlay.addEventListener('click', (e) => {
        if (e.target === galleryOverlay) closeGallery();
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
        // Se a galeria está aberta atrás do lightbox, mantém o scroll travado
        if (!galleryOverlay.classList.contains('active')) {
            document.body.style.overflow = 'auto';
        }
    };

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (lightbox.classList.contains('active')) {
            closeLightbox();
        } else if (galleryOverlay.classList.contains('active')) {
            closeGallery();
        }
    });
});
