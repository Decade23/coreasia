import { describe, it, expect } from 'vitest'
import { SchemeAdapter } from '../../app/adapters/SchemeAdapter'
import type { SchemeDTO } from '../../app/types/scheme'

describe('SchemeAdapter', () => {
    const mockDTO: SchemeDTO = {
        id: 's-1',
        code: 'JWD-001',
        name: 'Junior Web Developer',
        description: 'Skema JWD',
        is_active: true,
        validity_years: 3,
        units: [
            { id: 'u-1', code: 'J.001', title: 'Menggunakan Struktur Data', element_count: 5 },
            { id: 'u-2', code: 'J.002', title: 'Membuat Program OOP', element_count: 3 },
        ],
        unit_count: 2,
        assessee_count: 42,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2025-03-20T10:00:00Z',
    }

    it('transforms SchemeDTO to SchemeDomain', () => {
        const result = SchemeAdapter.toDomain(mockDTO)

        expect(result.id).toBe('s-1')
        expect(result.code).toBe('JWD-001')
        expect(result.name).toBe('Junior Web Developer')
        expect(result.isActive).toBe(true)
        expect(result.validityYears).toBe(3)
        expect(result.unitCount).toBe(2)
        expect(result.assesseeCount).toBe(42)
        expect(result.createdAt).toBeInstanceOf(Date)
        expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('transforms units with element_count to elementCount', () => {
        const result = SchemeAdapter.toDomain(mockDTO)

        expect(result.units).toHaveLength(2)
        expect(result.units[0].code).toBe('J.001')
        expect(result.units[0].elementCount).toBe(5)
        expect(result.units[1].elementCount).toBe(3)
    })

    it('handles missing units array', () => {
        const dto = { ...mockDTO, units: undefined as any }
        const result = SchemeAdapter.toDomain(dto)

        expect(result.units).toEqual([])
    })

    it('converts form data to API payload', () => {
        const payload = SchemeAdapter.toDTO({
            code: 'NEW-001',
            name: 'New Scheme',
            description: 'Desc',
            isActive: true,
            validityYears: 5,
            unitIds: ['u-1', 'u-2'],
        })

        expect(payload.code).toBe('NEW-001')
        expect(payload.is_active).toBe(true)
        expect(payload.validity_years).toBe(5)
        expect(payload.unit_ids).toEqual(['u-1', 'u-2'])
    })
})
