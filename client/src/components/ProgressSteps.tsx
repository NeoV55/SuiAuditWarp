import React from "react";

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressSteps({ currentStep, totalSteps }: ProgressStepsProps) {
  return (
    <div className="flex items-center justify-between mb-8 max-w-3xl">
      {Array.from({ length: totalSteps }).map((_, index) => {
        // Using a div instead of React.Fragment to avoid React warnings
        return (
          <div key={index} className="flex items-center">
            <div className="flex items-center">
              {currentStep > index + 1 ? (
                <div className="progress-step-completed w-8 h-8 rounded-full flex items-center justify-center bg-primary-600 text-white">
                  <span className="material-icons text-sm">check</span>
                </div>
              ) : currentStep === index + 1 ? (
                <div className="progress-step-active w-8 h-8 rounded-full flex items-center justify-center bg-primary-500 text-white font-medium">
                  {index + 1}
                </div>
              ) : (
                <div className="progress-step-pending w-8 h-8 rounded-full flex items-center justify-center bg-dark-700 text-gray-400">
                  {index + 1}
                </div>
              )}
            </div>
            
            {index < totalSteps - 1 && (
              <div 
                className={`progress-line h-1 w-16 md:w-32 ${
                  currentStep > index + 1 ? "bg-primary-500" : "bg-dark-700"
                }`}
              ></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
