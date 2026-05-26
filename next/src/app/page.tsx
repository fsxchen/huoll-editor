"use client";

import { useEffect, useRef, useState } from "react";
import { Toolbar } from "@/components/toolbar";
import { EditorPane } from "@/components/editor-pane";
import { PreviewPane } from "@/components/preview-pane";
import { TasksSidebar } from "@/components/tasks-sidebar";
import { WelcomeModal } from "@/components/welcome-modal";
import { SettingsModal, type SectionId } from "@/components/settings-modal";
import { ConvertChip } from "@/components/convert-chip";
import { PublishModal } from "@/components/publish-modal";
import { ImageGalleryModal } from "@/components/image-gallery-modal";
import { useStore, type AgentInfo } from "@/lib/store";
import { loadAgents } from "@/lib/tauri";

export default function Home() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const welcomeAck = useStore((s) => s.welcomeAck);
  const selectedAgent = useStore((s) => s.selectedAgent);
  const setAgents = useStore((s) => s.setAgents);
  const locale = useStore((s) => s.locale);
  const layoutMode = useStore((s) => s.layoutMode);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<
    SectionId | undefined
  >(undefined);
  const [showPublish, setShowPublish] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Detect agents on mount so the toolbar's agent chip can resolve the
  // persisted `selectedAgent` to a label without waiting for the user to
  // open Settings or Welcome. Without this, after a hard reload the chip
  // briefly (or permanently) shows "Select agent" even though selection
  // is intact in localStorage.
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const { agents } = await loadAgents();
        if (!cancelled) setAgents(agents);
      } catch {
        // Settings / Welcome modals will retry on open.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, setAgents]);

  // Keep <html lang="…"> in sync with the user's locale so screen readers
  // and browser features (autotranslate, hyphenation) pick the right language.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", locale);
    }
  }, [locale]);

  useEffect(() => {
    if (!hydrated) return;
    if (!welcomeAck || !selectedAgent) setWelcomeOpen(true);
  }, [hydrated, welcomeAck, selectedAgent]);



  return (
    <main className="relative flex h-screen flex-col">
      <Toolbar
        iframeRef={iframeRef}
        onOpenAgentPicker={() => setSettingsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}

        onPublish={() => setShowPublish(true)}
        onOpenImageGallery={() => setShowImageGallery(true)}
      />
      <div
        className="flex flex-1 min-h-0"
        style={{ borderTop: "1px solid var(--line-faint)" }}
      >
        <TasksSidebar />
        <div className="relative flex flex-1 min-w-0">
          {layoutMode !== "preview" && (
            <section
              className="flex min-w-0 flex-1 basis-0 flex-col"
              style={
                layoutMode === "split"
                  ? { borderRight: "1px solid var(--line-faint)" }
                  : undefined
              }
            >
              <EditorPane />
            </section>
          )}
          {layoutMode !== "editor" && (
            <section className="flex min-w-0 flex-1 basis-0 flex-col">
              <PreviewPane iframeRef={iframeRef} />
            </section>
          )}
          <ConvertChip />
        </div>
      </div>
      {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
      {showImageGallery && (
        <ImageGalleryModal
          onClose={() => setShowImageGallery(false)}
          onSelect={(url) => {
            const store = useStore.getState();
            const task = store.tasks.find((t) => t.id === store.activeTaskId);
            if (task) {
              const sep = task.content.endsWith("\n\n") ? "" : task.content.endsWith("\n") ? "\n" : "\n\n";
              store.setContent(task.content + sep + `![](${url})\n`);
            }
            setShowImageGallery(false);
          }}
        />
      )}
      {welcomeOpen && <WelcomeModal onClose={() => setWelcomeOpen(false)} />}
      {settingsOpen && (
        <SettingsModal
          initialSection={settingsInitialSection}
          onClose={() => {
            setSettingsOpen(false);
            setSettingsInitialSection(undefined);

          }}
        />
      )}
    </main>
  );
}
