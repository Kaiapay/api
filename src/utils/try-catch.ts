interface Success<T> {
  data: T;
  error: null;
}
interface Failure<E> {
  data: null;
  error: E;
}
export type Result<T, E = Error> = Success<T> | Failure<E>;

export async function tryCatch<T, E = Error>(
  fn: () => Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as E };
  }
}

export async function retry<T, E = Error>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delay?: number;
  }
): Promise<Result<T, E>> {
  let retries = 0;
  while (retries < (options?.maxRetries ?? 3)) {
    const result = await tryCatch(fn);
    if (result.error) {
      retries++;
      await new Promise((resolve) =>
        setTimeout(resolve, options?.delay ?? 1000)
      );
    } else {
      return result as Result<T, E>;
    }
  }

  // If all retries are exhausted, return the last error
  return await tryCatch(fn);
}
