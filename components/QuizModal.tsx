"use client";
import { useState } from "react";
import type { Quiz } from "@/types";

export default function QuizModal({ quiz, onClose }: { quiz: Quiz; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const choose = (i: number) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
  };

  const correct = selected === quiz.correct;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(15,23,42,.46)", backdropFilter: "blur(10px)" }}>
      <div className="w-full max-w-lg bg-white rounded-3xl p-7 shadow-2xl border border-white/80 max-h-[90vh] overflow-auto"
        style={{ background: "linear-gradient(180deg,#fff,#F8FAFC)" }}>
        <div className="flex gap-4 items-start mb-5">
          <div className="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-black text-white"
            style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)" }}>?</div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-blue-600 mb-1">Curiosity check</div>
            <div className="text-lg font-black tracking-tight">Pause and think</div>
            <div className="text-sm text-slate-500 font-semibold">One quick question before moving on.</div>
          </div>
        </div>

        <p className="text-base font-bold mb-4 text-slate-800">{quiz.question}</p>

        <div className="flex flex-col gap-2 mb-4">
          {quiz.options.map((opt, i) => {
            let bg = "bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300";
            if (answered) {
              if (i === quiz.correct) bg = "bg-green-50 border-green-400 text-green-800";
              else if (i === selected && !correct) bg = "bg-red-50 border-red-400 text-red-800";
              else bg = "bg-slate-50 border-slate-200 text-slate-400";
            }
            return (
              <button key={i} onClick={() => choose(i)}
                className={`text-left px-4 py-3 rounded-2xl border font-semibold text-sm cursor-pointer transition-all ${bg}`}>
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`rounded-2xl p-4 mb-4 text-sm font-semibold ${correct ? "bg-green-50 text-green-800 border border-green-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
            <strong>{correct ? "Correct!" : "Not quite."}</strong>{" "}
            {correct ? quiz.successMsg : quiz.wrongMsg}
            {correct && quiz.badge && (
              <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-black">{quiz.badge}</span>
            )}
          </div>
        )}

        {answered && (
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl text-white font-black text-sm cursor-pointer border-0"
            style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
