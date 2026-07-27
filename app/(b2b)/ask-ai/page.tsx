import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import B2BTopbar from "@/components/B2BTopbar";
import AskAIChat from "@/components/AskAI/AskAIChat";

export const dynamic = "force-dynamic";

type CategoryRow = {
  name: string;
  description: string | null;
  icon?: string | null;
  display_order?: number;
  is_visible?: boolean;
};

const REFERENCE_TASK_CATEGORIES = [
  {
    label: "Presentation design",
    icon: "▧",
    databaseNames: ["Make Presentations"],
    aliases: ["presentation design", "presentations", "presentation", "slide decks", "slides", "powerpoint", "ppt"],
  },
  {
    label: "Data analysis",
    icon: "▥",
    databaseNames: ["Analyze Data"],
    aliases: ["data analysis", "analyze data", "analytics", "data", "spreadsheets", "spreadsheet", "excel"],
  },
  {
    label: "Research",
    icon: "⌕",
    databaseNames: ["Research the Market"],
    aliases: ["research", "market research", "deep research", "web research"],
  },
  {
    label: "Image generation",
    icon: "◫",
    databaseNames: ["Generate Images"],
    aliases: ["image generation", "generate images", "images", "image", "visual generation", "graphics"],
  },
  {
    label: "Video generation",
    icon: "▶",
    databaseNames: ["Generate Videos"],
    aliases: ["video generation", "generate videos", "videos", "video", "animation"],
  },
  {
    label: "Chatbot building",
    icon: "◌",
    databaseNames: ["Build a Text Chatbot", "Build a Voice Chatbot"],
    aliases: ["chatbot building", "build chatbots", "chatbots", "chatbot", "text chatbot", "voice chatbot", "conversational ai"],
  },
  {
    label: "AI agent building",
    icon: "✦",
    databaseNames: ["Delegate Multi-Step Work to an Agent"],
    aliases: ["ai agent building", "build ai agents", "ai agents", "agents", "agent building", "agentic ai"],
  },
] as const;

function normalizeCategoryText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function categoryMatchScore(category: CategoryRow, aliases: readonly string[]): number {
  const name = normalizeCategoryText(category.name);
  const description = normalizeCategoryText(category.description ?? "");
  let best = 0;

  for (const rawAlias of aliases) {
    const alias = normalizeCategoryText(rawAlias);
    if (!alias) continue;
    if (name === alias) best = Math.max(best, 1000 + alias.length);
    else if (name.includes(alias)) best = Math.max(best, 800 + alias.length);
    else if (alias.includes(name) && name.length >= 5) best = Math.max(best, 650 + name.length);

    if (description.includes(alias)) {
      best = Math.max(best, 400 + alias.length);
    }
  }

  return best;
}

function matchReferenceCategories(categoryRows: CategoryRow[]) {
  const visibleCategories = categoryRows.filter((category) => category.is_visible !== false);
  const usedNames = new Set<string>();

  return REFERENCE_TASK_CATEGORIES.flatMap((target) => {
    const preferredNames = target.databaseNames.map(normalizeCategoryText);
    const exactDatabaseMatch = visibleCategories.find(
      (category) =>
        !usedNames.has(category.name) &&
        preferredNames.includes(normalizeCategoryText(category.name)),
    );
    const match = exactDatabaseMatch ?? visibleCategories
      .filter((category) => !usedNames.has(category.name))
      .map((category) => ({
        category,
        score: categoryMatchScore(category, target.aliases),
      }))
      .filter(({ score }) => score >= 400)
      .sort((a, b) => b.score - a.score)[0]?.category;

    if (!match) return [];
    usedNames.add(match.name);
    return [{
      name: match.name,
      label: target.label,
      description: match.description,
      icon: match.icon || target.icon,
    }];
  });
}

export default async function AskAIPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let categoryRows: CategoryRow[] = [];

  const categoryResult = await supabase
    .from("activity_categories")
    .select("name, description, icon, display_order, is_visible")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (!categoryResult.error) {
    categoryRows = categoryResult.data ?? [];
  } else {
    // Until the prepared category-metadata migration is applied, retain the
    // database-backed cards using the existing category columns.
    const fallbackResult = await supabase
      .from("activity_categories")
      .select("name, description")
      .order("name", { ascending: true });
    categoryRows = fallbackResult.data ?? [];
  }

  const categories = matchReferenceCategories(categoryRows);

  return (
    <>
      <B2BTopbar />
      <Suspense fallback={null}>
        <AskAIChat categories={categories} userId={user.id} />
      </Suspense>
    </>
  );
}
