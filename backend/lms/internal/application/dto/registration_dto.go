package dto

type SubmitRegistrationRequest struct {
	FullName       string `json:"nama_lengkap" validate:"required"`
	NIK            string `json:"nomor_nik" validate:"required,len=16,numeric"`
	PlaceOfBirth   string `json:"tempat_lahir" validate:"required"`
	DateOfBirth    string `json:"tanggal_lahir" validate:"required"`
	Gender         string `json:"jenis_kelamin" validate:"required,oneof=L P"`
	Address        string `json:"alamat_peserta" validate:"required"`
	PhoneNumber    string `json:"nomor_telp" validate:"required"`
	Email          string `json:"email_peserta" validate:"required,email"`
	LastEducation  string `json:"pendidikan_terakhir"`
	SchemeID       string `json:"skema_id" validate:"required"`
	AssessmentGoal string `json:"tujuan_assesment" validate:"required"`
}

type SubmitRegistrationResponse struct {
	VerificationID string `json:"verification_id"`
	AssesseeID     string `json:"assessee_id"`
	SchemeID       string `json:"scheme_id"`
	Status         string `json:"status"`
}
