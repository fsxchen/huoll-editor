"use client";

import { useCallback, useRef, useState } from "react";
import { useStore } from "./store";

export function useSectionAI() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const ctlRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    ctlRef.current?.abort();
    ctlRef.current = null;
  }, []);

  const run = useCallback(async (sectionText: string, action: "expand" | "polish"): Promise<string> => {
    cancel();
    const store = useStore.getState();
    const agent = store.selectedAgent;
    if (!agent) {
      setStatus("error");
      setError("先在右上角选择一个 agent");
      throw new Error("先在右上角选择一个 agent");
    }
    const model =
      store.agentModels[agent] && store.agentModels[agent] !== "default"
        ? store.agentModels[agent]
        : undefined;
    const binOverride = store.agentBinOverrides[agent]?.trim() || undefined;

    const promptBase = action === "expand"
      ? `你是一位专业的技术博客作者。请根据以下章节内容，扩展并丰富它。保持原有风格和语言，增加更多细节、例子、数据支撑。不要改变标题，不要添加新的标题层级。直接输出扩展后的正文内容。`
      : `你是一位专业的文字编辑。请对以下章节内容进行润色，使其更加流畅、专业、易读。保持原意不变，修正语法和表达问题。直接输出润色后的正文内容。`;

    const prompt = `${promptBase}

【章节内容】
${sectionText.slice(0, 3000)}

【要求】
1. 只输出正文内容，不要任何解释、不要"以下是…"开头。
2. 不要添加新的 ## 或 ### 标题。
3. 保持与原文一致的语言（中文/英文）。
4. 长度控制在原文字数的 1.5-2 倍（扩展）或相近（润色）。
`;

    const ctl = new AbortController();
    ctlRef.current = ctl;
    setStatus("running");
    setError(null);

    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent,
          instruction: prompt,
          context: "",
          model,
          binOverride,
        }),
        signal: ctl.signal,
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let lastEvent = "";
      let output = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        let blank: number;
        while ((blank = buf.indexOf("\n\n")) !== -1) {
          const block = buf.slice(0, blank);
          buf = buf.slice(blank + 2);
          const lines = block.split("\n");
          let event = lastEvent;
          const dataLines: string[] = [];
          for (const l of lines) {
            if (l.startsWith("event:")) event = l.slice(6).trim();
            else if (l.startsWith("data:")) dataLines.push(l.slice(5).trim());
          }
          lastEvent = event;
          if (!dataLines.length) continue;
          let data: unknown;
          try {
            data = JSON.parse(dataLines.join("\n"));
          } catch {
            continue;
          }
          if (event === "delta") {
            const d = data as { text?: string };
            if (typeof d.text === "string") {
              output += d.text;
            }
          } else if (event === "error") {
            const d = data as { message?: string };
            throw new Error(d.message ?? "draft error");
          }
        }
      }
      setStatus("done");
      return output;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        setStatus("idle");
        return "";
      }
      setStatus("error");
      setError((err as Error)?.message ?? String(err));
      throw err;
    } finally {
      if (ctlRef.current === ctl) ctlRef.current = null;
    }
  }, [cancel]);

  return { run, cancel, status, error };
}
