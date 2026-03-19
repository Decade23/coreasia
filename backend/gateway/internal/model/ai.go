package model

type AIGenerateRequest struct {
	Topic     string   `json:"topic" validate:"required,min=5"`
	Keywords  []string `json:"keywords"`
	Tone      string   `json:"tone" validate:"required,oneof=professional casual informative"`
	Language  string   `json:"language" validate:"required,oneof=id en"`
	WordCount int      `json:"word_count" validate:"required,min=300,max=5000"`
	Category  string   `json:"category"`
}

type AIGenerateResponse struct {
	Title       string   `json:"title"`
	Slug        string   `json:"slug"`
	Description string   `json:"description"`
	Content     string   `json:"content"`
	Tags        []string `json:"tags"`
	ReadTime    int      `json:"read_time"`
}
