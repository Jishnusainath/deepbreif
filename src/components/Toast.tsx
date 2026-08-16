import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string | null;
  type?: "info" | "error";
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  onClose,
}) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 shadow-2xl text-xs font-medium backdrop-blur-md">
        {type === "error" ? (
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};
