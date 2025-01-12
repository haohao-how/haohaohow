declare module "array-from-async" {
  declare const exprt: <T>(
    iterableOrArrayLike:
      | AsyncIterable<T>
      | Iterable<T | PromiseLike<T>>
      | ArrayLike<T | PromiseLike<T>>,
  ) => Promise<T[]>;
  declare const exprt: <T, U>(
    iterableOrArrayLike: AsyncIterable<T> | Iterable<T> | ArrayLike<T>,
    mapFn: (value: Awaited<T>, index: number) => U,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thisArg?: any,
  ) => Promise<Awaited<U>[]>;
  export = exprt;
}