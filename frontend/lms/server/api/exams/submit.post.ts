export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    console.log('[Mock API] Exam submitted:', {
        examId: body?.examId,
        answerCount: body?.answers ? Object.keys(body.answers).length : 0,
        remainingTime: body?.remainingTime,
    })

    return {
        success: true,
        message: 'Ujian berhasil diselesaikan',
        data: {
            exam_id: body?.examId,
            submitted_at: new Date().toISOString(),
            status: 'completed',
        },
    }
})
