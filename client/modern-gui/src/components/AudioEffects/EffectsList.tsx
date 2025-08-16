import { JSX, useState, useRef, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faGripVertical, faVolumeUp, faVolumeMute, faMicrophone, faVolumeHigh, faCog } from '@fortawesome/free-solid-svg-icons';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AudioEffect, AudioChannel } from '@dannadori/voice-changer-client-js';
import { getEffectDefinition } from './serverEffectsUtils';
import AddEffectModal from './AddEffectModal';
import { CSS_CLASSES } from '../../styles/constants';

// UI type with index for client-side management
type AudioEffectWithIndex = AudioEffect & { index: number };

interface EffectsListProps {
  effects: AudioEffectWithIndex[];
  selectedEffectIndex: number | null;
  onEffectSelect: (effectIndex: number) => void;
  onEffectAdd: (effectType: string, channel: AudioChannel) => void;
  onEffectDelete: (effectIndex: number) => void;
  onEffectToggle: (effectIndex: number) => void;
  onEffectReorder: (effects: AudioEffectWithIndex[]) => void;
  serverSchema?: any; // AudioEffectsSchema from server
  providersInfo?: any; // AudioEffectsProvidersResponse from server
}

interface SortableEffectItemProps {
  effect: AudioEffectWithIndex;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggle: () => void;
  serverSchema?: any;
}

function SortableEffectItem({ effect, isSelected, onSelect, onDelete, onToggle, serverSchema }: SortableEffectItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: effect.index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-md border cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
          : 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:border-slate-300 dark:hover:border-gray-500'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Order indicator */}
          <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs font-medium">
            {effect.index + 1}
          </div>
          
          <button
            {...attributes}
            {...listeners}
            className={`${CSS_CLASSES.iconButton} cursor-grab active:cursor-grabbing`}
            title="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <FontAwesomeIcon icon={faGripVertical} className="h-4 w-4" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`${CSS_CLASSES.iconButton} ${
              effect.enabled 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-slate-400 dark:text-gray-500'
            }`}
            title={effect.enabled ? 'Disable' : 'Enable'}
          >
            <FontAwesomeIcon 
              icon={effect.enabled ? faVolumeUp : faVolumeMute} 
              className="h-4 w-4" 
            />
          </button>
          
          <div>
            <div className="font-medium text-slate-700 dark:text-gray-200 text-sm">
              {getEffectDefinition(effect.type, serverSchema)?.name || effect.type}
            </div>
            <div className="text-xs text-slate-500 dark:text-gray-400 flex items-center space-x-2">
              <span className="capitalize">{effect.type}</span>
              {getEffectDefinition(effect.type, serverSchema)?.provider && (
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded text-xs">
                  {getEffectDefinition(effect.type, serverSchema)?.provider}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={`${CSS_CLASSES.iconButton} text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300`}
          title="Delete"
        >
          <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function EffectsList({ 
  effects = [], 
  selectedEffectIndex, 
  onEffectSelect, 
  onEffectAdd, 
  onEffectDelete,
  onEffectToggle,
  onEffectReorder,
  serverSchema,
  providersInfo
}: EffectsListProps): JSX.Element {
  const [activeChannel, setActiveChannel] = useState<AudioChannel>('input');
  const [showAddModal, setShowAddModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const channelEffects = useMemo(() => {
    if (!effects || !Array.isArray(effects)) return [];
    return effects
      .filter(effect => effect.channel === activeChannel)
      .sort((a, b) => a.index - b.index);
  }, [effects, activeChannel]);

  // Count active effects per channel
  const inputEffectsCount = useMemo(() => {
    return effects.filter(effect => effect.channel === 'input' && effect.enabled).length;
  }, [effects]);

  const outputEffectsCount = useMemo(() => {
    return effects.filter(effect => effect.channel === 'output' && effect.enabled).length;
  }, [effects]);

  // Performance optimization: prevent unnecessary re-renders
  const memoizedSortableItems = useMemo(() => {
    return channelEffects.map(e => e.index.toString());
  }, [channelEffects]);

  const handleAddEffect = (effectType: string, channel: AudioChannel) => {
    onEffectAdd(effectType, channel);
    setShowAddModal(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !channelEffects.length) return;

    const oldIndex = channelEffects.findIndex(e => e.index.toString() === active.id);
    const newIndex = channelEffects.findIndex(e => e.index.toString() === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedChannelEffects = arrayMove(channelEffects, oldIndex, newIndex);
      
      // Merge with other channel effects, maintaining global order
      const otherChannelEffects = effects?.filter(e => e.channel !== activeChannel) || [];
      const allEffects = [...otherChannelEffects, ...reorderedChannelEffects];
      
      onEffectReorder(allEffects);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Channel Tabs */}
      <div className="flex mb-3 bg-slate-100 dark:bg-gray-700 rounded-md p-1">
        <button
          onClick={() => setActiveChannel('input')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
            activeChannel === 'input'
              ? 'bg-white dark:bg-gray-600 text-slate-700 dark:text-gray-200 shadow-sm'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center justify-center space-x-1">
            <span>Input</span>
            {inputEffectsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded-full">
                {inputEffectsCount}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveChannel('output')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
            activeChannel === 'output'
              ? 'bg-white dark:bg-gray-600 text-slate-700 dark:text-gray-200 shadow-sm'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center justify-center space-x-1">
            <span>Output</span>
            {outputEffectsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-xs rounded-full">
                {outputEffectsCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-gray-600">
        <div>
          <h5 className="font-medium text-slate-700 dark:text-gray-200">
            {activeChannel === 'input' ? 'Input' : 'Output'} Chain
          </h5>
          <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Signal flows from top to bottom
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowAddModal(true)}
            className={`${CSS_CLASSES.iconButton} text-green-600 dark:text-green-400`}
            title="Add Effect"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Effects List with Drag and Drop */}
      <div className="flex-1 overflow-y-auto">
        {channelEffects.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-gray-400 text-sm">
            No {activeChannel} effects added yet.
            <br />
            Click the + button to add an effect.
          </div>
        ) : (
          <div className="space-y-1">
            {/* Signal Source Icon */}
            <div className="flex justify-center py-2">
              <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-gray-700 rounded-md">
                <FontAwesomeIcon 
                  icon={activeChannel === 'input' ? faMicrophone : faCog} 
                  className={`h-4 w-4 ${
                    activeChannel === 'input' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-purple-600 dark:text-purple-400'
                  }`}
                />
                <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">
                  {activeChannel === 'input' ? 'Audio Input' : 'From Processing'}
                </span>
              </div>
            </div>
            
            {/* Connection line from source */}
            <div className="flex justify-center py-1">
              <div className="w-0.5 h-4 bg-slate-300 dark:bg-gray-600"></div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={memoizedSortableItems}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {channelEffects.map((effect, channelIndex) => (
                    <div key={effect.index}>
                      <SortableEffectItem
                        effect={effect}
                        isSelected={selectedEffectIndex === effect.index}
                        onSelect={() => onEffectSelect(effect.index)}
                        onDelete={() => onEffectDelete(effect.index)}
                        onToggle={() => onEffectToggle(effect.index)}
                        serverSchema={serverSchema}
                      />
                      {channelIndex < channelEffects.length - 1 && (
                        <div className="flex justify-center py-1">
                          <div className="w-0.5 h-4 bg-slate-300 dark:bg-gray-600"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Connection line to destination */}
            <div className="flex justify-center py-1">
              <div className="w-0.5 h-4 bg-slate-300 dark:bg-gray-600"></div>
            </div>

            {/* Signal Destination Icon */}
            <div className="flex justify-center py-2">
              <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-gray-700 rounded-md">
                <FontAwesomeIcon 
                  icon={activeChannel === 'input' ? faCog : faVolumeHigh} 
                  className={`h-4 w-4 ${
                    activeChannel === 'input' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-purple-600 dark:text-purple-400'
                  }`}
                />
                <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">
                  {activeChannel === 'input' ? 'To Processing' : 'Audio Output'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Effect Modal */}
      <AddEffectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddEffect={handleAddEffect}
        channel={activeChannel}
        serverSchema={serverSchema}
        providersInfo={providersInfo}
      />
    </div>
  );
}

export default EffectsList;