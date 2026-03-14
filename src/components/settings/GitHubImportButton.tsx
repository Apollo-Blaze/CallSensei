// src/components/settings/GitHubImportSection.tsx
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/useRequestFormState";
import { pullActivitiesFromGitHub, filterSelected, type PulledActivity, type PulledFolder } from "../../utils/githubActivities";
// ⬇ replace with your actual action names
import { addActivity } from "../../state/activitiesSlice";
import type { ActivityModel } from "../../models/ActivityModel";
// import { addFolder } from "../../state/foldersSlice"; // uncomment if you have this

// ── Types ─────────────────────────────────────────────────────────────────────
type Status = "idle" | "loading" | "success" | "error";

const METHOD_COLORS: Record<string, string> = {
  GET:    "text-emerald-400 bg-emerald-400/10",
  POST:   "text-blue-400   bg-blue-400/10",
  PUT:    "text-amber-400  bg-amber-400/10",
  PATCH:  "text-purple-400 bg-purple-400/10",
  DELETE: "text-red-400    bg-red-400/10",
};
const methodColor = (m: string) =>
  METHOD_COLORS[m?.toUpperCase()] ?? "text-white/60 bg-white/5";

// ── Component ─────────────────────────────────────────────────────────────────
const GitHubImportSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state: any) => state.github?.token);

  // ── form state ──
  const [owner, setOwner]   = useState("Clasherzz");
  const [repo, setRepo]     = useState("testCallSensei");
  const [path, setPath]     = useState("activities.json");

  // ── pull results ──
  const [pulledActivities, setPulledActivities] = useState<PulledActivity[]>([]);
  const [pulledFolders, setPulledFolders]       = useState<PulledFolder[]>([]);
  const [sha, setSha]                           = useState<string>("");
  const [selectedIds, setSelectedIds]           = useState<string[]>([]);
  const [openFolders, setOpenFolders]           = useState<Set<string>>(new Set());

  // ── ui state ──
  const [status, setStatus]   = useState<Status>("idle");
  const [error, setError]     = useState<string>("");
  const [imported, setImported] = useState(false);

  // ── helpers ──────────────────────────────────────────────────────────────────
  const toggleId = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleFolder = (folderId: string) => {
    const ids = pulledActivities.filter((a) => a.parentId === folderId).map((a) => a.id);
    const allIn = ids.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allIn ? prev.filter((x) => !ids.includes(x)) : [...new Set([...prev, ...ids])]
    );
  };

  const toggleFolderOpen = (id: string) =>
    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    const all = pulledActivities.map((a) => a.id);
    setSelectedIds(selectedIds.length === all.length ? [] : all);
  };

  // ── pull ─────────────────────────────────────────────────────────────────────
  const handlePull = async () => {
    if (!token) { setError("You must be logged in to GitHub first."); return; }
    setStatus("loading");
    setError("");
    setImported(false);
    setPulledActivities([]);
    setPulledFolders([]);
    setSelectedIds([]);

    try {
      const data = await pullActivitiesFromGitHub({ token, owner, repo, path });
      setPulledActivities(data.activities);
      setPulledFolders(data.folders);
      setSha(data.sha);
      setOpenFolders(new Set(data.folders.map((f) => f.id)));
      setStatus("success");
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
      setStatus("error");
    }
  };

  // ── import selected ───────────────────────────────────────────────────────────
  const handleImport = () => {
    const { activities, folders } = filterSelected(
      { activities: pulledActivities, folders: pulledFolders, sha, version: 1, exportedAt: "" },
      selectedIds
    );

    // dispatch folders first so activities can resolve parentId
    // folders.forEach((f) => dispatch(addFolder(f))); // uncomment when ready
    activities.forEach((a) => dispatch(addActivity(a as ActivityModel)));

    setImported(true);
    setSelectedIds([]);
  };

  // ── render ────────────────────────────────────────────────────────────────────
  const rootActivities = pulledActivities.filter((a) => !a.parentId);

  const ActivityRow = ({ activity }: { activity: PulledActivity }) => {
    const isSelected = selectedIds.includes(activity.id);
    return (
      <label
        className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors group
          ${isSelected ? "bg-blue-600/15 border border-blue-500/30" : "hover:bg-white/5 border border-transparent"}`}
      >
        <input type="checkbox" checked={isSelected} onChange={() => toggleId(activity.id)} className="sr-only" />
        <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors
          ${isSelected ? "bg-blue-600 border-blue-500" : "border-white/20 group-hover:border-white/40"}`}>
          {isSelected && (
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${methodColor(activity.request.method)}`}>
          {activity.request.method}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm text-white truncate">{activity.name}</span>
          {activity.url && <span className="block text-xs text-white/40 truncate">{activity.url}</span>}
        </span>
      </label>
    );
  };

  const FolderBlock = ({ folder }: { folder: PulledFolder }) => {
    const children = pulledActivities.filter((a) => a.parentId === folder.id);
    const ids = children.map((a) => a.id);
    const allIn = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    const someIn = ids.some((id) => selectedIds.includes(id));
    const isOpen = openFolders.has(folder.id);

    return (
      <div className="space-y-0.5">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 group">
          <button type="button" onClick={() => toggleFolderOpen(folder.id)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left">
            <svg className={`w-3 h-3 text-white/50 flex-shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
              viewBox="0 0 6 10" fill="none">
              <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="w-3.5 h-3.5 text-amber-400/70 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.5 3A1.5 1.5 0 000 4.5v8A1.5 1.5 0 001.5 14h13a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H7.621a1.5 1.5 0 01-1.06-.44L5.439 2.94A1.5 1.5 0 004.379 2.5H1.5z" />
            </svg>
            <span className="text-sm text-white/80 font-medium truncate">{folder.name}</span>
            <span className="text-xs text-white/30">({children.length})</span>
          </button>
          {ids.length > 0 && (
            <button type="button" onClick={() => toggleFolder(folder.id)}
              className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors
                ${allIn ? "bg-blue-600 border-blue-500"
                  : someIn ? "bg-blue-600/40 border-blue-500/60"
                  : "border-white/20 group-hover:border-white/40"}`}>
              {allIn && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>}
              {someIn && !allIn && <span className="w-2 h-0.5 bg-blue-300 rounded" />}
            </button>
          )}
        </div>
        {isOpen && children.length > 0 && (
          <div className="ml-5 space-y-0.5 border-l border-white/5 pl-3">
            {children.map((a) => <ActivityRow key={a.id} activity={a} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-white mb-1">Import from GitHub</div>
        <p className="text-xs text-white/60">
          Pull an <code className="font-mono text-white/50">activities.json</code> from any repo you have access to,
          then pick which activities to import into your workspace.
        </p>
      </div>

      {/* ── Repo config ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Owner", value: owner, set: setOwner, placeholder: "Clasherzz" },
          { label: "Repo",  value: repo,  set: setRepo,  placeholder: "testCallSensei" },
          { label: "Path",  value: path,  set: setPath,  placeholder: "activities.json" },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label}>
            <label className="block text-xs text-white/50 mb-1">{label}</label>
            <input
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className="w-full px-2.5 py-1.5 text-sm bg-[#101022] text-white rounded border border-white/10
                focus:outline-none focus:ring-2 focus:ring-blue-500/60 placeholder:text-white/20"
            />
          </div>
        ))}
      </div>

      {/* ── Pull button ── */}
      <button
        type="button"
        onClick={handlePull}
        disabled={status === "loading" || !token}
        className="flex items-center gap-2 px-3 py-2 rounded bg-[#101022] border border-white/10
          text-sm text-white/80 hover:text-white hover:border-white/20 transition
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 010 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Fetching…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
                0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
                -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
                .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
                -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 012-.27c.68 0
                1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56
                .82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0
                1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Pull from GitHub
          </>
        )}
      </button>

      {!token && (
        <p className="text-xs text-amber-400/80">⚠ Connect your GitHub account first (Settings → General).</p>
      )}

      {/* ── Error ── */}
      {status === "error" && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {status === "success" && pulledActivities.length === 0 && (
        <p className="text-sm text-white/40 text-center py-4">No activities found in that file.</p>
      )}

      {status === "success" && pulledActivities.length > 0 && (
        <div className="space-y-3">
          {/* select-all bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">
              {pulledActivities.length} activities · {pulledFolders.length} folders
            </span>
            <button type="button" onClick={toggleAll}
              className="text-xs text-blue-400 hover:text-blue-300 transition px-2 py-1 rounded border border-white/10 hover:border-white/20">
              {selectedIds.length === pulledActivities.length ? "Deselect all" : "Select all"}
            </button>
          </div>

          {/* list */}
          <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar pr-1 rounded-md border border-white/5 p-2 bg-[#0d0d1f]">
            {pulledFolders.map((f) => <FolderBlock key={f.id} folder={f} />)}
            {rootActivities.map((a) => <ActivityRow key={a.id} activity={a} />)}
          </div>

          {/* import button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm transition
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Import {selectedIds.length > 0 ? `${selectedIds.length} ` : ""}selected
            </button>
            {imported && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Imported!
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default GitHubImportSection;