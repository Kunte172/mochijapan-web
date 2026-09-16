import type { NextFunction, Request, Response } from 'express';

import {
  getPublishedCourse,
  getPublishedCourses,
} from '../services/course.service.js';

export async function listPublishedCourses(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const courses = await getPublishedCourses();

    res.status(200).json({
      status: 'ok',
      data: courses,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublishedCourseById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rawCourseId = req.params.courseId;

    const courseId = Array.isArray(rawCourseId)
      ? rawCourseId[0]
      : rawCourseId;

    if (!courseId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_COURSE_ID',
        message: 'Course id is invalid',
      });

      return;
    }

    const course = await getPublishedCourse(courseId);

    if (!course) {
      res.status(404).json({
        status: 'error',
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });

      return;
    }

    res.status(200).json({
      status: 'ok',
      data: course,
    });
  } catch (error) {
    next(error);
  }
}