package rbac

// Permission represents a granular access control permission.
type Permission string

// Dashboard
const (
	DashboardView Permission = "dashboard:view"
)

// Articles
const (
	ArticlesList   Permission = "articles:list"
	ArticlesView   Permission = "articles:view"
	ArticlesCreate Permission = "articles:create"
	ArticlesUpdate Permission = "articles:update"
	ArticlesDelete Permission = "articles:delete"
	ArticlesPublish Permission = "articles:publish"
	ArticlesStats  Permission = "articles:stats"
)

// Users
const (
	UsersList   Permission = "users:list"
	UsersCreate Permission = "users:create"
	UsersUpdate Permission = "users:update"
	UsersDelete Permission = "users:delete"
)

// Bots
const (
	BotsList    Permission = "bots:list"
	BotsView    Permission = "bots:view"
	BotsCreate  Permission = "bots:create"
	BotsUpdate  Permission = "bots:update"
	BotsDelete  Permission = "bots:delete"
	BotsTrigger Permission = "bots:trigger"
)

// AI
const (
	AIGenerate       Permission = "ai:generate"
	AIModels         Permission = "ai:models"
	AISettingsView   Permission = "ai:settings:view"
	AISettingsUpdate Permission = "ai:settings:update"
)

// API Keys
const (
	APIKeysList   Permission = "apikeys:list"
	APIKeysView   Permission = "apikeys:view"
	APIKeysCreate Permission = "apikeys:create"
	APIKeysUpdate Permission = "apikeys:update"
	APIKeysDelete Permission = "apikeys:delete"
	APIKeysCopy   Permission = "apikeys:copy"
)

// Upload
const (
	UploadCreate Permission = "upload:create"
)

// Keywords
const (
	KeywordsList      Permission = "keywords:list"
	KeywordsView      Permission = "keywords:view"
	KeywordsCreate    Permission = "keywords:create"
	KeywordsUpdate    Permission = "keywords:update"
	KeywordsDelete    Permission = "keywords:delete"
	KeywordsAISuggest Permission = "keywords:ai_suggest"
)

// Audit
const (
	AuditList Permission = "audit:list"
)

// RolePermissions maps each role to its allowed permissions.
// To add a new role, add an entry here. To grant/revoke a permission, edit the map.
// Keep in sync with frontend: composables/usePermissions.ts
var RolePermissions = map[string]map[Permission]bool{
	"super_admin": {
		DashboardView:   true,
		ArticlesList:    true,
		ArticlesView:    true,
		ArticlesCreate:  true,
		ArticlesUpdate:  true,
		ArticlesDelete:  true,
		ArticlesPublish: true,
		ArticlesStats:   true,
		UsersList:       true,
		UsersCreate:     true,
		UsersUpdate:     true,
		UsersDelete:     true,
		BotsList:        true,
		BotsView:        true,
		BotsCreate:      true,
		BotsUpdate:      true,
		BotsDelete:      true,
		BotsTrigger:     true,
		AIGenerate:      true,
		AIModels:        true,
		AISettingsView:  true,
		AISettingsUpdate: true,
		APIKeysList:     true,
		APIKeysView:     true,
		APIKeysCreate:   true,
		APIKeysUpdate:   true,
		APIKeysDelete:   true,
		APIKeysCopy:     true,
		KeywordsList:      true,
		KeywordsView:      true,
		KeywordsCreate:    true,
		KeywordsUpdate:    true,
		KeywordsDelete:    true,
		KeywordsAISuggest: true,
		UploadCreate:      true,
		AuditList:         true,
	},
	"admin": {
		DashboardView:  true,
		ArticlesList:   true,
		ArticlesView:   true,
		ArticlesCreate: true,
		ArticlesUpdate: true,
		ArticlesStats:  true,
		UsersList:      true,
		BotsList:       true,
		BotsView:       true,
		AIGenerate:     true,
		AIModels:       true,
		AISettingsView: true,
		KeywordsList:      true,
		KeywordsView:      true,
		KeywordsAISuggest: true,
		APIKeysList:       true,
		APIKeysView:       true,
		UploadCreate:      true,
		AuditList:         true,
	},
}

// HasPermission checks if a role has a specific permission.
func HasPermission(role string, perm Permission) bool {
	perms, ok := RolePermissions[role]
	if !ok {
		return false
	}
	return perms[perm]
}

// PermissionsForRole returns all permission strings for a given role.
func PermissionsForRole(role string) []string {
	perms, ok := RolePermissions[role]
	if !ok {
		return nil
	}
	result := make([]string, 0, len(perms))
	for p := range perms {
		result = append(result, string(p))
	}
	return result
}
