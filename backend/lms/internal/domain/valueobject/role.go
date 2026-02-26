package valueobject

const (
	RoleSuperAdmin     = "super_admin"
	RoleAdmin          = "admin"
	RoleQualityManager = "quality_manager"
	RoleAssessor       = "assessor"
	RoleAssessee       = "assessee"
)

var ValidRoles = []string{
	RoleSuperAdmin,
	RoleAdmin,
	RoleQualityManager,
	RoleAssessor,
	RoleAssessee,
}

func IsValidRole(role string) bool {
	for _, r := range ValidRoles {
		if r == role {
			return true
		}
	}
	return false
}
