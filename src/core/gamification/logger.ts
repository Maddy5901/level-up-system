export const log = {
  debug: (message: string, data?: unknown) => {
    console.log(`[DEBUG] ${message}`, data);
  },
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data);
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, data?: unknown) => {
    console.error(`[ERROR] ${message}`, data);
  }
};

export function logOperationStart(operation: string, data?: unknown) {
  log.info(`${operation} started`, data);
}

export function logOperationSuccess(operation: string, data?: unknown) {
  log.info(`${operation} completed`, data);
}

export function logOperationFailure(operation: string, error: Error) {
  log.error(`${operation} failed: ${error.message}`, error);
}

export function logXPCalculation(category: string, quality: number, streak: number, result: unknown) {
  log.debug(`XP Calculation: ${category} quality=${quality} streak=${streak}`, result);
}

export class Timer {
  private readonly startTime: number;
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = Date.now();
  }

  end() {
    const duration = Date.now() - this.startTime;
    if (duration > 100) log.warn(`${this.name} took ${duration}ms`);
  }
}

export function startTimer(name: string): Timer {
  return new Timer(name);
}
