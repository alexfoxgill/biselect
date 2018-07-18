import {Subtract, combine} from './util'

export type UpdateSignature<A, Params extends {}> =
  {} extends Params
  ? (a: A) => A
  : (a: A, p: Params) => A

export type Update<A, Params extends {} = {}> = UpdateSignature<A, Params> & {
  _underlying: (a: A, params: Params) => A
  andThen: <P2 extends {}>(nextUpdate: Update<A, P2>) => Update<A, Params & P2>
  withParams: <P2 extends Partial<Params>>(params: P2) => Update<A, Subtract<Params, P2>>
  applyTo: UpdateSignature<A, Params>
}

export namespace Update {

  export const create = <A, Params extends {} = {}>(update: (a: A, p: Params) => A): Update<A, Params> => {
    const clone: any = (a: A, p: Params) => clone._underlying(a, p)

    clone._underlying = update

    clone.andThen = <P2 extends {}>(nextUpdate: Update<A, P2>) =>
      create((a: A, p: Params & P2) => nextUpdate._underlying(update(a, p), p))

    clone.withParams = <P2 extends Partial<Params>>(params: P2) =>
      create((a: A, p: Subtract<Params, P2>) => clone._underlying(a, combine(p, params)))

    clone.applyTo = clone

    return clone
  }

}