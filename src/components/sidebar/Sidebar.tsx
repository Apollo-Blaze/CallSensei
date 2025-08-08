import React, { useEffect, useRef, useState } from "react";
import ActivityList from "./ActivityList";
import { useDispatch, useSelector } from "react-redux";
import { addRequest } from "../../state/activitiesSlice";
import type { RequestMethod } from "../../models";

interface SidebarProps {
    onSelect: (id: string) => void;
    selectedId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect, selectedId }) => {
    const dispatch = useDispatch();
    const activities = useSelector((state: any) => (state.activities.activities));
    const initialized = useRef(false);
    const previousActivitiesLength = useRef(activities.length);
    const [width, setWidth] = useState(260); // default 260px (~w-64)

    const sidebarRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    // Ensure at least one activity exists
    useEffect(() => {
        if (!initialized.current && activities.length === 0 && !selectedId) {
            const newReq = { method: "GET" as RequestMethod, url: "", headers: {}, body: "" };
            dispatch(addRequest(newReq));
            initialized.current = true;
        }
    }, [activities.length, dispatch, selectedId]);

    // Auto-select the latest activity if needed
    useEffect(() => {
        if (activities.length > 0) {
            const isNewActivityAdded = activities.length > previousActivitiesLength.current;
            if (!selectedId || !activities.find((a: any) => a.id === selectedId) || isNewActivityAdded) {
                const latestActivity = activities[activities.length - 1];
                console.log('Auto-selecting latest activity:', latestActivity.id, latestActivity.name, 'isNewActivityAdded:', isNewActivityAdded);
                onSelect(latestActivity.id);
            }
        }
        previousActivitiesLength.current = activities.length;
    }, [activities, selectedId, onSelect]);

    // Handle creating new activity
    const handleNewActivity = () => {
        const newReq = { method: "GET" as RequestMethod, url: "", headers: {}, body: "" };
        console.log('Creating new activity...');
        dispatch(addRequest(newReq));
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const newWidth = e.clientX;
            if (newWidth > 180 && newWidth < 500) {
                setWidth(newWidth);
            }
        };
    
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", stopResize); // ✅ use external stopResize
    
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", stopResize);
        };
    }, []);

    // Resizer drag events

    const stopResize = () => {
        isResizing.current = false;
        document.body.classList.remove("select-none");
        document.body.style.cursor = ""; // ✅ Reset to default
    };

    
    const startResize = () => {
        isResizing.current = true;
        document.body.classList.add("select-none");
        document.body.style.cursor = "col-resize"; // ✅ Force resize cursor
    };
    

    

    return (
        <div
            ref={sidebarRef}
            className="relative h-full border-r bg-[#14142bf8]"
            style={{ width }}
        >
            <div className="p-4">
                <div className="flex items-center border-b justify-between mb-2 pb-2">
                    <h2 className="text-xl font-bold text-accent border-gray-300 pb-2 mb-0">Activities</h2>
                    <button
                        className="ml-2 bg-accent text-white px-2 py-1 rounded text-xs font-semibold border border-gray-300 hover:bg-cyan-800 transition"
                        style={{ height: '2rem' }}
                        onClick={handleNewActivity}
                        title="New Activity"
                    >
                        +
                    </button>
                </div>
                <ActivityList onSelect={onSelect} selectedId={selectedId} />
            </div>

            {/* Resizer Handle */}
            <div
                onMouseDown={startResize}
                className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent transition"
                style={{ zIndex: 50 }}
            />
        </div>
    );
};

export default Sidebar;
