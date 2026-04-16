"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface UseAIReturn {
  analyze: (context: string, prompt: string) => Promise<string>;
  loading: boolean;
  error: string | null;
  remaining: number | null; // null = unknown, -1 = unlimited (BYOK)
}

export function useAI(): UseAIReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const analyze = useCallback(async (context: string, prompt: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      // Get current session token for auth
      let token: string | null = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token ?? null;
      }

      if (!token) {
        throw new Error("Vous devez être connecté pour utiliser l'analyse IA.");
      }

      const res = await fetch("/api/v1/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ context, prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }

      if (typeof data.remaining === "number") {
        setRemaining(data.remaining);
      }

      return data.text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyze, loading, error, remaining };
}
