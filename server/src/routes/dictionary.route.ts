import { Router } from 'express';
import {
  getDictionaryWordById,
  searchDictionaryWords,
} from '../controllers/dictionary.controller.js';
import { validateDictionaryWordId } from '../schemas/dictionary.schema.js';

export const dictionaryRouter = Router();

dictionaryRouter.get('/search', searchDictionaryWords);

dictionaryRouter.get(
  '/words/:wordId',
  validateDictionaryWordId,
  getDictionaryWordById,
);
