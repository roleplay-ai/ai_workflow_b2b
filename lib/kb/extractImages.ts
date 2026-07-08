/**
 * Extracts embedded raster images (figures/screenshots/photos) from a PDF's
 * pages — NOT a full-page render (see lib/pdfToImages.ts for that, still used
 * elsewhere in the app). Walks each page's pdfjs operator list looking for
 * paintImageXObject ops, resolves the referenced bitmap via page.objs, and
 * rasterizes it to a PNG via @napi-rs/canvas.
 *
 * Only catches true embedded raster XObjects. A page whose "images" are
 * actually vector drawings (common in PPT/Word-exported PDFs) will yield
 * nothing here — see RAG_ASSISTANT_ARCHITECTURE.md §3a. This relies on
 * pdfjs's internal `page.objs` / operator-list shapes, which are stable in
 * practice but not a documented public API — validate against real sample
 * PDFs early (see architecture doc, Build order step 3).
 */

export type ExtractedImage = {
  pageNumber: number;
  buffer: Buffer;
  width: number;
  height: number;
};

const MIN_DIMENSION = 80; // filters out logos, bullets, hairline rules

type PdfImageObject = {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
  kind: number; // pdfjs ImageKind: GRAYSCALE_1BPP=1, RGB_24BPP=2, RGBA_32BPP=3
};

/**
 * Extracts images from a single, already-loaded pdfjs page. This is the core
 * function — call it directly (as lib/kb/ingest.ts does) when you already have
 * a `page` object from a document you're also pulling text from, so the PDF
 * only gets parsed once per ingestion batch.
 */
export async function extractImagesFromPage(page: any, pageNumber: number): Promise<ExtractedImage[]> {
  const { createCanvas, DOMMatrix } = await import("@napi-rs/canvas");
  if (typeof (global as any).DOMMatrix === "undefined") {
    (global as any).DOMMatrix = DOMMatrix;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjs = require("pdfjs-dist/build/pdf.js");
  const imageOps = new Set(
    [pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintJpegXObject].filter(
      (op): op is number => typeof op === "number",
    ),
  );

  const opList = await page.getOperatorList();
  const results: ExtractedImage[] = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    if (!imageOps.has(opList.fnArray[i])) continue;

    const objId = opList.argsArray[i]?.[0];
    if (typeof objId !== "string") continue;

    const imgData = await getPageObject(page, objId);
    if (!imgData || !imgData.width || !imgData.height) continue;
    if (imgData.width < MIN_DIMENSION || imgData.height < MIN_DIMENSION) continue;

    const rgba = toRGBA(imgData);
    if (!rgba) continue;

    const canvas = createCanvas(imgData.width, imgData.height);
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(imgData.width, imgData.height);
    imageData.data.set(rgba);
    ctx.putImageData(imageData, 0, 0);

    results.push({
      pageNumber,
      buffer: canvas.toBuffer("image/png") as Buffer,
      width: imgData.width,
      height: imgData.height,
    });
  }

  return results;
}

/** Convenience wrapper for standalone use/testing — loads and walks a whole PDF. */
export async function extractImagesFromPdf(pdfBuffer: Buffer): Promise<ExtractedImage[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjs = require("pdfjs-dist/build/pdf.js");
  pdfjs.GlobalWorkerOptions.workerSrc = "";

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    disableFontFace: true,
  });
  const pdfDoc = await loadingTask.promise;

  const results: ExtractedImage[] = [];
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    results.push(...(await extractImagesFromPage(page, pageNum)));
    page.cleanup();
  }

  await loadingTask.destroy?.().catch(() => {});
  return results;
}

function getPageObject(page: any, objId: string): Promise<PdfImageObject | null> {
  return new Promise((resolve) => {
    try {
      page.objs.get(objId, (obj: PdfImageObject | undefined) => resolve(obj ?? null));
    } catch {
      resolve(null);
    }
  });
}

function toRGBA(img: PdfImageObject): Uint8ClampedArray | null {
  const { data, width, height, kind } = img;
  const out = new Uint8ClampedArray(width * height * 4);

  if (kind === 3) {
    // Already RGBA
    if (data.length !== out.length) return null;
    out.set(data);
    return out;
  }

  if (kind === 2) {
    // RGB → RGBA
    if (data.length !== width * height * 3) return null;
    for (let p = 0; p < width * height; p++) {
      out[p * 4] = data[p * 3];
      out[p * 4 + 1] = data[p * 3 + 1];
      out[p * 4 + 2] = data[p * 3 + 2];
      out[p * 4 + 3] = 255;
    }
    return out;
  }

  if (kind === 1) {
    // 1-bit-per-pixel packed grayscale → RGBA
    const rowBytes = Math.ceil(width / 8);
    if (data.length < rowBytes * height) return null;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const byte = data[y * rowBytes + (x >> 3)];
        const bit = (byte >> (7 - (x & 7))) & 1;
        const gray = bit ? 255 : 0;
        const p = (y * width + x) * 4;
        out[p] = gray;
        out[p + 1] = gray;
        out[p + 2] = gray;
        out[p + 3] = 255;
      }
    }
    return out;
  }

  return null;
}
