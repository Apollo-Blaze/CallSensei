import React from "react";
import { FiX } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ isOpen, onClose }) => {
  return (
    <div 
      className={`tour-ai-panel h-full bg-[#18182a] shadow-2xl transition-all duration-300 ease-in-out flex flex-col ${
        isOpen ? 'w-80' : 'w-0'
      } overflow-hidden`}
    >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <FaRobot className="text-white text-xl" />
            <h2 className="text-xl font-bold text-white">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close AI panel"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-[#2a2a3a] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Welcome to CallSensei AI</h3>
              <p className="text-gray-300 text-sm">
                I'm here to help you understand API endpoints, analyze responses, and provide insights about your API calls.
              </p>
            </div>

            {/* Features Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">What I can help with:</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">Explain API endpoints and their parameters</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">Analyze response data and identify issues</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">Suggest improvements and best practices</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">Help debug API integration problems</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full bg-[#2a2a3a] hover:bg-[#3a3a4a] text-white py-2 px-4 rounded-lg transition-colors text-left">
                  Analyze current request
                </button>
                <button className="w-full bg-[#2a2a3a] hover:bg-[#3a3a4a] text-white py-2 px-4 rounded-lg transition-colors text-left">
                  Explain response format
                </button>
                <button className="w-full bg-[#2a2a3a] hover:bg-[#3a3a4a] text-white py-2 px-4 rounded-lg transition-colors text-left">
                  Suggest optimizations
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="bg-[#2a2a3a] rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-sm">AI Assistant Online</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">Ready to help with your API calls</p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AIPanel; 