import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xnuftmkxfturtntqgaqd.supabase.co";
const supabaseKey = "sb_publishable_qVEXYM8d-F_YZNJ7lUbNRQ_jdCLz2qO";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);