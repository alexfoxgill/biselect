export type DeepPartialObject<A> = { [K in keyof A]?: DeepPartial<A[K]> }
export type DeepPartial<A> = A extends object ? DeepPartialObject<A> : A

export namespace DeepPartial {
  export const merge = <A>(a: A, someA: DeepPartial<A>): A => {
    if (typeof someA === "string" || typeof someA === "number" || typeof someA === "function" || someA === undefined) {
      return someA as A
    }

    const keys = Object.keys(someA) as [keyof DeepPartialObject<A>]
    const partial = keys.reduce((acc, key) => ({...acc, [key]: merge(a[key], (<any>someA)[key])}), {})
    return { ...a as any, ...partial }
  }
}
