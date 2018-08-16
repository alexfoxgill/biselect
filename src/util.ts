export interface Lookup<T> {
  [key: string]: T
}

export const indexBy = <T>(items: T[], prop: keyof T): Lookup<T> =>
  items.reduce((acc, x) => {
    const key = x[prop] as any as string
    return { ...acc as any, [key]: x }
  }, {})

export type StringProperty<K extends string> = { [Key in K]: string }

// subtracts any keys present in U from T
export type Subtract<T extends {}, U extends {}> = { [K in Exclude<keyof T, keyof U>]: T[K] }

export const combine = <T extends {}, U extends {}>(t: T, u: U): T & U => ({ ...t as any, ...u as any })