import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import {
  Bus,
  Users,
  Map,
  Gauge,
//   User,
  TrendingUp,
  Activity,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */

type Summary = {
  buses: number;
  drivers: number;
  passengers: number;
  distance: number;
  speed: number;
};

type BusAnalytics = {
  name: string;
  passengers: number;
  distance: number;
  speed: number;
};

type ApiResponse = {
  success: boolean;
  data: {
    summary: Summary;
    buses: BusAnalytics[];
  };
};

type FilterType = "today" | "week" | "month";

/* ================= TOOLTIP ================= */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#0b1220] border border-[#22304d] rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>

      {payload.map((p: any, i: number) => (
        <div key={i} className="flex justify-between gap-4 text-sm">
          <span className="text-gray-400">{p.name}</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ================= MAIN ================= */

export default function OperatorAnalytics() {
  const { token } = useAuth();

  const [filter, setFilter] = useState<FilterType>("today");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [buses, setBuses] = useState<BusAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const res = await fetch(
        `${API_URL}/operator/analytics?filter=${filter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result: ApiResponse = await res.json();

      setSummary(result.data.summary);
      setBuses(result.data.buses);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchData(false);

    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, [filter, token]);

  const avgPassengersPerBus =
    summary?.buses ? Math.round(summary.passengers / summary.buses) : 0;

  const fleetEfficiency = summary?.buses
    ? (summary.distance / summary.buses).toFixed(2)
    : 0;

  const mostActiveBus = buses.length
    ? buses.reduce((max, b) =>
        b.passengers > (max?.passengers || 0) ? b : max
      )
    : null;

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">
          Analytics Section
        </h1>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="bg-[#111a2e] border border-[#22304d] px-4 py-2 rounded-lg"
        >
          <option value="today">Today</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>

      {loading && <p className="text-gray-400">Loading...</p>}

      {!loading && summary && (
        <>
          {/* KPI */}
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            <KPI icon={<Bus size={32} />} label="Buses" value={summary.buses} />
            {/* <KPI icon={<User size={32} />} label="Drivers" value={summary.drivers} /> */}
            <KPI icon={<Users size={32} />} label="Passengers" value={summary.passengers} />
            <KPI icon={<Map size={32} />} label="Distance" value={`${summary.distance} km`} />
            <KPI icon={<Gauge size={32} />} label="Speed" value={summary.speed} />
            <KPI icon={<TrendingUp size={32} />} label="Efficiency" value={`${fleetEfficiency} km/bus`} />
          </div>

          {/* CHARTS */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">

            {/* PASSENGERS */}
            <Card title="Passenger Distribution" icon={<Users size={16} />}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={buses} barSize={30}>
                  <CartesianGrid stroke="#1f2a44" opacity={0.4} />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />

                  <Bar
                    dataKey="passengers"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                    activeBar={{
                      fill: "#60a5fa",
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* DISTANCE */}
            <Card title="Fleet Movement" icon={<Map size={16} />}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={buses}>
                  <CartesianGrid stroke="#1f2a44" opacity={0.4} />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />

                  <Line
                    type="monotone"
                    dataKey="distance"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* BOTTOM */}
          <div className="grid md:grid-cols-3 gap-6">

            <Card title="Speed Monitoring" icon={<Gauge size={16} />}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={buses}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />

                  <Bar
                    dataKey="speed"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Avg Passengers" icon={<Activity size={16} />}>
              <div className="text-center mt-16">
                <div className="text-4xl font-bold text-blue-400 animate-pulse">
                  {avgPassengersPerBus}
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  per bus average
                </p>
              </div>
            </Card>

            <Card title="Most Active Bus" icon={<TrendingUp size={16} />}>
              <div className="text-center mt-12">
                <p className="text-lg font-semibold">
                  {mostActiveBus?.name || "N/A"}
                </p>
                <p className="text-gray-400">
                  {mostActiveBus?.passengers || 0} passengers
                </p>
              </div>
            </Card>

          </div>
        </>
      )}
    </div>
  );
}

/* ================= COMPONENTS ================= */

function KPI({ icon, label, value }: any) {
  return (
    <div className="bg-[#111a2e] border border-[#22304d] p-4 rounded-xl flex items-center gap-3 hover:scale-[1.03] transition">
      <div className="text-blue-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: any) {
  return (
    <div className="bg-[#0b1220] border border-[#22304d] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4 text-gray-300">
        <span className="text-blue-400">{icon}</span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}