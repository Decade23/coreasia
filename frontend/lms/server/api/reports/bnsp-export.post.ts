export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    return {
        download_url: `/api/reports/download/bnsp-export-${Date.now()}.${body.format || 'xlsx'}`,
        file_name: `BNSP_Export_${body.scheme_id || 'ALL'}_${body.period_start}_${body.period_end}.${body.format || 'xlsx'}`,
        record_count: 42,
        generated_at: new Date().toISOString(),
    }
})
