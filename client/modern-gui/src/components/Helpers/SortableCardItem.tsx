import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCardItemProps {
  id: string;
  children: (attributes: Record<string, any>, listeners: Record<string, any>) => React.ReactNode;
  className?: string;
}

const SortableCardItem: React.FC<SortableCardItemProps> = ({ id, children, className = '' }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // Useful for styling the dragged item
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Example: make item semi-transparent when dragging
    // Ensure the card takes up full height in its grid cell if needed, or adjust layout as necessary
    // height: '100%', 
    display: 'flex', // Make it a flex container to allow child to grow
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex ${className}`}> {/* Ensure this div allows child to expand */}
      {/* Pass attributes and listeners to children, so they can be applied to a specific drag handle */}
      {children(attributes, listeners ?? {})}
    </div>
  );
};

export default SortableCardItem; 