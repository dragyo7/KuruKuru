import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { getSpoilageRisks, type SpoilageRisk } from "@/services/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const riskBadge: Record<string, string> = {
  low: "bg-agri-green-light text-agri-green",
  medium: "bg-agri-amber-light text-agri-amber",
  high: "bg-agri-red-light text-agri-red",
};

const SpoilageCard = () => {
  const [data, setData] = useState<SpoilageRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // ML_RISK_SCORING
    getSpoilageRisks()
      .then(setData)
      .catch(() => setError("Failed to load spoilage data"))
      .finally(() => setLoading(false));
  }, []);

  const topItem = data[0];

  return (
    <DashboardCard
      title={t("dashboard.spoilage.title")}
      icon={<Package className="h-5 w-5 text-agri-red" />}
      accentColor="bg-agri-red-light"
      loading={loading}
      error={error}
      confidence={topItem?.confidence}
      dataSource={topItem?.dataSource}
      lastUpdated={topItem?.lastUpdated}
      reason={topItem?.reason}
    >
      <ul className="space-y-2">
        {data.map((item, i) => (
          <li key={i} className="rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.product}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold uppercase", riskBadge[item.riskLevel])}>
                {item.riskLevel}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.spoilage.daysRemaining", { count: item.daysRemaining })}</p>
            <p className="text-xs text-muted-foreground">{item.recommendation}</p>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
};

export default SpoilageCard;
