package dto

type TenantSettingsResponse struct {
	Settings map[string]interface{} `json:"settings"`
}

type UpdateTenantSettingsRequest struct {
	Settings map[string]interface{} `json:"settings" validate:"required"`
}

type TenantResolveResponse struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Slug       string  `json:"slug"`
	SchemaName string  `json:"schema_name"`
	Domain     *string `json:"domain"`
}
