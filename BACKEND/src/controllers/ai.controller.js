const aiService = require('../services/ai.service');

module.exports.getReview = async (req, res) => {
    const body = req.body || {};
    const code = body.prompt || body.code;
    const language = body.language || 'javascript';
    const clientKey = req.headers['x-gemini-key'] || req.headers['x-api-key'] || body.apiKey;
     
    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    try {
        const response = await aiService(code, language, clientKey);
        return res.send(response);
    } catch (error) {
        console.error("AI Service Error:", error);
        let message = error.message || 'Failed to generate review';
        let status = 500;

        if (error.status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
            status = 429;
            message = 'Gemini API rate limit exceeded. Please try again shortly.';
        }

        res.status(status).json({ error: message });
    }
}