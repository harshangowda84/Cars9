"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#080b11] text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black">Something went wrong</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A temporary client exception occurred while rendering this view. You can reload the section or return to the main studio catalog.
          </p>
        </div>

        {error?.message && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-mono text-left overflow-x-auto max-h-32">
            <span className="font-bold block mb-1">Diagnostic Detail:</span>
            <span>{error.message}</span>
            {error.digest && <span className="block opacity-60 text-[10px] mt-1">Digest: {error.digest}</span>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
