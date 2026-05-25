"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { clearTokens, logout } from "@/lib/api";

export function UserMenu({ onOpenAuth, onOpenMyArticles, onOpenImageGallery }: { onOpenAuth: () => void; onOpenMyArticles: () => void; onOpenImageGallery: () => void }) {
  const user = useStore((s) => s.user);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const storeLogout = useStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    clearTokens();
    storeLogout();
    setOpen(false);
  };

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={onOpenAuth}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all hover:opacity-80"
        style={{ background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        登录
      </button>
    );
  }

  const initials = user.nickname || user.username;
  const avatarText = initials.slice(0, 2);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full px-2 py-1 text-[12px] font-medium transition-all hover:opacity-80"
        style={{ background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
      >
        <div
          className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white"
          style={{ background: "var(--ink)" }}
        >
          {avatarText}
        </div>
        <span className="hidden sm:inline">{initials}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 flex min-w-[160px] flex-col gap-1 rounded-xl p-1.5 text-sm"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line-soft)",
            boxShadow: "0 12px 40px -8px rgba(21,20,15,0.2)",
          }}
        >
          <div className="px-3 py-2 text-[11px] text-[var(--ink-faint)]">
            @{user.username}
          </div>
          <div style={{ borderTop: "1px solid var(--line-faint)" }} />
          <button
            onClick={() => { setOpen(false); onOpenMyArticles(); }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            我的文章
          </button>
          <button
            onClick={() => { setOpen(false); onOpenImageGallery(); }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            图片管理
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
