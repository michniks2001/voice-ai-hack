export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export interface VoiceRecordingState {
    isRecording: boolean
    isProcessing: boolean
    error: string | null
}
