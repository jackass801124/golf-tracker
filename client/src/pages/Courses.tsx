import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Edit2, Trash2, MapPin, Flag, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DEFAULT_HOLE_PARS = [4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4, 5];

interface CourseFormData {
  name: string;
  location: string;
  par: number;
  holes: number;
  holePars: number[];
  notes: string;
}

function HoleParInput({ holePars, onChange }: { holePars: number[]; onChange: (pars: number[]) => void }) {
  return (
    <div>
      <p className="swiss-label mb-2">每洞標準桿</p>
      <div className="grid grid-cols-9 gap-1">
        {holePars.map((par, i) => (
          <div key={i} className="text-center">
            <div className="text-[0.55rem] text-gray-400 mb-0.5">{i + 1}</div>
            <select
              value={par}
              onChange={e => {
                const newPars = [...holePars];
                newPars[i] = parseInt(e.target.value);
                onChange(newPars);
              }}
              className="w-full text-center text-xs border border-gray-300 py-1 bg-white focus:outline-none focus:border-black"
            >
              {[3, 4, 5].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>前9洞: {holePars.slice(0, 9).reduce((a, b) => a + b, 0)}</span>
        <span>後9洞: {holePars.slice(9).reduce((a, b) => a + b, 0)}</span>
        <span className="font-bold">總計: {holePars.reduce((a, b) => a + b, 0)}</span>
      </div>
    </div>
  );
}

function CourseForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<CourseFormData>;
  onSubmit: (data: CourseFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [form, setForm] = useState<CourseFormData>({
    name: initial?.name ?? "",
    location: initial?.location ?? "",
    par: initial?.par ?? 72,
    holes: initial?.holes ?? 18,
    holePars: initial?.holePars ?? [...DEFAULT_HOLE_PARS],
    notes: initial?.notes ?? "",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="swiss-label block mb-1">球場名稱 *</label>
          <input
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="例：林口球場"
          />
        </div>
        <div>
          <label className="swiss-label block mb-1">地點</label>
          <input
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            placeholder="例：台灣台北"
          />
        </div>
        <div>
          <label className="swiss-label block mb-1">標準桿</label>
          <input
            type="number"
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
            value={form.par}
            onChange={e => setForm({ ...form, par: parseInt(e.target.value) || 72 })}
            min={60}
            max={80}
          />
        </div>
      </div>

      <HoleParInput
        holePars={form.holePars}
        onChange={pars => setForm({ ...form, holePars: pars, par: pars.reduce((a, b) => a + b, 0) })}
      />

      <div>
        <label className="swiss-label block mb-1">備註</label>
        <textarea
          className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none"
          rows={2}
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="球場特色、注意事項等"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSubmit(form)}
          disabled={!form.name || loading}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase disabled:opacity-50"
        >
          <Check size={12} />
          {loading ? "儲存中..." : "儲存球場"}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 border border-gray-300 px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase hover:bg-gray-50"
        >
          <X size={12} />
          取消
        </button>
      </div>
    </div>
  );
}

export default function Courses() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: courses, isLoading } = trpc.courses.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.courses.create.useMutation({
    onSuccess: () => {
      utils.courses.list.invalidate();
      setShowCreate(false);
      toast.success("球場已新增");
    },
    onError: () => toast.error("新增失敗，請重試"),
  });

  const updateMutation = trpc.courses.update.useMutation({
    onSuccess: () => {
      utils.courses.list.invalidate();
      setEditingId(null);
      toast.success("球場已更新");
    },
    onError: () => toast.error("更新失敗，請重試"),
  });

  const deleteMutation = trpc.courses.delete.useMutation({
    onSuccess: () => {
      utils.courses.list.invalidate();
      setDeleteId(null);
      toast.success("球場已刪除");
    },
    onError: () => toast.error("刪除失敗，請重試"),
  });

  const editingCourse = courses?.find(c => c.id === editingId);

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="border-b-2 border-black pb-6 mb-8 flex items-end justify-between">
        <div>
          <p className="swiss-label">COURSE MANAGEMENT</p>
          <h1 className="text-3xl font-black tracking-tight">球場管理</h1>
          <p className="text-sm text-gray-500 mt-1">{courses?.length ?? 0} 個球場</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 text-xs font-bold tracking-[0.1em] uppercase hover:bg-gray-800 transition-colors"
        >
          <Plus size={14} />
          新增球場
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="border-2 border-black p-6 mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="swiss-label">NEW COURSE</p>
              <h2 className="text-lg font-black">新增球場</h2>
            </div>
            <div className="w-4 h-4 bg-[oklch(0.55_0.22_27.33)]" />
          </div>
          <CourseForm
            onSubmit={data => createMutation.mutate(data)}
            onCancel={() => setShowCreate(false)}
            loading={createMutation.isPending}
          />
        </div>
      )}

      {/* Course List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-100 w-48 mb-2" />
              <div className="h-3 bg-gray-100 w-32" />
            </div>
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Flag size={24} className="text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-600 mb-1">尚未新增任何球場</p>
          <p className="text-xs text-gray-400 mb-4">新增您常去的高爾夫球場，開始記錄成績</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase"
          >
            <Plus size={12} />
            新增第一個球場
          </button>
        </div>
      ) : (
        <div className="grid gap-0 border border-gray-200">
          {courses?.map((course, idx) => (
            <div key={course.id}>
              {editingId === course.id ? (
                <div className="p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <p className="swiss-label">EDITING COURSE</p>
                    <div className="w-4 h-4 bg-[oklch(0.55_0.22_27.33)]" />
                  </div>
                  <CourseForm
                    initial={{
                      name: course.name,
                      location: course.location ?? "",
                      par: course.par,
                      holes: course.holes,
                      holePars: (course.holePars as number[]) ?? [...DEFAULT_HOLE_PARS],
                      notes: course.notes ?? "",
                    }}
                    onSubmit={data => updateMutation.mutate({ id: course.id, ...data })}
                    onCancel={() => setEditingId(null)}
                    loading={updateMutation.isPending}
                  />
                </div>
              ) : (
                <div className={`p-6 flex items-start justify-between ${idx < (courses?.length ?? 0) - 1 ? 'border-b border-gray-200' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-black flex items-center justify-center flex-shrink-0">
                      <Flag size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-base tracking-tight">{course.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {course.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={10} />
                            {course.location}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">Par {course.par}</span>
                        <span className="text-xs text-gray-500">{course.holes} 洞</span>
                      </div>
                      {course.holePars && (
                        <div className="flex gap-1 mt-2">
                          {(course.holePars as number[]).map((par, i) => (
                            <div key={i} className="text-center">
                              <div className={`w-5 h-5 flex items-center justify-center text-[0.6rem] font-bold ${
                                par === 3 ? 'bg-gray-100 text-gray-600' :
                                par === 4 ? 'bg-gray-200 text-gray-700' :
                                'bg-gray-800 text-white'
                              }`}>
                                {par}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {course.notes && (
                        <p className="text-xs text-gray-400 mt-1">{course.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(course.id)}
                      className="p-2 hover:bg-gray-100 transition-colors"
                      title="編輯"
                    >
                      <Edit2 size={14} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => setDeleteId(course.id)}
                      className="p-2 hover:bg-red-50 transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-none">
          <DialogHeader>
            <DialogTitle className="font-black tracking-tight">確認刪除球場</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            確定要刪除「{courses?.find(c => c.id === deleteId)?.name}」嗎？此操作無法復原。
          </p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-[oklch(0.55_0.22_27.33)] text-white py-2 text-xs font-bold tracking-[0.1em] uppercase disabled:opacity-50"
            >
              {deleteMutation.isPending ? "刪除中..." : "確認刪除"}
            </button>
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 border border-gray-300 py-2 text-xs font-bold tracking-[0.1em] uppercase hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
