import { invoke } from "@tauri-apps/api/core";
import { AGENTS } from "./agents/defs";
import type { AgentInfo } from "./store";

export function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
}

export async function detectAgentsTauri(): Promise<AgentInfo[]> {
  const queries = AGENTS.map((a) => ({
    id: a.id,
    bins: [a.bin, ...(a.fallbackBins ?? [])],
    env: a.envOverride,
  }));

  type Result = {
    id: string;
    available: boolean;
    path?: string;
    resolved_bin?: string;
  };

  const results = await invoke<Result[]>("detect_agents", { agents: queries });

  return AGENTS.map((a): AgentInfo => {
    const protocol = (a.protocol ?? "stdin") as AgentInfo["protocol"];
    const unsupported = protocol === "acp" || protocol === "pi-rpc";
    const r = results.find((x) => x.id === a.id);
    return {
      id: a.id,
      label: a.label,
      vendor: a.vendor,
      protocol,
      models: a.fallbackModels,
      unsupported: unsupported || undefined,
      available: r?.available ?? false,
      path: r?.path,
    };
  });
}

export async function loadAgents(): Promise<{ agents: AgentInfo[]; error?: string }> {
  try {
    let agents: AgentInfo[];
    if (isTauri()) {
      agents = await detectAgentsTauri();
    } else {
      const res = await fetch("/api/agents", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { agents: AgentInfo[] };
      agents = data.agents;
    }
    return { agents };
  } catch (e) {
    return { agents: [], error: e instanceof Error ? e.message : "detection failed" };
  }
}
