import React, { useState } from "react";
import Navbar from "../Navbar";
import AIExplanation from "./ai/AIExplanation";
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

    const handleAIClick = () => {
        setIsAIPanelOpen(!isAIPanelOpen);
    };

    const handleCloseAIPanel = () => {
        setIsAIPanelOpen(false);
    };

    return (
        <div className="flex flex-col h-full w-full">
            <Navbar onAIClick={handleAIClick} isAIPanelOpen={isAIPanelOpen} />
            <div className="flex flex-1 overflow-hidden">
                <main className={`tour-main-content flex-1 p-8 overflow-hidden flex flex-col custom-scrollbar transition-all duration-300 ease-in-out ${isAIPanelOpen ? 'mr-0' : 'mr-0'}`}>
                    <div className="flex-1 min-h-0 overflow-auto  min-w-0">
                        <RequestForm selectedId={selectedId} setAIExplanation={setAIExplanation} />
                        <ResponseViewer />
                        <AIExplanation explanation={aiExplanation} />
                    </div>
                </main>
                <AIPanel isOpen={isAIPanelOpen} onClose={handleCloseAIPanel} />
            </div>
        </div>
    );
};

export default MainWindow; 