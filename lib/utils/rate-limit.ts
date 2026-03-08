import { getServiceSupabase } from '@/lib/api/supabase'
import { LIMITS } from './constants'

interface RateLimitResult {
  allowed: boolean
  message?: string
}

export async function checkProjectRateLimit(userId: string): Promise<RateLimitResult> {
  const supabase = getServiceSupabase()

  // Check total project count
  const { count: totalCount, error: totalError } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (totalError) {
    console.error('Rate limit check failed (total):', totalError.message)
    // Fail open to avoid blocking users on DB errors
    return { allowed: true }
  }

  if ((totalCount ?? 0) >= LIMITS.MAX_TOTAL_PROJECTS) {
    return {
      allowed: false,
      message: `최대 ${LIMITS.MAX_TOTAL_PROJECTS}개의 프로젝트까지 생성할 수 있습니다`,
    }
  }

  // Check daily project count (last 24 hours)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count: dailyCount, error: dailyError } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since)

  if (dailyError) {
    console.error('Rate limit check failed (daily):', dailyError.message)
    return { allowed: true }
  }

  if ((dailyCount ?? 0) >= LIMITS.MAX_PROJECTS_PER_DAY) {
    return {
      allowed: false,
      message: `하루 최대 ${LIMITS.MAX_PROJECTS_PER_DAY}개의 프로젝트를 생성할 수 있습니다. 내일 다시 시도하세요`,
    }
  }

  return { allowed: true }
}
