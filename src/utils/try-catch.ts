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
