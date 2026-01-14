import { Router } from 'express';
import { getMatches } from '../controllers/matching.controller'; // Ensure this function exists in your controller

const router = Router();

// This links the URL "/matches" to your controller logic
router.get('/matches', getMatches);

export default router;