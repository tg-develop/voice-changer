import { useEffect, useState } from "react"

export type AudioConfigState = {
    audioContext: AudioContext | null
}
export const useAudioConfig = (): AudioConfigState => {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null)

    useEffect(() => {
        const createAudioContext = () => {

            const url = new URL(window.location.href);
            // TODO: This must be a proper option in UI.
            const sampleRate = url.searchParams.get('sample_rate')
            const ctx: AudioContext = sampleRate
                ? new AudioContext({ sampleRate: Number(sampleRate)})
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