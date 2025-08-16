import { RVCModelSlot } from "@dannadori/voice-changer-client-js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import EditModelModal from "../LeftSideBar/Modals/EditModelModal";

interface ModelInfoProps {
  model: RVCModelSlot;
  icon: string;
}
function ModelInfo({ model, icon }: ModelInfoProps) {
  // ---------------- State ----------------
  const [showEdit, setShowEdit] = useState<boolean>(false);

  const isONNX = model?.isONNX ?? false;
  const modelTypeDisplay = isONNX
    ? model?.modelTypeOnnx || model?.modelType
    : model?.modelType;

  // ---------------- Render ----------------

  return (
    <>
      {model ? (
        <>
          <EditModelModal
            model={model}
            showModal={showEdit}
            setShowEdit={setShowEdit}
          />
          <div className="flex flex-col items-center text-center mb-6 p-4 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
            <div className="flex w-full items-start">
              <img
                src={icon}
                alt={model.name}
                className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg mb-3 mr-4 flex-shrink-0"
              />
              <div className="flex-grow text-left">
                <div className="flex items-center mb-1">
                  <h3 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-gray-100 break-words mr-2">{model.name}</h3>
                  <button
                    onClick={() => setShowEdit(true)}
                    className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                    title="Edit Model"
                  >
                    <FontAwesomeIcon icon={faPen} className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    <span className="font-semibold">Embedder:</span> {model.embedder || 'N/A'}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    <span className="font-semibold">Model Type:</span> {modelTypeDisplay || 'N/A'}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    <span className="font-semibold">Sample Rate:</span> {model.samplingRate ? `${model.samplingRate / 1000} kHz` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center mb-6 p-8 bg-slate-100 dark:bg-gray-700/50 rounded-lg min-h-[160px]">
          <p className="text-slate-500 dark:text-gray-400 italic text-center">Select a model from the list <br /> to see its settings.</p>
        </div>
      )}
    </>
  )
}

export default ModelInfo;
