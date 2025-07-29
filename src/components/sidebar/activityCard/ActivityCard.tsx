import React from "react";
import { useDispatch } from "react-redux";
import { duplicateActivity, deleteActivity, renameActivity } from "../../../state/activitiesSlice";
import type { ActivityModel } from "../../../models/ActivityModel";
import ActivityMenu from "./ActivityMenu";
import ActivityName from "./ActivityName";
import { activityStyles } from "./ActivityStyles";

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

    const handleCardClick = () => {
        console.log('Selecting activity:', activity.id, 'Current selectedId:', selectedId);
        onSelect(activity.id);
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

    const isSelected = selectedId === activity.id;
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
            </div>
        </li>
    );
};

export default ActivityCard; 