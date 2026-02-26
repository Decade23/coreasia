package valueobject

const (
	DefaultPage    = 1
	DefaultPerPage = 10
	MaxPerPage     = 100
)

type Pagination struct {
	Page    int `json:"page"`
	PerPage int `json:"per_page"`
}

func NewPagination(page, perPage int) Pagination {
	if page < 1 {
		page = DefaultPage
	}
	if perPage < 1 {
		perPage = DefaultPerPage
	}
	if perPage > MaxPerPage {
		perPage = MaxPerPage
	}
	return Pagination{Page: page, PerPage: perPage}
}

func (p Pagination) Offset() int {
	return (p.Page - 1) * p.PerPage
}

func (p Pagination) Limit() int {
	return p.PerPage
}
