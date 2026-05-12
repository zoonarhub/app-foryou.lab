import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iamszevlwgiirziejppp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbXN6ZXZsd2dpaXJ6aWVqcHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDU2NDIsImV4cCI6MjA5NDEyMTY0Mn0.5cUbj37WjMADy3GHeSFZ2RPMHbyfqnrtUtxv--9zpJA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
