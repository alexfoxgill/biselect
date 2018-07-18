export type UpdateSignature<A, Params extends {}> =
  {} extends Params
  ? (a: A) => A
  : (a: A, p: Params) => A

export type UpdateChain<A, Params extends {} = {}> = UpdateSignature<A, Params> & {
  _underlying: (a: A, params: Params) => A
  andThen: <P2 extends {}>(nextUpdate: UpdateChain<A, P2>) => UpdateChain<A, Params & P2>
}

export namespace UpdateChain {

  export const create = <A, Params extends {} = {}>(update: (a: A, p: Params) => A): UpdateChain<A, Params> => {
    const clone: any = (a: A, p: Params) => clone._underlying(a, p)

    clone._underlying = update

    clone.andThen = <P2 extends {}>(nextUpdate: UpdateChain<A, P2>) =>
      create((a: A, p: Params & P2) => nextUpdate._underlying(update(a, p), p))

    return clone
  }

}