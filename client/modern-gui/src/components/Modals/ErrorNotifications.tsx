import React from 'react';

type ErrorType = 'Error' | 'Warning' | 'Confirm';

export interface UIError {
  id: number;
  message: string;
  type: ErrorType;
}

interface ErrorNotificationsProps {
  errors: UIError[];
  removeError: (id: number) => void;
}

const ErrorNotifications: React.FC<ErrorNotificationsProps> = ({ errors, removeError }) => (

  // ---------------- Render ----------------


  <div className="fixed top-4 right-4 space-y-2 z-50">
    {errors.map(err => (
      <div
        key={err.id}
        className={`max-w-sm w-full p-4 rounded shadow flex justify-between items-start
          ${err.type === 'Error' ? 'bg-red-100 border border-red-400' : ''}
          ${err.type === 'Warning' ? 'bg-yellow-100 border border-yellow-400' : ''}
          ${err.type === 'Confirm' ? 'bg-blue-100 border border-blue-400' : ''}`}
      >
        <div>
          <strong className="block text-sm font-medium">{err.type}</strong>
          <p className="text-sm">{err.message}</p>
        </div>
        <button
          onClick={() => removeError(err.id)}
          className="ml-4 text-lg font-bold leading-none"
        >
          &times;
        </button>
      </div>
    ))}
  </div>
);

export default ErrorNotifications;
