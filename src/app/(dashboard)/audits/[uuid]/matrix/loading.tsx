import { getTranslations } from "next-intl/server";
import { BrandLoader } from "@/components/ui/brand-loader";

export default async function MatrixLoading() {
  const t = await getTranslations("common");
  return <BrandLoader label={t("loading")} />;
}
