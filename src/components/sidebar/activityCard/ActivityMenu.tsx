import React, { useState, useRef, useEffect } from "react";
import { activityStyles, activityConstants } from "./ActivityStyles";

interface ActivityMenuProps {
    activityId: string;
    onDuplicate: () => void;
    onDelete: () => void;
}

const ActivityMenu: React.FC<ActivityMenuProps> = ({ activityId, onDuplicate, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Handle click outside menu
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleDuplicate = () => {
        onDuplicate();
        setIsOpen(false);
    };

    const handleDelete = () => {
        onDelete();
        setIsOpen(false);
    };

    return (
        <div className={activityStyles.menu.container}>
            <button
                className={activityStyles.menu.button}
                onClick={handleMenuToggle}
            >
                {activityConstants.menuEllipsis}
            </button>

            {isOpen && (
                <div
                    ref={menuRef}
                    className={activityStyles.menu.dropdown}
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        className={activityStyles.menu.item}
                        onClick={handleDuplicate}
                    >
                        Duplicate
                    </button>
                    <button
                        className={activityStyles.menu.deleteItem}
                        onClick={handleDelete}
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActivityMenu; 