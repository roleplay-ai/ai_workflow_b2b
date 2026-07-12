"use client";

import { useEffect, useState } from "react";

const STAGES = [
  { delay: 0, label: "Understanding your question" },
  { delay: 1200, label: "Searching for relevant resources" },
  { delay: 2400, label: "Finding relevant screenshots" },
  { delay: 3600, label: "Finding relevant workflows" },
  { delay: 4800, label: "Designing your response" },
] as const;

const FACTS = [
  "AI fact: Tokens are small pieces of text that an AI reads and writes.",
  "AI fact: Clear goals and useful context usually improve the first answer.",
  "AI fact: A context window is the information an AI can consider at once.",
  "AI fact: Important AI-generated facts should still be checked.",
  "AI fact: AI predicts likely responses rather than thinking like a person.",
  "AI fact: Examples can help an AI understand the format you want.",
  "AI fact: Shorter prompts aren't always better — relevant detail matters.",
  "AI fact: AI can summarize text, but important details may be missed.",
  "AI fact: A hallucination is a confident-sounding but incorrect AI response.",
  "AI fact: Asking for sources makes factual answers easier to verify.",
  "AI fact: Breaking a complex task into steps can improve the result.",
  "AI fact: Different AI models can produce different answers to the same prompt.",
  "AI fact: AI works best when you clearly describe the desired audience.",
  "AI fact: You can ask AI to revise tone, length, structure, or reading level.",
  "AI fact: Sensitive personal or company information should be handled carefully.",
  "AI fact: AI-generated numbers and calculations should be double-checked.",
  "AI fact: A workflow combines prompts and steps into a repeatable process.",
  "AI fact: AI can help create a first draft, but human review adds judgment.",
  "AI fact: Asking what's missing can improve an incomplete prompt.",
  "AI fact: The right AI tool depends on the task, not just its popularity.",
] as const;

/** Multi-stage "thinking" indicator shown while /api/ask is in flight. Stages advance on a
 *  fixed client-side timer independent of real backend progress — whenever the real answer
 *  arrives, the parent stops rendering this and the loader is simply replaced. If the request
 *  runs longer than the timeline, this just holds on the last stage + fact. */
export default function AskAIThinking() {
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showFact, setShowFact] = useState(false);
  const [fact] = useState(() => FACTS[Math.floor(Math.random() * FACTS.length)]);

  useEffect(() => {
    const timeouts = STAGES.slice(1).map((stage, i) =>
      setTimeout(() => setStageIndex(i + 1), stage.delay),
    );
    const factTimeout = setTimeout(() => setShowFact(true), STAGES[STAGES.length - 1].delay);
    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(factTimeout);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="askai-thinking-block">
      <div className="askai-thinking-elapsed">Working for {elapsedSeconds}s</div>
      <div className="askai-thinking">
        <svg className="askai-thinking-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2c.6 3.4 1.4 5.6 2.6 6.9 1.3 1.3 3.5 2.1 6.9 2.6-3.4.6-5.6 1.4-6.9 2.6-1.3 1.3-2.1 3.5-2.6 6.9-.6-3.4-1.4-5.6-2.6-6.9C8.1 12.8 5.9 12 2.5 11.4c3.4-.5 5.6-1.3 6.9-2.6C10.6 7.6 11.4 5.4 12 2z" />
        </svg>
        <span className="askai-thinking-text">{STAGES[stageIndex].label}</span>
      </div>
      {showFact && <div className="askai-thinking-fact">{fact}</div>}
    </div>
  );
}
