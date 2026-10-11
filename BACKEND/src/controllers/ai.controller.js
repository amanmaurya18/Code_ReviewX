const aiService = require('../services/ai.service');

module.exports.getReview = async (req, res) => {
    const body = req.body || {};
    const code = body.prompt || body.code;
    const language = body.language || 'javascript';
    const clientKey = req.headers['x-gemini-key'] || req.headers['x-api-key'] || body.apiKey;
    const apiKey = (clientKey && typeof clientKey === 'string' && clientKey.trim()) ? clientKey.trim() : process.env.GOOGLE_GEMINI_KEY;
     
    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
        return res.status(401).json({ 
            error: 'Missing Gemini API Key',
            needKey: true,
            message: 'No Google Gemini API key configured. Please enter your API key using the "API Key" button in the header, or set GOOGLE_GEMINI_KEY in Vercel Project Settings.' 
        });
    }

    try {
        const response = await aiService(code, language, apiKey);
        res.send(response);
    } catch (error) {
        console.error("AI Service Error:", error);
        let message = error.message || 'Failed to generate review';
        let status = 500;

        if (
            error.status === 401 || 
            message.includes('API key') || 
            message.includes('authentication') ||
            message.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
            message.includes('UNAUTHENTICATED')
        ) {
            status = 401;
            message = 'Invalid or unauthorized Gemini API key. Please generate a valid Gemini API key at https://aistudio.google.com/app/apikey';
            return res.status(status).json({ error: message, needKey: true });
        }

        if (error.status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
            status = 429;
            message = 'Gemini API rate limit or quota exceeded. Please try again shortly or use your own API key.';
            return res.status(status).json({ error: message });
        }

        res.status(status).json({ error: message });
    }
}