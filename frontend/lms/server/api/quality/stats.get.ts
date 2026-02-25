export default defineEventHandler(() => {
    return {
        total_assessments: 275,
        competent_count: 231,
        not_competent_count: 44,
        pass_rate: 84,
        pending_reviews: 8,
        scheme_breakdown: [
            { scheme_name: 'Junior Web Developer', total: 128, competent: 112, pass_rate: 87.5 },
            { scheme_name: 'Desainer Grafis Muda', total: 85, competent: 68, pass_rate: 80 },
            { scheme_name: 'Digital Marketing', total: 62, competent: 51, pass_rate: 82.3 },
        ],
    }
})
