import React, { useState } from "react";
import { useSelector } from "react-redux";
import Sidebar from "./components/sidebar/Sidebar";
import MainWindow from "./components/window/MainWindow";
import { useDispatch } from "react-redux";
import { setSelectedActivity } from "./state/activitiesSlice";
import type { RootState } from "./state/store";

const App: React.FC = () => {
  const dispatch = useDispatch();
  const selectedId = useSelector((state: RootState) => state.activities.selectedActivityId);
  const [aiExplanation, setAIExplanation] = useState<string>("");

  const handleSelect = (id: string) => {
    dispatch(setSelectedActivity(id));
  };

  return (
    <div className="flex h-screen bg-[#0b0b1ff8] w-screen overflow-auto">
      <Sidebar onSelect={handleSelect} selectedId={selectedId || null} />
      <MainWindow
        selectedId={selectedId || null}
        setAIExplanation={setAIExplanation}
        aiExplanation={aiExplanation}
      />
    </div>
  );
};

export default App;