import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Mic, MicOff, Save, Check, X, Flag, Cloud } from "lucide-react";
import { format } from "date-fns";

type FairwayHit = "hit" | "left" | "right" | "na";

interface HoleData {
  holeNumber: number;
  par: number;
  score: number;
  putts: number;
  fairwayHit: FairwayHit;
  greenInRegulation: boolean;
  penalties: number;
  notes: string;
}

function getScoreClass(score: number, par: number) {
  const diff = score - par;
  if (diff <= -2) return "score-eagle-bg";
  if (diff === -1) return "score-birdie-bg";
  if (diff === 0) return "score-par-bg";
  if (diff === 1) return "score-bogey-bg";
  return "score-double-bg";
}

function getScoreLabel(score: number, par: number) {
  const diff = score - par;
  if (diff <= -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Double";
  return `+${diff}`;
}

function HoleInput({
  hole,
  onChange,
}: {
  hole: HoleData;
  onChange: (data: Partial<HoleData>) => void;
}) {
  const diff = hole.score - hole.par;
  const scoreLabel = getScoreLabel(hole.score, hole.par);
  const scoreClass = getScoreClass(hole.score, hole.par);

  return (
    <div className="border border-gray-200 p-5">
      {/* Hole Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="swiss-label">HOLE</p>
          <div className="text-4xl font-black tracking-tight leading-none">{hole.holeNumber}</div>
        </div>
        <div className="text-center">
          <p className="swiss-label mb-1">PAR</p>
          <div className="text-2xl font-black">{hole.par}</div>
        </div>
        <div className="text-right">
          <p className="swiss-label mb-1">SCORE</p>
          <div className={`inline-block px-3 py-1 text-sm font-black ${scoreClass}`}>
            {hole.score} ({diff > 0 ? '+' : ''}{diff})
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{scoreLabel}</div>
        </div>
      </div>

      {/* Score Adjuster */}
      <div className="mb-5">
        <p className="swiss-label mb-2">STROKES</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange({ score: Math.max(1, hole.score - 1) })}
            className="w-10 h-10 border-2 border-black flex items-center justify-center font-black text-lg hover:bg-black hover:text-white transition-colors"
          >
            −
          </button>
          <div className={`flex-1 text-center py-2 text-2xl font-black ${scoreClass}`}>
            {hole.score}
          </div>
          <button
            onClick={() => onChange({ score: Math.min(15, hole.score + 1) })}
            className="w-10 h-10 border-2 border-black flex items-center justify-center font-black text-lg hover:bg-black hover:text-white transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Putts */}
      <div className="mb-5">
        <p className="swiss-label mb-2">PUTTS</p>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map(p => (
            <button
              key={p}
              onClick={() => onChange({ putts: p })}
              className={`flex-1 py-2 text-sm font-bold border transition-colors ${
                hole.putts === p
                  ? 'bg-black text-white border-black'
                  : 'border-gray-300 hover:border-black'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Fairway Hit (only for non-par-3) */}
      {hole.par !== 3 && (
        <div className="mb-5">
          <p className="swiss-label mb-2">FAIRWAY</p>
          <div className="grid grid-cols-4 gap-1">
            {([
              { value: "hit", label: "命中", icon: "✓" },
              { value: "left", label: "左偏", icon: "←" },
              { value: "right", label: "右偏", icon: "→" },
              { value: "na", label: "N/A", icon: "—" },
            ] as { value: FairwayHit; label: string; icon: string }[]).map(opt => (
              <button
                key={opt.value}
                onClick={() => onChange({ fairwayHit: opt.value })}
                className={`py-2 text-xs font-bold border transition-colors ${
                  hole.fairwayHit === opt.value
                    ? opt.value === 'hit'
                      ? 'bg-[oklch(0.55_0.22_27.33)] text-white border-[oklch(0.55_0.22_27.33)]'
                      : 'bg-black text-white border-black'
                    : 'border-gray-300 hover:border-black'
                }`}
              >
                <div>{opt.icon}</div>
                <div className="text-[0.6rem] tracking-[0.05em]">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GIR */}
      <div className="mb-4">
        <p className="swiss-label mb-2">GREEN IN REGULATION</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChange({ greenInRegulation: true })}
            className={`py-2 text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${
              hole.greenInRegulation
                ? 'bg-[oklch(0.55_0.22_27.33)] text-white border-[oklch(0.55_0.22_27.33)]'
                : 'border-gray-300 hover:border-black'
            }`}
          >
            <Check size={12} /> 達成 GIR
          </button>
          <button
            onClick={() => onChange({ greenInRegulation: false })}
            className={`py-2 text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${
              !hole.greenInRegulation
                ? 'bg-black text-white border-black'
                : 'border-gray-300 hover:border-black'
            }`}
          >
            <X size={12} /> 未達 GIR
          </button>
        </div>
      </div>

      {/* Penalties */}
      <div>
        <p className="swiss-label mb-2">PENALTIES</p>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(p => (
            <button
              key={p}
              onClick={() => onChange({ penalties: p })}
              className={`flex-1 py-1.5 text-sm font-bold border transition-colors ${
                hole.penalties === p
                  ? 'bg-black text-white border-black'
                  : 'border-gray-300 hover:border-black'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NewRound() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"setup" | "holes" | "review">("setup");
  const [courseId, setCourseId] = useState<number | null>(null);
  const [playedAt, setPlayedAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [currentHole, setCurrentHole] = useState(0);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [holes, setHoles] = useState<HoleData[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { data: courses } = trpc.courses.list.useQuery();
  const utils = trpc.useUtils();

  const createRoundMutation = trpc.rounds.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        setRoundId(data.id);
        // Initialize holes based on course
        const course = courses?.find(c => c.id === courseId);
        const holePars = (course?.holePars as number[]) ?? Array(18).fill(4);
        setHoles(Array.from({ length: 18 }, (_, i) => ({
          holeNumber: i + 1,
          par: holePars[i] ?? 4,
          score: holePars[i] ?? 4,
          putts: 2,
          fairwayHit: "na" as FairwayHit,
          greenInRegulation: false,
          penalties: 0,
          notes: "",
        })));
        setStep("holes");
      }
    },
    onError: () => toast.error("建立下場紀錄失敗"),
  });

  const saveHolesMutation = trpc.rounds.saveHoles.useMutation({
    onSuccess: (data) => {
      utils.rounds.list.invalidate();
      utils.stats.summary.invalidate();
      toast.success(`成績已儲存！總桿數：${data.totalScore}`);
      if (roundId) navigate(`/rounds/${roundId}`);
    },
    onError: () => toast.error("儲存成績失敗"),
  });

  const weatherMutation = trpc.weather.getForRound.useMutation({
    onSuccess: (data) => {
      if (data) toast.success(`天氣資料已取得：${data.condition}`);
    },
  });

  const voiceMutation = trpc.voice.transcribeScore.useMutation({
    onSuccess: (data) => {
      if (data.holes && data.holes.length > 0) {
        const parsedHoles = data.holes as Array<{
          holeNumber: number;
          score: number;
          putts?: number;
          fairwayHit?: FairwayHit;
          greenInRegulation?: boolean;
        }>;
        setHoles(prev => {
          const updated = [...prev];
          parsedHoles.forEach(h => {
            const idx = h.holeNumber - 1;
            if (idx >= 0 && idx < 18) {
              updated[idx] = {
                ...updated[idx],
                score: h.score,
                putts: h.putts ?? updated[idx].putts,
                fairwayHit: h.fairwayHit ?? updated[idx].fairwayHit,
                greenInRegulation: h.greenInRegulation ?? updated[idx].greenInRegulation,
              };
            }
          });
          return updated;
        });
        toast.success(`語音辨識完成，已填入 ${parsedHoles.length} 洞成績`);
      }
    },
    onError: () => toast.error("語音辨識失敗"),
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());

        // Upload to storage
        const formData = new FormData();
        formData.append("file", blob, "voice-score.webm");

        try {
          const uploadRes = await fetch("/api/upload-audio", {
            method: "POST",
            body: formData,
          });
          if (uploadRes.ok) {
            const { url } = await uploadRes.json() as { url: string };
            voiceMutation.mutate({ audioUrl: url });
          } else {
            toast.error("音頻上傳失敗");
          }
        } catch {
          toast.error("音頻上傳失敗");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error("無法存取麥克風，請確認權限設定");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSave = () => {
    if (!roundId) return;
    saveHolesMutation.mutate({ roundId, holes });
  };

  const totalScore = holes.reduce((sum, h) => sum + h.score, 0);
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
  const scoreDiff = totalScore - totalPar;

  // Step 1: Setup
  if (step === "setup") {
    return (
      <div className="p-6 lg:p-8 animate-fade-in max-w-2xl">
        <div className="border-b-2 border-black pb-6 mb-8">
          <p className="swiss-label">NEW ROUND</p>
          <h1 className="text-3xl font-black tracking-tight">新增下場紀錄</h1>
        </div>

        <div className="space-y-6">
          <div>
            <label className="swiss-label block mb-2">選擇球場 *</label>
            {courses?.length === 0 ? (
              <div className="border border-gray-200 p-4 text-sm text-gray-500">
                尚未新增球場，請先至「球場管理」新增球場資料
              </div>
            ) : (
              <div className="grid gap-2">
                {courses?.map(course => (
                  <button
                    key={course.id}
                    onClick={() => setCourseId(course.id)}
                    className={`flex items-center justify-between p-4 border-2 transition-colors text-left ${
                      courseId === course.id
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 hover:border-black'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Flag size={16} className={courseId === course.id ? 'text-white' : 'text-gray-400'} />
                      <div>
                        <div className="font-bold text-sm">{course.name}</div>
                        <div className={`text-xs ${courseId === course.id ? 'text-gray-300' : 'text-gray-500'}`}>
                          {course.location} · Par {course.par}
                        </div>
                      </div>
                    </div>
                    {courseId === course.id && <Check size={16} className="text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="swiss-label block mb-2">下場日期 *</label>
            <input
              type="date"
              value={playedAt}
              onChange={e => setPlayedAt(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="swiss-label block mb-2">備註（選填）</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none"
              rows={2}
              placeholder="天氣、球況、特殊情況等"
            />
          </div>

          <button
            onClick={() => {
              if (!courseId) { toast.error("請選擇球場"); return; }
              createRoundMutation.mutate({
                courseId,
                playedAt: new Date(playedAt),
                notes,
              });
            }}
            disabled={!courseId || createRoundMutation.isPending}
            className="w-full bg-black text-white py-3 text-xs font-bold tracking-[0.15em] uppercase disabled:opacity-50 hover:bg-gray-800 transition-colors"
          >
            {createRoundMutation.isPending ? "建立中..." : "開始記錄成績 →"}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Holes
  if (step === "holes") {
    const hole = holes[currentHole];
    if (!hole) return null;

    return (
      <div className="p-6 lg:p-8 animate-fade-in max-w-2xl">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="swiss-label">RECORDING SCORES</p>
              <h1 className="text-2xl font-black tracking-tight">成績輸入</h1>
            </div>
            <div className="text-right">
              <p className="swiss-label">TOTAL</p>
              <div className={`text-2xl font-black ${scoreDiff > 0 ? 'text-gray-600' : 'text-[oklch(0.55_0.22_27.33)]'}`}>
                {totalScore} ({scoreDiff > 0 ? '+' : ''}{scoreDiff})
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex gap-0.5">
              {holes.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentHole(i)}
                  className={`flex-1 h-1.5 transition-colors ${
                    i === currentHole ? 'bg-black' :
                    i < currentHole ? 'bg-[oklch(0.55_0.22_27.33)]' :
                    'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="swiss-label">HOLE {currentHole + 1}/18</span>
              <span className="swiss-label">{Math.round((currentHole / 18) * 100)}% COMPLETE</span>
            </div>
          </div>
        </div>

        {/* Voice Input */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={voiceMutation.isPending}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase transition-colors ${
              isRecording
                ? 'bg-[oklch(0.55_0.22_27.33)] text-white animate-pulse'
                : 'border border-gray-300 hover:border-black'
            }`}
          >
            {isRecording ? <MicOff size={12} /> : <Mic size={12} />}
            {isRecording ? "停止錄音" : voiceMutation.isPending ? "辨識中..." : "語音輸入"}
          </button>
          <span className="text-xs text-gray-400">說出各洞成績，AI 自動辨識填入</span>
        </div>

        {/* Hole Input */}
        <HoleInput
          hole={hole}
          onChange={data => {
            const updated = [...holes];
            updated[currentHole] = { ...updated[currentHole], ...data };
            setHoles(updated);
          }}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentHole(Math.max(0, currentHole - 1))}
            disabled={currentHole === 0}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase disabled:opacity-30 hover:border-black transition-colors"
          >
            <ChevronLeft size={14} /> 上一洞
          </button>

          <div className="flex gap-1">
            {holes.slice(Math.max(0, currentHole - 2), Math.min(18, currentHole + 3)).map((h, i) => {
              const actualIdx = Math.max(0, currentHole - 2) + i;
              return (
                <button
                  key={actualIdx}
                  onClick={() => setCurrentHole(actualIdx)}
                  className={`w-8 h-8 text-xs font-bold transition-colors ${
                    actualIdx === currentHole
                      ? 'bg-black text-white'
                      : getScoreClass(h.score, h.par)
                  }`}
                >
                  {actualIdx + 1}
                </button>
              );
            })}
          </div>

          {currentHole < 17 ? (
            <button
              onClick={() => setCurrentHole(Math.min(17, currentHole + 1))}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase hover:bg-gray-800 transition-colors"
            >
              下一洞 <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => setStep("review")}
              className="flex items-center gap-2 bg-[oklch(0.55_0.22_27.33)] text-white px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase hover:opacity-90 transition-opacity"
            >
              檢視成績卡 <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Review
  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-3xl">
      <div className="border-b-2 border-black pb-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="swiss-label">SCORECARD REVIEW</p>
            <h1 className="text-3xl font-black tracking-tight">成績卡確認</h1>
          </div>
          <div className="text-right">
            <p className="swiss-label">FINAL SCORE</p>
            <div className={`swiss-number-lg ${scoreDiff <= 0 ? 'text-[oklch(0.55_0.22_27.33)]' : ''}`}>
              {totalScore}
            </div>
            <div className="text-sm font-bold text-gray-500">
              {scoreDiff > 0 ? '+' : ''}{scoreDiff} vs Par {totalPar}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-0 border border-gray-200 mb-6">
        {[
          { label: "總桿數", value: totalScore.toString() },
          { label: "推桿數", value: holes.reduce((s, h) => s + h.putts, 0).toString() },
          { label: "球道命中", value: `${holes.filter(h => h.fairwayHit === 'hit').length}/${holes.filter(h => h.par !== 3).length}` },
          { label: "GIR", value: `${holes.filter(h => h.greenInRegulation).length}/18` },
        ].map((s, i) => (
          <div key={i} className="p-4 border-r border-gray-200 last:border-r-0 text-center">
            <div className="text-xl font-black">{s.value}</div>
            <p className="swiss-label mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Scorecard Table */}
      <div className="border border-gray-200 mb-6 overflow-x-auto">
        <table className="swiss-table min-w-full">
          <thead>
            <tr>
              <th>洞</th>
              {holes.slice(0, 9).map(h => <th key={h.holeNumber} className="text-center">{h.holeNumber}</th>)}
              <th className="text-center">前9</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="swiss-label">PAR</td>
              {holes.slice(0, 9).map(h => <td key={h.holeNumber} className="text-center text-xs">{h.par}</td>)}
              <td className="text-center font-bold">{holes.slice(0, 9).reduce((s, h) => s + h.par, 0)}</td>
            </tr>
            <tr>
              <td className="swiss-label">SCORE</td>
              {holes.slice(0, 9).map(h => (
                <td key={h.holeNumber} className="text-center">
                  <span className={`inline-block w-6 h-6 text-xs font-bold flex items-center justify-center ${getScoreClass(h.score, h.par)}`}>
                    {h.score}
                  </span>
                </td>
              ))}
              <td className="text-center font-bold">{holes.slice(0, 9).reduce((s, h) => s + h.score, 0)}</td>
            </tr>
          </tbody>
        </table>
        <table className="swiss-table min-w-full border-t border-gray-200">
          <thead>
            <tr>
              <th>洞</th>
              {holes.slice(9).map(h => <th key={h.holeNumber} className="text-center">{h.holeNumber}</th>)}
              <th className="text-center">後9</th>
              <th className="text-center">總計</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="swiss-label">PAR</td>
              {holes.slice(9).map(h => <td key={h.holeNumber} className="text-center text-xs">{h.par}</td>)}
              <td className="text-center font-bold">{holes.slice(9).reduce((s, h) => s + h.par, 0)}</td>
              <td className="text-center font-black">{totalPar}</td>
            </tr>
            <tr>
              <td className="swiss-label">SCORE</td>
              {holes.slice(9).map(h => (
                <td key={h.holeNumber} className="text-center">
                  <span className={`inline-block w-6 h-6 text-xs font-bold flex items-center justify-center ${getScoreClass(h.score, h.par)}`}>
                    {h.score}
                  </span>
                </td>
              ))}
              <td className="text-center font-bold">{holes.slice(9).reduce((s, h) => s + h.score, 0)}</td>
              <td className="text-center font-black">{totalScore}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Weather */}
      {roundId && (
        <div className="mb-6">
          <button
            onClick={() => weatherMutation.mutate({ roundId })}
            disabled={weatherMutation.isPending}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase hover:border-black transition-colors disabled:opacity-50"
          >
            <Cloud size={12} />
            {weatherMutation.isPending ? "取得天氣中..." : "取得當日天氣資料"}
          </button>
          {weatherMutation.data && (
            <div className="mt-2 text-xs text-gray-600 flex items-center gap-3">
              <span>🌡 {weatherMutation.data.temperature}°C</span>
              <span>💨 {weatherMutation.data.windSpeed} km/h</span>
              <span>☁ {weatherMutation.data.condition}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep("holes")}
          className="flex items-center gap-2 border border-gray-300 px-4 py-2.5 text-xs font-bold tracking-[0.1em] uppercase hover:border-black transition-colors"
        >
          <ChevronLeft size={14} /> 返回修改
        </button>
        <button
          onClick={handleSave}
          disabled={saveHolesMutation.isPending}
          className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-2.5 text-xs font-bold tracking-[0.15em] uppercase disabled:opacity-50 hover:bg-gray-800 transition-colors"
        >
          <Save size={14} />
          {saveHolesMutation.isPending ? "儲存中..." : "確認儲存成績"}
        </button>
      </div>
    </div>
  );
}
