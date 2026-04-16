import type { Metadata } from "next";
import { TransparenceClient } from "./client";

export const metadata: Metadata = {
  title: "Transparence du modèle d'estimation | tevaxia.lu",
  description:
    "Méthodologie, coefficients, sources et performance (MAPE, R²) du modèle hédonique d'estimation immobilière tevaxia. Résultats de back-test publics.",
};

export default function TransparencePage() {
  return <TransparenceClient />;
}
