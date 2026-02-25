export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const statusMap: Record<string, string> = {
        approve: 'VERIFIED',
        reject: 'REJECTED',
        request_revision: 'REVISION_NEEDED',
    }

    const newStatus = statusMap[body.action] || 'SUBMITTED'

    return {
        id,
        status: newStatus,
        review_notes: body.notes || '',
        reviewed_by: 'Admin LSP',
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
})
