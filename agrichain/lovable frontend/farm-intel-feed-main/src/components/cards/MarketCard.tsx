import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { getMarketPrices, type MarketPrice } from "@/services/api";
import { useTranslation } from "react-i18next";

const trendIcon = (trend: string) => {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-agri-green" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

const MarketCard = () => {
  const [data, setData] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // ML_INTEGRATION_POINT_PRICE
    // ML_PRICE_FORECAST_MODEL
    getMarketPrices()
      .then(setData)
      .catch(() => setError("Failed to load market data"))
      .finally(() => setLoading(false));
  }, []);

  const topItem = data[0];

  return (
    <DashboardCard
      title={t("dashboard.market.title")}
      icon={<TrendingUp className="h-5 w-5 text-agri-amber" />}
      accentColor="bg-agri-amber-light"
      loading={loading}
      error={error}
      confidence={topItem?.confidence}
      dataSource={topItem?.dataSource}
      lastUpdated={topItem?.lastUpdated}
      reason={topItem?.reason}
    >
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
            <div>
              <span className="text-sm font-medium">{item.crop}</span>
              <p className="text-xs text-muted-foreground">{item.unit}</p>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-sm font-semibold">{item.predictedPrice.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.market.from", { value: item.currentPrice.toLocaleString() })}</p>
              </div>
              {trendIcon(item.trend)}
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default MarketCard;
