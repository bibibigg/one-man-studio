import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// API Routes에서 DB 조작용 (RLS 우회)
// 클라이언트 컴포넌트용은 lib/auth/client.ts, 서버 인증용은 lib/auth/server.ts 참조
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}
