import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "../../../001_provider/001_AppStateProvider";
import { useMessageBuilder } from "../../../hooks/useMessageBuilder";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    LineController,
    Filler,
  } from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    LineController,
    Filler,
);

export type PortraitProps = {};

// @ts-ignore
import MyIcon from "./female-clickable.svg";
export const Portrait = (_props: PortraitProps) => {
    const { serverSetting, performance } = useAppState();
    const messageBuilderState = useMessageBuilder();

    const [perfTooltip, setPerfTooltip] = useState(0);
    const elPerfChartRef = useRef<ChartJS | null>(null);
    const elVolRef = useRef<HTMLElement | null>(null);
    const elChunkTimeRef = useRef<HTMLElement | null>(null);
    const elPingRef = useRef<HTMLElement | null>(null);
    const elTotalRef = useRef<HTMLElement | null>(null);
    const elPerfRef = useRef<HTMLElement | null>(null);
    const MAX_DATA_POINTS = 50;

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
        if (!elVolRef.current || !elPerfChartRef.current || !elChunkTimeRef.current || !elPingRef.current || !elTotalRef.current || !elPerfRef.current) {
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

        if (performance.mainprocessTime > chunkTime) {
            elPerfRef.current.style.color = '#ff4a4a';
        } else if (performance.mainprocessTime * 1.2 > chunkTime) {
            elPerfRef.current.style.color = '#ffff00';
        } else {
            elPerfRef.current.style.color = '#00ff00';
        }

        elVolRef.current.innerHTML = volumeDb.toString();
        elChunkTimeRef.current.innerHTML = chunkTime.toFixed(1);
        elPingRef.current.innerHTML = performance.responseTime.toString();
        elTotalRef.current.innerHTML = totalLatencyTime.toString();
        elPerfRef.current.innerHTML = performance.mainprocessTime.toString();

        if (performance.mainprocessTime > 0) {
            if (elPerfChartRef.current.data.labels!.length > MAX_DATA_POINTS) {
                elPerfChartRef.current.data.labels!.shift()
                elPerfChartRef.current.data.datasets[0].data.shift();
            }
            elPerfChartRef.current.data.labels!.push(Date.now())
            elPerfChartRef.current.data.datasets[0].data.push(performance.mainprocessTime)
            elPerfChartRef.current.update('none')
        }
    }, [performance, serverSetting.serverSetting.crossFadeOverlapSize, serverSetting.serverSetting.serverReadChunkSize])

    useEffect(() => {
        if (!elPerfRef.current) {
            return
        }

        const chunkTime = ((serverSetting.serverSetting.serverReadChunkSize * 128 * 1000) / 48000);

        if (perfTooltip > chunkTime) {
            elPerfRef.current.style.color = '#ff4a4a';
        } else if (perfTooltip * 1.2 > chunkTime) {
            elPerfRef.current.style.color = '#ffff00';
        } else {
            elPerfRef.current.style.color = '#00ff00';
        }

        elPerfRef.current.innerHTML = perfTooltip.toString();
    }, [perfTooltip])

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

        const options = {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false,
            },
            layout: {
                padding: {
                    left: -10,
                    bottom: -10,
                }
            },
            plugins: {
                tooltip: {
                    enabled: false,
                    external: (context: any) => {
                        if (context.tooltip.dataPoints) {
                            setPerfTooltip(context.tooltip.dataPoints[0].parsed.y)
                        }
                    }
                },
                title: {
                    display: false,
                },
            },
            scales: {
                x: {
                    ticks: {
                        display: false,
                    },
                    min: 0,
                    grid: {
                        display: false
                    },
                },
                y: {
                    ticks: {
                        display: false,
                    },
                    min: 0,
                    grid: {
                        display: false
                    },
                }
            },
        };

        const data = {
            labels: [],
            datasets: [
                {
                    data: [],
                    fill: true,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    pointRadius: 0,
                    borderWidth: 1,
                }
            ]
        }

        return (
            <div className="portrait-area">
                <div className="portrait-container">
                    {portrait}
                    <div className="portrait-area-status">
                        <p>
                            <span className="portrait-area-status-vctype">{serverSetting.serverSetting.useONNX ? selected.modelTypeOnnx : selected.modelType}</span>
                        </p>
                        <p>
                            vol(in): <span ref={elVolRef}>-90</span> dB
                        </p>
                        <p>
                            ping: <span ref={elPingRef}>0</span> ms
                        </p>
                        <p>
                            total: <span ref={elTotalRef}>0</span> ms
                        </p>
                        <p>
                            perf: <span ref={elPerfRef}>0</span> of <span style={{ display: 'inline-block' }}><span ref={elChunkTimeRef}>0</span> ms</span>
                        </p>
                        <div style={{ border: "1px solid #FFF" }}>
                            <Chart ref={elPerfChartRef} type="line" options={options} data={data} />
                        </div>
                    </div>
                    <div className="portrait-area-terms-of-use">{selectedTermOfUseUrlLink}</div>
                </div>
            </div>
        );
    }, [selected, serverSetting.serverSetting.useONNX]);

    return portrait;
};
