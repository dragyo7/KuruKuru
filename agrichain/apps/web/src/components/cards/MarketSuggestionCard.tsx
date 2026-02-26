import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { getMarketSuggestions, type MarketSuggestion } from "@/services/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const demandColor: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-agri-amber",
  high: "text-agri-green",
};

const MarketSuggestionCard = () => {
  const [data, setData] = useState<MarketSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // ML_RECOMMENDER_PERSONALIZATION
    getMarketSuggestions()
      .then(setData)
      .catch(() => setError("Failed to load market suggestions"))
      .finally(() => setLoading(false));
  }, []);

  const topItem = data[0];

  return (
    <DashboardCard
      title={t("dashboard.marketSuggestion.title")}
      icon={<MapPin className="h-5 w-5 text-agri-earth" />}
      accentColor="bg-agri-earth-light"
      loading={loading}
      error={error}
      confidence={topItem?.confidence}
      dataSource={topItem?.dataSource}
      lastUpdated={topItem?.lastUpdated}
      reason={topItem?.reason}
    >
      <ul className="space-y-2">
        {data.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
            <div>
              <span className="text-sm font-medium">{m.name}</span>
              <p className="text-xs text-muted-foreground">{m.distance} · {t("dashboard.marketSuggestion.bestFor", { crop: m.bestCrop })}</p>
            </div>
            <span className={cn("text-xs font-semibold uppercase", demandColor[m.demandLevel])}>
              {t("dashboard.marketSuggestion.demand", { level: m.demandLevel })}
            </span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
};

export default MarketSuggestionCard;
