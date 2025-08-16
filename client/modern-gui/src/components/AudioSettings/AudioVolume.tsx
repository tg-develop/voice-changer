import { JSX, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faVolumeUp, faHeadphones } from '@fortawesome/free-solid-svg-icons';
import { useAppState } from '../../context/AppContext';
import { CSS_CLASSES } from '../../styles/constants';
import DebouncedSlider from '../Helpers/DebouncedSlider';

// CSS Class Constants (can be moved to a shared file or passed as props if preferred)

function AudioVolume(): JSX.Element {
  // ---------------- States ----------------
  const appState = useAppState();
  const [inputGain, setInputGain] = useState(1);
  const [outputGain, setOutputGain] = useState(1);
  const [monitorGain, setMonitorGain] = useState(1);

  // ---------------- Hooks ----------------

  // Set Audio Gains
  useEffect(() => {
    setInputGain(appState.serverSetting.serverSetting.serverInputAudioGain)
    setOutputGain(appState.serverSetting.serverSetting.serverOutputAudioGain)
    setMonitorGain(appState.serverSetting.serverSetting.serverMonitorAudioGain)
  }, [appState.serverSetting.serverSetting.serverInputAudioGain, appState.serverSetting.serverSetting.serverOutputAudioGain, appState.serverSetting.serverSetting.serverMonitorAudioGain])

  // ---------------- Handlers ----------------

  // Handle Input Gain Change
  const handleInputGainChange = (value: number) => {
    const gain = value / 100
    appState.serverSetting.updateServerSettings({
      ...appState.serverSetting.serverSetting,
      serverInputAudioGain: gain
    })

    appState.setVoiceChangerClientSetting({
      ...appState.setting.voiceChangerClientSetting,
      inputGain: gain
    })
  }

  // Handle Output Gain Change
  const handleOutputGainChange = (value: number) => {
    const gain = value / 100
    appState.serverSetting.updateServerSettings({
      ...appState.serverSetting.serverSetting,
      serverOutputAudioGain: gain
    })

    appState.setVoiceChangerClientSetting({
      ...appState.setting.voiceChangerClientSetting,
      outputGain: gain
    })
  }

  // Handle Monitor Gain Change
  const handleMonitorGainChange = (value: number) => {
    const gain = value / 100
    appState.serverSetting.updateServerSettings({
      ...appState.serverSetting.serverSetting,
      serverMonitorAudioGain: gain
    })

    appState.setVoiceChangerClientSetting({
      ...appState.setting.voiceChangerClientSetting,
      monitorGain: gain
    })
  }

  // ---------------- Render ----------------

  return (
    <>
      <div>
        <label htmlFor="inputGain" className={CSS_CLASSES.label}>
          <FontAwesomeIcon icon={faMicrophone} className="mr-2" />
          Input Volume
        </label>
        <DebouncedSlider
          id="inputGain"
          min={10}
          max={250}
          step={1}
          value={Math.round(inputGain * 100)}
          className={CSS_CLASSES.range}
          onChange={handleInputGainChange}
          onImmediateChange={(value) => setInputGain(value / 100)}
        />
        <p className={CSS_CLASSES.sliderValue}>{Math.round(inputGain * 100)}%</p>
      </div>
      <div>
        <label htmlFor="outputGain" className={CSS_CLASSES.label}>
          <FontAwesomeIcon icon={faVolumeUp} className="mr-2" />
          Output Volume
        </label>
        <DebouncedSlider
          id="outputGain"
          min={10}
          max={400}
          step={1}
          value={Math.round(outputGain * 100)}
          className={CSS_CLASSES.range}
          onChange={handleOutputGainChange}
          onImmediateChange={(value) => setOutputGain(value / 100)}
        />
        <p className={CSS_CLASSES.sliderValue}>{Math.round(outputGain * 100)}%</p>
      </div>
      <div>
        <label htmlFor="monitorGain" className={CSS_CLASSES.label}>
          <FontAwesomeIcon icon={faHeadphones} className="mr-2" />
          Monitor Volume
        </label>
        <DebouncedSlider
          id="monitorGain"
          min={0}
          max={400}
          step={1}
          value={Math.round(monitorGain * 100)}
          className={CSS_CLASSES.range}
          onChange={handleMonitorGainChange}
          onImmediateChange={(value) => setMonitorGain(value / 100)}
        />
        <p className={CSS_CLASSES.sliderValue}>{Math.round(monitorGain * 100)}%</p>
      </div>
    </>
  );
}

export default AudioVolume;
