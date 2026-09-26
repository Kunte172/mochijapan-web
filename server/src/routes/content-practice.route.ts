import { Router } from 'express';
import {
  getGrammarQueue,
  getKanjiQueue,
  getPracticeSummary,
  rateGrammarItem,
  rateKanjiItem,
} from '../controllers/content-practice.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  validateGrammarPracticeId,
  validateKanjiPracticeId,
} from '../schemas/content-practice.schema.js';

export const contentPracticeRouter = Router();

contentPracticeRouter.use(requireAuth);

contentPracticeRouter.get('/summary', getPracticeSummary);
contentPracticeRouter.get('/grammar/queue', getGrammarQueue);
contentPracticeRouter.get('/kanji/queue', getKanjiQueue);

contentPracticeRouter.post(
  '/grammar/:grammarId/rate',
  validateGrammarPracticeId,
  rateGrammarItem,
);

contentPracticeRouter.post(
  '/kanji/:kanjiId/rate',
  validateKanjiPracticeId,
  rateKanjiItem,
);
