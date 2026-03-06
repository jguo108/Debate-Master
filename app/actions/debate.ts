'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function getAIResponse(debateId: string, topic: string, history: any[]) {
    const supabase = await createClient()

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `You are Marcus Thorne, a world-class competitive debater. 
    You are currently in a high-stakes duel on the topic: "${topic}". 
    Your style is sharp, logical, and slightly provocative. 
    You look for logical fallacies in your opponent's arguments and exploit them.
    Keep your responses concise but powerful (max 150 words).`
    })

    // Format history for Gemini
    const contents = history.map(msg => ({
        role: msg.role === 'pro' ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }))

    try {
        const result = await model.generateContent({
            contents: contents,
        })

        const responseText = result.response.text()

        // Save AI response to DB
        const { error: dbError } = await supabase
            .from('messages')
            .insert({
                debate_id: debateId,
                role: 'con',
                author_name: 'Marcus Thorne',
                content: responseText,
                is_ai: true
            })

        if (dbError) throw dbError

        return { content: responseText }
    } catch (error: any) {
        console.error('Gemini Error:', error)
        return { error: 'Failed to generate AI response' }
    }
}

export async function saveMessage(debateId: string, content: string, role: 'pro' | 'con', authorName: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase.from('messages').insert({
        debate_id: debateId,
        user_id: user.id,
        role,
        author_name: authorName,
        content,
        is_ai: false
    })

    if (error) throw error
    return { success: true }
}
