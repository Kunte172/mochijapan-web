import { apiGet } from '../../../lib/api';
import type { LessonDetail } from '../types';

type ApiResponse<T> = {
  status: 'ok';
  data: T;
};

export async function getLesson(lessonId: string) {
  const response = await apiGet<ApiResponse<LessonDetail>>(
    `/lessons/${lessonId}`,
  );

  return response.data;
}
