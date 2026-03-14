import React, { useState } from "react";
import { FiSettings, FiMenu, FiGitPullRequest } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import SettingsModal from "../settings/SettingsModal";

interface NavbarProps {
  onAIClick: () => void;
  isAIPanelOpen: boolean;
  onPatchClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAIClick, isAIPanelOpen, onPatchClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="tour-navbar w-full px-4 py-3 md:px-6 md:py-4 flex items-center justify-between border-b border-slate-800/80 bg-gradient-to-r from-slate-950/80 via-slate-900/70 to-slate-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-cyan-400/90 via-sky-500/90 to-indigo-500/90 shadow-xl shadow-cyan-500/50 flex items-center justify-center text-slate-950 text-lg font-black">
          CS
        </div>
        <div className="flex flex-col leading-tight">
          <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
            CallSensei
          </h1>
          <span className="text-[0.7rem] md:text-[0.75rem] text-slate-400">
            AI-assisted API dojo
          </span>
        </div>
      </div>
      {/* Desktop icons */}
      <div className="hidden md:flex items-center space-x-6">
        <FaRobot
          className={`tour-ai-button text-xl cursor-pointer transition-colors ${isAIPanelOpen ? 'text-blue-400' : 'text-white hover:text-blue-400'
            }`}
          title="AI"
          onClick={onAIClick}
        />
        <FiGitPullRequest
          className="text-white text-xl cursor-pointer hover:text-green-400 transition-colors"
          title="Patch Review"
          onClick={onPatchClick}
        />
        <FiSettings
          className="text-white text-xl cursor-pointer hover:text-blue-400 transition-colors"
          title="Settings"
          onClick={() => setSettingsOpen(true)}
        />
      </div>
      {/* Mobile menu */}
      <div className="md:hidden flex items-center relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white text-2xl focus:outline-none"
          aria-label="Open menu"
        >
          <FiMenu />
        </button>
        {menuOpen && (
          <div className="fixed top-0 right-0 mt-14 mr-3 bg-slate-950/95 border border-slate-800 shadow-xl rounded-xl flex flex-col items-end p-4 z-50 space-y-4">
            <FaRobot
              className={`text-xl mb-4 cursor-pointer transition-colors ${isAIPanelOpen ? 'text-blue-400' : 'text-white hover:text-blue-400'
                }`}
              title="AI"
              onClick={() => {
                onAIClick();
                setMenuOpen(false);
              }}
            />
            <FiGitPullRequest
              className="text-white text-xl cursor-pointer hover:text-green-400 transition-colors"
              title="Patch Review"
              onClick={() => {
                onPatchClick && onPatchClick();
                setMenuOpen(false);
              }}
            />
            <FiSettings
              className="text-white text-xl cursor-pointer hover:text-blue-400 transition-colors"
              title="Settings"
              onClick={() => {
                setSettingsOpen(true);
                setMenuOpen(false);
              }}
            />
          </div>
        )}
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
};

export default Navbar;