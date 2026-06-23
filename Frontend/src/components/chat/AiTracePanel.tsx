import React from "react";
import { ChatIntent } from "@/lib/validations/chat.schema";
import { AlertCircle, FileText, CheckCircle2 } from "lucide-react";

interface AiTracePanelProps {
  intent: ChatIntent;
  latency?: number;
}

export function AiTracePanel({ intent, latency }: AiTracePanelProps) {
  return (
    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-700 w-full animate-fade-in-up">
      <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-1">
        <span className="font-semibold text-slate-900 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-gov-blue" />
          AI Trace Log
        </span>
        <span className="text-slate-500">{latency ? `${latency}ms` : "N/A"}</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex gap-2">
          <span className="font-medium text-slate-500 min-w-[70px]">Intent:</span>
          <span className="text-gov-blue font-semibold">{intent.intent}</span>
        </div>

        {intent.intent === "CREATE_FEEDBACK" && (
          <>
            <div className="flex gap-2">
              <span className="font-medium text-slate-500 min-w-[70px]">Category:</span>
              <span className="text-slate-800">{intent.category}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-slate-500 min-w-[70px]">Location:</span>
              <span className="text-slate-800">{intent.location || "N/A"}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-slate-500 min-w-[70px]">Confidence:</span>
              <span className={`font-semibold ${intent.confidence >= 0.8 ? "text-green-600" : "text-amber-600"}`}>
                {Math.round(intent.confidence * 100)}%
              </span>
            </div>
            {intent.needsMoreInfo.length > 0 && (
              <div className="flex gap-2">
                <span className="font-medium text-slate-500 min-w-[70px]">Missing:</span>
                <span className="text-red-500 font-semibold">{intent.needsMoreInfo.join(", ")}</span>
              </div>
            )}
          </>
        )}

        {intent.intent === "QA_LEGAL" && intent.citations && intent.citations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <span className="font-medium text-slate-500 flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3" />
              Citations Used:
            </span>
            <ul className="list-disc list-inside space-y-1">
              {intent.citations.map((cite, i) => (
                <li key={i} className="text-slate-600 truncate">
                  <a href={cite.url} target="_blank" rel="noreferrer" className="hover:underline hover:text-gov-blue">
                    {cite.doc} - {cite.article}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
