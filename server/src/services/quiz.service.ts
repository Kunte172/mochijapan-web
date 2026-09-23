import {
  QuizAttemptStatus,
  QuizQuestionType,
} from '../generated/prisma/client.js';
import { AppError } from '../utils/app-error.js';
import {
  quizRepository,
  type QuizAttemptRecord,
} from '../repositories/quiz.repository.js';
import { generateQuizPlan } from './quiz-generator.service.js';

function optionLabel(
  type: QuizQuestionType,
  word: {
    writtenForm: string | null;
    reading: string;
    meaningVi: string;
  },
) {
  if (type === QuizQuestionType.MEANING_TO_WORD) {
    return word.writtenForm ?? word.reading;
  }

  return word.meaningVi;
}

async function mapAttempt(attempt: QuizAttemptRecord) {
  const currentItem = attempt.items.find((item) => !item.answeredAt);
  const answeredCount = attempt.items.filter((item) => item.answeredAt).length;

  if (!currentItem) {
    return {
      id: attempt.id,
      lesson: attempt.lesson,
      status: attempt.status,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      answeredCount,
      scorePercent: attempt.totalQuestions > 0
        ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
        : 0,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      currentQuestion: null,
    };
  }

  const optionWords = await quizRepository.findWordsByIds(
    currentItem.optionWordIds,
  );

  const optionsById = new Map(
    optionWords.map((word) => [word.id, word]),
  );

  const options = currentItem.optionWordIds
    .map((id) => optionsById.get(id))
    .filter((word): word is NonNullable<typeof word> => Boolean(word))
    .map((word) => ({
      id: word.id,
      label: optionLabel(currentItem.questionType, word),
    }));

  const prompt = (() => {
    if (currentItem.questionType === QuizQuestionType.MEANING_TO_WORD) {
      return {
        primary: currentItem.word.meaningVi,
        secondary: null,
        audioUrl: null,
      };
    }

    if (currentItem.questionType === QuizQuestionType.READING_TO_MEANING) {
      return {
        primary: currentItem.word.reading,
        secondary: 'Chọn nghĩa đúng',
        audioUrl: null,
      };
    }

    if (currentItem.questionType === QuizQuestionType.AUDIO_TO_MEANING) {
      return {
        primary: 'Nghe và chọn nghĩa đúng',
        secondary: null,
        audioUrl: currentItem.word.audioUrl,
      };
    }

    return {
      primary: currentItem.word.writtenForm ?? currentItem.word.reading,
      secondary: currentItem.word.writtenForm
        ? currentItem.word.reading
        : null,
      audioUrl: null,
    };
  })();

  return {
    id: attempt.id,
    lesson: attempt.lesson,
    status: attempt.status,
    totalQuestions: attempt.totalQuestions,
    correctAnswers: attempt.correctAnswers,
    answeredCount,
    scorePercent: attempt.totalQuestions > 0
      ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
      : 0,
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
    currentQuestion: {
      id: currentItem.id,
      position: currentItem.position,
      type: currentItem.questionType,
      prompt,
      options,
    },
  };
}

export async function getActiveQuiz(
  userId: string,
  lessonId: string,
) {
  const attempt = await quizRepository.findActiveAttempt(
    userId,
    lessonId,
  );

  return attempt ? mapAttempt(attempt) : null;
}

export async function getQuizAttempt(
  userId: string,
  attemptId: string,
) {
  const attempt = await quizRepository.findAttempt(userId, attemptId);

  if (!attempt) {
    throw new AppError(
      404,
      'QUIZ_ATTEMPT_NOT_FOUND',
      'Quiz attempt was not found.',
    );
  }

  return mapAttempt(attempt);
}

export async function startQuiz(
  userId: string,
  lessonId: string,
  limit: number,
) {
  const existing = await quizRepository.findActiveAttempt(
    userId,
    lessonId,
  );

  if (existing) {
    return {
      reused: true,
      attempt: await mapAttempt(existing),
    };
  }

  const lesson = await quizRepository.findLessonCandidates(
    userId,
    lessonId,
  );

  if (!lesson) {
    throw new AppError(
      404,
      'LESSON_NOT_FOUND',
      'Published lesson was not found.',
    );
  }

  if (lesson.lessonWords.length < 4) {
    throw new AppError(
      409,
      'QUIZ_NOT_ENOUGH_WORDS',
      'Lesson needs at least four words to build a quiz.',
    );
  }

  const plan = generateQuizPlan(
    lesson.lessonWords,
    Math.min(limit, lesson.lessonWords.length),
  );

  const attempt = await quizRepository.createAttempt({
    userId,
    lessonId,
    plan,
  });

  return {
    reused: false,
    attempt: await mapAttempt(attempt),
  };
}

export async function submitQuizAnswer(args: {
  userId: string;
  attemptId: string;
  itemId: string;
  selectedWordId: string;
  responseTimeMs: number;
  idempotencyKey: string;
}) {
  const result = await quizRepository.submitAnswer(args);
  const attempt = await quizRepository.findAttempt(
    args.userId,
    args.attemptId,
  );

  if (!attempt) {
    throw new AppError(
      404,
      'QUIZ_ATTEMPT_NOT_FOUND',
      'Quiz attempt was not found after answer.',
    );
  }

  return {
    idempotent: result.idempotent,
    isCorrect: result.item.isCorrect,
    correctOptionId: result.item.wordId,
    selectedOptionId: result.item.selectedWordId,
    attemptCompleted:
      result.attemptCompleted ||
      attempt.status === QuizAttemptStatus.COMPLETED,
    attempt: await mapAttempt(attempt),
  };
}
