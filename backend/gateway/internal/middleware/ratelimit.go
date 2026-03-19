package middleware

import (
	"sync"
	"time"

	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type rateLimitEntry struct {
	count     int
	resetAt   time.Time
}

type RateLimiter struct {
	mu       sync.Mutex
	entries  map[uuid.UUID]*rateLimitEntry
	limit    int
	window   time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		entries: make(map[uuid.UUID]*rateLimitEntry),
		limit:   limit,
		window:  window,
	}

	// Cleanup expired entries periodically
	go func() {
		ticker := time.NewTicker(window)
		defer ticker.Stop()
		for range ticker.C {
			rl.cleanup()
		}
	}()

	return rl
}

func (rl *RateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	now := time.Now()
	for k, v := range rl.entries {
		if now.After(v.resetAt) {
			delete(rl.entries, k)
		}
	}
}

func (rl *RateLimiter) Middleware() fiber.Handler {
	return func(c fiber.Ctx) error {
		claims := GetClaims(c)
		if claims == nil {
			return c.Next()
		}

		rl.mu.Lock()
		entry, exists := rl.entries[claims.UserID]
		now := time.Now()

		if !exists || now.After(entry.resetAt) {
			rl.entries[claims.UserID] = &rateLimitEntry{
				count:   1,
				resetAt: now.Add(rl.window),
			}
			rl.mu.Unlock()
			return c.Next()
		}

		if entry.count >= rl.limit {
			rl.mu.Unlock()
			appErr := apperr.NewTooManyRequests("Terlalu banyak permintaan. Coba lagi nanti.")
			return c.Status(appErr.HTTPStatus).JSON(fiber.Map{
				"data":   nil,
				"errors": fiber.Map{"code": appErr.Code, "message": appErr.Message},
			})
		}

		entry.count++
		rl.mu.Unlock()
		return c.Next()
	}
}
