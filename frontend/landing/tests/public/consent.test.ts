import { afterEach, describe, expect, it, vi } from 'vitest'
import { parsePublicConsent, readPublicConsent } from '~/utils/public-consent'
afterEach(() => vi.unstubAllGlobals())
describe('optional tracking consent', () => {
  it('starts with optional tracking denied, including unknown versions', () => {
    for (const value of [undefined, '', 'true', 'v2.a1.m1', 'v1.a1.m1.invalid']) expect(parsePublicConsent(value)).toEqual({ analytics: false, ads: false, decided: false })
  })
  it('keeps analytics and advertising choices separate', () => {
    expect(parsePublicConsent('v1.a1.m0')).toEqual({ analytics: true, ads: false, decided: true })
    expect(parsePublicConsent('v1.a0.m1')).toEqual({ analytics: false, ads: true, decided: true })
    expect(parsePublicConsent('v1.a0.m0').decided).toBe(true)
  })
  it('does not confuse unrelated cookies with an explicit choice', () => {
    vi.stubGlobal('document', { cookie: 'other=coreasia-consent; coreasia-theme=light' })
    expect(readPublicConsent().analytics).toBe(false)
    vi.stubGlobal('document', { cookie: 'other=1; coreasia-consent=v1.a1.m0; theme=light' })
    expect(readPublicConsent().analytics).toBe(true)
  })
})
