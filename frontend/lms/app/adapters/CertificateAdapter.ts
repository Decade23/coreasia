import type { IssuedCertificateDTO, IssuedCertificateDomain, PublicVerificationResultDTO, PublicVerificationResultDomain } from '~/types/certificate'

export class CertificateAdapter {

    public static toDomain(dto: IssuedCertificateDTO): IssuedCertificateDomain {
        return {
            id: dto.id,
            certificateNumber: dto.certificate_number,
            holderName: dto.holder_name,
            holderPhotoUrl: dto.holder_photo_url,
            schemeName: dto.scheme_name,
            schemeCode: dto.scheme_code,
            assessorName: dto.assessor_name,
            lspName: dto.lsp_name,
            status: dto.status,
            issuedDate: new Date(dto.issued_date),
            expiryDate: new Date(dto.expiry_date),
            downloadUrl: dto.download_url,
            verificationUrl: dto.verification_url,
            qrCodeData: dto.qr_code_data,
        }
    }

    public static toVerificationDomain(dto: PublicVerificationResultDTO): PublicVerificationResultDomain {
        return {
            valid: dto.valid,
            certificateNumber: dto.certificate_number,
            holderName: dto.holder_name,
            holderPhotoUrl: dto.holder_photo_url,
            schemeName: dto.scheme_name,
            lspName: dto.lsp_name,
            status: dto.status,
            issuedDate: new Date(dto.issued_date),
            expiryDate: new Date(dto.expiry_date),
        }
    }
}
