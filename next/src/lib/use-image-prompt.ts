"use client";

import { useCallback, useRef, useState } from "react";
import { useStore } from "./store";

export function useImagePrompt() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ctlRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    ctlRef.current?.abort();
    ctlRef.current = null;
  }, []);

  const run = useCallback(async (content: string): Promise<string> => {
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

    const prompt = `你是一位专业的 AI 图像生成提示词工程师。请根据以下内容，生成一段高质量的中英文图像生成提示词（适用于 Midjourney / Stable Diffusion / Flux 等）。

【硬性规则】
1. 只输出提示词本身，不要任何解释、不要"以下是…"开头、不要 markdown 代码块。
2. 提示词应包含：主体描述、风格、光线、色彩、构图、细节质量等。
3. 如果内容涉及人物，描述其表情、姿态、服装。
4. 如果内容涉及场景，描述环境氛围、时间、天气。
5. 提示词长度控制在 100-200 词（英文为主，可带少量中文注释）。
6. 额外提供 3 个可选的风格变体提示词，用"变体1 / 变体2 / 变体3"标注。

【内容】
${content.slice(0, 2000)}

【输出格式】
主提示词: ...
变体1: ...
变体2: ...
变体3: ...
`;

    const ctl = new AbortController();
    ctlRef.current = ctl;
    setStatus("running");
    setError(null);
    setResult("");

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
              setResult(output);
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

  return { run, cancel, status, result, error };
}
