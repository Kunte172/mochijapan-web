import { apiGet } from '../../../lib/api';
import type {
  ApiResponse,
  CourseDetail,
  CourseSummary,
} from '../types';

export async function getCourses() {
  const response = await apiGet<ApiResponse<CourseSummary[]>>('/courses');
  return response.data;
}

export async function getCourse(courseId: string) {
  const response = await apiGet<ApiResponse<CourseDetail>>(`/courses/${courseId}`);
  return response.data;
}
