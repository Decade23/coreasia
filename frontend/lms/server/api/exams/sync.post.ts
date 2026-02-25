export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    console.log('[Mock API] Auto-save sync:', {
        examId: body?.examId,
        answerCount: body?.answers ? Object.keys(body.answers).length : 0,
    })

    return {
        success: true,
        synced_at: new Date().toISOString(),
    }
})
