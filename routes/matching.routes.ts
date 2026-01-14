import { Router } from 'express';
import { getMatches } from '../controllers/matching.controller';

const router = Router();

// This defines the POST endpoint
// Full URL will be: https://your-backend.com/api/matching/get-match
router.post('/get-match', getMatches);

export default router;