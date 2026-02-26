import { describe, it, expect } from 'vitest'
import { AuthAdapter } from '../../app/adapters/AuthAdapter'
import type { UserResponseDTO } from '../../app/types/auth'

describe('AuthAdapter', () => {
    const mockDTO: UserResponseDTO = {
        id: 'u-1',
        email: 'admin@lsp.com',
        full_name: 'Admin LSP',
        phone_number: '081234567890',
        role: 'admin',
        is_active: true,
        last_login_at: '2025-01-15T10:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
    }

    it('transforms UserResponseDTO to AuthUser domain', () => {
        const result = AuthAdapter.toDomain(mockDTO, 'demo')

        expect(result.id).toBe('u-1')
        expect(result.email).toBe('admin@lsp.com')
        expect(result.fullName).toBe('Admin LSP')
        expect(result.role).toBe('admin')
        expect(result.tenantId).toBe('demo')
        expect(result.isActive).toBe(true)
        expect(result.lastLogin).toBeInstanceOf(Date)
    })

    it('handles null last_login_at', () => {
        const dto: UserResponseDTO = { ...mockDTO, last_login_at: null }
        const result = AuthAdapter.toDomain(dto)

        expect(result.lastLogin).toBeUndefined()
    })

    it('handles empty full_name', () => {
        const dto: UserResponseDTO = { ...mockDTO, full_name: '' }
        const result = AuthAdapter.toDomain(dto)

        expect(result.fullName).toBe('Anonymous')
    })

    it('defaults tenantId to empty string when not provided', () => {
        const result = AuthAdapter.toDomain(mockDTO)
        expect(result.tenantId).toBe('')
    })
})
