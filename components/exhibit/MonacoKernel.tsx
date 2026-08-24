"use client";
import React, { useEffect, useRef } from "react";
import Editor, { Monaco, OnMount } from "@monaco-editor/react";
import type { editor as MonEditor } from "monaco-editor";
import { LAUNCH_SCENE } from "@/content/cuda/scenes";
import { LaunchConfig, parseLaunchSource } from "@/lib/engine/launchConfig";

const INITIAL_SOURCE = LAUNCH_SCENE.code
  .map((l) => l.parts.map((p) => p.text).join(""))
  .join("\n");

function lineNumberFor(id: string | null): number | null {
  if (!id) return null;
  const i = LAUNCH_SCENE.code.findIndex((l) => l.id === id);
  return i >= 0 ? i + 1 : null;
}

export default function MonacoKernel({
  hotLineId,
  onSeek,
  onConfigChange,
}: {
  hotLineId: string | null;
  onSeek: (t: number) => void;
  onConfigChange: (cfg: LaunchConfig) => void;
}) {
  const edRef = useRef<MonEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decoRef = useRef<MonEditor.IEditorDecorationsCollection | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCfgRef = useRef<string>("");

  const handleMount: OnMount = (ed, monaco: Monaco) => {
    edRef.current = ed;
    monacoRef.current = monaco;
    decoRef.current = ed.createDecorationsCollection([]);
    monaco.editor.defineTheme("cve", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "A48FFF" },
        { token: "identifier", foreground: "5CC8FF" },
        { token: "number", foreground: "FFC46B" },
        { token: "comment", foreground: "5E767C", fontStyle: "italic" },
        { token: "type", foreground: "46E3C8" },
      ],
      colors: {
        "editor.background": "#060C11",
        "editorGutter.background": "#04070A",
        "editor.lineHighlightBackground": "#00000000",
      },
    });
    monaco.editor.setTheme("cve");
    ed.onMouseDown((e) => {
      const pos = e.target.position;
      if (!pos) return;
      const line = LAUNCH_SCENE.code[pos.lineNumber - 1];
      if (line?.seek !== undefined) onSeek(line.seek);
    });
    const push = () => {
      const cfg = parseLaunchSource(ed.getValue());
      if (!cfg) return;
      const key = `${cfg.blocks}x${cfg.threadsPerBlock}`;
      if (key !== lastCfgRef.current) {
        lastCfgRef.current = key;
        onConfigChange(cfg);
      }
    };
    ed.onDidChangeModelContent(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(push, 250);
    });
    push();
  };

  useEffect(() => {
    const monaco = monacoRef.current;
    const coll = decoRef.current;
    if (!monaco || !coll) return;
    const line = lineNumberFor(hotLineId);
    if (line === null) {
      coll.set([]);
      return;
    }
    coll.set([
      {
        range: new monaco.Range(line, 1, line, 1),
        options: { isWholeLine: true, className: "cveHotLine", zIndex: 5 },
      },
    ]);
  }, [hotLineId]);

  return (
    <div className="monacoWrap">
      <Editor
        height="100%"
        language="cpp"
        theme="cve"
        defaultValue={INITIAL_SOURCE}
        onMount={handleMount}
        options={{
          fontSize: 12.3,
          fontFamily: '"IBM Plex Mono", Consolas, monospace',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          renderLineHighlight: "none",
          lineNumbersMinChars: 2,
          padding: { top: 10, bottom: 10 },
          automaticLayout: true,
          smoothScrolling: true,
          overviewRulerLanes: 0,
          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
        }}
        loading={<div className="monacoLoading">LOADING EDITOR…</div>}
      />
    </div>
  );
}
