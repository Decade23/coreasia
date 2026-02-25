import { reactive, computed } from 'vue'

type ValidationRule = (value: any) => string | true
type FieldRules = Record<string, ValidationRule[]>

/**
 * useFormValidation
 * Rule-based reactive form validation composable.
 * Provides per-field error tracking and batch/single-field validation.
 */
export const useFormValidation = <T extends Record<string, any>>(formData: T, rules: FieldRules) => {
    const errors = reactive<Record<string, string>>({})

    const isValid = computed(() => Object.values(errors).every(e => !e))

    const validateField = (field: string): boolean => {
        const fieldRules = rules[field]
        if (!fieldRules) {
            errors[field] = ''
            return true
        }

        const value = (formData as any)[field]
        for (const rule of fieldRules) {
            const result = rule(value)
            if (result !== true) {
                errors[field] = result
                return false
            }
        }

        errors[field] = ''
        return true
    }

    const validate = (): boolean => {
        let allValid = true
        for (const field of Object.keys(rules)) {
            if (!validateField(field)) {
                allValid = false
            }
        }
        return allValid
    }

    const resetErrors = () => {
        for (const key of Object.keys(errors)) {
            errors[key] = ''
        }
    }

    const clearFieldError = (field: string) => {
        errors[field] = ''
    }

    return {
        errors,
        isValid,
        validate,
        validateField,
        resetErrors,
        clearFieldError,
    }
}

// ── Built-in Validation Rules ──

export const required = (label: string): ValidationRule => {
    return (value: any) => {
        if (value === null || value === undefined || String(value).trim() === '') {
            return `${label} wajib diisi`
        }
        return true
    }
}

export const email = (): ValidationRule => {
    return (value: any) => {
        if (!value) return true
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return pattern.test(String(value)) || 'Format email tidak valid'
    }
}

export const minLength = (label: string, min: number): ValidationRule => {
    return (value: any) => {
        if (!value) return true
        return String(value).length >= min || `${label} minimal ${min} karakter`
    }
}

export const maxLength = (label: string, max: number): ValidationRule => {
    return (value: any) => {
        if (!value) return true
        return String(value).length <= max || `${label} maksimal ${max} karakter`
    }
}

export const exactLength = (label: string, len: number): ValidationRule => {
    return (value: any) => {
        if (!value) return true
        return String(value).length === len || `${label} harus ${len} karakter`
    }
}

export const numericOnly = (label: string): ValidationRule => {
    return (value: any) => {
        if (!value) return true
        return /^\d+$/.test(String(value)) || `${label} hanya boleh berisi angka`
    }
}

export const phoneNumber = (): ValidationRule => {
    return (value: any) => {
        if (!value) return true
        return /^0\d{9,13}$/.test(String(value)) || 'Nomor telepon tidak valid (contoh: 08123456789)'
    }
}

export const fileMaxSize = (maxMB: number): ValidationRule => {
    return (value: any) => {
        if (!value) return true
        const file = value as File
        if (!file.size) return true
        return file.size <= maxMB * 1024 * 1024 || `Ukuran file maksimal ${maxMB}MB`
    }
}

export const fileTypes = (extensions: string[]): ValidationRule => {
    return (value: any) => {
        if (!value) return true
        const file = value as File
        if (!file.name) return true
        const ext = file.name.split('.').pop()?.toLowerCase()
        return extensions.includes(ext || '') || `Format file harus: ${extensions.join(', ')}`
    }
}
