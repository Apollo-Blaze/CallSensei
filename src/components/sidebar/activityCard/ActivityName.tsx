import React, { useState } from "react";
import { activityStyles, activityConstants } from "./ActivityStyles";

interface ActivityNameProps {
    activityId: string;
    name: string;
    onRename: (id: string, newName: string) => void;
}

const ActivityName: React.FC<ActivityNameProps> = ({ activityId, name, onRename }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(name);

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditValue(name);
    };

    const handleRename = () => {
        if (editValue.trim() && editValue.trim() !== name) {
            onRename(activityId, editValue.trim());
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditValue(name);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleRename();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <input
                className={activityStyles.input.edit}
                value={editValue}
                autoFocus
                onChange={e => setEditValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
            />
        );
    }

    return (
        <span
            className={activityStyles.name.display}
            title={`${name}${activityConstants.renameTooltip}`}
            onDoubleClick={handleDoubleClick}
        >
            {name}
        </span>
    );
};

export default ActivityName; 