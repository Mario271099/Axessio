import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE, detectLocaleFromHeader, isLocale } from "./config";

// Lu pour chaque requête : sélectionne la locale depuis le cookie partagé.
// Sans cookie (tout premier chargement), on détecte la langue du navigateur
// via Accept-Language - le proxy pose le cookie correspondant en parallèle,
// donc les requêtes suivantes passent par la branche cookie.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieValue)
    ? cookieValue
    : detectLocaleFromHeader((await headers()).get("accept-language"));

  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
