export function formatDurationSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0 || Number.isNaN(seconds)) return "";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function probeVideoDurationFromFile(file: File, timeoutMs = 20000): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    let settled = false;

    const finish = (formatted: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve(formatted);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    video.onloadedmetadata = () => {
      const d = video.duration;
      if (Number.isFinite(d) && d > 0 && !Number.isNaN(d) && d !== Infinity) {
        finish(formatDurationSeconds(d));
      } else {
        finish(null);
      }
    };
    video.onerror = () => finish(null);

    video.src = url;
    video.load();
  });
}
