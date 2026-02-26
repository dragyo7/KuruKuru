import { useEffect, useState } from "react";
import { Wheat } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { getHarvestRecommendation, type HarvestRecommendation } from "@/services/api";
import { useTranslation } from "react-i18next";

const HarvestCard = () => {
  const [data, setData] = useState<HarvestRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // ML_INTEGRATION_POINT_HARVEST
    getHarvestRecommendation()
      .then(setData)
      .catch(() => setError("Failed to load harvest data"))
      .finally(() => setLoading(false));
  }, []);

  const topItem = data[0];

  return (
    <DashboardCard
      title={t("dashboard.harvest.title")}
      icon={<Wheat className="h-5 w-5 text-agri-green" />}
      accentColor="bg-agri-green-light"
      loading={loading}
      error={error}
      confidence={topItem?.confidence}
      dataSource={topItem?.dataSource}
      lastUpdated={topItem?.lastUpdated}
      reason={topItem?.reason}
    >
      {/* ML_HARVEST_MODEL_OUTPUT */}
      <ul className="space-y-3">
        {data.map((item) => (
          <li key={item.id} className="rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{item.crop}</span>
              <span className="text-xs font-semibold text-primary">{t("dashboard.harvest.match", { value: item.confidence })}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("dashboard.harvest.plant")}: {item.plantWindow} · {t("dashboard.harvest.harvest")}: {item.harvestWindow}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.reason}</p>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
};

export default HarvestCard;
