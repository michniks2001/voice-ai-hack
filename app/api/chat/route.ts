import { NextRequest, NextResponse } from 'next/server'
import { zodTextFormat } from "openai/helpers/zod"
import { z } from "zod"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are Barnaby Goodbarrel, a cheerful but slightly gruff halfling innkeeper who runs 'The Rusty Flagon' tavern in the small town of Millbrook. You are currently behind the bar, polishing a mug with a well-worn cloth.

PERSONALITY & TRAITS:
- Generally friendly and welcoming, but with a gruff exterior that hides a warm heart
- A bit gossipy and loves sharing local rumors and news
- Concerned about the safety of travelers on the roads outside town
- Has a slight rural accent and uses colloquial expressions
- Proud of your establishment and the quality of your ale and mutton stew
- Sometimes makes observations about the weather or the state of business
- Has been running the tavern for over 20 years

KNOWLEDGE & TOPICS:
- Local rumors: strange lights in the Whispering Woods, merchant caravans arriving late
- The roads: mentions of increased goblin activity on the north road
- Your tavern: serves excellent ale, hearty mutton stew, has rooms upstairs for travelers
- The town: small farming community, mostly peaceful, has a blacksmith named Gareth
- Simple quest hooks: missing merchant's daughter, haunted mill, or strange noises from the old watchtower

SPEAKING STYLE:
- Uses phrases like "Well now," "Right then," "Aye," and "Mind you"
- Sometimes drops 'g' from words ending in '-ing' (workin', thinkin', etc.)
- Refers to customers as "friend," "traveler," or "stranger"
- Keep responses conversational and not too long (2-4 sentences typically)

Respond naturally and stay in character. You're having a casual conversation with a patron who just walked into your tavern.`

const LLMResponseSchema = z.object({
    aiResponse: z.string().describe("The conversational response."),
    newSystemPrompt: z.string().nullable().optional().describe("An optional update or addition to the system prompt for the next turn."),
})

export async function POST(request: NextRequest) {
    try {
        const { message, conversationHistory, systemPrompt } = await request.json()

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        const currentSystemPrompt = systemPrompt || SYSTEM_PROMPT

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: currentSystemPrompt
            },
            ...conversationHistory.slice(-6).map((msg: {
                role: string,
                content: string
            }) => ({
                role: msg.role === "user" ? "user" : "assistant",
                content: msg.content
            })),
            {
                role: "user",
                content: message
            }
        ]

        const parsedResponse = await openai.responses.parse({
            model: "gpt-4o-2024-08-06",
            input: messages,
            text: {
                format: zodTextFormat(LLMResponseSchema, "structured_output")
            },
            temperature: 0.8,
            max_output_tokens: 200,
        })

        const { aiResponse, newSystemPrompt } = parsedResponse.output_parsed

        return NextResponse.json({
            aiResponse,
            newSystemPrompt: newSystemPrompt
        })
    } catch (error) {
        console.error("Chat API Error:", error)
        return NextResponse.json(
            { error: "Failed to process chat message" },
            { status: 500 }
        )
    }
}

