import { describe, expect, it } from 'vitest'
import { playTotals, updateImpact } from '../../adapters/leadkuMobile'
import type { LeadkuSummary } from '../../adapters/leadkuMobile'
const summary = (partial: Partial<LeadkuSummary>) => ({ play: [], versions: [], ...partial } as LeadkuSummary)
describe('analitik LeadKu', () => {
 it('does not replace unavailable Google Play counts with opted-in app counts', () => {
  expect(playTotals(summary({counts:{installations:99} as LeadkuSummary['counts']}))).toBeNull()
 })
 it('totals only the reported period and uses the newest device snapshot', () => {
  const result = playTotals(summary({play:[{day:'2026-11-04',installs:2,uninstalls:1,current_installs:4,active_installs:3},{day:'2026-11-03',installs:3,uninstalls:0,current_installs:3,active_installs:2}] as LeadkuSummary['play']}))
  expect(result?.installs).toBe(5);expect(result?.uninstalls).toBe(1)
  expect(result?.latest.current_installs).toBe(4);expect(result?.first.day).toBe('2026-11-03')
 })
 it('limits mandatory update impact to active installations below the minimum', () => {
  const value=summary({versions:[{code:12,active_7d:2},{code:13,active_7d:5}] as LeadkuSummary['versions']})
  expect(updateImpact(value,0)).toBe(0);expect(updateImpact(value,13)).toBe(2)
 })
})
