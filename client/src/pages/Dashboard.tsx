import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { PlusCircle, TrendingUp, Target, Activity, Flag, ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

function ScoreBadge({ score, par }: { score: number; par: number }) {
  const diff = score - par;
  if (diff <= -2) return <span className="score-eagle-bg px-2 py-0.5 text-xs font-bold">Eagle</span>;
  if (diff === -1) return <span className="score-birdie-bg px-2 py-0.5 text-xs font-bold">Birdie</span>;
  if (diff === 0) return <span className="score-par-bg px-2 py-0.5 text-xs font-bold">Par</span>;
  if (diff === 1) return <span className="score-bogey-bg px-2 py-0.5 text-xs font-bold">Bogey</span>;
  return <span className="score-double-bg px-2 py-0.5 text-xs font-bold">+{diff}</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.stats.summary.useQuery();
  const { data: rounds } = trpc.rounds.list.useQuery();
  const { data: courses } = trpc.courses.list.useQuery();

  const recentRounds = rounds?.slice(0, 5) ?? [];

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="border-b-2 border-black pb-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="swiss-label mb-1">WELCOME BACK</p>
            <h1 className="text-3xl font-black tracking-tight">{user?.name ?? "球員"}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(), "yyyy年 MM月 dd日 EEEE", { locale: zhTW })}
            </p>
          </div>
          <Link href="/rounds/new">
            <a className="flex items-center gap-2 bg-black text-white px-4 py-2.5 text-xs font-bold tracking-[0.1em] uppercase hover:bg-gray-800 transition-colors">
              <PlusCircle size={14} />
              新增下場
            </a>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-gray-200 mb-8">
        {[
          {
            label: "平均桿數",
            labelEn: "AVG SCORE",
            value: stats?.avgScore?.toFixed(1) ?? "—",
            icon: Activity,
            loading: isLoading,
          },
          {
            label: "最佳成績",
            labelEn: "BEST SCORE",
            value: stats?.bestScore?.toString() ?? "—",
            icon: Target,
            loading: isLoading,
          },
          {
            label: "下場次數",
            labelEn: "TOTAL ROUNDS",
            value: stats?.totalRounds?.toString() ?? "0",
            icon: Flag,
            loading: isLoading,
          },
          {
            label: "球道命中率",
            labelEn: "FAIRWAY HIT",
            value: stats?.fairwayHitRate ? `${(stats.fairwayHitRate * 100).toFixed(0)}%` : "—",
            icon: TrendingUp,
            loading: isLoading,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="stat-card border-r border-gray-200 last:border-r-0 border-b-0"
          >
            <p className="swiss-label mb-2">{stat.labelEn}</p>
            {stat.loading ? (
              <div className="h-8 w-16 bg-gray-100 animate-pulse" />
            ) : (
              <div className="swiss-number">{stat.value}</div>
            )}
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Rounds */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="swiss-label">RECENT ROUNDS</p>
              <h2 className="text-lg font-black tracking-tight">最近下場紀錄</h2>
            </div>
            <Link href="/history">
              <a className="flex items-center gap-1 text-xs font-bold tracking-[0.08em] uppercase text-gray-400 hover:text-black transition-colors">
                查看全部 <ArrowRight size={12} />
              </a>
            </Link>
          </div>

          <div className="border border-gray-200">
            {recentRounds.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Flag size={20} className="text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-600 mb-1">尚無下場紀錄</p>
                <p className="text-xs text-gray-400 mb-4">開始記錄您的第一場下場成績</p>
                <Link href="/rounds/new">
                  <a className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase">
                    <PlusCircle size={12} />
                    新增下場
                  </a>
                </Link>
              </div>
            ) : (
              <table className="swiss-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>球場</th>
                    <th className="text-right">總桿</th>
                    <th className="text-right">推桿</th>
                    <th className="text-right">GIR</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRounds.map(round => {
                    const course = courses?.find(c => c.id === round.courseId);
                    return (
                      <tr key={round.id} className="cursor-pointer">
                        <td>
                          <Link href={`/rounds/${round.id}`}>
                            <a className="block">
                              <div className="text-xs font-bold">{format(new Date(round.playedAt), "MM/dd")}</div>
                              <div className="text-[0.65rem] text-gray-400">{format(new Date(round.playedAt), "yyyy")}</div>
                            </a>
                          </Link>
                        </td>
                        <td>
                          <Link href={`/rounds/${round.id}`}>
                            <a className="block text-xs font-medium">{course?.name ?? "未知球場"}</a>
                          </Link>
                        </td>
                        <td className="text-right">
                          {round.totalScore ? (
                            <ScoreBadge score={round.totalScore} par={course?.par ?? 72} />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="text-right text-xs">{round.totalPutts ?? "—"}</td>
                        <td className="text-right text-xs">{round.greensInRegulation ?? "—"}/18</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <div className="mb-4">
            <p className="swiss-label">PERFORMANCE</p>
            <h2 className="text-lg font-black tracking-tight">表現指標</h2>
          </div>

          <div className="space-y-0 border border-gray-200">
            {[
              { label: "平均推桿", labelEn: "AVG PUTTS", value: stats?.avgPutts?.toFixed(1) ?? "—" },
              { label: "平均 GIR", labelEn: "AVG GIR", value: stats?.avgGir ? `${stats.avgGir.toFixed(1)}/18` : "—" },
              { label: "球場數量", labelEn: "COURSES", value: courses?.length?.toString() ?? "0" },
            ].map((item, i) => (
              <div key={i} className="px-4 py-3 border-b border-gray-200 last:border-b-0 flex items-center justify-between">
                <div>
                  <p className="swiss-label">{item.labelEn}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
                <div className="text-xl font-black">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <p className="swiss-label mb-3">QUICK ACTIONS</p>
            <div className="space-y-2">
              <Link href="/rounds/new">
                <a className="flex items-center justify-between w-full border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-black flex items-center justify-center">
                      <PlusCircle size={13} className="text-white" />
                    </div>
                    <span className="text-xs font-bold tracking-[0.05em] uppercase">新增下場紀錄</span>
                  </div>
                  <ArrowRight size={12} className="text-gray-400 group-hover:text-black transition-colors" />
                </a>
              </Link>
              <Link href="/analytics">
                <a className="flex items-center justify-between w-full border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-[oklch(0.55_0.22_27.33)] flex items-center justify-center">
                      <TrendingUp size={13} className="text-white" />
                    </div>
                    <span className="text-xs font-bold tracking-[0.05em] uppercase">查看數據分析</span>
                  </div>
                  <ArrowRight size={12} className="text-gray-400 group-hover:text-black transition-colors" />
                </a>
              </Link>
              <Link href="/ai">
                <a className="flex items-center justify-between w-full border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-gray-800 flex items-center justify-center">
                      <Calendar size={13} className="text-white" />
                    </div>
                    <span className="text-xs font-bold tracking-[0.05em] uppercase">AI 教練建議</span>
                  </div>
                  <ArrowRight size={12} className="text-gray-400 group-hover:text-black transition-colors" />
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
