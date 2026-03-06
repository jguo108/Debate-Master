import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createFriendshipsTable() {
  console.log("Creating friendships table...");
  const { error } = await supabase.rpc('exec_sql', {
    sql_string: `
      CREATE TABLE IF NOT EXISTS public.friendships (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, friend_id)
      );

      -- Enable RLS
      ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

      -- Create policies
      CREATE POLICY "Users can view their own friendships"
        ON public.friendships FOR SELECT
        USING (auth.uid() = user_id OR auth.uid() = friend_id);

      CREATE POLICY "Users can insert their own friendships"
        ON public.friendships FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their friendships if they are part of it"
        ON public.friendships FOR UPDATE
        USING (auth.uid() = user_id OR auth.uid() = friend_id);

      CREATE POLICY "Users can delete their friendships if they are part of it"
        ON public.friendships FOR DELETE
        USING (auth.uid() = user_id OR auth.uid() = friend_id);
    `
  });

  if (error) {
    console.error("Failed to create table via RPC. Is 'exec_sql' available?", error);
    console.log("\nPlease run this SQL directly in your Supabase SQL Editor:");
    console.log(`
      CREATE TABLE IF NOT EXISTS public.friendships (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, friend_id)
      );

      ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Users can view their own friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
      CREATE POLICY "Users can insert their own friendships" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their friendships if they are part of it" ON public.friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
      CREATE POLICY "Users can delete their friendships if they are part of it" ON public.friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);
    `);
  } else {
    console.log("Successfully created friendships table and policies!");
  }
}

createFriendshipsTable();
