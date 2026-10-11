const express=require('express')
const aiController=require('../controllers/ai.controller')


const router = express.Router();

router.post('/get-review', aiController.getReview);
router.post('/', aiController.getReview);
router.get('/', (req, res) => res.json({ status: "ok", message: "AI Review service is active" }));
router.get('/get-review', (req, res) => res.json({ status: "ok", message: "Please use POST to submit code for review" }));
router.get('/health', (req, res) => res.json({ status: "ok" }));

module.exports = router;