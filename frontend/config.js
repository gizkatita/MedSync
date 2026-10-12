const supabaseUrl = "https://tcwungdywrhktdxuylwo.supabase.co";
const supabaseAnonKey = "sb_publishable_z2MYg6O0poc5tWBql33OJA_kRWkkL0n";
const supabaseSdkReady = typeof window.supabase?.createClient === "function";

export const supabaseClient = supabaseUrl && supabaseAnonKey && supabaseSdkReady
  ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const supabaseConfigMessage = supabaseClient
  ? ""
  : !supabaseUrl || !supabaseAnonKey
    ? "Atur SUPABASE_URL dan SUPABASE_ANON_KEY pada konfigurasi proyek."
    : "Library Supabase gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.";
