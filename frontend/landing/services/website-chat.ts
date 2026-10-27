import { websiteChatOrigin } from '~/utils/website-chat'

interface ChatWindow extends Window {
    chatwootSettings?: Record<string, unknown>
    chatwootSDK?: { run: (options: { websiteToken: string; baseUrl: string }) => void }
    $chatwoot?: { toggle: (state: 'open' | 'close') => void }
}
let loading: Promise<void> | undefined

// No SDK, iframe, cookies or connection before the visitor explicitly opens chat.
export async function openWebsiteChat(base: string, token: string, locale: string, allowLocal = false) {
    const origin = websiteChatOrigin(base, allowLocal)
    if (!origin || !token) throw new Error('Website chat is not configured')
    const target = window as ChatWindow
    if (!target.$chatwoot) {
        loading ??= new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            const cleanup = () => {
                clearTimeout(timeout)
                window.removeEventListener('chatwoot:ready', ready)
            }
            const ready = () => {
                cleanup()
                resolve()
            }
            const fail = () => {
                cleanup()
                script.remove()
                loading = undefined
                reject(new Error('Chat unavailable'))
            }
            const timeout = setTimeout(fail, 15000)
            window.addEventListener('chatwoot:ready', ready, { once: true })
            target.chatwootSettings = { hideMessageBubble: true, position: 'right', locale }
            script.src = `${origin}/packs/js/sdk.js`
            script.async = true
            script.onerror = fail
            script.onload = () => {
                if (!target.chatwootSDK) {
                    fail()
                    return
                }
                try {
                    target.chatwootSDK.run({ websiteToken: token, baseUrl: origin })
                } catch {
                    fail()
                }
            }
            document.head.append(script)
        })
        await loading
    }
    if (!target.$chatwoot) throw new Error('Chat unavailable')
    target.$chatwoot.toggle('open')
}
