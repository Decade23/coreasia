export function websiteChatOrigin(raw: string, allowLocal = false): string | undefined {
    try {
        const url = new URL(raw)
        if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return
        const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
        if (url.protocol !== 'https:' && !(allowLocal && local && url.protocol === 'http:')) return
        return url.origin
    } catch {
        return
    }
}
