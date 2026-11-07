export interface LeadkuPolicy { channel: 'production' | 'uat'; latest_code: number; latest_version: string; minimum_code: number; available: boolean; notes: string; updated_at: string }
export interface LeadkuFunnel {
 first_open: number
 welcome_view: number
 demo_started: number
 demo_key_action: number
 guide_opened: number
 guide_completed: number
 signup_started: number
 signup_completed: number
 signup_direct?: number
 signup_via_demo?: number
 setup_help_requested: number
}
export interface LeadkuSetupRequest {
 id: string
 channel: 'email' | 'whatsapp'
 contact: string
 topic: 'pipeline' | 'contacts' | 'tasks' | 'setup'
 created_at: string
}
export interface LeadkuSummary {
 channel: 'production' | 'uat'
 play_sync: { configured: boolean; last_attempt: string | null; last_success: string | null; error: string }
 counts: { installations: number; active_24h: number; active_7d: number; active_30d: number; new_7d: number }
 versions: Array<{ version: string; code: number; installations: number; active_7d: number }>
 usage: Array<{ kind: string; screen: string; events: number; installations: number }>
 daily: Array<{ day: string; new_installations: number }>
 play: Array<{ day: string; installs: number; uninstalls: number; current_installs: number | null; active_installs: number | null; source: string; imported_at: string }>
 policy: LeadkuPolicy
 funnel?: LeadkuFunnel
}
export const screenLabels: Record<string, string> = { home: 'Hari ini', contacts: 'Kontak', pipeline: 'Deal', tasks: 'Tugas', profile: 'Menu', contact: 'Detail kontak', deal: 'Detail deal', task: 'Detail tugas', login: 'Login', other: 'Lainnya' }
export function updateImpact(summary: LeadkuSummary, minimum: number) { return summary.versions.filter(v => v.code < minimum).reduce((count,v) => count + v.active_7d,0) }
export function funnelRate(reached: number, started: number) {
 if (!Number.isSafeInteger(reached) || !Number.isSafeInteger(started) || started <= 0 || reached < 0 || reached > started) return null
 return reached / started
}
export function playTotals(summary: LeadkuSummary) {
 const days = [...summary.play].sort((a, b) => a.day.localeCompare(b.day))
 const first = days[0]
 const latest = days[days.length - 1]
 if (!first || !latest) return null
 return {
  first,
  latest,
  reportedDays: days.length,
  installs: days.reduce((sum, row) => sum + row.installs, 0),
  uninstalls: days.reduce((sum, row) => sum + row.uninstalls, 0),
  importedAt: days.reduce((latestImport, row) => Date.parse(row.imported_at) > Date.parse(latestImport) ? row.imported_at : latestImport, first.imported_at),
 }
}
