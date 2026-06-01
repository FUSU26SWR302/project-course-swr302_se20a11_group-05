import { useState, useEffect } from "react";
import { CloudRain, RefreshCw, AlertTriangle, Wind, Thermometer, Droplets } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { weatherApi, type WeatherForecastResponse, type AlertLevel, type RiskLevel } from "@/lib/api";

const ALERT_CONFIG: Record<AlertLevel, { bg: string; border: string; text: string; icon: string }> = {
  NORMAL:  { bg: "bg-emerald-50",  border: "border-emerald-400", text: "text-emerald-700", icon: "🟢" },
  WATCH:   { bg: "bg-yellow-50",   border: "border-yellow-400",  text: "text-yellow-700",  icon: "🟡" },
  WARNING: { bg: "bg-orange-50",   border: "border-orange-400",  text: "text-orange-700",  icon: "🟠" },
  DANGER:  { bg: "bg-red-50",      border: "border-red-500",     text: "text-red-700",     icon: "🔴" },
};

const RISK_BADGE: Record<RiskLevel, string> = {
  LOW:      "bg-emerald-100 text-emerald-700",
  MEDIUM:   "bg-yellow-100  text-yellow-700",
  HIGH:     "bg-orange-100  text-orange-700",
  CRITICAL: "bg-red-100     text-red-700",
};

const INCIDENT_ICON: Record<string, string> = {
  FLOOD:       "🌊",
  FALLEN_TREE: "🌳",
  ROAD_DAMAGE: "🛣️",
  POWER_OUTAGE:"⚡",
};

export function WeatherForecastPanel() {
  const [forecast, setForecast] = useState<WeatherForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await weatherApi.getForecast();
      setForecast(data);
      setLastUpdated(new Date());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const alert = forecast ? ALERT_CONFIG[forecast.alertLevel] : ALERT_CONFIG.NORMAL;

  return (
    <div className="mt-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CloudRain size={22} className="text-gov-blue" />
          <h2 className="text-xl font-bold text-ink">Dự báo Thời tiết & Cảnh báo Sự cố Đô thị</h2>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-ink-soft">Cập nhật: {lastUpdated.toLocaleTimeString("vi-VN")}</span>
          )}
          <button onClick={load} disabled={loading} className="btn-civic btn-civic-ghost flex items-center gap-1.5 text-sm">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {loading && !forecast && (
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      )}

      {forecast && (
        <>
          <div className={`rounded-xl border-l-4 p-4 mb-6 ${alert.bg} ${alert.border}`}>
            <p className={`font-semibold text-sm ${alert.text}`}>{forecast.alertMessage}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="card-civic p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 grid place-items-center shrink-0">
                <Thermometer size={24} />
              </div>
              <div>
                <div className="text-xs text-ink-soft">Nhiệt độ hiện tại</div>
                <div className="text-2xl font-bold text-ink">{forecast.current.temperature}°C</div>
                <div className="text-xs text-slate-400 capitalize">{forecast.current.weatherDescription}</div>
              </div>
            </div>

            <div className="card-civic p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 grid place-items-center shrink-0">
                <CloudRain size={24} />
              </div>
              <div>
                <div className="text-xs text-ink-soft">Lượng mưa</div>
                <div className="text-2xl font-bold text-ink">{forecast.current.precipitation} mm</div>
              </div>
            </div>

            <div className="card-civic p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 grid place-items-center shrink-0">
                <Wind size={24} />
              </div>
              <div>
                <div className="text-xs text-ink-soft">Sức gió</div>
                <div className="text-2xl font-bold text-ink">{forecast.current.windspeed} km/h</div>
              </div>
            </div>

            <div className="card-civic p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 grid place-items-center shrink-0">
                <Droplets size={24} />
              </div>
              <div>
                <div className="text-xs text-ink-soft">Độ ẩm tương đối</div>
                <div className="text-2xl font-bold text-ink">{forecast.current.relativeHumidity}%</div>
              </div>
            </div>
          </div>

          {forecast.predictedHotspots && forecast.predictedHotspots.length > 0 && (
            <div className="card-civic p-5 border-t-4 border-[var(--status-danger)] mb-6 animate-slide-in-right">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-[var(--status-danger)]" />
                <h3 className="font-bold text-ink">Khu vực nguy cơ cao (Phân tích Dự báo AI)</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {forecast.predictedHotspots.map((p, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-ink text-sm">
                        {INCIDENT_ICON[p.incidentType]} {p.incidentLabel}
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${RISK_BADGE[p.riskLevel]}`}>
                        {p.riskLevel}
                      </span>
                    </div>
                    <div className="text-xs text-ink-soft mb-2">Phường/Xã: <span className="font-bold text-ink">{p.wardName}</span></div>
                    <p className="text-xs text-ink-soft leading-relaxed bg-white p-2 rounded border border-slate-100">
                      {p.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
