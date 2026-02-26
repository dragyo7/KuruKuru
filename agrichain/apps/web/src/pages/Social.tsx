import { useTranslation } from "react-i18next";
import Feed from "@/components/social/Feed";

const Social = () => {
  const { t } = useTranslation();

  return (
    <main className="container max-w-lg py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold mb-1">{t("social.title")}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t("social.subtitle")}</p>
      <Feed />
    </main>
  );
};

export default Social;
