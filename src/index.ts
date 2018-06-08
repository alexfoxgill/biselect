import { DeepPartial } from './DeepPartial'

export type Optic<A, B, Params> =
  MaybeSelector<A, B, Params>
  | Selector<A, B, Params>
  | MaybeConverter<A, B, Params>
  | Converter<A, B, Params>

export type Maybe<A, B, Params> = MaybeSelector<A, B, Params> | MaybeConverter<A, B, Params>
export type Certain<A, B, Params> = Selector<A, B, Params> | Converter<A, B, Params>
export type AnyConverter<A, B, Params> = Converter<A, B, Params> | MaybeConverter<A, B, Params>
export type AnySelector<A, B, Params> = Selector<A, B, Params> | MaybeSelector<A, B, Params>

export interface IndexOverloads<A, B, Params> {
  <K extends string>(key: K):       MaybeSelector<A, B, Params & { [Key in K]: string }>
  <K extends string>(key: K, ifNone: B): Selector<A, B, Params & { [Key in K]: string }>
}

export interface CertainPropOverloads<A, B, Params> {
  <K1 extends keyof B>(key: K1): Selector<A, B[K1], Params>
  <K1 extends keyof B, K2 extends keyof B[K1]>(k1: K1, k2: K2): Selector<A, B[K1][K2], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2]>(k1: K1, k2: K2, k3: K3): Selector<B, B[K1][K2][K3], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2], K4 extends keyof B[K1][K2][K3]>(k1: K1, k2: K2, k3: K3): Selector<B, B[K1][K2][K3][K4], Params>
}

export interface MaybePropOverloads<A, B, Params> {
  <K1 extends keyof B>(key: K1): MaybeSelector<A, B[K1], Params>
  <K1 extends keyof B, K2 extends keyof B[K1]>(k1: K1, k2: K2): MaybeSelector<A, B[K1][K2], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2]>(k1: K1, k2: K2, k3: K3): MaybeSelector<B, B[K1][K2][K3], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2], K4 extends keyof B[K1][K2][K3]>(k1: K1, k2: K2, k3: K3): MaybeSelector<B, B[K1][K2][K3][K4], Params>
}

export class Selector<A, B, Params extends {} = {}> {

  constructor(public _get: (a: A, params: Params) => B, public _set: (a: A, b: B, params: Params) => A) {
    this.get = _get as any
    this.set = _set as any
    this.modify = this._modify as any
    this.merge = this._merge as any
    this.deepMerge = this._deepMerge as any
    this.prop = this._prop as any
    this.index = this._index as any
  }

  get: {} extends Params
    ? (a: A) => B
    : (a: A, params: Params) => B

  set: {} extends Params
    ? (a: A, b: B) => A
    : (a: A, b: B, params: Params) => A

  modify: {} extends Params
    ? (a: A, f: (b: B) => B) => A
    : (a: A, f: (b: B) => B, params: Params) => A

  public _modify = (a: A, f: (b: B) => B, params: Params): A =>
    this._set(a, f(this._get(a, params)), params)

  merge: B extends object
    ? {} extends Params
      ? (a: A, someB: Partial<B>) => A
      : (a: A, someB: Partial<B>, params: Params) => A
    : never

  private _merge = (a: A, someB: Partial<B>, params: Params): A =>
    this._modify(a, b => ({ ...b as any, ...someB as any }), params)

  deepMerge: B extends object
    ? {} extends Params
      ? (a: A, b: DeepPartial<B>) => A
      : (a: A, b: DeepPartial<B>, params: Params) => A
    : never

  private _deepMerge = (a: A, someB: DeepPartial<B>, params: Params): A =>
    this._modify(a, b => DeepPartial.merge(b, someB), params)

  compose<C, BCParams>(other: Maybe<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  compose<C, BCParams>(other: Certain<B, C, BCParams>): Selector<A, C, Params & BCParams>
  compose<C, BCParams>(other: Optic<B, C, BCParams>) {
    if (other instanceof Selector) {
      return new Selector<A, C, Params & BCParams>(
        (a, params) => other._get(this._get(a, params), params),
        (a, c, params) => this._modify(a, b => other._set(b, c, params), params))

    } else if (other instanceof MaybeSelector) {
      return new MaybeSelector<A, C, Params & BCParams>(
        (a, params) => other._get(this._get(a, params), params),
        (a, c, params) => this._modify(a, b => other._set(b, c, params), params))

    } else if (other instanceof Converter) {
      return new Selector<A, C, Params & BCParams>(
        (a, params) => other._convert(this._get(a, params), params),
        (a, c, params) => this._set(a, other._convertBack(c, params), params))

    } else if (other instanceof MaybeConverter) {
      return new MaybeSelector<A, C, Params & BCParams>(
        (a, params) => other._convert(this._get(a, params), params),
        (a, c, params) => this._set(a, other._convertBack(c, params), params))
    }
  }

  prop!: CertainPropOverloads<A, B, Params>

  _prop = (...keys: string[]): any =>
    this.compose(Biselect.props(...keys) as any)

  index!: B extends { [key: string]: infer C } ? IndexOverloads<A, C, Params> : never

  _index = <C>(key: string, ifNone?: C) => {
    let selector = Biselect.index(key) as any
    return this.compose(ifNone !== undefined ? selector.withDefault(ifNone) : selector)
  }

  choose = <C extends B>(pred: (b: B) => b is C) =>
    this.compose(Biselect.choose<B, C>(pred))

  combine = <K extends string, B2, P2>(k: K, other: Selector<A, B2, P2>): Selector<A, B & { [KK in K]: B2 }, Params & P2> => {
    return new Selector<A, any, Params & P2>(
      (a, p) => ({ ...this._get(a, p) as any, [k]: other._get(a, p) }),
      (a, b, p) => other._set(this._set(a, b, p), b[k], p))
  }
}

export class MaybeSelector<A, B, Params> {
  constructor(public _get: (a: A, params: Params) => B | null, public _set: (a: A, b: B, params: Params) => A) {
    this.get = _get as any
    this.set = _set as any
    this.modify = this._modify as any
    this.merge = this._merge as any
    this.deepMerge = this._deepMerge as any
    this.prop = this._prop as any
    this.index = this._index as any
  }

  get: {} extends Params
    ? (a: A) => B
    : (a: A, params: Params) => B

  set: {} extends Params
    ? (a: A, b: B) => A
    : (a: A, b: B, params: Params) => A

  modify: {} extends Params
    ? (a: A, f: (b: B) => B) => A
    : (a: A, f: (b: B) => B, params: Params) => A

  public _modify(a: A, f: (b: B) => B, params: Params): A {
    const b = this._get(a, params)
    return b === null ? a : this._set(a, f(b), params)
  }

  merge: B extends object
    ? {} extends Params
      ? (a: A, someB: Partial<B>) => A
      : (a: A, someB: Partial<B>, params: Params) => A
    : never

  private _merge = (a: A, someB: Partial<B>, params: Params): A =>
    this._modify(a, b => ({ ...b as any, ...someB as any }), params)

  deepMerge: B extends object
    ? {} extends Params
      ? (a: A, b: DeepPartial<B>) => A
      : (a: A, b: DeepPartial<B>, params: Params) => A
    : never

  private _deepMerge = (a: A, someB: DeepPartial<B>, params: Params): A =>
    this._modify(a, b => DeepPartial.merge(b, someB), params)
  
  compose<C, BCParams>(other: Optic<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams> {
    if (other instanceof Selector || other instanceof MaybeSelector) {
      return new MaybeSelector<A, C, Params & BCParams>(
        (a, params) => {
          const b = this._get(a, params)
          return b === null ? null : other._get(b, params)
        },
        (a, c, params) => this._modify(a, b => other._set(b, c, params), params))

    } else if (other instanceof Converter || other instanceof MaybeConverter) {
      return new MaybeSelector<A, C, Params & BCParams>(
        (a, params) => {
          const b = this._get(a, params)
          return b === null ? null : other._convert(b, params)
        },
        (a, c, params) => this._set(a, other._convertBack(c, params), params))

    } else {
      throw new Error(`Unexpected argument: ${other}`)
    }
  }

  withDefault = (defaultValue: B): Selector<A, B, Params> =>
    new Selector<A, B, Params>(
      (a, params) => {
        const b = this._get(a, params)
        return b !== null ? b : defaultValue
      },
      this._set)

  prop!: MaybePropOverloads<A, B, Params>

  _prop = (...keys: string[]): any =>
    this.compose(Biselect.props(...keys) as any)

  index!: B extends { [key: string]: infer C } ? IndexOverloads<A, C, Params> : never

  _index = <C>(key: string, ifNone?: C) => {
    let selector = Biselect.index(key) as any
    return this.compose(ifNone !== undefined ? selector.withDefault(ifNone) : selector)
  }

  choose = <C extends B>(pred: (b: B) => b is C) =>
    this.compose(Biselect.choose<B, C>(pred))
}

export class Converter<A, B, Params> {
  constructor(public _convert: (a: A, params: Params) => B, public _convertBack: (b: B, params: Params) => A) {
    this.convert = _convert as any
    this.convertBack = _convertBack as any
    this.prop = this._prop as any
    this.index = this._index as any
  }
  
  convert: {} extends Params
    ? (a: A) => B
    : (a: A, params: Params) => B

  convertBack: {} extends Params
    ? (b: B) => A
    : (b: B, params: Params) => A
    
  compose<C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  compose<C, BCParams>(other: Selector<B, C, BCParams>): Selector<A, C, Params & BCParams>
  compose<C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeConverter<A, C, Params & BCParams>
  compose<C, BCParams>(other: Converter<B, C, BCParams>): Converter<A, C, Params & BCParams>
  compose<C, BCParams>(other: Optic<B, C, BCParams>) {
    if (other instanceof MaybeSelector) {
      return new MaybeSelector<A, C, Params & BCParams>(
        (a, params) => other._get(this._convert(a, params), params),
        (a, c, params) => this._convertBack(other._set(this._convert(a, params), c, params), params))

    } else if (other instanceof Selector) {
      return new Selector<A, C, Params & BCParams>(
        (a, params) => other._get(this._convert(a, params), params),
        (a, c, params) => this._convertBack(other._set(this._convert(a, params), c, params), params))

    } else if (other instanceof MaybeConverter) {
      return new MaybeConverter<A, C, Params & BCParams>(
        (a, params) => other._convert(this._convert(a, params), params),
        (c, params) => this._convertBack(other._convertBack(c, params), params))

    } else if (other instanceof Converter) {
      return new Converter<A, C, Params & BCParams>(
        (a, params) => other._convert(this._convert(a, params), params),
        (c, params) => this._convertBack(other._convertBack(c, params), params))
    }
  }

  invert = () => new Converter<B, A, Params>(this._convertBack, this._convert)

  prop!: CertainPropOverloads<A, B, Params>
  
  _prop = (...keys: string[]): any =>
    this.compose(Biselect.props(...keys) as any)

  index!: B extends { [key: string]: infer C } ? IndexOverloads<A, C, Params> : never

  _index = <C>(key: string, ifNone?: C) => {
    let selector = Biselect.index(key) as any
    return this.compose(ifNone !== undefined ? selector.withDefault(ifNone) : selector)
  }

  choose = <C extends B>(pred: (b: B) => b is C) =>
    this.compose(Biselect.choose<B, C>(pred))
}

export class MaybeConverter<A, B, Params> {
  constructor(public _convert: (a: A, params: Params) => B | null, public _convertBack: (b: B, params: Params) => A) {
    this.convert = _convert as any
    this.convertBack = _convertBack as any
    this.prop = this._prop as any
    this.index = this._index as any
  }
  
  convert: {} extends Params
    ? (a: A) => B | null
    : (a: A, params: Params) => B | null

  convertBack: {} extends Params
    ? (b: B) => A
    : (b: B, params: Params) => A
        
  compose<C, BCParams>(other: AnySelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  compose<C, BCParams>(other: AnyConverter<B, C, BCParams>): MaybeConverter<A, C, Params & BCParams>
  compose<C, BCParams>(other: Optic<B, C, BCParams>) {
    if (other instanceof MaybeSelector || other instanceof Selector) {
      return new MaybeSelector<A, C, Params & BCParams>(
        (a, params) => {
          const b = this._convert(a, params)
          return b === null ? null : other._get(b, params)
        },
        (a, c, params) => {
          const b = this._convert(a, params)
          return b === null ? a : this._convertBack(other._set(b, c, params), params)
        })

    } else if (other instanceof MaybeConverter || other instanceof Converter) {
      const convert = other.convert as (b: B, params: BCParams) => C | null
      const convertBack = other.convertBack as (c: C, params: BCParams) => B
      return new MaybeConverter<A, C, Params & BCParams>(
        (a, params) => {
          const b = this._convert(a, params)
          return b === null ? null : convert(b, params)
        },
        (c, params) => this._convertBack(convertBack(c, params), params))
    }
  }

  withDefault = (defaultValue: B): Converter<A, B, Params> =>
    new Converter<A, B, Params>(
      (a, params) => {
        const b = this._convert(a, params)
        return b !== null ? b : defaultValue
      },
      this._convertBack)

  prop!: MaybePropOverloads<A, B, Params>
  
  _prop = (...keys: string[]): any =>
    this.compose(Biselect.props(...keys) as any)

  index!: B extends { [key: string]: infer C } ? IndexOverloads<A, C, Params> : never

  _index = <C>(key: string, ifNone?: C) => {
    let selector = Biselect.index(key) as any
    return this.compose(ifNone !== undefined ? selector.withDefault(ifNone) : selector)
  }

  choose = <C extends B>(pred: (b: B) => b is C) =>
    this.compose(Biselect.choose<B, C>(pred))
}

export interface Root<A> {
  index: A extends { [key: string]: infer B } ? IndexOverloads<A, B, {}> : never
  prop: CertainPropOverloads<A, A, {}>
  choose<B extends A>(typeGuard: (a: A) => a is B): MaybeConverter<A, B, {}>
}

export namespace Biselect {
  export const from = <A>(): Root<A> => ({
    index,
    prop: props,
    choose
  }) as any

  export const props = (...keys: string[]) => keys.map(Biselect.prop).reduce((a, b) => a.compose(b))

  export const prop = <A, K1 extends keyof A>(key: K1): Selector<A, A[K1], {}> =>
    new Selector<A, A[K1], {}>(
      a => a[key],
      (a, b) => ({ ...a as any, [key]: b }))

  export const index = <A extends { [key: string]: B }, B, K extends string>(key: K): MaybeSelector<A, B, { [Key in K]: string }> =>
    new MaybeSelector<A, B, { [Key in K]: string }>(
      (a, params) => {
        const b = a[params[key] as any]
        return b !== undefined ? b : null
      },
      (a, b, params) => ({ ...a as any, [params[key] as any]: b }))

  export const choose = <A, B extends A>(typeGuard: (a: A) => a is B): MaybeConverter<A, B, {}> =>
    new MaybeConverter<A, B, {}>(
      a => typeGuard(a) ? a : null,
      b => b as A)

  export const combine = <A, B, K extends string, P>(k: K, selector: Selector<A, B, P>): Selector<A, { [KK in K]: B }, P> => {
    const get = selector.get as (a: A, p: P) => B
    const set = selector.set as (a: A, b: B, p: P) => A
    return new Selector<A, any, P>(
      (a, p) => ({ [k]: get(a, p) }),
      (a, b, p) => set(a, b[k], p))
  }
}