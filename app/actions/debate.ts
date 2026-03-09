'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import * as fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function getAIResponse(debateId: string, topic: string, history: any[]) {
    const supabase = await createClient()

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are Gemini 2.5 Flash, a world-class competitive debater. 
    You are currently in a high-stakes duel on the topic: "${topic}". 
    Your style is sharp, logical, and slightly provocative. 
    You look for logical fallacies in your opponent's arguments and exploit them.
    If this is the beginning of the debate (no history provided), start with a powerful opening statement for the opposition.
    Keep your responses concise but powerful (max 150 words).`
    })

    // Format history for Gemini. If empty, provide a prompt to start the debate.
    let contents = history.map(msg => ({
        role: msg.role === 'pro' ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }))

    if (contents.length === 0) {
        contents = [{
            role: 'user',
            parts: [{ text: `The debate on "${topic}" begins now. Please provide your opening statement as the opposition.` }]
        }]
    }

    try {
        console.log(`DEBUG: Generating AI response for debate ${debateId}...`);
        const result = await model.generateContent({
            contents: contents,
        })

        const responseText = result.response.text()
        console.log(`DEBUG: AI Generated: ${responseText.substring(0, 50)}...`);

        // Save AI response to DB
        const { error: dbError } = await supabase
            .from('messages')
            .insert({
                debate_id: debateId,
                role: 'con',
                author_name: 'Gemini 2.5 Flash',
                content: responseText,
                is_ai: true
            })

        if (dbError) {
            console.error("DEBUG: AI Message Insert Error:", dbError);
            throw dbError
        }

        return { content: responseText }
    } catch (error: any) {
        console.error('Gemini Action Error:', error)
        return { error: error.message || 'Failed to generate AI response' }
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

export async function evaluateDebate(debateId: string, topic: string, history: any[], userProfileName: string, opponentName: string) {
    const supabase = await createClient()

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are an impartial, expert debate judge.
    You are evaluating a debate on the topic: "${topic}".
    The user (${userProfileName}) argued the affirmative/pro side. The opponent (${opponentName}) argued the negative/con side.
    Review the transcript and determine a winner based on logical consistency, persuasiveness, and debate etiquette.
    Your response MUST be a valid JSON object with exactly two keys:
    1. "winner": strictly either "user" (if ${userProfileName} won) or "opponent" (if ${opponentName} won). 
    2. "reasoning": A concise paragraph (3-4 sentences) explaining your decision, referencing specific points made by both sides.
    Do NOT wrap the JSON in markdown blocks like \`\`\`json.`
    })

    const transcriptText = history.map(msg =>
        `${msg.role === 'pro' ? userProfileName : opponentName}: ${msg.content}`
    ).join('\n\n');

    if (history.length < 2) {
        return { winner: 'tie', reasoning: 'Not enough arguments were presented to determine a clear winner.' }
    }

    try {
        console.log(`DEBUG: Evaluating debate ${debateId}...`);
        const result = await model.generateContent(`Here is the transcript for the debate on "${topic}":\n\n${transcriptText}\n\nPlease provide your final verdict in JSON format.`);

        const responseText = result.response.text().trim();
        let evaluation;
        try {
            // Remove markdown code blocks if the model ignored the instruction
            const cleanJson = responseText.replace(/```json/i, '').replace(/```/g, '').trim();
            evaluation = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse evaluation JSON:", responseText);
            return { winner: 'tie', reasoning: 'The judges could not reach a formatted verdict. The debate is a tie.' }
        }

        console.log(`DEBUG: Debate Evaluated:`, evaluation);
        return evaluation;
    } catch (error: any) {
        console.error('Evaluation Error:', error)
        return { error: 'Failed to evaluate debate' }
    }
}

export async function forfeitDebate(debateId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    console.log(`DEBUG: Forfeiting debate ${debateId} for user ${user.id}`);

    const { data: debate, error: fetchError } = await supabase.from('debates').select('pro_user_id, con_user_id').eq('id', debateId).single()
    console.log(`DEBUG forfeitDebate fetch: debateId=${debateId}, debate=${JSON.stringify(debate)}, fetchError=${JSON.stringify(fetchError)}`);

    let opponentId = null;
    if (debate && debate.pro_user_id === user.id) {
        opponentId = debate.con_user_id;
    } else if (debate) {
        opponentId = debate.pro_user_id;
    }

    const { data: updateData, error } = await supabase
        .from('debates')
        .update({
            status: 'concluded',
            winner_id: opponentId,
            evaluation_reason: 'User forfeited the debate by exiting the arena.'
        })
        .eq('id', debateId)
        .or(`pro_user_id.eq.${user.id},con_user_id.eq.${user.id}`)
        .select();

    const logStr = `\n[${new Date().toISOString()}] forfeitDebate -> ID: ${debateId}, OPPONENT_ID: ${opponentId}, UPDATE_DATA: ${JSON.stringify(updateData)}, ERROR: ${JSON.stringify(error)}`;
    console.log(logStr);
    try { fs.appendFileSync('debug_log.txt', logStr); } catch (e) { }

    if (error) {
        console.error("DEBUG: Forfeit Debate Error:", error);
        throw error
    }

    return { success: true }
}

export async function concludeDebate(debateId: string, winnerRole: 'user' | 'opponent' | 'tie' | string, reasoning: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: debate, error: fetchError } = await supabase.from('debates').select('pro_user_id, con_user_id').eq('id', debateId).single()
    console.log(`DEBUG concludeDebate fetch: debateId=${debateId}, debate=${JSON.stringify(debate)}, fetchError=${JSON.stringify(fetchError)}`);

    let winnerId = null;
    if (winnerRole === 'user' || winnerRole === user.id) {
        winnerId = user.id;
    } else if (winnerRole === 'opponent') {
        if (debate) {
            winnerId = debate.pro_user_id === user.id ? debate.con_user_id : debate.pro_user_id;
        }
    }

    console.log(`DEBUG: Concluding debate ${debateId} via server action. WinnerRole: ${winnerRole}, Resolved WinnerId: ${winnerId}`);

    const { data: updateData, error } = await supabase
        .from('debates')
        .update({
            status: 'concluded',
            winner_id: winnerId,
            evaluation_reason: reasoning
        })
        .eq('id', debateId)
        .or(`pro_user_id.eq.${user.id},con_user_id.eq.${user.id}`)
        .select();

    console.log(`DEBUG concludeDebate update result: data=${JSON.stringify(updateData)}, error=${JSON.stringify(error)}`);

    if (error) {
        console.error("DEBUG: Conclude Debate Error:", error);
        throw error
    }

    return { success: true }
}

export async function deleteDebate(debateId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    console.log(`DEBUG: Deleting debate ${debateId} for user ${user.id}`);

    // First check if the user is a participant
    const { data: debate, error: fetchError } = await supabase
        .from('debates')
        .select('pro_user_id, con_user_id, pro_deleted, con_deleted')
        .eq('id', debateId)
        .single();

    if (fetchError || !debate) {
        console.error("DEBUG: Debate not found or error fetching:", fetchError);
        return { success: false, error: 'Debate not found' };
    }

    if (debate.pro_user_id !== user.id && debate.con_user_id !== user.id) {
        console.warn("DEBUG: User not participant of debate:", user.id);
        return { success: false, error: 'Unauthorized' };
    }

    const isPro = debate.pro_user_id === user.id;
    const isCon = debate.con_user_id === user.id;

    const updates: any = {};
    if (isPro) updates.pro_deleted = true;
    if (isCon) updates.con_deleted = true;

    // Check if both sides will be deleted after this operation
    const willProBeDeleted = isPro ? true : debate.pro_deleted;
    const willConBeDeleted = isCon ? true : debate.con_deleted;

    if (willProBeDeleted && willConBeDeleted) {
        updates.status = 'cancelled';
    }

    const { error, count } = await supabase
        .from('debates')
        .update(updates, { count: 'exact' })
        .eq('id', debateId);

    if (error) {
        console.error("DEBUG: Soft Delete Debate Error:", error);
        throw error
    }

    console.log(`DEBUG: Soft Delete Debate Success. Rows affected: ${count}`);

    return { success: true, count }
}
