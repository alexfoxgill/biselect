import { Selector } from './Selector'
import { MaybeSelector } from './MaybeSelector'
import { Get } from './Get'
import { Set } from './Set'
import { MaybeGet } from './MaybeGet'

export interface MaybeGetPropOverloads<A, B, Params extends {} = {}> {
  <K1 extends keyof B>(key: K1): MaybeGet<A, B[K1], Params>
  <K1 extends keyof B, K2 extends keyof B[K1]>(k1: K1, k2: K2): MaybeGet<A, B[K1][K2], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2]>(k1: K1, k2: K2, k3: K3): MaybeGet<B, B[K1][K2][K3], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2], K4 extends keyof B[K1][K2][K3]>(k1: K1, k2: K2, k3: K3): MaybeGet<B, B[K1][K2][K3][K4], Params>
}

export interface GetPropOverloads<A, B, Params extends {} = {}> {
  <K1 extends keyof B>(key: K1): Get<A, B[K1], Params>
  <K1 extends keyof B, K2 extends keyof B[K1]>(k1: K1, k2: K2): Get<A, B[K1][K2], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2]>(k1: K1, k2: K2, k3: K3): Get<B, B[K1][K2][K3], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2], K4 extends keyof B[K1][K2][K3]>(k1: K1, k2: K2, k3: K3): Get<B, B[K1][K2][K3][K4], Params>
}

export interface SelectorPropOverloads<A, B, Params extends {} = {}> {
  <K1 extends keyof B>(key: K1): Selector<A, B[K1], Params>
  <K1 extends keyof B, K2 extends keyof B[K1]>(k1: K1, k2: K2): Selector<A, B[K1][K2], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2]>(k1: K1, k2: K2, k3: K3): Selector<B, B[K1][K2][K3], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2], K4 extends keyof B[K1][K2][K3]>(k1: K1, k2: K2, k3: K3): Selector<B, B[K1][K2][K3][K4], Params>
}

export interface MaybeSelectorPropOverloads<A, B, Params extends {} = {}> {
  <K1 extends keyof B>(key: K1): MaybeSelector<A, B[K1], Params>
  <K1 extends keyof B, K2 extends keyof B[K1]>(k1: K1, k2: K2): MaybeSelector<A, B[K1][K2], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2]>(k1: K1, k2: K2, k3: K3): MaybeSelector<B, B[K1][K2][K3], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2], K4 extends keyof B[K1][K2][K3]>(k1: K1, k2: K2, k3: K3): MaybeSelector<B, B[K1][K2][K3][K4], Params>
}

export namespace Prop {
  export const many = (...keys: string[]) => keys.map(create).reduce((a: any, b: any) => a.compose(b))

  export const create = <A, K1 extends keyof A>(key: K1): Selector<A, A[K1]> =>
    Selector.create(Get.create(a => a[key]), Set.create((a, p, b) => ({ ...a as any, [key]: b })))

  export const implementation = (compose: (prop: any) => any): any =>
    (...keys: string[]) => compose(many(...keys))
}