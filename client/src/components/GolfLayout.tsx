import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Flag, PlusCircle, History, BarChart3, Bot, LogOut, Menu, X, User
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "儀表板", labelEn: "DASHBOARD" },
  { path: "/rounds/new", icon: PlusCircle, label: "新增下場", labelEn: "NEW ROUND" },
  { path: "/history", icon: History, label: "歷史紀錄", labelEn: "HISTORY" },
  { path: "/analytics", icon: BarChart3, label: "數據分析", labelEn: "ANALYTICS" },
  { path: "/courses", icon: Flag, label: "球場管理", labelEn: "COURSES" },
  { path: "/ai", icon: Bot, label: "AI 助理", labelEn: "AI COACH" },
];

interface GolfLayoutProps {
  children: React.ReactNode;
}

export default function GolfLayout({ children }: GolfLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin mx-auto mb-4" />
          <p className="swiss-label">LOADING</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-sm w-full px-8">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-black flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500" />
              </div>
              <span className="text-xs font-bold tracking-[0.2em] uppercase">47's Golf Tracker</span>
            </div>
            <div className="border-t-2 border-black pt-4">
              <h1 className="text-4xl font-black tracking-tight leading-none">47'S</h1>
              <h1 className="text-4xl font-black tracking-tight leading-none">GOLF</h1>
              <h1 className="text-4xl font-black tracking-tight leading-none text-[oklch(0.55_0.22_27.33)]">TRACKER</h1>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            專業高爾夫成績追蹤與分析系統。記錄每洞表現，獲得 AI 個人化建議。
          </p>

          <a
            href={getLoginUrl()}
            className="block w-full bg-black text-white text-center py-3 text-xs font-bold tracking-[0.15em] uppercase hover:bg-gray-800 transition-colors"
          >
            登入開始使用
          </a>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="swiss-label mb-3">功能特色</p>
            <div className="space-y-2">
              {["18 洞成績紀錄", "AI 教練分析建議", "數據視覺化儀表板", "語音快速輸入", "天氣影響分析"].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[oklch(0.55_0.22_27.33)]" />
                  <span className="text-xs text-gray-600">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-56 bg-[oklch(0.06_0_0)] fixed top-0 left-0 h-full z-40">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-[oklch(0.18_0_0)]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 bg-[oklch(0.55_0.22_27.33)] flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 bg-white" />
            </div>
            <span className="text-[0.6rem] font-bold tracking-[0.2em] text-gray-400 uppercase">47's Golf Tracker</span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-white tracking-tight leading-none">47'S</div>
            <div className="text-xl font-black text-white tracking-tight leading-none">GOLF</div>
            <div className="text-xl font-black text-[oklch(0.55_0.22_27.33)] tracking-tight leading-none">TRACKER</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <p className="px-4 mb-2 text-[0.55rem] font-bold tracking-[0.2em] text-gray-600 uppercase">Navigation</p>
          {navItems.map(item => (
            <Link key={item.path} href={item.path}>
              <a className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}>
                <item.icon size={14} strokeWidth={2} />
                <div>
                  <div className="text-[0.7rem] font-bold tracking-[0.08em]">{item.labelEn}</div>
                  <div className="text-[0.65rem] opacity-60">{item.label}</div>
                </div>
              </a>
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-[oklch(0.18_0_0)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-[oklch(0.55_0.22_27.33)] flex items-center justify-center flex-shrink-0">
              <User size={12} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[0.7rem] font-bold text-white truncate">{user?.name ?? "使用者"}</div>
              <div className="text-[0.6rem] text-gray-500 truncate">{user?.email ?? ""}</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 text-[0.65rem] text-gray-500 hover:text-white transition-colors py-1"
          >
            <LogOut size={11} />
            <span className="tracking-[0.08em] uppercase font-medium">登出</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[oklch(0.06_0_0)] border-b border-[oklch(0.18_0_0)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[oklch(0.55_0.22_27.33)] flex items-center justify-center">
            <div className="w-2 h-2 bg-white" />
          </div>
          <span className="text-white text-sm font-black tracking-tight">47'S GOLF TRACKER</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-1">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <aside className="w-56 h-full bg-[oklch(0.06_0_0)]" onClick={e => e.stopPropagation()}>
            <div className="pt-16 pb-4">
              {navItems.map(item => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon size={14} />
                    <span className="text-[0.75rem] font-bold tracking-[0.08em]">{item.labelEn}</span>
                  </a>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 min-h-screen bg-white">
        {children}
      </main>
    </div>
  );
}
