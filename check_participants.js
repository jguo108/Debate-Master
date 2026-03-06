import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkParticipants() {
    const { data: debate, error } = await supabase
        .from('debates')
        .select('id, topic, pro_user_id, con_user_id')
        .eq('id', '52037c2e-6cd6-4891-93f1-6bdbd11f66e5')
        .single();

    if (error) console.error(error);
    else console.log(JSON.stringify(debate, null, 2));

    const { data: { user } } = await supabase.auth.getUser();
    console.log("Current user in script (likely none):", user?.id);
}

checkParticipants();
