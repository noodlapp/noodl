export function getLessonsState(lessonProgress: { index: number; end: number }[]) {
  const firstNotStartedLesson = lessonProgress.find((l) => l.index === 0);
  const firstLessonInProgress = lessonProgress.find((l) => l.index > 0 && l.index < l.end - 1);

  const nextUp = firstLessonInProgress || firstNotStartedLesson;

  return lessonProgress.map((progress) => {
    let state;
    const progressPercent = !progress.end ? 0 : Math.round((progress.index / (progress.end - 1)) * 100);

    if (progress.index === 0) {
      state = 'not-started';
    } else if (progress.index == progress.end - 1) {
      state = 'completed';
    } else if (progress.index > 0) {
      state = 'in-progress';
    }

    return {
      name: state,
      progressPercent,
      isNextUp: progress === nextUp
    };
  });
}
