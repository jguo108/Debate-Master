import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log("--- Debates Table ---");
    const { data: debates, error } = await supabase.from('debates').select('*');
    if (error) console.error("Error fetching debates:", error);
    else console.log(`Found ${debates.length} debates.`);

    console.log("\n--- Checking RLS Policies ---");
    // We can try to query pg_policies if it's accessible via RPC or just use common knowledge
    const { data: policies, error: polError } = await supabase.rpc('exec_sql', {
        sql_string: "SELECT * FROM pg_policies WHERE tablename = 'debates';"
    });

    if (polError) {
        console.error("Could not fetch policies via RPC:", polError.message);
    } else {
        console.table(policies);
    }
}

debug();
