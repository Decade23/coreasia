/** Sidik untuk ?pelaku= di URL audit: buram, stabil, dan tahan beda ejaan. */
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { sidik, POLA_SIDIK } from '../../adapters/cashflow'

describe('sidik', () => {
  it('10 aksara hex pertama sha256 dari bentuk ternormal', async () => {
    const harap = createHash('sha256').update('admin@coreasia.id').digest('hex').slice(0, 10)
    expect(await sidik('admin@coreasia.id')).toBe(harap)
    expect(await sidik('  Admin@CoreAsia.id ')).toBe(harap)
    expect(POLA_SIDIK.test(harap)).toBe(true)
  })
  it('tidak memuat email mentah', async () => {
    const s = await sidik('dedi@contoh.id')
    expect(s).not.toContain('@')
    expect(s).not.toContain('dedi')
  })
})
