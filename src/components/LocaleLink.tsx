"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { localeFromPath, localizePath } from "@/lib/locale-path";

export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const locale = localeFromPath(usePathname());
  const localizedHref = typeof href === "string"
    ? localizePath(href, locale)
    : href.host || href.hostname || href.protocol
      ? href
      : { ...href, pathname: href.pathname ? localizePath(href.pathname, locale) : href.pathname };
  return <Link href={localizedHref} {...props} />;
}
