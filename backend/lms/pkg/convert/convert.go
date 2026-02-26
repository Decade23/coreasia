package convert

func StringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func IntPtr(i int) *int {
	return &i
}

func Float64Ptr(f float64) *float64 {
	return &f
}

func DerefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func DerefInt(i *int) int {
	if i == nil {
		return 0
	}
	return *i
}
