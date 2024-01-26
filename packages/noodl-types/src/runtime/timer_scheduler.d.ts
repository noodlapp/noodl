export interface TimerOptions {
  duration?: number;
  repeatCount?: number;
  delay?: number;

  onStart?: () => void;
  onFinished?: () => void;
  onRunning: (time: number) => void;
}

export interface Timer {
  scheduler: TimerScheduler;
  repeatCount: number;
  delay: number;

  start(): Timer;
  stop(): void;
  isRunning(): boolean;
  durationLeft(): number;
}

export interface TimerScheduler {
  createTimer(args: TimerOptions): Timer;
  scheduleTimer(timer: Timer): void;
  stopTimer(timer: Timer): void;
  runTimers(currentTime: number): void;
  hasPendingTimers(): boolean;
}
