import { All } from './Optic'

export interface Extension {
  apply: <A, B, Params>(subject: All<A, B, Params>) => void
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

    apply = <A, B, Params>(subject: All<A, B, Params>) => {
      this.extensions.forEach(x => x.apply(subject))
    }
  }

  const flatten = (ext: Extension): Extension[] =>
    ext instanceof CompositeExtension
      ? ext.extensions.map(flatten).reduce((xs, x) => xs.concat(x), [])
      : [ext]

  export const combine = (a: Extension, b: Extension, ...others: Extension[]) =>
    new CompositeExtension([a, b, ...others])

  export const none = new CompositeExtension([])

  export const create = (apply: <A, B, Params>(subject: All<A, B, Params>) => void): Extension =>
    ({ apply })
}