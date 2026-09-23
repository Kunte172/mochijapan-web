import { QuizQuestionType } from '../generated/prisma/client.js';

type Candidate = {
  position: number | null;
  word: {
    id: string;
    writtenForm: string | null;
    reading: string;
    meaningVi: string;
    audioUrl: string | null;
    userStates: Array<{
      masteryLevel: number;
      incorrectCount: number;
      reviewCount: number;
    }>;
  };
};

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function visibleWord(word: Candidate['word']) {
  return word.writtenForm ?? word.reading;
}

function optionLabel(
  type: QuizQuestionType,
  word: Candidate['word'],
) {
  if (type === QuizQuestionType.MEANING_TO_WORD) {
    return visibleWord(word);
  }

  return word.meaningVi;
}

function chooseType(
  word: Candidate['word'],
  index: number,
) {
  const cycle = index % 4;

  if (cycle === 0) {
    return QuizQuestionType.WORD_TO_MEANING;
  }

  if (cycle === 1) {
    return QuizQuestionType.MEANING_TO_WORD;
  }

  if (cycle === 2) {
    return QuizQuestionType.READING_TO_MEANING;
  }

  if (word.audioUrl) {
    return QuizQuestionType.AUDIO_TO_MEANING;
  }

  return QuizQuestionType.WORD_TO_MEANING;
}

function buildOptions(
  target: Candidate,
  candidates: Candidate[],
  type: QuizQuestionType,
) {
  const targetLabel = optionLabel(type, target.word);
  const pool = candidates.filter((candidate) => {
    if (candidate.word.id === target.word.id) {
      return false;
    }

    return optionLabel(type, candidate.word) !== targetLabel;
  });

  const distractors = [...pool]
    .sort((left, right) => {
      const seed = `${target.word.id}:${type}`;
      return (
        hashText(`${seed}:${left.word.id}`) -
        hashText(`${seed}:${right.word.id}`)
      );
    })
    .slice(0, 3);

  return [target, ...distractors]
    .sort((left, right) => {
      const seed = `options:${target.word.id}:${type}`;
      return (
        hashText(`${seed}:${left.word.id}`) -
        hashText(`${seed}:${right.word.id}`)
      );
    })
    .map((candidate) => candidate.word.id);
}

export function generateQuizPlan(
  candidates: Candidate[],
  limit: number,
) {
  const ranked = [...candidates].sort((left, right) => {
    const leftState = left.word.userStates[0];
    const rightState = right.word.userStates[0];

    const leftMastery = leftState?.masteryLevel ?? 0;
    const rightMastery = rightState?.masteryLevel ?? 0;

    if (leftMastery !== rightMastery) {
      return leftMastery - rightMastery;
    }

    const leftIncorrect = leftState?.incorrectCount ?? 0;
    const rightIncorrect = rightState?.incorrectCount ?? 0;

    if (leftIncorrect !== rightIncorrect) {
      return rightIncorrect - leftIncorrect;
    }

    const leftReviews = leftState?.reviewCount ?? 0;
    const rightReviews = rightState?.reviewCount ?? 0;

    if (leftReviews !== rightReviews) {
      return leftReviews - rightReviews;
    }

    return (left.position ?? 0) - (right.position ?? 0);
  });

  const selected = ranked.slice(0, Math.min(limit, ranked.length));

  return selected.map((candidate, index) => {
    const questionType = chooseType(candidate.word, index);

    return {
      wordId: candidate.word.id,
      position: index + 1,
      questionType,
      optionWordIds: buildOptions(
        candidate,
        candidates,
        questionType,
      ),
    };
  });
}
