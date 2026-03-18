import { createBrowserClient } from '@supabase/ssr'

// 싱글톤 패턴 — 리렌더링마다 새 인스턴스 생성 방지
let client: ReturnType<typeof createBrowserClient> | undefined

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
