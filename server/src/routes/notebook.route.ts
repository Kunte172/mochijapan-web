import { Router } from 'express';
import {
  getMyNotebookSummary,
  listMyNotebook,
  removeWordFromMyNotebook,
  saveWordToMyNotebook,
  updateWordInMyNotebook,
} from '../controllers/notebook.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateNotebookWordId } from '../schemas/notebook.schema.js';

export const notebookRouter = Router();

notebookRouter.use(requireAuth);

notebookRouter.get('/', listMyNotebook);
notebookRouter.get('/summary', getMyNotebookSummary);

notebookRouter.post(
  '/words/:wordId',
  validateNotebookWordId,
  saveWordToMyNotebook,
);

notebookRouter.patch(
  '/words/:wordId',
  validateNotebookWordId,
  updateWordInMyNotebook,
);

notebookRouter.delete(
  '/words/:wordId',
  validateNotebookWordId,
  removeWordFromMyNotebook,
);
