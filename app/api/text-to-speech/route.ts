import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { text, voiceId } = await request.json()

        if (!text || !voiceId) {
            return NextResponse.json({ error: 'Text and voiceId are required' }, { status: 400 })
        }


        console.log('Using voice ID:', voiceId)
        console.log('Text to synthesize:', text.substring(0, 100) + '...')

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': process.env.ELEVENLABS_API_KEY!,
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8,
                    style: 0.2,
                    use_speaker_boost: true
                }
            }),
        })

        console.log('ElevenLabs TTS response status:', response.status)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('ElevenLabs TTS error response:', errorText)

            // If voice not found, try with default voice
            if (response.status === 404) {
                console.log('Voice not found, trying with default voice...')
                return await tryWithDefaultVoice(text)
            }

            throw new Error(`ElevenLabs TTS API error: ${response.status} - ${errorText}`)
        }

        const audioBuffer = await response.arrayBuffer()
        console.log('Generated audio size:', audioBuffer.byteLength)

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.byteLength.toString(),
            },
        })
    } catch (error) {
        console.error('Text-to-speech API error:', error)
        return NextResponse.json(
            { error: 'Failed to generate speech' },
            { status: 500 }
        )
    }
}

// Fallback function to try with a known working voice
async function tryWithDefaultVoice(text: string) {
    try {
        const defaultVoiceId = 'pNInz6obpgDQGcFmaJgB' // Adam voice (reliable default)

        console.log('Trying with default voice ID:', defaultVoiceId)

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${defaultVoiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': process.env.ELEVENLABS_API_KEY!,
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8
                }
            }),
        })

        if (response.ok) {
            const audioBuffer = await response.arrayBuffer()
            return new NextResponse(audioBuffer, {
                headers: {
                    'Content-Type': 'audio/mpeg',
                    'Content-Length': audioBuffer.byteLength.toString(),
                },
            })
        } else {
            const errorText = await response.text()
            throw new Error(`Default voice also failed: ${response.status} - ${errorText}`)
        }
    } catch (error) {
        console.error('Default voice fallback failed:', error)
        return NextResponse.json(
            { error: 'Failed to generate speech with any voice' },
            { status: 500 }
        )
    }
}
