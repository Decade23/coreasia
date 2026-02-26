package dto

type PaginatedResponse struct {
	Data  interface{} `json:"data"`
	Meta  PaginationMeta `json:"meta"`
}

type PaginationMeta struct {
	Page    int `json:"page"`
	PerPage int `json:"per_page"`
	Total   int `json:"total"`
}

type IDResponse struct {
	ID string `json:"id"`
}

type MessageResponse struct {
	Message string `json:"message"`
}
