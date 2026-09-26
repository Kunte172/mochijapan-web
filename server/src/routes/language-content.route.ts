import { Router } from 'express';
import {
  getPublishedGrammar,
  getPublishedKanji,
  listPublishedGrammar,
  listPublishedKanji,
} from '../controllers/language-content.controller.js';
import {
  validateGrammarId,
  validateKanjiCharacter,
} from '../schemas/language-content.schema.js';

export const languageContentRouter = Router();

languageContentRouter.get('/grammar', listPublishedGrammar);
languageContentRouter.get(
  '/grammar/:grammarId',
  validateGrammarId,
  getPublishedGrammar,
);

languageContentRouter.get('/kanji', listPublishedKanji);
languageContentRouter.get(
  '/kanji/:character',
  validateKanjiCharacter,
  getPublishedKanji,
);
