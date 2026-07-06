import { Suspense } from "react";
import B2BTopbar from "@/components/B2BTopbar";
import AskAIChat from "@/components/AskAI/AskAIChat";

export default function AskAIPage() {
  return (
    <>
      <B2BTopbar />
      <Suspense fallback={null}>
        <AskAIChat />
      </Suspense>
    </>
  );
}
