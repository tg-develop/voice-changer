import React from 'react';

const WelcomeModal: React.FC = () => {
  return (
    <div className="text-center">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to the Voice Changer App
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Click on "Continue" to start the application and initialize the audio engine.
        </p>
      </div>

      <div className="mb-4 p-4 bg-slate-100 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-slate-700 dark:text-blue-200">
          <strong>Note:</strong> For optimal functionality, this app requires access to your audio system.
        </p>
      </div>
    </div>
  );
};

export default WelcomeModal;