import { useEffect, useState } from "react"

export type AudioConfigState = {
    audioContext: AudioContext | null
}
export const useAudioConfig = (): AudioConfigState => {

    // ---------------- State ----------------
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null)

    // ---------------- Hooks ----------------
    // Create audio context on first render (browser safety options require interaction to initialize audio context)
    useEffect(() => {
        const createAudioContext = () => {
            const url = new URL(window.location.href);
            const sampleRate = url.searchParams.get('sample_rate')
            const ctx: AudioContext = sampleRate
                ? new AudioContext({ sampleRate: Number(sampleRate) })
                : new AudioContext({ sampleRate: 48000 })

            console.log('Base context', ctx)
            setAudioContext(ctx)

            document.removeEventListener('touchstart', createAudioContext);
            document.removeEventListener('mousedown', createAudioContext);
        }
        document.addEventListener('touchstart', createAudioContext, false);
        document.addEventListener('mousedown', createAudioContext, false);
    }, [])

    return {
        audioContext
    }
}