import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../state/store";
import ActivityCard from "./activityCard/ActivityCard";
import type { ActivityModel } from "../../models/ActivityModel";
import type { FolderModel } from "../../models/FolderModel";
import { moveNode, deleteFolder } from "../../state/activitiesSlice";

interface ActivityListProps {
    onSelect: (id: string) => void;
    selectedId: string | null;
}

export function ActivityList({ onSelect, selectedId }: ActivityListProps) {
    const dispatch = useDispatch();
    const activities = useSelector((state: RootState) => state.activities.activities);
    const folders = useSelector((state: RootState) => state.activities.folders);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set()); // empty = all expanded

    const handleDuplicate = (originalId: string) => {
        const latestActivity = activities[activities.length - 1];
        if (
            latestActivity &&
            latestActivity.id !== originalId &&
            (latestActivity as any).title?.includes('(copy)')
        ) {
            onSelect(latestActivity.id);
        }
    };

    const tree = useMemo(() => {
        const childrenByParent: Record<string, { folders: FolderModel[]; activities: ActivityModel[] }> = {};
        const getBucket = (parentId?: string) => {
            const key = parentId || 'root';
            if (!childrenByParent[key]) childrenByParent[key] = { folders: [], activities: [] };
            return childrenByParent[key];
        };
        folders.forEach(f => getBucket(f.parentId).folders.push(f));
        activities.forEach(a => getBucket(a.parentId).activities.push(a));
        return childrenByParent;
    }, [activities, folders]);

    const isInvalidFolderDrop = (dragFolderId: string, dropFolderId?: string) => {
        if (!dropFolderId) return false;
        if (dragFolderId === dropFolderId) return true;
        let current: string | undefined = dropFolderId;
        const parentById: Record<string, string | undefined> = {};
        folders.forEach(f => { parentById[f.id] = f.parentId; });
        while (current) {
            if (current === dragFolderId) return true;
            current = parentById[current];
        }
        return false;
    };

    const onDropToFolder = (folderId?: string) => (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const nodeType = e.dataTransfer.getData('type') as 'activity' | 'folder';
        const id = e.dataTransfer.getData('id');
        if (!nodeType || !id) {
            console.log('Drop ignored: missing type or id');
            return;
        }
        if (nodeType === 'folder' && isInvalidFolderDrop(id, folderId)) {
            console.log('Invalid drop: cannot drop folder into itself/descendant');
            return;
        }
        console.log('Dropping', nodeType, id, 'into', folderId || 'root');
        dispatch(moveNode({ nodeType, id, newParentId: folderId }));
        if (folderId) {
            setCollapsed(prev => {
                const next = new Set(prev);
                next.delete(folderId);
                return next;
            });
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const renderFolder = (folder?: FolderModel) => {
        const key = folder ? folder.id : 'root';
        const bucket = tree[key] || { folders: [], activities: [] };
        return (
            <li key={key} onDragOver={onDragOver} onDrop={onDropToFolder(folder?.id)}>
                {folder && (
                    <div
                        className="text-white font-semibold py-1 cursor-pointer select-none flex items-center gap-2"
                        onDragOver={onDragOver}
                        onDrop={onDropToFolder(folder.id)}
                    >
                        <button
                            className="text-xs"
                            onClick={(ev) => {
                                ev.stopPropagation();
                                setCollapsed(prev => {
                                    const next = new Set(prev);
                                    if (next.has(folder.id)) next.delete(folder.id); else next.add(folder.id);
                                    return next;
                                });
                            }}
                            title={collapsed.has(folder.id) ? 'Expand' : 'Collapse'}
                        >
                            {collapsed.has(folder.id) ? '▶' : '▼'}
                        </button>
                        <span
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('type', 'folder');
                                e.dataTransfer.setData('id', folder.id);
                            }}
                            title="Drag to move folder"
                        >
                            📁 {folder.name}
                        </span>
                        <button
                            className="text-xs text-red-400 hover:text-red-300 ml-auto"
                            onClick={(ev) => { ev.stopPropagation(); dispatch(deleteFolder(folder.id)); }}
                            title="Delete folder"
                        >
                            ✕
                        </button>
                    </div>
                )}
                {!folder || !collapsed.has(folder.id) ? (
                <ul className="pl-3">
                    {bucket.folders.map(childFolder => renderFolder(childFolder))}
                    {bucket.activities.map(activity => (
                        <div
                            key={activity.id}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('type', 'activity');
                                e.dataTransfer.setData('id', activity.id);
                            }}
                        >
                            <ActivityCard
                                activity={activity}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                onDuplicate={handleDuplicate}
                            />
                        </div>
                    ))}
                </ul>
                ) : null}
            </li>
        );
    };

    return (
        <div>
            <ul onDragOver={onDragOver} onDrop={onDropToFolder(undefined)}>
                {renderFolder(undefined)}
            </ul>
        </div>
    );
}


