/**
 * BNSP Data Formatter
 * Formats data sesuai template standar BNSP untuk export laporan.
 */

export interface BnspCertificateRow {
    no: number
    nama_pemegang: string
    nomor_sertifikat: string
    skema_sertifikasi: string
    tanggal_terbit: string
    tanggal_expired: string
    nama_asesor: string
    rekomendasi: string
    status: string
}

export interface BnspAssessmentRow {
    no: number
    nama_asesi: string
    nik: string
    skema_sertifikasi: string
    tanggal_asesmen: string
    nama_asesor: string
    rekomendasi: 'Kompeten' | 'Belum Kompeten'
    nomor_sertifikat: string
}

/**
 * Format tanggal ke format BNSP standar (DD-MM-YYYY)
 */
export const formatBnspDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
}

/**
 * Format nomor sertifikat ke standar BNSP
 */
export const formatBnspCertNumber = (lspCode: string, schemeCode: string, year: number, sequence: number): string => {
    return `${lspCode}/${schemeCode}/${year}/${String(sequence).padStart(6, '0')}`
}

/**
 * Generate nama file export sesuai konvensi BNSP
 */
export const generateExportFileName = (lspName: string, schemeCode: string, periodStart: string, periodEnd: string, format: string): string => {
    const sanitized = lspName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
    const start = periodStart.replace(/-/g, '')
    const end = periodEnd.replace(/-/g, '')
    return `BNSP_${sanitized}_${schemeCode}_${start}_${end}.${format}`
}

/**
 * Format rekomendasi ke label BNSP
 */
export const formatRecommendation = (rec: 'competent' | 'not_competent'): string => {
    return rec === 'competent' ? 'Kompeten' : 'Belum Kompeten'
}

/**
 * Format status sertifikat ke label BNSP
 */
export const formatCertificateStatus = (status: 'active' | 'expired' | 'revoked'): string => {
    switch (status) {
        case 'active': return 'Berlaku'
        case 'expired': return 'Kedaluwarsa'
        case 'revoked': return 'Dicabut'
    }
}
