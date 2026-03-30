"use client";

export default function LanguageSwitcher() {
  const switchLocale = (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    window.location.reload();
  };

  // Lire la locale actuelle depuis le cookie
  const currentLocale = typeof document !== "undefined"
    ? (document.cookie.match(/locale=(\w+)/)?.[1] || "fr")
    : "fr";

  return (
    <div className="flex gap-0.5 rounded-lg bg-white/10 p-0.5">
      <button
        onClick={() => switchLocale("fr")}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          currentLocale === "fr" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
        }`}
      >
        FR
      </button>
      <button
        onClick={() => switchLocale("en")}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          currentLocale === "en" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}
