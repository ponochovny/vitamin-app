const supabase = import.meta.client ? useSupabaseClient() : null

export { supabase }
