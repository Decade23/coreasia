export interface PersonalData {
    fullName: string
    nik: string
    placeOfBirth: string
    dateOfBirth: string
    gender: 'L' | 'P'
    address: string
    phoneNumber: string
    email: string
    lastEducation: string
}

export interface CompetencyData {
    schemeId: string
    purpose: 'sertifikasi' | 'sertifikasi_ulang' | 'pkp' | 'lainnya'
}

export interface UploadedFile {
    name: string
    type: string
    url: string
    status: 'pending' | 'success' | 'error'
}

export interface RegistrationDTO {
    // Structure expected by the backend
    nama_lengkap: string
    nomor_nik: string
    tempat_lahir: string
    tanggal_lahir: string
    jenis_kelamin: string
    alamat_peserta: string
    nomor_telp: string
    email_peserta: string
    pendidikan_terakhir: string
    skema_id: string
    tujuan_assesment: string
}
