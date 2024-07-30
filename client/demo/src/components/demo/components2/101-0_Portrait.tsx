import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "../../../001_provider/001_AppStateProvider";
import { useMessageBuilder } from "../../../hooks/useMessageBuilder";
export type PortraitProps = {};

// @ts-ignore
import MyIcon from "./female-clickable.svg";
export const Portrait = (_props: PortraitProps) => {
    const { serverSetting, performance } = useAppState();
    const messageBuilderState = useMessageBuilder();

    const elVolRef = useRef<HTMLElement | null>(null);
    const elChunkTimeRef = useRef<HTMLElement | null>(null);
    const elPingRef = useRef<HTMLElement | null>(null);
    const elTotalRef = useRef<HTMLElement | null>(null);
    const elPerfRef = useRef<HTMLElement | null>(null);

    const [lastReport, setLastReport] = useState(Date.now())

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

    useEffect(() => {
        if (!elVolRef.current || !elChunkTimeRef.current || !elPingRef.current || !elTotalRef.current || !elPerfRef.current) {
            return;
        }

        const now = Date.now()
        if (now - lastReport <= 100) {
            return
        }
        setLastReport(now)

        const volumeDb = Math.max(Math.round(20 * Math.log10(performance.vol)), -90);
        const chunkTime = ((serverSetting.serverSetting.serverReadChunkSize * 128 * 1000) / 48000);
        const totalLatencyTime = Math.ceil(chunkTime + performance.responseTime + serverSetting.serverSetting.crossFadeOverlapSize * 1000);

        elVolRef.current.innerHTML = volumeDb.toString();
        elChunkTimeRef.current.innerHTML = chunkTime.toFixed(1);
        elPingRef.current.innerHTML = performance.responseTime.toString();
        elTotalRef.current.innerHTML = totalLatencyTime.toString();
        elPerfRef.current.innerHTML = performance.mainprocessTime.toString();
    }, [performance, serverSetting.serverSetting.crossFadeOverlapSize, serverSetting.serverSetting.serverReadChunkSize])

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

        return (
            <div className="portrait-area">
                <div className="portrait-container">
                    {portrait}
                    <div className="portrait-area-status">
                        <p>
                            <span className="portrait-area-status-vctype">{selected.voiceChangerType}</span>
                        </p>
                        <p>
                            vol(in): <span ref={elVolRef}>-90</span> dB
                        </p>
                        <p>
                            buf: <span ref={elChunkTimeRef}>0</span> ms
                        </p>
                        <p>
                            ping: <span ref={elPingRef}>0</span> ms
                        </p>
                        <p>
                            total: <span ref={elTotalRef}>0</span> ms
                        </p>
                        <p>
                            perf: <span ref={elPerfRef}>0</span> ms
                        </p>
                    </div>
                    <div className="portrait-area-terms-of-use">{selectedTermOfUseUrlLink}</div>
                </div>
            </div>
        );
    }, [selected]);

    return portrait;
};
