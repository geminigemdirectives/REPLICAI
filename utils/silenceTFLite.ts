
/**
 * Utility to silence specific TensorFlow Lite / MediaPipe informational logs
 * that clutter the console during initialization.
 */
export const withSilencedTFLite = async <T>(fn: () => Promise<T>): Promise<T> => {
  const originalInfo = console.info;
  const originalLog = console.log;
  const originalWarn = console.warn;

  const isTFLiteLog = (args: any[]) => {
    return args.some(arg => 
      typeof arg === 'string' && 
      (arg.includes('Created TensorFlow Lite XNNPACK delegate') || 
       arg.includes('XNNPACK delegate for CPU'))
    );
  };

  // Override console methods
  console.info = (...args: any[]) => {
    if (isTFLiteLog(args)) return;
    originalInfo.apply(console, args);
  };

  console.log = (...args: any[]) => {
    if (isTFLiteLog(args)) return;
    originalLog.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    if (isTFLiteLog(args)) return;
    originalWarn.apply(console, args);
  };

  try {
    return await fn();
  } finally {
    // Restore originals
    console.info = originalInfo;
    console.log = originalLog;
    console.warn = originalWarn;
  }
};
