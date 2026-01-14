import { Router } from 'express';
import { getMatches } from '../controllers/matching.controller';

const router = Router();

// Endpoint: POST /api/matches
router.post('/matches', getMatches);

export default router;