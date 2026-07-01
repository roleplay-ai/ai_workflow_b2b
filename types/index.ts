export interface Quiz {
  question: string;
  options: string[];
  correct: number;
  successMsg: string;
  wrongMsg: string;
  badge: string;
}

export interface WorkflowStep {
  id: string;
  step_number: number;
  slide_number: number;
  title: string;
  what_learner_sees: string;
  what_this_means: string;
  what_to_do: string[];
  if_stuck: string;
  callout: string;
  coach_next: string;
  try_asking: string[];
  slideUrl?: string;
  quiz?: Quiz;
}

export function buildCoachChatMessage(step: Pick<WorkflowStep, "title" | "coach_next"> | null | undefined): string {
  if (!step) return "Follow along with the activity when you're ready.";
  return step.coach_next?.trim() || `Follow the instructions on the slide for **${step.title}**.`;
}
