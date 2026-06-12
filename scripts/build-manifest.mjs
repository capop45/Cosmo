// Gera site-1-ano/manifest.js com todas as mídias em ordem de data real.
//
// Fontes de data, em ordem de prioridade:
//   1. EXIF DateTimeOriginal/CreateDate (fotos) ou CreationDate/MediaCreateDate (vídeos)
//   2. Interpolação pela numeração sequencial do iPhone (IMG_NNNN) entre vizinhos
//      com data conhecida — fotos repassadas por WhatsApp perdem o EXIF
//   3. Estimativa manual (fotos sem EXIF e sem número de sequência)
//
// Para regenerar dates_raw.json:
//   cd Fotos && exiftool -json -DateTimeOriginal -CreateDate -CreationDate \
//     -MediaCreateDate -d "%Y-%m-%dT%H:%M:%S" -ext jpg -ext heic -ext mp4 -ext mov . \
//     > ../scripts/dates_raw.json
//
// Uso: node scripts/build-manifest.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(join(here, 'dates_raw.json'), 'utf8').replace(/^﻿/, ''));

const VIDEO_RE = /\.(mp4|mov)$/i;
const HEIC_RE = /\.heic$/i;
const SEQ_RE = /^(?:IMG|VID)_(\d{4})(?:_\d+)?\.(?:jpg|jpeg|heic|mp4|mov)$/i;
const VIDEO_UTC_OFFSET_MIN = -3 * 60; // MP4 grava CreateDate em UTC; Brasil é UTC-3

// Estimativas manuais: fotos sem EXIF e sem número de sequência (nomes de
// compartilhamento). Idade aparente do bebê comparada com fotos datadas.
const MANUAL = {
  'bfc4f00d-a60f-4d42-99ac-14202f30e287.jpg': '2025-09-15T12:00:00', // ensaio de estúdio, ~3 meses
  '95f477e8-53eb-45f2-9664-7e9b3cb16274.jpg': '2025-11-15T12:00:00', // trocador, ~5 meses
};

// minutos desde 2025-01-01 para aritmética sem fuso
function toMin(iso) {
  const [d, t] = iso.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi, s] = t.split(':').map(Number);
  return Date.UTC(y, mo - 1, da, h, mi, s) / 60000;
}
function toIso(min) {
  return new Date(min * 60000).toISOString().slice(0, 19);
}
function valid(s) {
  return s && !s.startsWith('0000') ? s : null;
}

const heicBases = new Set(
  raw.filter(e => HEIC_RE.test(e.SourceFile)).map(e => basename(e.SourceFile).replace(HEIC_RE, ''))
);

const items = [];
for (const e of raw) {
  const name = basename(e.SourceFile);
  // pula os .jpg gerados a partir de .HEIC (a data vem do original)
  if (/\.jpg$/.test(name) && heicBases.has(name.replace(/\.jpg$/, ''))) continue;

  const isVideo = VIDEO_RE.test(name);
  let min = null;
  if (isVideo) {
    const local = valid(e.CreationDate); // MOV: já em hora local
    const utc = valid(e.CreateDate) || valid(e.MediaCreateDate);
    if (local) min = toMin(local);
    else if (utc) min = toMin(utc) + VIDEO_UTC_OFFSET_MIN;
  } else {
    const d = valid(e.DateTimeOriginal) || valid(e.CreateDate);
    if (d) min = toMin(d);
  }

  const seqMatch = name.match(SEQ_RE);
  items.push({
    name,
    isVideo,
    seq: seqMatch ? Number(seqMatch[1]) : null,
    min,
    estimated: min === null,
  });
}

// âncoras: arquivos com data real e número de sequência
const anchors = items
  .filter(i => i.min !== null && i.seq !== null)
  .sort((a, b) => a.seq - b.seq);

for (const it of items) {
  if (it.min !== null) continue;

  if (MANUAL[it.name]) {
    it.min = toMin(MANUAL[it.name]);
    continue;
  }
  if (it.seq === null) {
    throw new Error(`Sem data e sem sequência: ${it.name}`);
  }

  const prev = [...anchors].reverse().find(a => a.seq < it.seq);
  const next = anchors.find(a => a.seq > it.seq);
  if (prev && next) {
    const frac = (it.seq - prev.seq) / (next.seq - prev.seq);
    it.min = Math.round(prev.min + (next.min - prev.min) * frac);
  } else if (next) {
    // antes da primeira âncora (fotos do parto): mesmo dia, 1 min por passo
    it.min = next.min - (next.seq - it.seq);
  } else if (prev) {
    it.min = prev.min + (it.seq - prev.seq);
  } else {
    throw new Error(`Sem âncoras para interpolar: ${it.name}`);
  }
}

items.sort((a, b) => a.min - b.min || (a.seq ?? 0) - (b.seq ?? 0));

const manifest = items.map(it => ({
  file: it.isVideo
    ? it.name.replace(VIDEO_RE, '_web.mp4')
    : HEIC_RE.test(it.name) ? it.name.replace(HEIC_RE, '.jpg') : it.name,
  date: toIso(it.min),
  type: it.isVideo ? 'video' : 'image',
  ...(it.estimated ? { estimated: true } : {}),
}));

const out =
  '// Gerado por scripts/build-manifest.mjs — não editar manualmente.\n' +
  '// Datas reais extraídas dos metadados; "estimated" = data aproximada\n' +
  '// (interpolada pela sequência do arquivo ou estimada pelo conteúdo).\n' +
  'window.MEDIA_MANIFEST = ' + JSON.stringify(manifest, null, 2) + ';\n';

writeFileSync(join(here, '..', 'site-1-ano', 'manifest.js'), out, 'utf8');
console.log(`manifest.js gerado com ${manifest.length} itens`);
console.log(`com data real: ${items.filter(i => !i.estimated).length}`);
console.log(`estimados: ${items.filter(i => i.estimated).length}`);
