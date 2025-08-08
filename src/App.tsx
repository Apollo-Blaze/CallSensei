import React, { useState } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import MainWindow from "./components/MainWindow";



const App: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiExplanation, setAIExplanation] = useState<string>("");

  return (
    <div className="flex h-screen bg-[#0b0b1ff8] w-screen">
      <Sidebar onSelect={setSelectedId} selectedId={selectedId} />
      <MainWindow
        selectedId={selectedId}
        setAIExplanation={setAIExplanation}
        aiExplanation={aiExplanation}
      />
    </div>
  );
};

export default App;