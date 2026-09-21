type ReviewCandidateState = {
  masteryLevel: number;
  memoryStrength: number;
  lapseCount: number;
  nextReviewAt: Date | null;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateReviewPriority(
  state: ReviewCandidateState,
  now: Date,
) {
  const scheduledAt = state.nextReviewAt ?? now;
  const overdueHours = Math.max(
    0,
    (now.getTime() - scheduledAt.getTime()) / (60 * 60 * 1000),
  );
  const masteryWeight = (5 - state.masteryLevel) * 8;
  const lapseWeight = Math.min(state.lapseCount, 10) * 4;
  const strengthWeight = Math.max(0, 5 - state.memoryStrength) * 2;
  const overdueWeight = Math.min(overdueHours, 72) * 1.5;

  return round2(
    masteryWeight + lapseWeight + strengthWeight + overdueWeight,
  );
}
