import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDelete() {
    // First, find a debate we can try to delete (or just use one from the previous list)
    const { data: debates } = await supabase.from('debates').select('id, pro_user_id, con_user_id').limit(1);

    if (!debates || debates.length === 0) {
        console.log("No debates found to test deletion.");
        return;
    }

    const debate = debates[0];
    console.log(`Testing deletion for debate: ${debate.id}`);

    // Since we don't have a user session in this script, we might fail if RLS is on.
    // However, if we use the service role key, we can bypass RLS.
    // Let's try with the anon key as if we were an unauthenticated user or some user.

    const { error, count } = await supabase
        .from('debates')
        .delete({ count: 'exact' })
        .eq('id', debate.id);

    if (error) {
        console.error("Delete failed as expected (if RLS is on and no session):", error.message);
    } else {
        console.log(`Delete operation completed. Rows affected: ${count}`);
    }
}

testDelete();
