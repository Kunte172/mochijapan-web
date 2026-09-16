import { Router } from 'express';

import {
  getPublishedCourseById,
  listPublishedCourses,
} from '../controllers/course.controller.js';

import { validateCourseId } from '../schemas/course.schema.js';

export const courseRouter = Router();

courseRouter.get(
  '/',
  listPublishedCourses,
);

courseRouter.get(
  '/:courseId',
  validateCourseId,
  getPublishedCourseById,
);