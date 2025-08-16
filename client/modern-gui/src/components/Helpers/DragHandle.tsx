import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsAlt } from '@fortawesome/free-solid-svg-icons';

interface DragHandleProps {
  // Pass attributes and listeners from useSortable down to this handle
  attributes?: Record<string, any>;
  listeners?: Record<string, any>;
  className?: string;
  title?: string;
}

const DragHandle: React.FC<DragHandleProps> = ({ attributes, listeners, className, title = "Drag" }) => {
  return (
    <button 
      {...attributes} 
      {...listeners} 
      className={`p-1 text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-grab ${className}`}
      title={title}
    >
      <FontAwesomeIcon icon={faArrowsAlt} className="h-5 w-5" />
    </button>
  );
};

export default DragHandle; 