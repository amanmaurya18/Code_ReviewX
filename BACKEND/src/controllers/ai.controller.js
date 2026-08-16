const aiService = require('../services/ai.service');

module.exports.getReview = async (req, res) => {
    const code = req.body.prompt || req.body.code;
    const language = req.body.language || 'javascript';
     
    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    try {
        const response = await aiService(code, language);
        res.send(response);
    } catch (error) {
        console.error("AI Service Error:", error);
        res.status(500).json({ error: error.message || 'Failed to generate review' });
    }
}