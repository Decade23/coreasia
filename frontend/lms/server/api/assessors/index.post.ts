export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    return { id: `ASR-${Date.now()}`, ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
})
