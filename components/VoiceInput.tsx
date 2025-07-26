'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'

interface VoiceInputProps {
    onTranscription: (text: string) => void
    disabled?: boolean
}

export function VoiceInput({ onTranscription, disabled }: VoiceInputProps) {
    const { isRecording, isProcessing, error, startRecording, stopRecording, processAudio } = useVoiceRecording()

    const handleRecordingToggle = async () => {
        if (isRecording) {
            const audioBlob = await stopRecording()
            if (audioBlob.size > 0) {
                const transcription = await processAudio(audioBlob)
                if (transcription.trim()) {
                    onTranscription(transcription)
                }
            }
        } else {
            await startRecording()
        }
    }

    const buttonText = () => {
        if (isProcessing) return 'Processing...'
        if (isRecording) return 'Stop Recording'
        return 'Start Recording'
    }

    const ButtonIcon = () => {
        if (isProcessing) return <Loader2 className="h-4 w-4 animate-spin" />
        if (isRecording) return <MicOff className="h-4 w-4" />
        return <Mic className="h-4 w-4" />
    }

    return (
        <div className="flex flex-col items-center space-y-2">
            <Button
                onClick={handleRecordingToggle}
                disabled={disabled || isProcessing}
                variant={isRecording ? "destructive" : "default"}
                className="flex items-center space-x-2"
            >
                <ButtonIcon />
                <span>{buttonText()}</span>
            </Button>

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {isRecording && (
                <p className="text-sm text-blue-600 animate-pulse">
                    🎤 Listening... Click "Stop Recording" when done
                </p>
            )}
        </div>
    )
}
