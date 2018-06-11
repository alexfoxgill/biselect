import { All } from './Optic'

export interface Extension {
  extend: <A, B, Params>(subject: All<A, B, Params>) => void
}

export namespace Extension {
  export class CompositeExtension implements Extension {
    public readonly extensions: Extension[]

    constructor(list: Extension[]) {
      this.extensions = list
        .map(flatten)
        .reduce((xs, ys) => xs.concat(ys), [])
        .filter((ext, i, list) => list.indexOf(ext) === i)
    }

    extend = <A, B, Params>(subject: All<A, B, Params>) => {
      this.extensions.forEach(x => x.extend(subject))
    }
  }

  const flatten = (ext: Extension): Extension[] =>
    ext instanceof CompositeExtension
      ? ext.extensions.map(flatten).reduce((xs, x) => xs.concat(x), [])
      : [ext]

  export const combine = (a: Extension, b: Extension, ...others: Extension[]) =>
    new CompositeExtension([a, b, ...others])

  export const none = new CompositeExtension([])

  export const create = (extend: <A, B, Params>(subject: All<A, B, Params>) => void): Extension =>
    ({ extend })
}