import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
// @ts-expect-error no types for gif-encoder-2
import GIFEncoder from "gif-encoder-2";

const YELLOW = "#FFCE00";
const BLACK = "#221D23";

type Ctx = SKRSContext2D;

function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBadgeBackground(ctx: Ctx, size: number) {
  ctx.fillStyle = YELLOW;
  roundRect(ctx, 1, 1, size - 2, size - 2, 10);
  ctx.fill();
  ctx.strokeStyle = BLACK;
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, size - 2, size - 2, 10);
  ctx.stroke();
}

function drawBolt(ctx: Ctx, size: number, scale = 1) {
  const s = (size / 64) * scale;
  const ox = (size * (1 - scale)) / 2;
  const oy = (size * (1 - scale)) / 2;
  ctx.fillStyle = BLACK;
  ctx.beginPath();
  ctx.moveTo(ox + 36 * s, oy + 12 * s);
  ctx.lineTo(ox + 22 * s, oy + 34 * s);
  ctx.lineTo(ox + 30 * s, oy + 34 * s);
  ctx.lineTo(ox + 26 * s, oy + 52 * s);
  ctx.lineTo(ox + 44 * s, oy + 28 * s);
  ctx.lineTo(ox + 34 * s, oy + 28 * s);
  ctx.closePath();
  ctx.fill();
}

function drawCoach(ctx: Ctx, size: number, scale = 1) {
  ctx.fillStyle = BLACK;
  ctx.font = `bold ${Math.round(size * 0.34 * scale)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AI", size / 2, size / 2 + 1);
}

function drawStar(ctx: Ctx, size: number, scale = 1) {
  const cx = size / 2;
  const cy = size / 2 + 1;
  const r = size * 0.22 * scale;
  ctx.fillStyle = BLACK;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    const a2 = a + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(a2) * (r * 0.42), cy + Math.sin(a2) * (r * 0.42));
  }
  ctx.closePath();
  ctx.fill();
}

function encodeGif(
  width: number,
  height: number,
  frames: number,
  delayMs: number,
  draw: (ctx: Ctx, frame: number, t: number) => void
): Buffer {
  const encoder = new GIFEncoder(width, height);
  encoder.setDelay(delayMs);
  encoder.setRepeat(0);
  encoder.start();

  for (let f = 0; f < frames; f++) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    draw(ctx, f, f / frames);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return Buffer.from(encoder.out.getData());
}

/** Static bolt PNG (fallback / first frame look). */
export function makeBoltIconPng(size = 64): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  drawBadgeBackground(ctx, size);
  drawBolt(ctx, size);
  return Buffer.from(canvas.toBuffer("image/png"));
}

export function makeCoachIconPng(size = 64): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  drawBadgeBackground(ctx, size);
  drawCoach(ctx, size);
  return Buffer.from(canvas.toBuffer("image/png"));
}

export function makeProgressIconPng(size = 64): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  drawBadgeBackground(ctx, size);
  drawStar(ctx, size);
  return Buffer.from(canvas.toBuffer("image/png"));
}

/** Soft breathing icon GIFs — subtle scale pulse (Gmail-safe). */
export function makeBoltIconGif(size = 64): Buffer {
  return encodeGif(size, size, 20, 90, (ctx, _f, t) => {
    const breathe = 0.94 + 0.06 * Math.sin(t * Math.PI * 2);
    drawBadgeBackground(ctx, size);
    drawBolt(ctx, size, breathe);
  });
}

export function makeCoachIconGif(size = 64): Buffer {
  return encodeGif(size, size, 20, 90, (ctx, _f, t) => {
    const alpha = 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
    drawBadgeBackground(ctx, size);
    ctx.globalAlpha = alpha;
    drawCoach(ctx, size);
    ctx.globalAlpha = 1;
  });
}

export function makeProgressIconGif(size = 64): Buffer {
  return encodeGif(size, size, 24, 80, (ctx, _f, t) => {
    const rot = t * Math.PI * 2;
    const scale = 0.94 + 0.06 * Math.sin(t * Math.PI * 2);
    drawBadgeBackground(ctx, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(rot * 0.15);
    ctx.scale(scale, scale);
    ctx.translate(-size / 2, -size / 2);
    drawStar(ctx, size);
    ctx.restore();
  });
}

/** Dual soft light sweeps on a charcoal bar. */
export function makeAnimBannerGif(width = 488, height = 10): Buffer {
  return encodeGif(width, height, 24, 70, (ctx, _f, t) => {
    ctx.fillStyle = BLACK;
    roundRect(ctx, 0, 0, width, height, height / 2);
    ctx.fill();

    const band = width * 0.32;
    const x1 = easeInOutSine(t) * (width + band) - band;
    const x2 = easeInOutSine((t + 0.5) % 1) * (width + band) - band;

    for (const x of [x1, x2]) {
      const grad = ctx.createLinearGradient(x, 0, x + band, 0);
      grad.addColorStop(0, "rgba(255,206,0,0)");
      grad.addColorStop(0.5, "rgba(255,206,0,0.95)");
      grad.addColorStop(1, "rgba(255,206,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
  });
}

/** Logo with a refined vertical nudge + soft shadow bloom. */
export async function makeLogoNudgeGif(logoPng: Buffer, size = 56): Promise<Buffer> {
  const logo = await loadImage(logoPng);
  const w = size + 8;
  const h = size + 16;
  return encodeGif(w, h, 24, 80, (ctx, _f, t) => {
    ctx.fillStyle = YELLOW;
    ctx.fillRect(0, 0, w, h);
    const y = 6 + Math.sin(t * Math.PI * 2) * 3;
    const bloom = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
    ctx.fillStyle = `rgba(34,29,35,${bloom})`;
    ctx.beginPath();
    ctx.ellipse(size / 2 + 4, size + 10, size * 0.28, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(logo, 4, y, size, size);
  });
}

/** Thin amber underline that sweeps under section titles / password. */
export function makeUnderlineGlowGif(width = 160, height = 4): Buffer {
  return encodeGif(width, height, 20, 80, (ctx, _f, t) => {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(34,29,35,0.08)";
    roundRect(ctx, 0, 1, width, 2, 1);
    ctx.fill();

    const band = width * 0.4;
    const x = easeInOutSine(t) * (width + band) - band;
    const grad = ctx.createLinearGradient(x, 0, x + band, 0);
    grad.addColorStop(0, "rgba(255,206,0,0)");
    grad.addColorStop(0.5, YELLOW);
    grad.addColorStop(1, "rgba(255,206,0,0)");
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, width, height, 2);
    ctx.fill();
  });
}

/** Soft pulse ring behind the CTA — professional attention cue. */
export function makeCtaPulseGif(width = 280, height = 54): Buffer {
  return encodeGif(width, height, 20, 90, (ctx, _f, t) => {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    const pulse = easeInOutSine(t);
    const pad = 4 + pulse * 5;
    const alpha = 0.35 - pulse * 0.28;

    ctx.strokeStyle = `rgba(255,206,0,${Math.max(alpha, 0.05)})`;
    ctx.lineWidth = 3;
    roundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, (height - pad * 2) / 2);
    ctx.stroke();

    ctx.fillStyle = YELLOW;
    roundRect(ctx, 8, 8, width - 16, height - 16, (height - 16) / 2);
    ctx.fill();
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2.5;
    roundRect(ctx, 8, 8, width - 16, height - 16, (height - 16) / 2);
    ctx.stroke();

    ctx.fillStyle = BLACK;
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Open AI Practice Lab  →", width / 2, height / 2 + 0.5);
  });
}

/** Footer status dots cycling yellow / white. */
export function makeFooterDotsGif(width = 72, height = 16): Buffer {
  return encodeGif(width, height, 18, 100, (ctx, _f, t) => {
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, width, height);
    const positions = [12, 36, 60];
    positions.forEach((x, i) => {
      const phase = (t + i / 3) % 1;
      const lift = Math.sin(phase * Math.PI * 2) * 2;
      const on = phase < 0.5;
      ctx.fillStyle = on ? YELLOW : "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(x, height / 2 - lift, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}
