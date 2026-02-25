export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    return {
        id: `SCH-${Date.now()}`,
        code: body.code,
        name: body.name,
        description: body.description,
        is_active: body.is_active ?? true,
        validity_years: body.validity_years ?? 3,
        units: [],
        unit_count: 0,
        assessee_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
})
