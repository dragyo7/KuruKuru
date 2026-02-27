import { useEffect, useState } from "react";
import { CloudRain, Thermometer, Droplets } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { getWeatherRisk, type WeatherRisk } from "@/services/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const levelColor: Record<string, string> = {
  low: "bg-agri-green-light text-agri-green",
  medium: "bg-agri-amber-light text-agri-amber",
  high: "bg-agri-red-light text-agri-red",
};

const WeatherCard = () => {
  const [data, setData] = useState<WeatherRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    getWeatherRisk()
      .then(setData)
      .catch(() => setError("Failed to load weather data"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardCard
      title={t("dashboard.weather.title")}
      icon={<CloudRain className="h-5 w-5 text-agri-sky" />}
      accentColor="bg-agri-sky-light"
      loading={loading}
      error={error}
      confidence={data?.confidence}
      dataSource={data?.dataSource}
      lastUpdated={data?.lastUpdated}
      reason={data?.reason}
    >
      {data && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase", levelColor[data.level])}>
              {t("dashboard.weather.risk", { level: data.level })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{data.summary}</p>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1"><Thermometer className="h-3.5 w-3.5" />{data.temperature}°C</span>
            <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" />{data.humidity}%</span>
          </div>
          {data.alerts.length > 0 && (
            <ul className="space-y-1">
              {data.alerts.map((a, i) => (
                <li key={i} className="rounded border-l-2 border-secondary bg-muted/40 px-3 py-1.5 text-xs">{a}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </DashboardCard>
  );
};

export default WeatherCard;
