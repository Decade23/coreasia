export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    return { success: true, ...body, updated_at: new Date().toISOString() }
})
