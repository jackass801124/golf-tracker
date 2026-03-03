import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ArrowLeft, Cloud, Image, Bot, Trash2, Download } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { Streamdown } from "streamdown";

function getScoreClass(score: number, par: number) {
  const diff = score - par;
  if (diff <= -2) return "score-eagle-bg";
  if (diff === -1) return "score-birdie-bg";
  if (diff === 0) return "score-par-bg";
  if (diff === 1) return "score-bogey-bg";
  return "score-double-bg";
}

export default function RoundDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const roundId = parseInt(params.id ?? "0");
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const { data: round, isLoading, refetch } = trpc.rounds.getById.useQuery({ id: roundId });
  const { data: courses } = trpc.courses.list.useQuery();
  const utils = trpc.useUtils();

  const weatherMutation = trpc.weather.getForRound.useMutation({
    onSuccess: (data) => {
      if (data) {
        toast.success(`天氣資料已取得：${data.condition}`);
        refetch();
      }
    },
  });

  const aiMutation = trpc.ai.analyze.useMutation({
    onSuccess: (data) => {
      setAiAnalysis(data.analysis);
      toast.success("AI 分析完成");
    },
    onError: () => toast.error("AI 分析失敗"),
  });

  const imageMutation = trpc.scorecard.generateImage.useMutation({
    onSuccess: (data) => {
      toast.success("成績卡圖片已生成");
      refetch();
    },
    onError: () => toast.error("圖片生成失敗"),
  });

  const deleteMutation = trpc.rounds.delete.useMutation({
    onSuccess: () => {
      utils.rounds.list.invalidate();
      utils.stats.summary.invalidate();
      toast.success("下場紀錄已刪除");
      navigate("/history");
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 w-48" />
          <div className="h-4 bg-gray-100 w-32" />
          <div className="h-32 bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">找不到此下場紀錄</p>
        <Link href="/history"><a className="text-sm font-bold underline mt-2 block">返回歷史紀錄</a></Link>
      </div>
    );
  }

  const course = courses?.find(c => c.id === round.courseId);
  const holes = round.holes ?? [];
  const totalPar = holes.reduce((s, h) => s + h.par, 0);
  const scoreDiff = (round.totalScore ?? 0) - totalPar;
  const weather = round.weatherData as { temperature?: number; windSpeed?: number; condition?: string; precipitation?: number } | null;

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="border-b-2 border-black pb-6 mb-8">
        <Link href="/history">
          <a className="flex items-center gap-1 text-xs font-bold tracking-[0.08em] uppercase text-gray-400 hover:text-black mb-4 transition-colors">
            <ArrowLeft size={12} /> 返回歷史紀錄
          </a>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <p className="swiss-label">ROUND DETAIL</p>
            <h1 className="text-3xl font-black tracking-tight">{course?.name ?? "未知球場"}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(round.playedAt), "yyyy年 MM月 dd日 EEEE", { locale: zhTW })}
            </p>
          </div>
          <div className="text-right">
            <p className="swiss-label">SCORE</p>
            <div className={`swiss-number-lg ${scoreDiff <= 0 ? 'text-[oklch(0.55_0.22_27.33)]' : ''}`}>
              {round.totalScore ?? "—"}
            </div>
            <div className="text-sm font-bold text-gray-500">
              {scoreDiff > 0 ? '+' : ''}{scoreDiff} vs Par {totalPar}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-gray-200 mb-8">
        {[
          { label: "推桿數", labelEn: "PUTTS", value: round.totalPutts?.toString() ?? "—" },
          { label: "球道命中", labelEn: "FAIRWAYS", value: round.fairwaysHit !== null ? `${round.fairwaysHit}/${round.fairwaysTotal}` : "—" },
          { label: "上果嶺率", labelEn: "GIR", value: round.greensInRegulation !== null ? `${round.greensInRegulation}/18` : "—" },
          { label: "天氣", labelEn: "WEATHER", value: weather?.condition ?? "—" },
        ].map((s, i) => (
          <div key={i} className="stat-card border-r border-gray-200 last:border-r-0 border-b-0">
            <p className="swiss-label">{s.labelEn}</p>
            <div className="text-2xl font-black mt-1">{s.value}</div>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Scorecard */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <p className="swiss-label">SCORECARD</p>
            <h2 className="text-lg font-black">成績卡</h2>
          </div>

          {holes.length > 0 ? (
            <div className="border border-gray-200 overflow-x-auto">
              {/* Front 9 */}
              <table className="swiss-table min-w-full">
                <thead>
                  <tr>
                    <th>洞</th>
                    {holes.slice(0, 9).map(h => <th key={h.holeNumber} className="text-center w-10">{h.holeNumber}</th>)}
                    <th className="text-center">前9</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="swiss-label">PAR</td>
                    {holes.slice(0, 9).map(h => <td key={h.holeNumber} className="text-center text-xs text-gray-500">{h.par}</td>)}
                    <td className="text-center font-bold text-sm">{holes.slice(0, 9).reduce((s, h) => s + h.par, 0)}</td>
                  </tr>
                  <tr>
                    <td className="swiss-label">SCORE</td>
                    {holes.slice(0, 9).map(h => (
                      <td key={h.holeNumber} className="text-center py-2">
                        <span className={`inline-flex w-7 h-7 items-center justify-center text-xs font-black ${getScoreClass(h.score, h.par)}`}>
                          {h.score}
                        </span>
                      </td>
                    ))}
                    <td className="text-center font-black">{holes.slice(0, 9).reduce((s, h) => s + h.score, 0)}</td>
                  </tr>
                  <tr>
                    <td className="swiss-label">PUTTS</td>
                    {holes.slice(0, 9).map(h => <td key={h.holeNumber} className="text-center text-xs text-gray-500">{h.putts ?? "—"}</td>)}
                    <td className="text-center text-sm font-bold">{holes.slice(0, 9).reduce((s, h) => s + (h.putts ?? 0), 0)}</td>
                  </tr>
                </tbody>
              </table>
              {/* Back 9 */}
              <table className="swiss-table min-w-full border-t-2 border-black">
                <thead>
                  <tr>
                    <th>洞</th>
                    {holes.slice(9).map(h => <th key={h.holeNumber} className="text-center w-10">{h.holeNumber}</th>)}
                    <th className="text-center">後9</th>
                    <th className="text-center">總計</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="swiss-label">PAR</td>
                    {holes.slice(9).map(h => <td key={h.holeNumber} className="text-center text-xs text-gray-500">{h.par}</td>)}
                    <td className="text-center font-bold text-sm">{holes.slice(9).reduce((s, h) => s + h.par, 0)}</td>
                    <td className="text-center font-black">{totalPar}</td>
                  </tr>
                  <tr>
                    <td className="swiss-label">SCORE</td>
                    {holes.slice(9).map(h => (
                      <td key={h.holeNumber} className="text-center py-2">
                        <span className={`inline-flex w-7 h-7 items-center justify-center text-xs font-black ${getScoreClass(h.score, h.par)}`}>
                          {h.score}
                        </span>
                      </td>
                    ))}
                    <td className="text-center font-black">{holes.slice(9).reduce((s, h) => s + h.score, 0)}</td>
                    <td className="text-center font-black text-lg">{round.totalScore}</td>
                  </tr>
                  <tr>
                    <td className="swiss-label">PUTTS</td>
                    {holes.slice(9).map(h => <td key={h.holeNumber} className="text-center text-xs text-gray-500">{h.putts ?? "—"}</td>)}
                    <td className="text-center text-sm font-bold">{holes.slice(9).reduce((s, h) => s + (h.putts ?? 0), 0)}</td>
                    <td className="text-center font-black">{round.totalPutts}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-gray-200 p-8 text-center text-gray-400 text-sm">
              尚未輸入每洞成績
            </div>
          )}

          {/* AI Analysis */}
          {(aiAnalysis || round.aiAnalysis) && (
            <div className="mt-6 border border-gray-200">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
                <Bot size={14} />
                <p className="swiss-label">AI COACH ANALYSIS</p>
              </div>
              <div className="p-4">
                <Streamdown className="text-sm leading-relaxed prose prose-sm max-w-none">
                  {aiAnalysis ?? round.aiAnalysis ?? ""}
                </Streamdown>
              </div>
            </div>
          )}
        </div>

        {/* Actions & Weather */}
        <div>
          <div className="mb-4">
            <p className="swiss-label">ACTIONS</p>
            <h2 className="text-lg font-black">操作</h2>
          </div>

          <div className="space-y-2 mb-6">
            <button
              onClick={() => weatherMutation.mutate({ roundId })}
              disabled={weatherMutation.isPending}
              className="w-full flex items-center gap-3 border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
            >
              <div className="w-7 h-7 bg-gray-100 flex items-center justify-center">
                <Cloud size={13} className="text-gray-600" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.05em] uppercase">取得天氣資料</div>
                <div className="text-[0.65rem] text-gray-400">下場當日天氣</div>
              </div>
            </button>

            <button
              onClick={() => aiMutation.mutate({ roundId })}
              disabled={aiMutation.isPending}
              className="w-full flex items-center gap-3 border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
            >
              <div className="w-7 h-7 bg-black flex items-center justify-center">
                <Bot size={13} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.05em] uppercase">
                  {aiMutation.isPending ? "分析中..." : "AI 教練分析"}
                </div>
                <div className="text-[0.65rem] text-gray-400">個人化改善建議</div>
              </div>
            </button>

            <button
              onClick={() => imageMutation.mutate({ roundId })}
              disabled={imageMutation.isPending}
              className="w-full flex items-center gap-3 border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
            >
              <div className="w-7 h-7 bg-[oklch(0.55_0.22_27.33)] flex items-center justify-center">
                <Image size={13} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.05em] uppercase">
                  {imageMutation.isPending ? "生成中..." : "生成成績卡圖片"}
                </div>
                <div className="text-[0.65rem] text-gray-400">AI 生成分享圖片</div>
              </div>
            </button>

            <button
              onClick={() => {
                if (confirm("確定要刪除此下場紀錄嗎？")) {
                  deleteMutation.mutate({ id: roundId });
                }
              }}
              disabled={deleteMutation.isPending}
              className="w-full flex items-center gap-3 border border-red-200 px-4 py-3 hover:bg-red-50 transition-colors disabled:opacity-50 text-left"
            >
              <div className="w-7 h-7 bg-red-100 flex items-center justify-center">
                <Trash2 size={13} className="text-red-500" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.05em] uppercase text-red-600">刪除紀錄</div>
                <div className="text-[0.65rem] text-gray-400">永久刪除此下場紀錄</div>
              </div>
            </button>
          </div>

          {/* Weather Detail */}
          {weather && (
            <div className="border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <p className="swiss-label">WEATHER CONDITIONS</p>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { label: "天氣狀況", value: weather.condition },
                  { label: "氣溫", value: weather.temperature ? `${weather.temperature}°C` : "—" },
                  { label: "風速", value: weather.windSpeed ? `${weather.windSpeed} km/h` : "—" },
                  { label: "降雨量", value: weather.precipitation ? `${weather.precipitation} mm` : "0 mm" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="swiss-label">{item.label}</span>
                    <span className="text-sm font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scorecard Image */}
          {round.scorecardImageUrl && (
            <div className="mt-4 border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <p className="swiss-label">SCORECARD IMAGE</p>
                <a
                  href={round.scorecardImageUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black"
                >
                  <Download size={10} /> 下載
                </a>
              </div>
              <img
                src={round.scorecardImageUrl}
                alt="成績卡"
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
