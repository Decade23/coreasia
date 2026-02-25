export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    return { id, status: body.status, manager_notes: body.manager_notes, reviewed_at: new Date().toISOString() }
})
