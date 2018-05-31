type Optic<A, B, Params> =
  MaybeSelector<A, B, Params>
  | Selector<A, B, Params>
  | MaybeConverter<A, B, Params>
  | Converter<A, B, Params>

type Maybe<A, B, Params> = MaybeSelector<A, B, Params> | MaybeConverter<A, B, Params>
type Certain<A, B, Params> = Selector<A, B, Params> | Converter<A, B, Params>
type AnyConverter<A, B, Params> = Converter<A, B, Params> | MaybeConverter<A, B, Params>
type AnySelector<A, B, Params> = Selector<A, B, Params> | MaybeSelector<A, B, Params>

interface IndexOverloads<A, B, Params> {
  <K extends string>(key: K): MaybeSelector<A, B, Params & { [Key in K]: string }>
  <K extends string>(key: K, ifNone: B): Selector<A, B, Params & { [Key in keyof K]: string }>
}

interface CertainPropOverloads<A, B, Params> {
  <K1 extends keyof B>(key: K1): Selector<A, B[K1], Params>
  <K1 extends keyof B, K2 extends keyof B[K1]>(k1: K1, k2: K2): Selector<A, B[K1][K2], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2]>(k1: K1, k2: K2, k3: K3): Selector<B, B[K1][K2][K3], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2], K4 extends keyof B[K1][K2][K3]>(k1: K1, k2: K2, k3: K3): Selector<B, B[K1][K2][K3][K4], Params>
}

interface MaybePropOverloads<A, B, Params> {
  <K1 extends keyof B>(key: K1): MaybeSelector<A, B[K1], Params>
  <K1 extends keyof B, K2 extends keyof B[K1]>(k1: K1, k2: K2): MaybeSelector<A, B[K1][K2], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2]>(k1: K1, k2: K2, k3: K3): MaybeSelector<B, B[K1][K2][K3], Params>
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2], K4 extends keyof B[K1][K2][K3]>(k1: K1, k2: K2, k3: K3): MaybeSelector<B, B[K1][K2][K3][K4], Params>
}

export class Selector<A, B, Params extends {} = {}> {

  constructor(private _get: (a: A, params: Params) => B, private _set: (a: A, b: B, params: Params) => A) {
    this.get = _get as any
    this.set = _set as any
    this.modify = this._modify as any
    this.merge = this._merge as any
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

  private _modify = (a: A, f: (b: B) => B, params: Params): A =>
    this._set(a, f(this._get(a, params)), params)

  merge: B extends {}
    ? {} extends Params
      ? (a: A, b: Partial<B>) => A
      : (a: A, b: Partial<B>, params: Params) => A

    : never
  private _merge = (a: A, someB: Partial<B>, params: Params): A =>
    this._modify(a, b => ({ ...b as any, ...someB as any }), params)

  compose<C, BCParams>(other: Maybe<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  compose<C, BCParams>(other: Certain<B, C, BCParams>): Selector<A, C, Params & BCParams>
  compose<C, BCParams>(other: Optic<B, C, BCParams>) {
    if (other instanceof Selector) {
      return new Selector<A, C, Params & BCParams>(
        (a, params) => other._get(this._get(a, params), params),
        (a, c, params) => this._modify(a, b => other._set(b, c, params), params))

    } else if (other instanceof MaybeSelector) {
      const getter = other.get as (b: B, params: BCParams) => C | null
      const setter = other.set as (b: B, c: C, params: BCParams) => B
      return new MaybeSelector<A, C, Params & BCParams>(
        (a, params) => getter(this._get(a, params), params),
        (a, c, params) => this._modify(a, b => setter(b, c, params), params))

    } else if (other instanceof Converter) {
      const convert = other.convert as (b: B, params: BCParams) => C
      const convertBack = other.convertBack as (c: C, params: BCParams) => B
      return new Selector<A, C, Params & BCParams>(
        (a, params) => convert(this._get(a, params), params),
        (a, c, params) => this._set(a, convertBack(c, params), params))

    } else if (other instanceof MaybeConverter) {
      const convert = other.convert as (b: B, params: BCParams) => C | null
      const convertBack = other.convertBack as (c: C, params: BCParams) => B
      return new MaybeSelector<A, C, Params & BCParams>(
        (a, params) => convert(this._get(a, params), params),
        (a, c, params) => this._set(a, convertBack(c, params), params))
    }
  }

  prop!: CertainPropOverloads<A, B, Params>

  index!: B extends { [key: string]: infer C } ? IndexOverloads<B, C, Params> : never
}

Selector.prototype.index = <C>(key: string, ifNone?: C) => {
  let selector = Biselect.index(key)
  return this.compose(ifNone !== undefined ? selector.withDefault(ifNone) : selector)
}

Selector.prototype.prop = (...keys: string[]) =>
  this.compose(Biselect.props(...keys))

export class MaybeSelector<A, B, Params> {
  constructor(private _get: (a: A, params: Params) => B | null, private _set: (a: A, b: B, params: Params) => A) {
    this.get = _get as any
    this.set = _set as any
    this.modify = this._modify as any
    this.merge = this._merge as any
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

  private _modify(a: A, f: (b: B) => B, params: Params): A {
    const b = this._get(a, params)
    return b === null ? a : this._set(a, f(b), params)
  }

  merge: B extends {}
    ? {} extends Params
      ? (a: A, b: Partial<B>) => A
      : (a: A, b: Partial<B>, params: Params) => A
    : never

  private _merge = (a: A, someB: Partial<B>, params: Params): A =>
    this._modify(a, b => ({ ...b as any, ...someB as any }), params)
  
  compose<C, BCParams>(other: Optic<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams> {
    if (other instanceof Selector || other instanceof MaybeSelector) {
      const getter = other.get as (b: B, params: BCParams) => C | null
      const setter = other.set as (b: B, c: C, params: BCParams) => B
      return new MaybeSelector<A, C, Params & BCParams>(
        (a, params) => {
          const b = this._get(a, params)
          return b === null ? null : getter(b, params)
        },
        (a, c, params) => this._modify(a, b => setter(b, c, params), params))

    } else if (other instanceof Converter || other instanceof MaybeConverter) {
      const convert = other.convert as (b: B, params: BCParams) => C | null
      const convertBack = other.convertBack as (c: C, params: BCParams) => B
      return new MaybeSelector<A, C, Params & BCParams>(
        (a, params) => {
          const b = this._get(a, params)
          return b === null ? null : convert(b, params)
        },
        (a, c, params) => this._set(a, convertBack(c, params), params))

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

  index!: B extends { [key: string]: infer C } ? IndexOverloads<B, C, Params> : never
}

MaybeSelector.prototype.index = <C>(key: string, ifNone?: C) => {
  let selector = Biselect.index(key)
  return this.compose(ifNone !== undefined ? selector.withDefault(ifNone) : selector)
}

MaybeSelector.prototype.prop = (...keys: string[]) =>
  this.compose(Biselect.props(...keys))

export class Converter<A, B, Params> {
  constructor(private _convert: (a: A, params: Params) => B, private _convertBack: (b: B, params: Params) => A) {
    this.convert = _convert as any
    this.convertBack = _convertBack as any
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
      const getter = other.get as (b: B, params: BCParams) => C | null
      const setter = other.set as (b: B, c: C, params: BCParams) => B
      return new MaybeSelector<A, C, Params & BCParams>(
        (a, params) => getter(this._convert(a, params), params),
        (a, c, params) => this._convertBack(setter(this._convert(a, params), c, params), params))

    } else if (other instanceof Selector) {
      const getter = other.get as (b: B, params: BCParams) => C
      const setter = other.set as (b: B, c: C, params: BCParams) => B
      return new Selector<A, C, Params & BCParams>(
        (a, params) => getter(this._convert(a, params), params),
        (a, c, params) => this._convertBack(setter(this._convert(a, params), c, params), params))

    } else if (other instanceof MaybeConverter) {
      const convert = other.convert as (b: B, params: BCParams) => C | null
      const convertBack = other.convertBack as (c: C, params: BCParams) => B
      return new MaybeConverter<A, C, Params & BCParams>(
        (a, params) => convert(this._convert(a, params), params),
        (c, params) => this._convertBack(convertBack(c, params), params))

    } else if (other instanceof Converter) {
      const convert = other.convert as (b: B, params: BCParams) => C
      const convertBack = other.convertBack as (c: C, params: BCParams) => B
      return new Converter<A, C, Params & BCParams>(
        (a, params) => convert(this._convert(a, params), params),
        (c, params) => this._convertBack(convertBack(c, params), params))
    }
  }

  invert = () => new Converter<B, A, Params>(this._convertBack, this._convert)

  prop!: CertainPropOverloads<A, B, Params>

  index!: B extends { [key: string]: infer C } ? IndexOverloads<B, C, Params> : never
}

Converter.prototype.index = <C>(key: string, ifNone?: C) => {
  let selector = Biselect.index(key)
  return this.compose(ifNone !== undefined ? selector.withDefault(ifNone) : selector)
}

Converter.prototype.prop = (...keys: string[]) =>
  this.compose(Biselect.props(...keys))

export class MaybeConverter<A, B, Params> {
  constructor(private _convert: (a: A, params: Params) => B | null, private _convertBack: (b: B, params: Params) => A) {
    this.convert = _convert as any
    this.convertBack = _convertBack as any
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
      const getter = other.get as (b: B, params: BCParams) => C | null
      const setter = other.set as (b: B, c: C, params: BCParams) => B
      return new MaybeSelector<A, C, Params & BCParams>(
        (a, params) => {
          const b = this._convert(a, params)
          return b === null ? null : getter(b, params)
        },
        (a, c, params) => {
          const b = this._convert(a, params)
          return b === null ? a : this._convertBack(setter(b, c, params), params)
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

  index!: B extends { [key: string]: infer C } ? IndexOverloads<B, C, Params> : never
}

MaybeConverter.prototype.index = <C>(key: string, ifNone?: C) => {
  let selector = Biselect.index(key)
  return this.compose(ifNone !== undefined ? selector.withDefault(ifNone) : selector)
}

MaybeConverter.prototype.prop = (...keys: string[]) =>
  this.compose(Biselect.props(...keys))

interface Root<A> {
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
}