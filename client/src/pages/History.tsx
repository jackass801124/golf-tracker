import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Filter, ArrowRight, Flag, Cloud, TrendingUp } from "lucide-react";

function getScoreColor(score: number, par: number) {
  const diff = score - par;
  if (diff <= -2) return "text-[oklch(0.55_0.22_27.33)] font-black";
  if (diff === -1) return "text-[oklch(0.55_0.22_27.33)] font-bold";
  if (diff === 0) return "text-black font-bold";
  if (diff === 1) return "text-gray-600 font-medium";
  return "text-gray-400 font-medium";
}

export default function History() {
  const [filterCourseId, setFilterCourseId] = useState<number | undefined>();
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: courses } = trpc.courses.list.useQuery();
  const { data: rounds, isLoading } = trpc.rounds.list.useQuery({
    courseId: filterCourseId,
    fromDate: filterFrom ? new Date(filterFrom) : undefined,
    toDate: filterTo ? new Date(filterTo) : undefined,
  });

  const clearFilters = () => {
    setFilterCourseId(undefined);
    setFilterFrom("");
    setFilterTo("");
  };

  const hasFilters = filterCourseId || filterFrom || filterTo;

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="border-b-2 border-black pb-6 mb-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="swiss-label">ROUND HISTORY</p>
            <h1 className="text-3xl font-black tracking-tight">歷史紀錄</h1>
            <p className="text-sm text-gray-500 mt-1">{rounds?.length ?? 0} 場下場紀錄</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-[0.1em] uppercase transition-colors ${
              showFilters || hasFilters
                ? 'bg-black text-white'
                : 'border border-gray-300 hover:border-black'
            }`}
          >
            <Filter size={12} />
            篩選 {hasFilters ? "●" : ""}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="border border-gray-200 p-4 mb-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="swiss-label block mb-1">球場</label>
              <select
                value={filterCourseId ?? ""}
                onChange={e => setFilterCourseId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
              >
                <option value="">全部球場</option>
                {courses?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="swiss-label block mb-1">開始日期</label>
              <input
                type="date"
                value={filterFrom}
                onChange={e => setFilterFrom(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="swiss-label block mb-1">結束日期</label>
              <input
                type="date"
                value={filterTo}
                onChange={e => setFilterTo(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs font-bold text-gray-400 hover:text-black transition-colors tracking-[0.08em] uppercase"
            >
              清除篩選條件
            </button>
          )}
        </div>
      )}

      {/* Rounds List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="border border-gray-200 p-5 animate-pulse">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 w-32" />
                  <div className="h-3 bg-gray-100 w-24" />
                </div>
                <div className="h-8 bg-gray-100 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : rounds?.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Flag size={24} className="text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-600 mb-1">
            {hasFilters ? "沒有符合條件的紀錄" : "尚無下場紀錄"}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            {hasFilters ? "請調整篩選條件" : "開始記錄您的第一場下場成績"}
          </p>
          {!hasFilters && (
            <Link href="/rounds/new">
              <a className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase">
                新增下場
              </a>
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-gray-200">
          {rounds?.map((round, idx) => {
            const course = courses?.find(c => c.id === round.courseId);
            const scoreDiff = round.totalScore && course ? round.totalScore - course.par : null;
            const weather = round.weatherData as { condition?: string; temperature?: number } | null;

            return (
              <Link key={round.id} href={`/rounds/${round.id}`}>
                <a className={`flex items-center justify-between p-5 hover:bg-gray-50 transition-colors ${
                  idx < (rounds?.length ?? 0) - 1 ? 'border-b border-gray-200' : ''
                }`}>
                  <div className="flex items-center gap-5">
                    {/* Date */}
                    <div className="text-center w-12 flex-shrink-0">
                      <div className="text-xl font-black leading-none">
                        {format(new Date(round.playedAt), "dd")}
                      </div>
                      <div className="swiss-label mt-0.5">
                        {format(new Date(round.playedAt), "MMM", { locale: zhTW })}
                      </div>
                      <div className="text-[0.6rem] text-gray-400">
                        {format(new Date(round.playedAt), "yyyy")}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-12 bg-gray-200" />

                    {/* Course & Details */}
                    <div>
                      <div className="font-black text-sm tracking-tight">{course?.name ?? "未知球場"}</div>
                      <div className="flex items-center gap-3 mt-1">
                        {course?.location && (
                          <span className="text-xs text-gray-400">{course.location}</span>
                        )}
                        {weather?.condition && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Cloud size={9} />
                            {weather.condition}
                            {weather.temperature && ` ${weather.temperature}°C`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        {round.totalPutts !== null && (
                          <span className="text-[0.65rem] text-gray-500">推桿 {round.totalPutts}</span>
                        )}
                        {round.fairwaysHit !== null && round.fairwaysTotal !== null && (
                          <span className="text-[0.65rem] text-gray-500">
                            球道 {round.fairwaysHit}/{round.fairwaysTotal}
                          </span>
                        )}
                        {round.greensInRegulation !== null && (
                          <span className="text-[0.65rem] text-gray-500">
                            GIR {round.greensInRegulation}/18
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Score */}
                    <div className="text-right">
                      {round.totalScore ? (
                        <>
                          <div className={`text-2xl font-black ${getScoreColor(round.totalScore, course?.par ?? 72)}`}>
                            {round.totalScore}
                          </div>
                          <div className="swiss-label">
                            {scoreDiff !== null && (scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff === 0 ? 'E' : `${scoreDiff}`)}
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-400 text-sm">未記錄</div>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-gray-300" />
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
