import { expect } from 'chai'
import 'mocha'
import { Selector } from './Selector';
import { Get } from './Get';
import { MaybeSelector } from './MaybeSelector';
import { Converter } from './Converter';
import { MaybeConverter } from './MaybeConverter';

describe("Selector", () => {

  it("gets", () => {
    interface Foo { bar: number }
    const selector = Selector.fromGetSet<Foo, number>(foo => foo.bar, (foo, _, bar) => ({ bar }))

    const result = selector.get({ bar: 1 })

    expect(result).to.equal(1)
  })

  it("sets", () => {
    interface Foo { bar: number }
    const selector = Selector.fromGetSet<Foo, number>(foo => foo.bar, (foo, _, bar) => ({ bar }))

    const result = selector.set({ bar: 1 }, 2)

    expect(result).to.deep.equal({ bar: 2 })
  })
  
  it("modifies", () => {
    interface Foo { bar: number }
    const selector = Selector.fromGetSet<Foo, number>(foo => foo.bar, (foo, _, bar) => ({ bar }))

    const result = selector.modify({ bar: 1 }, x => x + 1)

    expect(result).to.deep.equal({ bar: 2 })
  })

  describe(".mapParams()", () => {
    it("maps parameter object", () => {
      interface Foo { bar: number }
      const selector = Selector.fromGetSet<Foo, number, { param: number }>(
        (foo, {param}) => foo.bar + param,
        (foo, {param}, bar) => ({ bar: bar - param }))
        .mapParams<{ x: number }>(({x}) => ({ param: x }))

      const result = selector.get({ bar: 1 }, { x: 1 })
      expect(result).to.equal(2)
    })
  })

  describe(".withParams()", () => {
    it("supplies the given parameters", () => {
      interface Foo { bar: number }
      const selector = Selector.fromGetSet<Foo, number, { x: number, y: number }>(
        (foo, {x, y}) => foo.bar + (x * y),
        (foo, {x, y}, bar) => ({ bar: bar - (x * y) }))

      const ySupplied = selector.withParams({ y: 2 })

      const result = ySupplied.get({ bar: 1 }, { x: 5 })
      expect(result).to.equal(11)
    })
  })

  describe(".indexBy()", () => {
    it("returns a Selector if a default value is provided", () => {
      interface Foo {
        lookup: Lookup
      }
      type Lookup = {
        [key: string]: number
      }

      const selector = Selector.fromGetSet<Foo, Lookup>(foo => foo.lookup, (foo, _, lookup) => ({ lookup }))
        .indexBy('key', 0)

      const defaultResult = selector.get({ lookup: { b: 1 } }, { key: "a" })
      expect(defaultResult).to.equal(0)

      const defaultModification = selector.modify({ lookup: { b: 1 } }, { key: "a" }, x => x + 1)
      expect(defaultModification).to.deep.equal({ lookup: { b: 1, a: 1 } })
    })

    it("passes all parameters to the default value provider", () => {
      interface Foo {
        lookup: Lookup
      }
      type Lookup = {
        [key: string]: {
          pos: number
          key: string
        }
      }

      const selector = Selector.fromGetSet<Foo, Lookup, { pos: number }>(foo => foo.lookup, (foo, _, lookup) => ({ lookup }))
        .indexBy('key', (_, { pos, key }) => ({ pos, key }))

      const initialState: Foo = { lookup: {} }
      const result = selector.get(initialState, { pos: 0, key: "a" })
      expect(result).to.deep.equal({ pos: 0, key: "a" })
    })
  })

  it("composes with Get", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }

    const get = Selector.fromGetSet<Foo, Bar>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(Get.create((bar: Bar) => bar.qux))

    const result = get({ bar: { qux: 1 } })
    
    expect(result).to.equal(1)
  })

  it("composes with Selector", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }

    const selector = Selector.fromGetSet<Foo, Bar>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(Selector.fromGetSet<Bar, number>(bar => bar.qux, (bar, _, qux) => ({ qux })))

    const result = selector.modify({ bar: { qux: 1 } }, x => x + 1)
    
    expect(result).to.deep.equal({ bar: { qux: 2 } })
  })

  it("composes with MaybeSelector", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number | null }

    const selector = Selector.fromGetSet<Foo, Bar>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(MaybeSelector.fromGetSet<Bar, number>(bar => bar.qux, (bar, _, qux) => ({ qux })))

    const result = selector.modify({ bar: { qux: 1 } }, x => x + 1)
    expect(result).to.deep.equal({ bar: { qux: 2 } })

    const nullResult = selector.modify({ bar: { qux: null } }, x => x + 1)
    expect(nullResult).to.deep.equal({ bar: { qux: null } })
  })

  it("composes with Converter", () => {
    interface Foo { bar: string }

    const selector = Selector.fromGetSet<Foo, string>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(Converter.fromGets<string, string[]>(str => str.split(''), list => list.join('')))

    const result = selector.modify({ bar: "foo" }, str => str.reverse())
    
    expect(result).to.deep.equal({ bar: "oof" })
  })

  it("composes with MaybeConverter", () => {
    interface Foo { bar: string }

    const parseNum = (str: string) => {
      const num = parseFloat(str)
      return isNaN(num) ? null : num
    }

    const maybeSelector = Selector.fromGetSet<Foo, string>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(MaybeConverter.fromGets(parseNum, num => num.toString()))

    const result = maybeSelector.modify({ bar: "1" }, x => x + 1)
    expect(result).to.deep.equal({ bar: "2" })

    const nullResult = maybeSelector.modify({ bar: "one" }, x => x + 1)
    expect(nullResult).to.deep.equal({ bar: "one" })
  })
})