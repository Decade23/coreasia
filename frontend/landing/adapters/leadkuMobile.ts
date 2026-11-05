export interface LeadkuPolicy { channel: 'production' | 'uat'; latest_code: number; latest_version: string; minimum_code: number; available: boolean; notes: string; updated_at: string }
export interface LeadkuSummary {
 channel: 'production' | 'uat'
 play_sync: { configured: boolean; last_attempt: string | null; last_success: string | null; error: string }
 counts: { installations: number; active_24h: number; active_7d: number; active_30d: number; new_7d: number }
 versions: Array<{ version: string; code: number; installations: number; active_7d: number }>
 usage: Array<{ kind: string; screen: string; events: number; installations: number }>
 daily: Array<{ day: string; new_installations: number }>
 play: Array<{ day: string; installs: number; uninstalls: number; current_installs: number | null; active_installs: number | null; source: string; imported_at: string }>
 policy: LeadkuPolicy
}
export const screenLabels: Record<string, string> = { home: 'Hari ini', contacts: 'Kontak', pipeline: 'Deal', tasks: 'Tugas', profile: 'Menu', contact: 'Detail kontak', deal: 'Detail deal', task: 'Detail tugas', login: 'Login', other: 'Lainnya' }
export function updateImpact(summary: LeadkuSummary, minimum: number) { return summary.versions.filter(v => v.code < minimum).reduce((count,v) => count + v.active_7d,0) }
export function playTotals(summary: LeadkuSummary) {
 if (!summary.play.length) return null
 return { first: [...summary.play].sort((a,b)=>a.day.localeCompare(b.day))[0]!, installs: summary.play.reduce((n,d) => n+d.installs,0), uninstalls: summary.play.reduce((n,d) => n+d.uninstalls,0), latest: [...summary.play].sort((a,b) => b.day.localeCompare(a.day))[0]! }
}
