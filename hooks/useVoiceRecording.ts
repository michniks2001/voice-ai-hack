import { useState, useRef, useCallback } from 'react'
import { VoiceRecordingState } from '@/types'

export const useVoiceRecording = () => {
    const [state, setState] = useState<VoiceRecordingState>({
        isRecording: false,
        isProcessing: false,
        error: null,
    })

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    const startRecording = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, error: null }))

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.start()
            setState(prev => ({ ...prev, isRecording: true }))
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: 'Failed to access microphone. Please check permissions.'
            }))
        }
    }, [])

    const stopRecording = useCallback((): Promise<Blob> => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
                resolve(new Blob())
                return
            }

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
                resolve(audioBlob)
                setState(prev => ({ ...prev, isRecording: false }))

                // Clean up
                const tracks = mediaRecorderRef.current?.stream.getTracks()
                tracks?.forEach(track => track.stop())
            }

            mediaRecorderRef.current.stop()
        })
    }, [])

    const processAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
        setState(prev => ({ ...prev, isProcessing: true, error: null }))

        try {
            const formData = new FormData()
            formData.append('audio', audioBlob, 'recording.wav')

            const response = await fetch('/api/speech-to-text', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error('Failed to transcribe audio')
            }

            const result = await response.json()
            return result.text || ''
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: 'Failed to process audio. Please try again.'
            }))
            return ''
        } finally {
            setState(prev => ({ ...prev, isProcessing: false }))
        }
    }, [])

    return {
        ...state,
        startRecording,
        stopRecording,
        processAudio,
    }
}
