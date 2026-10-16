// Confere o tipo real do arquivo pelos primeiros bytes (o "type" enviado pelo navegador pode ser falsificado).

const SIGNATURES: { mime: string; test: (b: Uint8Array) => boolean }[] = [
  { mime: 'image/png', test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/gif', test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  {
    mime: 'image/webp',
    test: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP',
  },
  { mime: 'image/avif', test: (b) => ascii(b, 4, 8) === 'ftyp' && /avi[fs]/.test(ascii(b, 8, 12)) },
  { mime: 'application/pdf', test: (b) => ascii(b, 0, 5) === '%PDF-' },
  // DOCX, XLSX e ZIP compartilham a assinatura do ZIP
  { mime: 'application/zip', test: (b) => b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07) },
  // DOC e XLS antigos (OLE2)
  { mime: 'application/x-ole', test: (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0 },
];

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

export function detectFileType(bytes: Uint8Array): string | null {
  return SIGNATURES.find((s) => s.test(bytes))?.mime ?? null;
}

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']);

export function isRealImage(bytes: Uint8Array): string | null {
  const type = detectFileType(bytes);
  return type && IMAGE_TYPES.has(type) ? type : null;
}

// Documentos de cliente: o conteúdo precisa bater com a família do tipo declarado
export function documentMatchesType(bytes: Uint8Array, declared: string): boolean {
  const detected = detectFileType(bytes);
  if (declared === 'text/plain' || declared === 'text/csv') {
    // Texto: rejeita binários conhecidos e bytes nulos
    return detected === null && !bytes.slice(0, 1024).includes(0);
  }
  if (declared.startsWith('image/')) return detected === declared;
  if (declared === 'application/pdf') return detected === 'application/pdf';
  if (declared === 'application/msword' || declared === 'application/vnd.ms-excel') return detected === 'application/x-ole';
  // docx, xlsx, zip
  return detected === 'application/zip';
}
