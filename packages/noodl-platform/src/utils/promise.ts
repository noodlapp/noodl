// TODO(typescript): Remove when we upgrade to Typescript 4.5
type Awaited<T> = T extends null | undefined
  ? T // special case for `null | undefined` when not in `--strictNullChecks` mode
  : T extends object & { then(onfulfilled: infer F): any } // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
  ? F extends (value: infer V, ...args: any) => any // if the argument to `then` is callable, extracts the first argument
    ? Awaited<V> // recursively unwrap the value
    : never // the argument to `then` was not callable
  : T; // non-object or non-thenable

type PromiseHash = Record<string, Promise<unknown>>;

type AwaitedPromiseHash<T extends PromiseHash> = {
  [P in keyof T]: Awaited<T[P]>;
};

export namespace PromiseUtils {
  export async function allObjects<T extends PromiseHash>(object: T): Promise<AwaitedPromiseHash<T>> {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(object).map(async ([key, promise]) => {
          return [key, await promise];
        })
      )
    );
  }

  export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
