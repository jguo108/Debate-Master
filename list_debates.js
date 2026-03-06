import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listDebates() {
    console.log("Fetching all debates...");
    const { data: debates, error } = await supabase.from('debates').select('*');
    if (error) {
        console.error("Error fetching debates:", error.message);
        console.error("Full error:", JSON.stringify(error, null, 2));
    } else {
        console.log(`Found ${debates?.length} debates.`);
        if (debates && debates.length > 0) {
            console.log("First debate columns:", Object.keys(debates[0]));
            console.log(JSON.stringify(debates.map(d => ({ id: d.id, topic: d.topic, status: d.status })), null, 2));
        }
    }
}

listDebates();
