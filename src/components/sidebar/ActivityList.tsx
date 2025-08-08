import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../state/store";
import ActivityCard from "./activityCard/ActivityCard";

interface ActivityListProps {
    onSelect: (id: string) => void;
    selectedId: string | null;
}

const ActivityList: React.FC<ActivityListProps> = ({ onSelect, selectedId }) => {
    const activities = useSelector((state: RootState) => state.activities.activities);

    const handleDuplicate = (originalId: string) => {
        // Find the latest activity that is a copy and select it
        const latestActivity = activities[activities.length - 1];
        if (latestActivity && latestActivity.id !== originalId && latestActivity.name?.includes('(copy)')) {
            console.log('Selecting duplicated activity:', latestActivity.id);
            onSelect(latestActivity.id);
        }
    };

    return (
        <div>
            <ul>
                {activities.map((activity) => (
                    <ActivityCard
                        key={activity.id}
                        activity={activity}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onDuplicate={handleDuplicate}
                    />
                ))}
            </ul>
        </div>
    );
};

export default ActivityList; 