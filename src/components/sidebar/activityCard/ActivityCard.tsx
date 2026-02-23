import React from "react";
import { useDispatch } from "react-redux";
import { handlePush as handlePushGithub} from "../../../utils/githubActivities";
import { duplicateActivity, deleteActivity, renameActivity, setSelectedActivity } from "../../../state/activitiesSlice";
import type { ActivityModel } from "../../../models/ActivityModel";
import ActivityMenu from "./ActivityMenu";
import ActivityName from "./ActivityName";
import { activityStyles } from "./ActivityStyles";
import { useSelector } from "react-redux";
import type { RootState } from "../../../state/store";

interface ActivityCardProps {
    activity: ActivityModel;
    selectedId: string | null;
     onSelect: (id: string) => void;
    onDuplicate?: (originalId: string) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
    activity,
    selectedId,
    onSelect,
    onDuplicate
}) => {
    const dispatch = useDispatch();
    const selectedActivityId = useSelector((state: RootState) => state.activities.selectedActivityId);
    const handleCardClick = () => {
        dispatch(setSelectedActivity(activity.id));
        console.log('Selecting activity:', activity.id, 'Current selectedId:', selectedId);
       // onSelect(activity.id);
    };
   
    const handleRename = (id: string, newName: string) => {
        dispatch(renameActivity({ id, name: newName }));
    };

    const handleDuplicate = () => {
        const originalId = activity.id;
        console.log('Duplicating activity:', originalId);
        dispatch(duplicateActivity(activity.id));

        // Notify parent component to handle duplicate selection
        if (onDuplicate) {
            setTimeout(() => {
                onDuplicate(originalId);
            }, 100);
        }
    };

    const handleDelete = () => {
        dispatch(deleteActivity(activity.id));
    };

    const handlePush = () => {
        console.log("Pressed push button");
        handlePushGithub();
    };

    const isSelected = selectedActivityId === activity.id;
    const displayName = activity.name || activity.url || activity.id;

    return (
        <li
            className={`${activityStyles.card.base} ${isSelected ? activityStyles.card.selected : activityStyles.card.unselected}`}
            onClick={handleCardClick}
        >
            <div className="flex flex-col items-start">
                <ActivityName
                    activityId={activity.id}
                    name={displayName}
                    onRename={handleRename}
                />

                <ActivityMenu
                    activityId={activity.id}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                />
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePush();
                    }}
                    className="mt-2 inline-flex items-center justify-center rounded-md border border-gray-500/60 bg-transparent px-2.5 py-1 text-xs font-medium text-gray-100 hover:bg-gray-700/60 hover:border-gray-300 transition-colors"
                    title="Push this activity to GitHub"
                >
                    Push
                </button>
            </div>
        </li>
    );
};

export default ActivityCard; 