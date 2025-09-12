import React, { useState } from "react";
import { FiSettings, FiMenu, FiGitPullRequest } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";

interface NavbarProps {
  onAIClick: () => void;
  isAIPanelOpen: boolean;
  onPatchClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAIClick, isAIPanelOpen, onPatchClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="tour-navbar w-full bg-[#18182a] px-4 py-3 flex items-center justify-between shadow relative">
      <h1 className="text-2xl font-bold text-white text-left">CallSensei</h1>
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
        <FiSettings className="text-white text-xl cursor-pointer hover:text-blue-400 transition-colors" title="Settings" />
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
          <div className="fixed top-0 right-0 mt-14 bg-[#18182a] shadow-lg flex flex-col items-end p-4 z-50"
            style={{ width: "auto" }}>
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
            <FiSettings className="text-white text-xl cursor-pointer hover:text-blue-400 transition-colors" title="Settings" />
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;