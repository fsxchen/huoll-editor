"use client";

import { useState } from "react";
import { login, register, type User } from "@/lib/api";
import { useStore } from "@/lib/store";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const storeLogin = useStore((s) => s.login);

  const canSubmit =
    username.trim() &&
    password.trim() &&
    (mode === "login" || (email.trim() && password2.trim())) &&
    status !== "loading";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      let user: User;
      if (mode === "login") {
        const res = await login(username.trim(), password.trim());
        user = res.user;
      } else {
        const res = await register({
          username: username.trim(),
          email: email.trim(),
          password,
          password2,
          nickname: nickname.trim() || undefined,
        });
        user = res.user;
      }
      storeLogin(user);
      onClose();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "请求失败");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(21, 20, 15, 0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-[420px] max-w-[94vw] flex flex-col overflow-hidden"
        style={{
          background: "var(--surface)",
          borderRadius: 24,
          border: "1px solid var(--line-soft)",
          boxShadow: "0 40px 80px -20px rgba(21, 20, 15, 0.35)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--line-faint)" }}
        >
          <div className="flex gap-4">
            <button
              onClick={() => { setMode("login"); setErrorMsg(""); }}
              className={`text-sm font-medium transition-colors ${mode === "login" ? "text-[var(--ink)]" : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"}`}
            >
              登录
            </button>
            <button
              onClick={() => { setMode("register"); setErrorMsg(""); }}
              className={`text-sm font-medium transition-colors ${mode === "register" ? "text-[var(--ink)]" : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"}`}
            >
              注册
            </button>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[var(--ink-faint)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-faint)]">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--ink)]/40"
              style={{ background: "var(--paper)", borderColor: "var(--line)" }}
              placeholder="your_username"
              required
            />
          </div>

          {mode === "register" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-faint)]">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--ink)]/40"
                  style={{ background: "var(--paper)", borderColor: "var(--line)" }}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-faint)]">昵称（可选）</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--ink)]/40"
                  style={{ background: "var(--paper)", borderColor: "var(--line)" }}
                  placeholder="昵称"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-faint)]">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--ink)]/40"
              style={{ background: "var(--paper)", borderColor: "var(--line)" }}
              placeholder="••••••••"
              required
            />
          </div>

          {mode === "register" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-faint)]">确认密码</label>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--ink)]/40"
                style={{ background: "var(--paper)", borderColor: "var(--line)" }}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {errorMsg && (
            <div className="rounded-md px-3 py-2 text-xs text-[var(--coral)]" style={{ background: "rgba(201, 100, 66, 0.08)" }}>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            {status === "loading" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--paper)] border-t-transparent" />
                {mode === "login" ? "登录中…" : "注册中…"}
              </>
            ) : (
              mode === "login" ? "登录" : "注册"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
