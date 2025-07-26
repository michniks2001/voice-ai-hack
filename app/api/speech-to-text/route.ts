import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const audioFile = formData.get('audio') as File

        if (!audioFile) {
            return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
        }

        console.log('Audio file details:', {
            name: audioFile.name,
            type: audioFile.type,
            size: audioFile.size
        })

        // Check if audio file is valid
        if (audioFile.size === 0) {
            return NextResponse.json({ error: 'Audio file is empty' }, { status: 400 })
        }

        // Convert File to FormData for ElevenLabs
        const elevenLabsFormData = new FormData()
        // ElevenLabs expects the parameter to be named 'file'
        elevenLabsFormData.append('file', audioFile, audioFile.name || 'recording.wav')
        elevenLabsFormData.append('model_id', 'scribe_v1')

        const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: {
                'xi-api-key': process.env.ELEVENLABS_API_KEY!,
            },
            body: elevenLabsFormData,
        })

        console.log('ElevenLabs response status:', response.status)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('ElevenLabs error response:', errorText)
            throw new Error(`ElevenLabs STT API error: ${response.status} - ${errorText}`)
        }

        const result = await response.json()
        console.log('ElevenLabs result:', result)

        return NextResponse.json({
            text: result.text || result.transcript || ''
        })
    } catch (error) {
        console.error('Speech-to-text API error:', error)
        return NextResponse.json(
            { error: 'Failed to transcribe audio' },
            { status: 500 }
        )
    }
}
