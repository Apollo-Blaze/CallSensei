import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { handlePush as handlePushGithub } from "../../../utils/githubActivities";
import { duplicateActivity, deleteActivity, renameActivity, setSelectedActivity } from "../../../state/activitiesSlice";
import type { ActivityModel } from "../../../models/ActivityModel";
import type { RootState } from "../../../state/store";
import ActivityMenu from "./ActivityMenu";
import ActivityName from "./ActivityName";
import { PushIcon } from "./Icons";
import { activityStyles } from "./ActivityStyles";

const METHOD_BADGE: Record<string, { color: string; bg: string; border: string }> = {
  GET:     { color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)"  },
  POST:    { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.25)"  },
  PUT:     { color: "#f59e0b", bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.25)"  },
  PATCH:   { color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.25)" },
  DELETE:  { color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)" },
  HEAD:    { color: "#94a3b8", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.20)" },
  OPTIONS: { color: "#fb923c", bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.25)"  },
};

interface ActivityCardProps {
  activity: ActivityModel;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDuplicate?: (originalId: string) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, selectedId, onSelect, onDuplicate }) => {
  const dispatch = useDispatch();
  const selectedActivityId = useSelector((state: RootState) => state.activities.selectedActivityId);
  const isSelected = selectedActivityId === activity.id;

  const badge = METHOD_BADGE[(activity.request?.method ?? "GET").toUpperCase()] ?? METHOD_BADGE["GET"];
  const methodLabel = (activity.request?.method ?? "GET").toUpperCase();
  const urlPreview = activity.url || activity.request?.url || "";
  const displayName = activity.name || activity.url || activity.id;

  const handleDuplicate = () => {
    dispatch(duplicateActivity(activity.id));
    if (onDuplicate) setTimeout(() => onDuplicate(activity.id), 100);
  };

  return (
    <li
      className={`group/card ${activityStyles.card.base} ${isSelected ? activityStyles.card.selected : activityStyles.card.unselected}`}
      onClick={() => dispatch(setSelectedActivity(activity.id))}
      style={{
        backgroundImage: isSelected
          ? "linear-gradient(160deg, rgba(34,211,238,0.07) 0%, rgba(34,211,238,0.02) 40%, transparent 70%)"
          : "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 40%, transparent 70%)",
      }}
    >
      {/* Name */}
      <div className="w-full min-w-0 mb-1.5">
        <ActivityName
          activityId={activity.id}
          name={displayName}
          onRename={(id, name) => dispatch(renameActivity({ id, name }))}
        />
      </div>

      {/* Method badge + URL */}
      <div className="flex items-center gap-1.5 w-full min-w-0 mb-2">
        <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md font-mono text-[0.6rem] font-bold uppercase tracking-wide"
          style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, backdropFilter: "blur(6px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          {methodLabel}
        </span>
        <span className="text-[0.68rem] text-slate-400 truncate min-w-0 flex-1">
          {urlPreview || "No URL set"}
        </span>
      </div>

      {/* Push + menu */}
      <div className="flex items-center justify-between w-full overflow-hidden gap-2">
        <button type="button" onClick={(e) => { e.stopPropagation(); handlePushGithub(); }}
          title="Push to GitHub"
          className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.65rem] font-medium transition-all duration-150 focus:outline-none"
          style={{ color: "#64748b", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(148,163,184,0.12)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#cbd5e1"; e.currentTarget.style.borderColor = "rgba(148,163,184,0.25)"; e.currentTarget.style.background = "rgba(15,23,42,0.65)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(148,163,184,0.12)"; e.currentTarget.style.background = "rgba(15,23,42,0.4)"; }}
        >
          <PushIcon /> Push
        </button>
        <div className="flex-shrink-0">
          <ActivityMenu activityId={activity.id} onDuplicate={handleDuplicate} onDelete={() => dispatch(deleteActivity(activity.id))} />
        </div>
      </div>
    </li>
  );
};

export default ActivityCard;