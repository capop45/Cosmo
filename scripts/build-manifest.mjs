// Gera site-1-ano/manifest.js varrendo a pasta Fotos/.
//
// O site deixou de ser uma linha do tempo cronológica: a maioria das fotos
// veio do WhatsApp, sem metadados de data. Em vez de ordenar por data, o
// manifesto agora agrupa as mídias em três coleções:
//
//   - nascimento : Fotos/Nascimento/  → exibida como "02 de junho de 2025"
//   - festa      : Fotos/Festa/        → exibida como "1 ano depois..."
//   - geral      : Fotos/ (raiz)       → "nuvem de fotos" embaralhada no meio
//
// Regras de inclusão:
//   - imagens .jpg/.jpeg/.png entram direto
//   - .HEIC é ignorado (o site usa o .jpg equivalente gerado a partir dele)
//   - vídeos: só as versões comprimidas *_web.mp4 (as únicas versionadas;
//     ver .gitignore). Os originais .mp4/.mov/WhatsApp ficam de fora.
//
// Uso: node scripts/build-manifest.mjs

import { readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const fotosDir = join(here, '..', 'Fotos');

const IMAGE_RE = /\.(jpe?g|png)$/i;
const HEIC_RE = /\.heic$/i;
const WEB_VIDEO_RE = /_web\.mp4$/i;

// Varre uma subpasta de Fotos/ (ou a raiz, quando subdir é null) e devolve a
// lista de mídias com o caminho relativo a Fotos/.
function collect(subdir) {
  const dir = subdir ? join(fotosDir, subdir) : fotosDir;
  const names = readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isFile())
    .map(d => d.name)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const items = [];
  for (const name of names) {
    const rel = subdir ? `${subdir}/${name}` : name;
    if (WEB_VIDEO_RE.test(name)) {
      items.push({ file: rel, type: 'video' });
    } else if (HEIC_RE.test(name)) {
      continue; // usa o .jpg equivalente
    } else if (IMAGE_RE.test(name)) {
      items.push({ file: rel, type: 'image' });
    }
    // demais (.mp4 não-web, .mov, etc.) não são versionados — ficam de fora
  }
  return items;
}

const manifest = {
  nascimento: collect('Nascimento'),
  festa: collect('Festa'),
  geral: collect(null),
};

const out =
  '// Gerado por scripts/build-manifest.mjs — não editar manualmente.\n' +
  '// Coleções de mídia agrupadas por pasta (sem ordem cronológica).\n' +
  '//   nascimento → "02 de junho de 2025"  |  festa → "1 ano depois..."\n' +
  '//   geral → nuvem de fotos embaralhada.\n' +
  'window.MEDIA_MANIFEST = ' + JSON.stringify(manifest, null, 2) + ';\n';

writeFileSync(join(here, '..', 'site-1-ano', 'manifest.js'), out, 'utf8');
console.log(
  `manifest.js gerado — nascimento: ${manifest.nascimento.length}, ` +
  `festa: ${manifest.festa.length}, geral: ${manifest.geral.length}`
);
