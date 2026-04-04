import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

const SUPPORTED_LOCALES = ["fr", "en", "de", "pt", "lb"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function detectLocale(url: string): Locale {
  for (const loc of SUPPORTED_LOCALES) {
    if (loc === "fr") continue; // default, no prefix
    if (url === `/${loc}` || url.startsWith(`/${loc}/`)) return loc;
  }
  return "fr";
}

export default getRequestConfig(async () => {
  const headersList = await headers();
  const url = headersList.get("x-url") || "";
  const locale = detectLocale(url);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
