'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateProfile(data: { full_name?: string, avatar_url?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

    if (error) throw error
    return { success: true }
}
