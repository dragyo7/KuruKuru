import { useTranslation } from "react-i18next";
import HarvestCard from "@/components/cards/HarvestCard";
import MarketCard from "@/components/cards/MarketCard";
import WeatherCard from "@/components/cards/WeatherCard";
import SpoilageCard from "@/components/cards/SpoilageCard";
import MarketSuggestionCard from "@/components/cards/MarketSuggestionCard";

const Home = () => {
  const { t } = useTranslation();

  return (
    <main className="container py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold mb-1">{t("dashboard.title")}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t("dashboard.subtitle")}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HarvestCard />
        <MarketCard />
        <WeatherCard />
        <SpoilageCard />
        <MarketSuggestionCard />
      </div>
    </main>
  );
};

export default Home;
