export type CourseModule = {
  id: string;
  title: string;
  part: string;
  partNumber: number;
  sections: number;
  icon: string;
};

export type CoursePart = {
  number: number;
  title: string;
  icon: string;
  modules: CourseModule[];
};

export const COURSE_PARTS: CoursePart[] = [
  {
    number: 0,
    title: "Start Here",
    icon: "👋",
    modules: [
      { id: "00-welcome-start-here", title: "Welcome to AI for Work", part: "Start Here", partNumber: 0, sections: 4, icon: "👋" },
    ],
  },
  {
    number: 1,
    title: "Foundations",
    icon: "🧠",
    modules: [
      { id: "ch1-m1-cut-through-the-hype", title: "Cut Through the Hype: What AI Actually Is", part: "Foundations", partNumber: 1, sections: 3, icon: "🧠" },
      { id: "ch1-m2-under-the-hood", title: "Under the Hood: How Large Language Models Think", part: "Foundations", partNumber: 1, sections: 4, icon: "🧠" },
      { id: "ch1-m3-why-ai-does-what-it-does", title: "Why AI Does What It Does: The Concepts Behind the Behaviour", part: "Foundations", partNumber: 1, sections: 5, icon: "🧠" },
      { id: "ch1-m4-the-ai-toolkit", title: "The AI Toolkit: Models, Apps and How to Choose", part: "Foundations", partNumber: 1, sections: 5, icon: "🧠" },
      { id: "ch1-m5-strengths-and-blind-spots", title: "Strengths and Blind Spots: What AI Can and Can't Do For You", part: "Foundations", partNumber: 1, sections: 4, icon: "🧠" },
    ],
  },
  {
    number: 2,
    title: "Getting Started",
    icon: "🧰",
    modules: [
      { id: "ch2-m1-get-set-up", title: "Get Set Up: Your AI Accounts in Minutes", part: "Getting Started", partNumber: 2, sections: 3, icon: "🧰" },
      { id: "ch2-m2-hidden-power-features", title: "Hidden Power Features Most Users Miss", part: "Getting Started", partNumber: 2, sections: 3, icon: "🧰" },
      { id: "ch2-m3-the-ai-mindset", title: "The AI Mindset: Think AI-First", part: "Getting Started", partNumber: 2, sections: 4, icon: "🧰" },
    ],
  },
  {
    number: 3,
    title: "Prompting",
    icon: "✍️",
    modules: [
      { id: "ch3-m1-the-prompting-mindset", title: "The Prompting Mindset: Think Before You Type", part: "Prompting", partNumber: 3, sections: 3, icon: "✍️" },
      { id: "ch3-m2-the-proven-prompt-framework", title: "The Proven Prompt Framework", part: "Prompting", partNumber: 3, sections: 3, icon: "✍️" },
      { id: "ch3-m3-prompting-techniques", title: "Prompting Techniques: Foundations and Advanced", part: "Prompting", partNumber: 3, sections: 3, icon: "✍️" },
      { id: "ch3-m4-beyond-text", title: "Beyond Text: Prompting with Images, Files and Voice", part: "Prompting", partNumber: 3, sections: 2, icon: "✍️" },
    ],
  },
  {
    number: 4,
    title: "Writing and Research",
    icon: "📝",
    modules: [
      { id: "ch4-m1-ai-as-your-writing-partner", title: "AI as Your Writing Partner", part: "Writing and Research", partNumber: 4, sections: 6, icon: "📝" },
      { id: "ch4-m2-smarter-research", title: "Smarter Research: Web Search Powered by AI", part: "Writing and Research", partNumber: 4, sections: 3, icon: "📝" },
      { id: "ch4-m3-document-analysis", title: "Upload, Ask, Extract: AI-Powered Document Analysis", part: "Writing and Research", partNumber: 4, sections: 4, icon: "📝" },
    ],
  },
  {
    number: 5,
    title: "Data and Presentations",
    icon: "📊",
    modules: [
      { id: "ch5-m1-ai-meets-your-spreadsheet", title: "AI Meets Your Spreadsheet", part: "Data and Presentations", partNumber: 5, sections: 4, icon: "📊" },
      { id: "ch5-m2-ai-agents-for-spreadsheets", title: "The Next Wave — AI Agents for Spreadsheets", part: "Data and Presentations", partNumber: 5, sections: 3, icon: "📊" },
      { id: "ch5-m3-ai-for-presentations", title: "AI for Presentations — The Workflow That Actually Works", part: "Data and Presentations", partNumber: 5, sections: 4, icon: "📊" },
    ],
  },
  {
    number: 6,
    title: "Build and Create",
    icon: "🧩",
    modules: [
      { id: "ch6-m1-custom-chatbots", title: "Custom Chatbots — Build Your Own AI Assistant", part: "Build and Create", partNumber: 6, sections: 3, icon: "🧩" },
      { id: "ch6-m2-ai-agents-from-chatbots-to-action", title: "AI Agents — From Chatbots to Action", part: "Build and Create", partNumber: 6, sections: 4, icon: "🧩" },
      { id: "ch6-m3-vibe-coding", title: "Vibe Coding — Build Apps Without Code", part: "Build and Create", partNumber: 6, sections: 4, icon: "🧩" },
      { id: "ch6-m4-ai-video-generation", title: "AI Video Generation", part: "Build and Create", partNumber: 6, sections: 4, icon: "🧩" },
    ],
  },
  {
    number: 7,
    title: "Stay Safe",
    icon: "⚠️",
    modules: [
      { id: "ch7-m1-hallucinations-and-black-box", title: "Hallucinations & the Black Box Problem", part: "Stay Safe", partNumber: 7, sections: 4, icon: "⚠️" },
      { id: "ch7-m2-data-privacy", title: "Data Privacy — What Happens to Your Data", part: "Stay Safe", partNumber: 7, sections: 3, icon: "⚠️" },
      { id: "ch7-m3-bias-in-ai", title: "Bias in AI — How AI Inherits Our Blind Spots", part: "Stay Safe", partNumber: 7, sections: 4, icon: "⚠️" },
      { id: "ch7-m4-legal-risk-security-cost", title: "Legal Risk, Security & the True Cost of AI", part: "Stay Safe", partNumber: 7, sections: 4, icon: "⚠️" },
    ],
  },
  {
    number: 8,
    title: "Keep Growing",
    icon: "🌱",
    modules: [
      { id: "ch8-m1-your-ai-learning-plan", title: "Your AI Learning Plan", part: "Keep Growing", partNumber: 8, sections: 4, icon: "🌱" },
      { id: "ch8-m2-ai-glossary", title: "AI Glossary", part: "Keep Growing", partNumber: 8, sections: 1, icon: "🌱" },
    ],
  },
  {
    number: 9,
    title: "What Comes Next",
    icon: "🚀",
    modules: [
      { id: "ch9-m1-from-chatbot-to-coworker-and-openclaw", title: "From Chatbot to Co-Worker", part: "What Comes Next", partNumber: 9, sections: 4, icon: "🚀" },
    ],
  },
];

export const TOTAL_MODULES = COURSE_PARTS.reduce((sum, p) => sum + p.modules.length, 0);

export function getAllModules(): CourseModule[] {
  return COURSE_PARTS.flatMap(p => p.modules);
}

export function getValidModuleIds(): Set<string> {
  return new Set(getAllModules().map(m => m.id));
}
