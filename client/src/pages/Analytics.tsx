import { trpc } from "@/lib/trpc";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from "recharts";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const RED = "oklch(0.55 0.22 27.33)";
const BLACK = "#141414";
const GRAY = "#888";

function StatCard({ label, labelEn, value, sub, trend }: {
  label: string;
  labelEn: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "flat";
}) {
  return (
    <div className="stat-card">
      <p className="swiss-label">{labelEn}</p>
      <div className="flex items-end gap-2 mt-1">
        <div className="swiss-number">{value}</div>
        {trend && (
          <div className={`mb-1 ${trend === 'up' ? 'text-[oklch(0.55_0.22_27.33)]' : trend === 'down' ? 'text-gray-400' : 'text-gray-300'}`}>
            {trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="swiss-label mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 p-3 shadow-sm">
      <p className="swiss-label mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = trpc.stats.summary.useQuery();
  const { data: trends, isLoading: trendsLoading } = trpc.stats.trends.useQuery();
  const { data: holeStats, isLoading: holeLoading } = trpc.stats.holeStats.useQuery();
  const { data: courses } = trpc.courses.list.useQuery();

  const trendData = trends?.map(r => {
    const course = courses?.find(c => c.id === r.courseId);
    return {
      date: format(new Date(r.playedAt), "MM/dd", { locale: zhTW }),
      score: r.totalScore,
      putts: r.totalPutts,
      gir: r.greensInRegulation,
      fairway: r.fairwaysTotal ? Math.round((r.fairwaysHit ?? 0) / r.fairwaysTotal * 100) : null,
      par: course?.par ?? 72,
    };
  }) ?? [];

  // Score distribution
  const scoreDist = [
    { label: "Eagle", count: 0, color: RED },
    { label: "Birdie", count: 0, color: RED },
    { label: "Par", count: 0, color: BLACK },
    { label: "Bogey", count: 0, color: GRAY },
    { label: "Double+", count: 0, color: "#ccc" },
  ];

  // Hole performance for heatmap
  const holeData = holeStats?.map(h => ({
    hole: `H${h.holeNumber}`,
    avgScore: parseFloat(h.avgScore.toFixed(2)),
    avgPutts: h.avgPutts ? parseFloat(h.avgPutts.toFixed(2)) : 0,
    girRate: h.girRate ? parseFloat((h.girRate * 100).toFixed(1)) : 0,
    count: h.count,
  })) ?? [];

  // Radar data for overall performance
  const radarData = [
    { subject: "桿數穩定性", A: stats?.avgScore ? Math.max(0, 100 - (stats.avgScore - 72) * 3) : 0 },
    { subject: "推桿效率", A: stats?.avgPutts ? Math.max(0, 100 - (stats.avgPutts - 30) * 2) : 0 },
    { subject: "球道命中", A: stats?.fairwayHitRate ? stats.fairwayHitRate * 100 : 0 },
    { subject: "上果嶺率", A: stats?.avgGir ? (stats.avgGir / 18) * 100 : 0 },
    { subject: "下場頻率", A: Math.min(100, (stats?.totalRounds ?? 0) * 5) },
  ];

  if (statsLoading || trendsLoading || holeLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-100 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100" />)}
          </div>
          <div className="h-64 bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="border-b-2 border-black pb-6 mb-8">
        <p className="swiss-label">DATA ANALYTICS</p>
        <h1 className="text-3xl font-black tracking-tight">數據分析</h1>
        <p className="text-sm text-gray-500 mt-1">基於 {stats?.totalRounds ?? 0} 場下場紀錄</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-gray-200 mb-8">
        <StatCard
          labelEn="AVG SCORE"
          label="平均桿數"
          value={stats?.avgScore?.toFixed(1) ?? "—"}
          sub={stats?.avgScore ? `vs Par: ${(stats.avgScore - 72) > 0 ? '+' : ''}${(stats.avgScore - 72).toFixed(1)}` : undefined}
        />
        <StatCard
          labelEn="BEST SCORE"
          label="最佳成績"
          value={stats?.bestScore?.toString() ?? "—"}
          trend="up"
        />
        <StatCard
          labelEn="AVG PUTTS"
          label="平均推桿"
          value={stats?.avgPutts?.toFixed(1) ?? "—"}
        />
        <StatCard
          labelEn="FAIRWAY HIT %"
          label="球道命中率"
          value={stats?.fairwayHitRate ? `${(stats.fairwayHitRate * 100).toFixed(0)}%` : "—"}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Score Trend */}
        <div className="border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <p className="swiss-label">SCORE TREND</p>
            <h3 className="font-black text-base">成績趨勢</h3>
          </div>
          <div className="p-5">
            {trendData.length < 2 ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                需要至少 2 場紀錄才能顯示趨勢
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: GRAY }} />
                  <YAxis tick={{ fontSize: 10, fill: GRAY }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={72} stroke={GRAY} strokeDasharray="4 4" label={{ value: "Par 72", fontSize: 9, fill: GRAY }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="桿數"
                    stroke={BLACK}
                    strokeWidth={2}
                    dot={{ fill: BLACK, r: 3 }}
                    activeDot={{ r: 5, fill: RED }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Putting Trend */}
        <div className="border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <p className="swiss-label">PUTTING TREND</p>
            <h3 className="font-black text-base">推桿趨勢</h3>
          </div>
          <div className="p-5">
            {trendData.filter(d => d.putts).length < 2 ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                需要更多推桿紀錄
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: GRAY }} />
                  <YAxis tick={{ fontSize: 10, fill: GRAY }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={36} stroke={GRAY} strokeDasharray="4 4" label={{ value: "36 putts", fontSize: 9, fill: GRAY }} />
                  <Line
                    type="monotone"
                    dataKey="putts"
                    name="推桿數"
                    stroke={RED}
                    strokeWidth={2}
                    dot={{ fill: RED, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Hole Performance Heatmap */}
        <div className="border border-gray-200 lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-200">
            <p className="swiss-label">HOLE PERFORMANCE</p>
            <h3 className="font-black text-base">各洞平均表現</h3>
          </div>
          <div className="p-5">
            {holeData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                需要更多下場紀錄才能顯示各洞分析
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={holeData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="hole" tick={{ fontSize: 9, fill: GRAY }} />
                  <YAxis tick={{ fontSize: 9, fill: GRAY }} domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgScore" name="平均桿數" radius={0}>
                    {holeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.avgScore > 5 ? RED : entry.avgScore > 4 ? GRAY : BLACK}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* GIR & Fairway Trend */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <p className="swiss-label">GIR TREND</p>
            <h3 className="font-black text-base">上果嶺率趨勢</h3>
          </div>
          <div className="p-5">
            {trendData.filter(d => d.gir !== null).length < 2 ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                需要更多 GIR 紀錄
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: GRAY }} />
                  <YAxis tick={{ fontSize: 10, fill: GRAY }} domain={[0, 18]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="gir" name="GIR 洞數" fill={BLACK} radius={0} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Performance Radar */}
        <div className="border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <p className="swiss-label">PERFORMANCE RADAR</p>
            <h3 className="font-black text-base">整體表現雷達圖</h3>
          </div>
          <div className="p-5">
            {(stats?.totalRounds ?? 0) === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                需要下場紀錄才能顯示
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e5e5" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: GRAY }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: GRAY }} />
                  <Radar
                    name="表現"
                    dataKey="A"
                    stroke={BLACK}
                    fill={BLACK}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Hole Stats Table */}
      {holeData.length > 0 && (
        <div className="border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <p className="swiss-label">HOLE-BY-HOLE STATS</p>
            <h3 className="font-black text-base">各洞詳細統計</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="swiss-table">
              <thead>
                <tr>
                  <th>洞號</th>
                  <th className="text-right">平均桿數</th>
                  <th className="text-right">平均推桿</th>
                  <th className="text-right">GIR 率</th>
                  <th className="text-right">紀錄次數</th>
                  <th className="text-right">難度評估</th>
                </tr>
              </thead>
              <tbody>
                {holeData.map(h => (
                  <tr key={h.hole}>
                    <td className="font-bold">{h.hole}</td>
                    <td className="text-right">
                      <span className={`font-bold ${h.avgScore > 5 ? 'text-[oklch(0.55_0.22_27.33)]' : h.avgScore > 4 ? 'text-gray-600' : 'text-black'}`}>
                        {h.avgScore.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right text-sm">{h.avgPutts > 0 ? h.avgPutts.toFixed(2) : "—"}</td>
                    <td className="text-right text-sm">{h.girRate > 0 ? `${h.girRate.toFixed(0)}%` : "—"}</td>
                    <td className="text-right text-sm text-gray-500">{h.count}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-4"
                            style={{
                              background: i < Math.round(h.avgScore - 3)
                                ? RED
                                : '#e5e5e5'
                            }}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
