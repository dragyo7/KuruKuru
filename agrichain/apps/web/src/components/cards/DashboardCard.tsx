import React, { ReactNode, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Clock, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DashboardCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  accentColor?: string;
  className?: string;
  confidence?: number;
  dataSource?: string;
  lastUpdated?: string;
  reason?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title, icon, children, loading, error, accentColor, className,
  confidence, dataSource, lastUpdated, reason,
}) => {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", accentColor)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base font-semibold leading-tight font-sans">{title}</CardTitle>
          {!loading && (confidence != null || lastUpdated) && (
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {confidence != null && (
                <span className="text-xs font-medium text-primary">{confidence}% confidence</span>
              )}
              {lastUpdated && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            {children}
            {(dataSource || reason) && (
              <div className="mt-3 border-t pt-2 space-y-1.5">
                {dataSource && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Database className="h-3 w-3" /> {dataSource}
                  </span>
                )}
                {reason && (
                  <button
                    onClick={() => setShowWhy(!showWhy)}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors"
                  >
                    Why? {showWhy ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
                {showWhy && reason && (
                  <p className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-2">{reason}</p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
