const aiService = require('../services/ai.service');

module.exports.getReview = async (req, res) => {
    const code = req.body.prompt || req.body.code;
    const language = req.body.language || 'javascript';
     
    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    try {
        if (!process.env.GOOGLE_GEMINI_KEY || process.env.GOOGLE_GEMINI_KEY.trim() === '' || process.env.GOOGLE_GEMINI_KEY === 'your_gemini_api_key_here') {
            return res.status(401).json({ 
                error: 'Missing GOOGLE_GEMINI_KEY environment variable. On Vercel, add GOOGLE_GEMINI_KEY under Project Settings -> Environment Variables.' 
            });
        }
        const response = await aiService(code, language);
        res.send(response);
    } catch (error) {
        console.error("AI Service Error:", error);
        let message = error.message || 'Failed to generate review';
        if (error.status === 401 || message.includes('API key') || message.includes('authentication')) {
            message = 'Invalid GOOGLE_GEMINI_KEY. Please verify your API key in BACKEND/.env at https://aistudio.google.com/';
        }
        res.status(500).json({ error: message });
    }
}