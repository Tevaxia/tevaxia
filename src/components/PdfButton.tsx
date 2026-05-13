"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export function PdfButton({ onClick, label, generateBlob, filename }: { onClick?: () => void; label: string; generateBlob?: () => Promise<Blob>; filename?: string }) {
  const { user } = useAuth();
  const [showGate, setShowGate] = useState(false);

  const gatedAction = (action: () => void) => {
    if (user) {
      action();
    } else {
      setShowGate(true);
    }
  };

  const handlePreview = async () => {
    if (!generateBlob) return;
    // Ouvrir la fenêtre AVANT l'await pour éviter le popup blocker
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.title = "Génération du PDF...";
    const loadingP = win.document.createElement("p");
    loadingP.setAttribute("style", "font-family:sans-serif;padding:40px;color:#666");
    loadingP.textContent = "Génération du PDF en cours...";
    win.document.body.replaceChildren(loadingP);
    try {
      const blob = await generateBlob();
      const url = URL.createObjectURL(blob);
      win.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const container = win.document.createElement("div");
      container.setAttribute("style", "font-family:sans-serif;padding:40px");
      const title = win.document.createElement("p");
      title.setAttribute("style", "color:red;font-weight:bold");
      title.textContent = "Erreur lors de la génération du PDF";
      const pre = win.document.createElement("pre");
      pre.setAttribute("style", "color:#666;font-size:12px;margin-top:12px;white-space:pre-wrap");
      pre.textContent = msg;
      container.append(title, pre);
      win.document.body.replaceChildren(container);
      console.error("PDF generation error:", err);
    }
  };

  const handleDownload = async () => {
    if (generateBlob && filename) {
      const blob = await generateBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else if (onClick) {
      onClick();
    }
  };

  if (generateBlob) {
    return (
      <>
        <div className="inline-flex items-center rounded-lg border border-card-border shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => gatedAction(handlePreview)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-navy bg-white transition hover:bg-gray-50 active:scale-95 border-r border-card-border"
            title="Prévisualiser"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Prévisualiser
          </button>
          <button
            type="button"
            onClick={() => gatedAction(handleDownload)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-navy transition hover:bg-navy-light active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {label}
          </button>
        </div>

        {showGate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-sm rounded-xl border border-card-border bg-card p-6 shadow-xl">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <p className="text-sm text-muted">
                  Creez un compte gratuit pour telecharger vos rapports PDF
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <a
                  href="/connexion"
                  className="block w-full rounded-lg bg-navy-800 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-navy-700"
                >
                  Creer un compte
                </a>
                <button
                  type="button"
                  onClick={() => setShowGate(false)}
                  className="w-full rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-background"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => gatedAction(() => onClick?.())}
        className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-700 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        {label}
      </button>

      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-card-border bg-card p-6 shadow-xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <p className="text-sm text-muted">
                Creez un compte gratuit pour telecharger vos rapports PDF
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href="/connexion"
                className="block w-full rounded-lg bg-navy-800 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-navy-700"
              >
                Creer un compte
              </a>
              <button
                type="button"
                onClick={() => setShowGate(false)}
                className="w-full rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-background"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
