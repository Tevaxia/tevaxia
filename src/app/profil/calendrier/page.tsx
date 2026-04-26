"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/components/AuthProvider";
import CalendarSyncSection from "@/components/CalendarSyncSection";

function OAuthBanner() {
  const sp = useSearchParams();
  const status = sp.get("status");
  const provider = sp.get("provider");
  const message = sp.get("message");
  if (!status || !provider) return null;

  const providerLabel = provider === "google" ? "Google Calendar" : provider === "microsoft" ? "Outlook" : provider;

  if (status === "success") {
    return (
      <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        ✓ <strong>{providerLabel}</strong> connecté avec succès. La synchronisation bi-directionnelle sera active dès que les workers de sync seront déployés.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
      ✗ Erreur de connexion à <strong>{providerLabel}</strong>{message ? ` : ${message}` : ""}.
    </div>
  );
}

export default function CalendrierPage() {
  const { user } = useAuth();

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <nav className="text-xs text-muted">
          <Link href="/profil" className="hover:text-navy">
            ← Mon profil
          </Link>
        </nav>

        <h1 className="mt-4 text-2xl font-bold text-navy sm:text-3xl">
          Synchronisation calendrier
        </h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Récupérez vos tâches CRM et visites planifiées dans votre calendrier favori (Google Calendar, Outlook, Apple Calendar).
          Aucune installation, juste une URL d'abonnement à coller.
        </p>

        <Suspense fallback={null}>
          <OAuthBanner />
        </Suspense>

        <div className="mt-8">
          <CalendarSyncSection userId={user?.id || null} />
        </div>

        <div className="mt-10 rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Comment ça marche</h2>
          <ol className="mt-3 space-y-2.5 text-sm text-slate-700 list-decimal list-inside">
            <li>Cliquez sur <strong>« Générer une URL d'abonnement »</strong>. Un token aléatoire unique est créé pour vous.</li>
            <li>Copiez l'URL HTTPS générée.</li>
            <li>Dans <strong>Google Calendar</strong> : cliquez le bouton dédié, ou ouvrez les paramètres → « Ajouter un calendrier » → « À partir de l'URL ».</li>
            <li>Dans <strong>Outlook</strong> : Paramètres → Calendrier → Calendriers partagés → « Ajouter un calendrier » → « S'abonner à partir du Web ».</li>
            <li>Dans <strong>Apple Calendar</strong> : utilisez le lien <code className="text-xs">webcal://</code> ou Fichier → « S'abonner à un calendrier ».</li>
          </ol>
        </div>

        <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Quels événements sont synchronisés</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc list-inside">
            <li><strong>Tâches CRM</strong> : toutes vos tâches avec une échéance (status « à faire » ou « en cours »).</li>
            <li><strong>Visites</strong> : interactions de type « visite » planifiées dans le futur.</li>
            <li>Fenêtre temporelle : 7 jours dans le passé à 180 jours dans le futur.</li>
            <li>Pas de données personnelles client en clair, uniquement le titre et la description que vous avez saisis.</li>
          </ul>
        </div>

        <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Sécurité</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc list-inside">
            <li>Le token est aléatoire (128 bits), unique, et opaque. Sans le token, l'URL ne renvoie aucun événement.</li>
            <li>Vous pouvez révoquer un abonnement à tout moment (le calendrier externe arrêtera de se mettre à jour).</li>
            <li>Le serveur trace les accès (date du dernier appel, nombre total d'appels) pour détecter une fuite éventuelle.</li>
            <li>Aucune donnée personnelle client en clair dans le flux ICS — uniquement vos titres de tâche.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
