export const SITE_NAME = "Nudgeable AI Practice Lab";
export const SITE_DESCRIPTION =
  "Practical AI workflows for everyday work — workflows, learn, and AI updates.";

export const WORKFLOWS_PAGE_NAME = "Workflows";
export const AI_UPDATES_PAGE_NAME = "AI Updates";

export function getMetadataBase(): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("http://localhost:3000");
}
