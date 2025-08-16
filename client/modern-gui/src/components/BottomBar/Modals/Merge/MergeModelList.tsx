import { JSX } from 'react';
import { RVCModelSlot } from '@dannadori/voice-changer-client-js';
import { CSS_CLASSES } from '../../../../styles/constants';

interface ModelMergeInfo {
  slot: RVCModelSlot;
  percentage: number;
}

interface MergeModelListProps {
  models: RVCModelSlot[];
  selectedModels: ModelMergeInfo[];
  onModelToggle: (slot: RVCModelSlot) => void;
  onPercentageChange: (slotIndex: number, percentage: number) => void;
  modelDir: string;
}

function MergeModelList({ models, selectedModels, onModelToggle, onPercentageChange, modelDir }: MergeModelListProps): JSX.Element {

  // ---------------- Functions ----------------

  // Check if a model is selected
  const isModelSelected = (slot: RVCModelSlot) => {
    return selectedModels.some(m => m.slot.slotIndex === slot.slotIndex);
  };

  // Get model percentage
  const getModelPercentage = (slot: RVCModelSlot) => {
    const found = selectedModels.find(m => m.slot.slotIndex === slot.slotIndex);
    return found ? found.percentage : 50;
  };

  // Generate placeholder without using hook (inline SVG generation)
  const generatePlaceholder = (name: string): string => {
    const initial = name.charAt(0).toUpperCase();
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14'];
    const bgColor = colors[Math.abs(hash) % colors.length];

    return `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}" rx="3.2"/>
        <text x="50%" y="50%" font-family="Arial" font-size="12.8" 
              fill="#ffffff" text-anchor="middle" dy=".3em">${initial}</text>
      </svg>
    `)}`;
  };

  // Handle model card click
  const handleModelCardClick = (model: RVCModelSlot) => {
    const isSelected = isModelSelected(model);
    if (!isSelected) {
      onModelToggle(model);
    }
  };

  // ---------------- Render ----------------
  
  return (
    <div className="space-y-3">
      <h4 className="text-md font-medium text-slate-700 dark:text-gray-200">Available Models</h4>

      {models.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-gray-400">
          <p>No models match the current filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {models.map((model) => {
            const isSelected = isModelSelected(model);
            const percentage = getModelPercentage(model);
            const icon = model.iconFile.length > 0 ? "/" + modelDir + "/" + model.slotIndex + "/" + model.iconFile.split(/[\/\\]/).pop() : "";
            const placeholder = generatePlaceholder(model.name);

            return (
              <div
                key={model.slotIndex}
                className={`p-3 rounded-lg border transition-all duration-150 ${isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                    : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer'
                  }`}
                onClick={() => handleModelCardClick(model)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onModelToggle(model);
                      }}
                      className={CSS_CLASSES.checkbox}
                    />
                    <img
                      src={icon.length > 0 ? icon : placeholder}
                      alt={model.name}
                      className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                    />
                    <div>
                      <div className="font-medium text-slate-800 dark:text-gray-200">
                        {model.name || `Model ${model.slotIndex}`}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">
                        {model.embedder || 'Unknown'} • {model.samplingRate || 'Unknown'} Hz • {model.voiceChangerType || 'RVC'}{model.version || '1'}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 ml-2">
                      {percentage}%
                    </div>
                  )}
                </div>

                {isSelected && (
                  <div className="mt-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={percentage}
                      onChange={(e) => onPercentageChange(model.slotIndex, Number(e.target.value))}
                      className={CSS_CLASSES.range}
                    />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mt-1 relative">
                      <span>0%</span>
                      <span className="absolute left-1/2 transform -translate-x-1/2">50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedModels.length > 0 && (
        <div className="pt-3 border-t border-slate-200 dark:border-gray-700">
          <div className="text-sm text-slate-600 dark:text-gray-400">
            Selected models: {selectedModels.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-gray-500 mt-1">
            Total weight: {selectedModels.reduce((sum, m) => sum + m.percentage, 0)}%
          </div>
        </div>
      )}
    </div>
  );
}

export default MergeModelList;