import type { PersonalData, CompetencyData, RegistrationDTO } from '../types/registration'

export const RegistrationAdapter = {
    toDTO(personal: PersonalData, competency: CompetencyData): RegistrationDTO {
        return {
            nama_lengkap: personal.fullName,
            nomor_nik: personal.nik,
            tempat_lahir: personal.placeOfBirth,
            tanggal_lahir: personal.dateOfBirth,
            jenis_kelamin: personal.gender,
            alamat_peserta: personal.address,
            nomor_telp: personal.phoneNumber,
            email_peserta: personal.email,
            pendidikan_terakhir: personal.lastEducation,
            skema_id: competency.schemeId,
            tujuan_assesment: competency.purpose
        }
    }
}
