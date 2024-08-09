import React from "react";
import { useGuiState } from "./001_GuiStateProvider";
import { TextInputDialog } from "./911_TextInputDialog";
import { WaitingDialog } from "./902_WaitingDialog";

export const Dialogs2 = () => {
    const guiState = useGuiState();
    const dialogs = (
        <div>
            {guiState.stateControls.showWaitingCheckbox.trigger}
            {guiState.stateControls.showTextInputCheckbox.trigger}
            {guiState.stateControls.showLicenseCheckbox.trigger}
            <div className="dialog-container2" id="dialog2">
                {guiState.stateControls.showWaitingCheckbox.trigger}
                <WaitingDialog></WaitingDialog>
                {guiState.stateControls.showTextInputCheckbox.trigger}
                <TextInputDialog></TextInputDialog>
                {guiState.stateControls.showLicenseCheckbox.trigger}
            </div>
        </div>
    );

    return dialogs;
};
