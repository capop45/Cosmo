/*
 * Sistema de depoimentos + slide show.
 * Os depoimentos são persistidos num bin do jsonbin.io.
 *
 * Estrutura do bin:
 *   {
 *     "geral": [ { id, nome, texto, data } ],          // depoimentos gerais
 *     "fotos": { "<arquivo>": [ { id, nome, texto, data } ] }  // por foto
 *   }
 */
(function () {
    'use strict';

    const BIN_ID = '6a2c883dda38895dfeb7c6ae';
    const ACCESS_KEY = '$2a$10$H6l0E2b3rlbf4F44/NvfceGCLRP9tXhvdiNTXLn0xd7zL.CixhPCm';
    const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

    // ---------- Camada de dados (jsonbin) ----------

    function emptyStore() {
        return { geral: [], fotos: {} };
    }

    async function fetchStore() {
        const res = await fetch(`${BASE_URL}/latest`, {
            headers: { 'X-Access-Key': ACCESS_KEY }
        });
        if (!res.ok) throw new Error('Falha ao carregar depoimentos (' + res.status + ')');
        const json = await res.json();
        const rec = json.record || {};
        return {
            geral: Array.isArray(rec.geral) ? rec.geral : [],
            fotos: (rec.fotos && typeof rec.fotos === 'object' && !Array.isArray(rec.fotos)) ? rec.fotos : {}
        };
    }

    async function putStore(store) {
        const res = await fetch(BASE_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': ACCESS_KEY
            },
            body: JSON.stringify(store)
        });
        if (!res.ok) throw new Error('Falha ao salvar depoimento (' + res.status + ')');
    }

    // Relê o estado mais recente antes de gravar, para reduzir perda de
    // depoimentos enviados por pessoas diferentes ao mesmo tempo.
    async function addDepoimento({ nome, texto, foto }) {
        const store = await fetchStore();
        const item = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            nome: nome.trim(),
            texto: texto.trim(),
            data: new Date().toISOString()
        };
        if (foto) {
            if (!Array.isArray(store.fotos[foto])) store.fotos[foto] = [];
            store.fotos[foto].push(item);
        } else {
            store.geral.push(item);
        }
        await putStore(store);
        return { item, store };
    }

    // Cache local do último estado carregado.
    let cache = emptyStore();

    // ---------- Utilidades ----------

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatarData(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return '';
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    }

    function cardHtml(dep) {
        return `
            <div class="depo-card">
                <div class="depo-card-head">
                    <span class="depo-nome">${escapeHtml(dep.nome)}</span>
                    <span class="depo-data">${formatarData(dep.data)}</span>
                </div>
                <p class="depo-texto">${escapeHtml(dep.texto)}</p>
            </div>`;
    }

    function renderLista(container, lista, vazioMsg) {
        if (!lista || lista.length === 0) {
            container.innerHTML = `<p class="depo-vazio">${vazioMsg}</p>`;
            return;
        }
        // Mais recentes primeiro
        const ordenada = [...lista].sort((a, b) => new Date(b.data) - new Date(a.data));
        container.innerHTML = ordenada.map(cardHtml).join('');
    }

    document.addEventListener('DOMContentLoaded', () => {

        // ====================================================
        //  Modais (depoimento geral + lista)
        // ====================================================
        const modalForm = document.getElementById('modal-form');
        const modalLista = document.getElementById('modal-lista');
        const listaContainer = document.getElementById('depoimentos-list');
        const formGeral = document.getElementById('form-depoimento-geral');

        function openModal(el) {
            el.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        function closeModal(el) {
            el.classList.remove('active');
            if (!modalForm.classList.contains('active') &&
                !modalLista.classList.contains('active')) {
                document.body.style.overflow = 'auto';
            }
        }

        // Botão: abrir formulário geral
        document.getElementById('btn-novo-depoimento').addEventListener('click', () => {
            openModal(modalForm);
        });

        // Botão: abrir lista de depoimentos
        document.getElementById('btn-ver-depoimentos').addEventListener('click', async () => {
            openModal(modalLista);
            listaContainer.innerHTML = '<p class="depo-vazio">Carregando…</p>';
            try {
                cache = await fetchStore();
                renderLista(listaContainer, cache.geral, 'Ainda não há depoimentos. Seja o primeiro! 💫');
            } catch (err) {
                listaContainer.innerHTML = `<p class="depo-erro">Não foi possível carregar os depoimentos.</p>`;
            }
        });

        // Fechar modais (X, clique no fundo, ESC)
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
        });
        [modalForm, modalLista].forEach(m => {
            m.addEventListener('click', e => { if (e.target === m) closeModal(m); });
        });

        // Enviar depoimento geral
        formGeral.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formGeral.querySelector('button[type="submit"]');
            const nome = formGeral.nome.value;
            const texto = formGeral.texto.value;
            if (!nome.trim() || !texto.trim()) return;

            btn.disabled = true;
            btn.textContent = 'Enviando…';
            try {
                await addDepoimento({ nome, texto });
                formGeral.reset();
                closeModal(modalForm);
                showToast('Depoimento enviado! Obrigado 💜');
            } catch (err) {
                showToast('Erro ao enviar. Tente novamente.', true);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Enviar depoimento';
            }
        });

        // ====================================================
        //  Depoimentos individuais por foto (dentro do lightbox)
        // ====================================================
        const depoToggle = document.getElementById('depo-toggle');
        const depoPanel = document.getElementById('depo-panel');
        const depoCount = document.getElementById('depo-count');
        const depoPanelList = document.getElementById('depo-panel-list');
        const fotoForm = document.getElementById('depo-foto-form');
        const lightboxDepoimentos = document.getElementById('lightbox-depoimentos');

        let fotoAtual = null;

        depoToggle.addEventListener('click', () => {
            depoPanel.classList.toggle('open');
        });

        // Chamado pelo script.js sempre que o lightbox abre
        window.refreshFotoDepoimentos = async (item) => {
            fotoAtual = item ? item.filename : null;
            depoPanel.classList.remove('open');
            lightboxDepoimentos.style.display = item ? 'block' : 'none';
            if (!fotoAtual) return;

            depoCount.textContent = '…';
            depoPanelList.innerHTML = '<p class="depo-vazio">Carregando…</p>';
            try {
                cache = await fetchStore();
                const lista = cache.fotos[fotoAtual] || [];
                depoCount.textContent = lista.length;
                renderLista(depoPanelList, lista, 'Nenhum depoimento nesta foto ainda.');
            } catch (err) {
                depoCount.textContent = '0';
                depoPanelList.innerHTML = `<p class="depo-erro">Erro ao carregar.</p>`;
            }
        };

        fotoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!fotoAtual) return;
            const btn = fotoForm.querySelector('button[type="submit"]');
            const nome = fotoForm.nome.value;
            const texto = fotoForm.texto.value;
            if (!nome.trim() || !texto.trim()) return;

            btn.disabled = true;
            btn.textContent = 'Enviando…';
            try {
                const { store } = await addDepoimento({ nome, texto, foto: fotoAtual });
                cache = store;
                fotoForm.reset();
                const lista = cache.fotos[fotoAtual] || [];
                depoCount.textContent = lista.length;
                renderLista(depoPanelList, lista, 'Nenhum depoimento nesta foto ainda.');
                showToast('Depoimento enviado! 💜');
            } catch (err) {
                showToast('Erro ao enviar. Tente novamente.', true);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Enviar depoimento';
            }
        });

        // ====================================================
        //  Slide Show em tela cheia
        // ====================================================
        const overlay = document.getElementById('slideshow-overlay');
        const stage = document.getElementById('slideshow-stage');
        const hint = document.getElementById('slideshow-hint');
        const btnSlideshow = document.getElementById('btn-slideshow');
        const btnClose = document.getElementById('slideshow-close');

        let slides = [];          // os dois <div> que se alternam
        let frontIndex = 0;       // qual slide está visível
        let ordem = [];           // ordem aleatória dos caminhos
        let posicao = 0;
        let timer = null;
        let hintTimer = null;
        const DURACAO = 6500;     // ms por foto

        function shuffle(arr) {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }

        function aplicarKenBurns(slide) {
            // Zoom + deslocamento suave em direção aleatória (efeito vitrine)
            const startScale = 1.0 + Math.random() * 0.06;
            const endScale = 1.15 + Math.random() * 0.12;
            const x = (Math.random() * 6 - 3).toFixed(2);
            const y = (Math.random() * 6 - 3).toFixed(2);
            const ox = (Math.random() * 100).toFixed(0);
            const oy = (Math.random() * 100).toFixed(0);
            slide.style.transformOrigin = `${ox}% ${oy}%`;
            slide.style.setProperty('--kb-from', `scale(${startScale}) translate(0, 0)`);
            slide.style.setProperty('--kb-to', `scale(${endScale}) translate(${x}%, ${y}%)`);
            // Reinicia a animação
            slide.style.animation = 'none';
            void slide.offsetWidth; // reflow
            slide.style.animation = `kenburns ${(DURACAO + 1600) / 1000}s ease-out forwards`;
        }

        function proximaImagem() {
            if (ordem.length === 0) return;
            const path = ordem[posicao % ordem.length];
            posicao++;

            const back = slides[1 - frontIndex];
            const front = slides[frontIndex];

            back.style.backgroundImage = `url("${path.replace(/"/g, '\\"')}")`;
            aplicarKenBurns(back);

            // Crossfade
            back.classList.add('show');
            front.classList.remove('show');
            frontIndex = 1 - frontIndex;
        }

        function abrirSlideshow() {
            const imgs = (window.mediaItems || [])
                .filter(m => !m.isVideo)
                .map(m => m.path);
            if (imgs.length === 0) {
                showToast('Nenhuma foto disponível.', true);
                return;
            }
            ordem = shuffle(imgs);
            posicao = 0;

            // Cria/zera os dois slides
            stage.innerHTML = '';
            slides = [document.createElement('div'), document.createElement('div')];
            slides.forEach(s => { s.className = 'slideshow-slide'; stage.appendChild(s); });
            frontIndex = 0;

            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Tenta tela cheia de verdade
            if (overlay.requestFullscreen) {
                overlay.requestFullscreen().catch(() => {});
            }

            proximaImagem();                 // primeira foto imediatamente
            timer = setInterval(proximaImagem, DURACAO);

            // Esconde a dica após alguns segundos
            hint.style.opacity = '1';
            clearTimeout(hintTimer);
            hintTimer = setTimeout(() => { hint.style.opacity = '0'; }, 3500);
        }

        function fecharSlideshow() {
            overlay.classList.remove('active');
            clearInterval(timer);
            timer = null;
            stage.innerHTML = '';
            slides = [];
            document.body.style.overflow = 'auto';
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        }

        btnSlideshow.addEventListener('click', abrirSlideshow);
        btnClose.addEventListener('click', fecharSlideshow);
        overlay.addEventListener('click', (e) => {
            // Clicar no fundo (não nos botões) avança ou nada; aqui só mostra a dica
            if (e.target === overlay || e.target === stage) {
                hint.style.opacity = '1';
                clearTimeout(hintTimer);
                hintTimer = setTimeout(() => { hint.style.opacity = '0'; }, 2500);
            }
        });

        // Se sair da tela cheia pelo F11/ESC do navegador, fecha o overlay
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement && overlay.classList.contains('active')) {
                fecharSlideshow();
            }
        });

        // ESC fecha modais e slideshow
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (overlay.classList.contains('active')) fecharSlideshow();
            if (modalForm.classList.contains('active')) closeModal(modalForm);
            if (modalLista.classList.contains('active')) closeModal(modalLista);
        });

        // ====================================================
        //  Toast simples
        // ====================================================
        function showToast(msg, erro) {
            let toast = document.getElementById('depo-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'depo-toast';
                toast.className = 'depo-toast';
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.classList.toggle('erro', !!erro);
            toast.classList.add('show');
            clearTimeout(toast._t);
            toast._t = setTimeout(() => toast.classList.remove('show'), 3200);
        }
    });
})();
