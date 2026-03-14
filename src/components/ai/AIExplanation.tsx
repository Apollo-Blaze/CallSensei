import React from "react";

interface AIExplanationProps {
  explanation: string;
}

const AIExplanation: React.FC<AIExplanationProps> = ({ explanation }) => (
  <div className="bg-darkblue-light p-4 rounded mt-4">
    <h3 className="text-lg font-semibold mb-2">AI Explanation</h3>
    <p className="text-accent whitespace-pre-line">
      {explanation || "AI will explain the endpoint and response here."}
    </p>
  </div>
);

export default AIExplanation;