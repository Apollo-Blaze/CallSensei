import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../Navbar";
import PatchReview from "./ai/PatchReview";
import TerminalAndPatchReview from "./terminal/TerminalAndPatchReview";
import AIPanel from "./ai/AIPanel";
import RequestForm from "../request/RequestForm";
import ResponseViewer from "../response/ResponseViewer";

interface MainWindowProps {
    selectedId: string | null;
    setAIExplanation: (explanation: string) => void;
    aiExplanation: string;
}

const MainWindow: React.FC<MainWindowProps> = ({
    selectedId,
    setAIExplanation,
    aiExplanation
}) => {
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [isPatchOpen, setIsPatchOpen] = useState(false);

    // Cache one PatchReview+Terminal panel per activityId while the patch UI is open.
    // We hide/show instead of remounting, so terminal + file selection state persists
    // when switching activities.
    const [cachedPatchActivityIds, setCachedPatchActivityIds] = useState<string[]>([]);

    useEffect(() => {
        if (!isPatchOpen) {
            setCachedPatchActivityIds([]);
            return;
        }
        if (!selectedId) return;

        setCachedPatchActivityIds(prev =>
            prev.includes(selectedId) ? prev : [...prev, selectedId]
        );
    }, [isPatchOpen, selectedId]);

    const cachedPanels = useMemo(() => {
        // Order matters only for render stability.
        return cachedPatchActivityIds;
    }, [cachedPatchActivityIds]);

    const handleAIClick = () => {
        setIsAIPanelOpen(!isAIPanelOpen);
    };

    const handleCloseAIPanel = () => {
        setIsAIPanelOpen(false);
    };

    return (
        <div className="flex flex-col h-full w-full">
            <Navbar onAIClick={handleAIClick} isAIPanelOpen={isAIPanelOpen} onPatchClick={() => setIsPatchOpen(!isPatchOpen)} />
            <div className="flex flex-1 overflow-hidden">
                <main className={`tour-main-content flex-1 p-8 overflow-hidden flex flex-col custom-scrollbar transition-all duration-300 ease-in-out ${isAIPanelOpen ? 'mr-0' : 'mr-0'}`}>
                    <div className="flex-1 min-h-0 overflow-auto  min-w-0">
                        <RequestForm selectedId={selectedId} setAIExplanation={setAIExplanation} />
                        <ResponseViewer />
                        {isPatchOpen && (
                            <div className="mt-6">
                                <div className="space-y-0">
                                    {cachedPanels.map(id => (
                                        <div
                                            key={id}
                                            style={{ display: id === selectedId ? 'block' : 'none' }}
                                        >
                                            <TerminalAndPatchReview activityId={id} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
                <AIPanel
                    isOpen={isAIPanelOpen}
                    onClose={handleCloseAIPanel}
                    explanation={aiExplanation}
                    onSetExplanation={setAIExplanation}
                    selectedId={selectedId}
                />
            </div>
        </div>
    );
};

export default MainWindow; 