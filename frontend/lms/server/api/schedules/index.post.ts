export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    return {
        id: `JAD-${Date.now()}`,
        ...body,
        status: 'draft',
        current_participants: 0,
        assessors: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
})
