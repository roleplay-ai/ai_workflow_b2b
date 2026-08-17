import fs from "fs";
import path from "path";
import {
  makeBoltIconGif,
  makeCoachIconGif,
  makeFooterDotsGif,
  makeLogoNudgeGif,
  makeProgressIconGif,
} from "@/scripts/lib/email-assets";

export const LAB_URL = "https://work.nudgeable.app/";

export function buildLabWelcomeSubject(firstName: string) {
  const name = String(firstName || "there").trim() || "there";
  return `Hi, ${name} — Welcome to the AI Practice Lab`;
}

export function buildLabWelcomeText({
  firstName,
  email,
  password,
}: {
  firstName: string;
  email: string;
  password: string;
}) {
  return `Hi ${firstName},

Welcome to the AI Practice Lab, a space designed to help you build practical AI skills through guided learning and regular practice.

Your login details

Lab URL: ${LAB_URL}
Username: ${email}
Password: ${password}

Please use a laptop or desktop for the best experience.

Inside the AI Practice Lab, you will find:

* Practical AI workflows, an AI Mastery Course, and weekly curated AI updates
* A trained AI Coach to guide you whenever you are stuck
* A personal progress tracker with points, badges, streaks, and leaderboards

For any login or technical issues, simply reply to this email and our team will assist you.

Your access to the AI Practice Lab will remain active for the next three months.

Regards,
Team Nudgeable
team@nudgeable.app`;
}

type LabWelcomeAsset = {
  filename: string;
  content: Buffer;
  contentId: string;
  mimeType: "image/png" | "image/gif";
};

let assetsPromise: Promise<LabWelcomeAsset[]> | null = null;

/** Build the shared image assets once per server process for previews and Resend attachments. */
export function getLabWelcomeAssets() {
  if (!assetsPromise) {
    assetsPromise = (async () => {
      const logoPath = path.join(process.cwd(), "public", "nudgeable-logo.png");
      const logoPng = fs.readFileSync(logoPath);
      const [logoNudge, bolt, coach, progress, dots] = await Promise.all([
        makeLogoNudgeGif(logoPng, 56),
        Promise.resolve(makeBoltIconGif(64)),
        Promise.resolve(makeCoachIconGif(64)),
        Promise.resolve(makeProgressIconGif(64)),
        Promise.resolve(makeFooterDotsGif(72, 16)),
      ]);

      return [
        { filename: "nudgeable-logo.png", content: logoPng, contentId: "nudgeable-logo", mimeType: "image/png" },
        { filename: "logo-nudge.gif", content: logoNudge, contentId: "logo-nudge", mimeType: "image/gif" },
        { filename: "icon-bolt.gif", content: bolt, contentId: "icon-bolt", mimeType: "image/gif" },
        { filename: "icon-coach.gif", content: coach, contentId: "icon-coach", mimeType: "image/gif" },
        { filename: "icon-progress.gif", content: progress, contentId: "icon-progress", mimeType: "image/gif" },
        { filename: "footer-dots.gif", content: dots, contentId: "footer-dots", mimeType: "image/gif" },
      ];
    })();
  }

  return assetsPromise;
}

export function getLabWelcomePreviewSources(assets: LabWelcomeAsset[]) {
  const source = (contentId: string) => {
    const asset = assets.find(item => item.contentId === contentId);
    if (!asset) return "";
    return `data:${asset.mimeType};base64,${asset.content.toString("base64")}`;
  };

  return {
    logoCid: source("nudgeable-logo"),
    logoAnimCid: source("logo-nudge"),
    iconBoltCid: source("icon-bolt"),
    iconCoachCid: source("icon-coach"),
    iconProgressCid: source("icon-progress"),
    footerDotsCid: source("footer-dots"),
  };
}
