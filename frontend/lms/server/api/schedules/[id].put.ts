export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    return { id, ...body, updated_at: new Date().toISOString() }
})
