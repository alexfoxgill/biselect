export interface Lookup<T> {
  [key: string]: T
}

export const indexBy = <T>(items: T[], prop: keyof T): Lookup<T> =>
  items.reduce((acc, x) => {
    const key = x[prop] as any as string
    return { ...acc as any, [key]: x }
  }, {})