import React, { useMemo } from "react";
import { useAppState } from "../../../001_provider/001_AppStateProvider";
import { useMessageBuilder } from "../../../hooks/useMessageBuilder";
export type PortraitProps = {};

// @ts-ignore
import MyIcon from "./female-clickable.svg";
export const Portrait = (_props: PortraitProps) => {
    const { serverSetting, volume, performance } = useAppState();
    const messageBuilderState = useMessageBuilder();

    useMemo(() => {
        messageBuilderState.setMessage(__filename, "terms_of_use", { ja: "利用規約", en: "terms of use" });
    }, []);

    const selected = useMemo(() => {
        if (serverSetting.serverSetting.modelSlotIndex == undefined) {
            return;
        } else {
            return serverSetting.serverSetting.modelSlots[serverSetting.serverSetting.modelSlotIndex];
        }
    }, [serverSetting.serverSetting.modelSlotIndex, serverSetting.serverSetting.modelSlots]);

    const portrait = useMemo(() => {
        if (!selected) {
            return <></>;
        }

        const modelDir = serverSetting.serverSetting.voiceChangerParams.model_dir;
        const icon = selected.iconFile.length > 0 ? modelDir + "/" + selected.slotIndex + "/" + selected.iconFile.split(/[\/\\]/).pop() : "./assets/icons/human.png";
        const portrait = <img className="portrait" src={icon} alt={selected.name} />;
        const selectedTermOfUseUrlLink = selected.termsOfUseUrl ? (
            <a href={selected.termsOfUseUrl} target="_blank" rel="noopener noreferrer" className="portrait-area-terms-of-use-link">
                [{messageBuilderState.getMessage(__filename, "terms_of_use")}]
            </a>
        ) : (
            <></>
        );

        const volumeDb = Math.max(Math.round(20 * Math.log10(volume)), -90)
        const chunkTime = ((serverSetting.serverSetting.serverReadChunkSize * 128 * 1000) / 48000)
        const totalLatencyTime = Math.ceil(chunkTime + performance.responseTime + serverSetting.serverSetting.crossFadeOverlapSize * 1000)
        return (
            <div className="portrait-area">
                <div className="portrait-container">
                    {portrait}
                    <div className="portrait-area-status">
                        <p>
                            <span className="portrait-area-status-vctype">{selected.voiceChangerType}</span>
                        </p>
                        <p>
                            vol(in): {volumeDb} dB
                        </p>
                        <p>
                            buf: {chunkTime.toFixed(1)} ms
                        </p>
                        <p>
                            ping: {performance.responseTime} ms
                        </p>
                        <p>
                            total: {totalLatencyTime} ms
                        </p>
                        <p>
                            perf: {performance.mainprocessTime} ms
                        </p>
                    </div>
                    <div className="portrait-area-terms-of-use">{selectedTermOfUseUrlLink}</div>
                </div>
            </div>
        );
        // FIXME: Volume notifications cause too frequent updates which harm the performance.
        // This way, volume update depends on performance that are always reported.
        // However, this might be a problem if this becomes no longer the case.
    }, [selected, performance, serverSetting.serverSetting.crossFadeOverlapSize, serverSetting.serverSetting.serverReadChunkSize]);

    return portrait;
};
