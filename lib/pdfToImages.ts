/**
 * Renders every page of a PDF Buffer into PNG Buffers, in page order.
 *
 * Stack:
 *   • pdfjs-dist v3 (CJS build) — parses the PDF
 *   • @napi-rs/canvas (via canvas-stub workspace) — renders each page
 *
 * Pure JavaScript — no external binaries. Works locally and on Vercel.
 */
export async function convertPdfToImages(
  pdfBuffer: Buffer,
  scale = 2.0
): Promise<Buffer[]> {
  const { createCanvas, DOMMatrix } = await import("@napi-rs/canvas");

  // pdfjs v3 uses DOMMatrix internally; polyfill it in Node.js
  if (typeof (global as any).DOMMatrix === "undefined") {
    (global as any).DOMMatrix = DOMMatrix;
  }

  // canvas-stub workspace makes require("canvas") resolve to @napi-rs/canvas,
  // so pdfjs's internal NodeCanvasFactory works without the native canvas package.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjs = require("pdfjs-dist/build/pdf.js");
  pdfjs.GlobalWorkerOptions.workerSrc = ""; // disable Web Worker in Node.js

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdfDoc = await loadingTask.promise;
  const results: Buffer[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const width  = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);

    const canvas = createCanvas(width, height);
    const ctx    = canvas.getContext("2d");

    const canvasFactory = {
      create(w: number, h: number) {
        const c = createCanvas(w, h);
        return { canvas: c, context: c.getContext("2d") };
      },
      reset(obj: any, w: number, h: number) {
        obj.canvas.width  = w;
        obj.canvas.height = h;
      },
      destroy(obj: any) {
        obj.canvas.width  = 0;
        obj.canvas.height = 0;
      },
    };

    await page.render({
      canvasContext: ctx,
      viewport,
      canvasFactory,
    } as any).promise;

    results.push((canvas as any).toBuffer("image/png") as Buffer);
    page.cleanup();
  }

  await loadingTask.destroy?.().catch(() => {});
  return results;
}
