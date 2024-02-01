export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type ExcludeAny<T> = unknown extends T ? never : T;
