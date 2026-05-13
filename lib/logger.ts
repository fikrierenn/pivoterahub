// Structured logger — production'da console.log yerine bunu kullan
// Browser'da JSON çıkarmaz, server-side'da JSON line üretir (Vercel/log aggregator dostu).

type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isServer = typeof window === 'undefined';
const isDev = process.env.NODE_ENV === 'development';

function emit(level: Level, message: string, context?: LogContext) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...context,
  };

  if (isServer) {
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  } else if (isDev) {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(`[${level}]`, message, context ?? '');
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => isDev && emit('debug', msg, ctx),
  info: (msg: string, ctx?: LogContext) => emit('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => emit('warn', msg, ctx),
  error: (msg: string, error?: Error | unknown, ctx?: LogContext) => {
    const errCtx = error instanceof Error
      ? { error: error.message, stack: isDev ? error.stack : undefined }
      : error !== undefined
        ? { error: String(error) }
        : {};
    emit('error', msg, { ...errCtx, ...ctx });
  },
};
