import { describe, it, expect } from 'vitest'
import { UserAdapter, type UserDTO } from '../../app/adapters/UserAdapter'

describe('UserAdapter', () => {
    const mockDTO: UserDTO = {
        id: 'u-1',
        email: 'user@test.com',
        full_name: 'Test User',
        phone_number: '081234567890',
        role: 'assessee',
        is_active: true,
        last_login_at: '2025-06-01T12:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2025-06-01T12:00:00Z',
    }

    it('transforms UserDTO to UserDomain', () => {
        const result = UserAdapter.toDomain(mockDTO, 'tenant-1')

        expect(result.id).toBe('u-1')
        expect(result.email).toBe('user@test.com')
        expect(result.fullName).toBe('Test User')
        expect(result.phoneNumber).toBe('081234567890')
        expect(result.role).toBe('assessee')
        expect(result.tenantId).toBe('tenant-1')
        expect(result.isActive).toBe(true)
        expect(result.lastLoginAt).toBeInstanceOf(Date)
    })

    it('handles null phone_number', () => {
        const dto: UserDTO = { ...mockDTO, phone_number: null }
        const result = UserAdapter.toDomain(dto)

        expect(result.phoneNumber).toBe('')
    })

    it('handles null last_login_at', () => {
        const dto: UserDTO = { ...mockDTO, last_login_at: null }
        const result = UserAdapter.toDomain(dto)

        expect(result.lastLoginAt).toBeNull()
    })

    it('transforms list of DTOs', () => {
        const list = [mockDTO, { ...mockDTO, id: 'u-2', full_name: 'Another' }]
        const result = UserAdapter.toDomainList(list, 'tenant-1')

        expect(result).toHaveLength(2)
        expect(result[0].id).toBe('u-1')
        expect(result[1].id).toBe('u-2')
        expect(result[1].fullName).toBe('Another')
    })

    it('creates correct API payload from domain', () => {
        const payload = UserAdapter.toCreatePayload({
            email: 'new@test.com',
            fullName: 'New User',
            phoneNumber: '08111',
            role: 'assessor',
        })

        expect(payload.email).toBe('new@test.com')
        expect(payload.full_name).toBe('New User')
        expect(payload.phone_number).toBe('08111')
        expect(payload.role).toBe('assessor')
        expect(payload.is_active).toBe(true)
    })
})
