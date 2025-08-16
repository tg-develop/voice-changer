import { RVCModelSlot } from "@dannadori/voice-changer-client-js";
import { CSS_CLASSES } from "../../styles/constants"
import DebouncedSlider from "../Helpers/DebouncedSlider"

interface ModelSettingsProps {
  model: RVCModelSlot;
  handlePitchChange: (val: number) => void;
  handleFormatShiftChange: (val: number) => void;
  handleIndexRatioChange: (val: number) => void;
  handleSpeakerChange: (val: number) => void;
  setModel: (model: RVCModelSlot) => void;
}

function ModelSettings({ model, handlePitchChange, handleFormatShiftChange, handleIndexRatioChange, handleSpeakerChange, setModel }: ModelSettingsProps) {
  // ---------------- State ----------------
  let speakerOptions: JSX.Element[] = [];
  if (model && model.speakers && Object.keys(model.speakers).length > 0) {
    speakerOptions = Object.entries(model.speakers).map(([id, name]) => (
      <option key={id} value={id}>{name as string}</option>
    ));
  } else {
    speakerOptions = [<option key="no-speakers" value={0} disabled>No speakers</option>];
  }

  // ---------------- Render ----------------

  return (
    <div className={`space-y-4 ${!model ? 'opacity-50 pointer-events-none' : ''}`}>
      <div>
        <label htmlFor="pitch" className={CSS_CLASSES.label}>Pitch:</label>
        <DebouncedSlider
          id="pitch"
          name="pitch"
          min={-50}
          max={50}
          step={1}
          value={model?.defaultTune || 0}
          onChange={handlePitchChange}
          onImmediateChange={(val) => setModel({ ...model, defaultTune: val })}
          className={CSS_CLASSES.range}
          disabled={!model}
        />
        <p className={CSS_CLASSES.sliderValue}>{model?.defaultTune || 0}</p>
      </div>
      <div>
        <label htmlFor="formatShift" className={CSS_CLASSES.label}>Formant Shift:</label>
        <DebouncedSlider
          id="formatShift"
          name="formatShift"
          min={-5}
          max={5}
          step={0.1}
          value={model?.defaultFormantShift ?? 0}
          onChange={handleFormatShiftChange}
          onImmediateChange={(val) => setModel({ ...model, defaultFormantShift: val })}
          className={CSS_CLASSES.range}
          disabled={!model}
        />
        <p className={CSS_CLASSES.sliderValue}>{(model?.defaultFormantShift ?? 0).toFixed(1)}</p>
      </div>
      {model.indexFile !== "" && (
        <div>
          <label htmlFor="indexRatio" className={CSS_CLASSES.label}>Index Ratio:</label>
          <DebouncedSlider
            id="indexRatio"
            name="indexRatio"
            min={0}
            max={1}
            step={0.01}
            value={model?.defaultIndexRatio ?? 0.5}
            onChange={handleIndexRatioChange}
            onImmediateChange={(val) => setModel({ ...model, defaultIndexRatio: val })}
            className={CSS_CLASSES.range}
            disabled={!model}
          />
          <p className={CSS_CLASSES.sliderValue}>{(model?.defaultIndexRatio ?? 0.5).toFixed(2)}</p>
        </div>
      )}
      {
        // Only show speaker selection if there is more than one speaker
        model.speakers && Object.keys(model.speakers).length > 1 && (
          <div className="flex items-center space-x-2">
            <label htmlFor="speaker" className={CSS_CLASSES.label}>Speaker:</label>
            <select
              id="speaker"
              name="speaker"
              className={CSS_CLASSES.select}
              disabled={!model || !model.speakers || Object.keys(model.speakers).length === 0}
              value={model?.slotIndex ?? 0}
              onChange={(e) => handleSpeakerChange(Number(e.target.value))}
            >
              {speakerOptions}
            </select>
          </div>
        )
      }
    </div>
  )
}

export default ModelSettings
