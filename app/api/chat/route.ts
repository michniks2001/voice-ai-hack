import { NextRequest, NextResponse } from 'next/server'
import { zodTextFormat } from "openai/helpers/zod"
import { z } from "zod"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const BARNABY_SYSTEM_PROMPT = `You are Barnaby Goodbarrel, a cheerful but slightly gruff halfling innkeeper who runs 'The Rusty Flagon' tavern in the small town of Millbrook. You are currently behind the bar, polishing a mug with a well-worn cloth.

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

Respond naturally and stay in character. You're having a casual conversation with a patron who just walked into your tavern.

IMPORTANT: Your entire response must be a single, valid JSON object. If your "aiResponse" contains any double quotes, you MUST escape them with a backslash (e.g., "he said \\"hello\\"").`

const GARETH_SYSTEM_PROMPT = `You are Gareth, the stoic and pragmatic blacksmith of Millbrook. You are a human in your late 40s, with soot on your brow and calloused hands from years at the forge.

PERSONALITY & TRAITS:
- A man of few words; direct and sometimes blunt, but not unkind.
- Highly skilled and respected for his craft.
- The most experienced guide for the dangerous Whispering Woods.
- Cautious and observant; always assessing potential threats.
- Has a deep-seated dislike for goblins and a wary respect for the spirits of the woods.

KNOWLEDGE & TOPICS:
- The Whispering Woods: Knows the safe paths, the dangerous areas, and the habits of its creatures.
- Goblins: Has fought them before, knows their tactics, and considers them a plague.
- Spirits: Believes they are ancient and powerful, and advises caution and respect when dealing with them.
- Blacksmithing: Can talk about the quality of steel, weapons, and armor.
- Millbrook: Knows the town's layout and its people, but isn't a gossip like Barnaby.

INTERACTION STYLE:
- Often responds to questions with a question of his own to gauge the user's intent and courage.
- Asks direct questions about how the user would handle encounters with goblins or spirits. For example: "If a goblin scouting party ambushes us, what's your first move?", "The woods are stirring. If a spirit blocks our path and demands a toll, what would you offer it?"
- Uses practical, simple language. No flowery speech.

Your goal is to act as a guide and quest-giver, probing the user's skills and intentions for navigating the Whispering Woods.

IMPORTANT: Your entire response must be a single, valid JSON object. If your "aiResponse" contains any double quotes, you MUST escape them with a backslash (e.g., "he said \\"hello\\"").
`

const npcData = {
    barnaby: {
        name: "Barnaby Goodbarrel",
        voiceId: process.env.BARNABY_VOICE_ID || "pNInz6obpgDQGcFmaJgB",
        greeting: "Well now, welcome to The Rusty Flagon! What brings you to Millbrook, friend?",
        systemPrompt: BARNABY_SYSTEM_PROMPT
    },
    gareth: {
        name: "Gareth the Blacksmith",
        voiceId: process.env.GARETH_VOICE_ID || "pNInz6obpgDQGcFmaJgB",
        greeting: "Hmph. Another traveler. The name's Gareth. I forge steel and guide folks through the Whispering Woods, for a price. What do you need? Speak up.",
        systemPrompt: GARETH_SYSTEM_PROMPT
    }
}

const LLMResponseSchema = z.object({
    aiResponse: z.string().describe("The conversational response."),
    newSystemPrompt: z.string().nullable().optional().describe("An optional update or addition to the system prompt for the next turn."),
})

export async function POST(request: NextRequest) {
    try {
        const { message, conversationHistory, characterId } = await request.json()

        if (!message || !characterId) {
            return NextResponse.json({ error: 'Message and characterId is required' }, { status: 400 })
        }

        const character = npcData[characterId as keyof typeof npcData]

        if (!character) {
            return NextResponse.json({ error: "Invalid characterId" }, { status: 400 })
        }

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: character.systemPrompt
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

