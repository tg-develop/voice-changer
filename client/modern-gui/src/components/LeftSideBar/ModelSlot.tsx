import { RVCModelSlot } from "@dannadori/voice-changer-client-js";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useInitialPlaceholder } from "../../scripts/usePlaceholder";
import { useState } from "react";
import DeleteModelModal from "./Modals/DeleteModelModal";
import EditModelModal from "./Modals/EditModelModal";

interface ModelSlotProps {
  selected: boolean;
  model: RVCModelSlot;
  modelDir: string;
  handleSelectModel: (model: RVCModelSlot) => void;
}

function ModelSlot(props: ModelSlotProps) {
  // ---------------- State ----------------
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [showDelete, setShowDelete] = useState<boolean>(false);

  // Generate icon URL from model directory and icon file path (or placeholder if not existing)
  const icon = props.model.iconFile.length > 0 ? "/" + props.modelDir + "/" + props.model.slotIndex + "/" + props.model.iconFile.split(/[\/\\]/).pop() : "";
  const placeholder = useInitialPlaceholder(props.model.name);

  // ---------------- Render ----------------

  return (
    <>
      {/* Edit modal for updating model settings */}
      <EditModelModal
        model={props.model}
        showModal={showEdit}
        setShowEdit={setShowEdit}
      />
      {/* Delete confirmation modal */}
      <DeleteModelModal
        model={props.model}
        showModal={showDelete}
        setShowDelete={setShowDelete}
        modelDir={props.modelDir}
      />
      {/* Main model slot container with conditional styling for selection state */}
      <li
        className={`p-3 text-sm cursor-pointer flex items-center group text-slate-700 dark:text-slate-300 transition-colors duration-200 border-b border-slate-200 dark:border-gray-700 last:border-b-0
              ${props.selected
            ? 'bg-blue-50 dark:bg-blue-700/20 border-l-4 border-l-blue-500 dark:border-l-blue-400 pl-2 rounded-md'
            : 'hover:bg-slate-50 dark:hover:bg-gray-700/50 hover:border-l-2 hover:border-l-slate-300 dark:hover:border-l-gray-500'}`}
        onClick={() => {
          props.handleSelectModel(props.model);
        }}
      >
        {/* Model thumbnail with fallback to generated placeholder */}
        <img
          src={icon.length > 0 ? icon : placeholder}
          alt={props.model.name}
          className="w-8 h-8 md:w-10 md:h-10 rounded-md mr-3 object-cover flex-shrink-0"
        />
        {/* Model name with text truncation for long names */}
        <span className="truncate mr-2 flex-grow">{props.model.name}</span>
        <div className="flex space-x-2 md:space-x-1 items-center md:opacity-0 group-hover:md:opacity-100 transition-opacity">
          {/* Edit button - Opens model settings modal */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowEdit(true); }}
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 md:p-0"
            title="Edit Model"
          >
            <FontAwesomeIcon icon={faPen} className="h-4 w-4 md:h-3 md:w-3" />
          </button>
          {/* Delete button - Opens confirmation modal */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowDelete(true); }}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 md:p-0"
            title="Delete Model"
          >
            <FontAwesomeIcon icon={faTrash} className="h-4 w-4 md:h-3 md:w-3" />
          </button>
        </div>
      </li>
    </>
  )
}

export default ModelSlot