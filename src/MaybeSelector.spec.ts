import { expect } from 'chai'
import 'mocha'
import { Selector } from './Selector';
import { Get } from './Get';
import { MaybeSelector } from './MaybeSelector';
import { Converter } from './Converter';
import { MaybeConverter } from './MaybeConverter';
import { IndexBy } from './IndexBy';
import { Biselect } from '.';

describe("MaybeSelector", () => {

  it("gets", () => {
    const maybeSelector = MaybeSelector.fromGetSet<number[], number>(list => list[0], (list, _, x) => [x, ...list.slice(1)])

    const result = maybeSelector.get([1, 2])
    expect(result).to.equal(1)

    const nullResult = maybeSelector.get([])
    expect(nullResult).to.equal(null)
  })

  it("sets", () => {
    const maybeSelector = MaybeSelector.fromGetSet<number[], number>(list => list[0], (list, _, x) => [x, ...list.slice(1)])

    const result = maybeSelector.set([1, 2], 3)
    expect(result).to.deep.equal([3, 2])
    
    const nullResult = maybeSelector.set([], 2)
    expect(nullResult).to.deep.equal([2])
  })
  
  it("modifies", () => {
    const maybeSelector = MaybeSelector.fromGetSet<number[], number>(list => list[0], (list, _, x) => [x, ...list.slice(1)])

    const result = maybeSelector.modify([2, 3], x => x + 1)
    expect(result).to.deep.equal([3, 3])
    
    const nullResult = maybeSelector.modify([], x => x + 1)
    expect(nullResult).to.deep.equal([])
  })

  describe(".mapParams()", () => {
    it("maps parameter object", () => {
      const indexSelector = MaybeSelector.fromGetSet<number[], number, { index: number }>(
        (list, {index}) => list[index],
        (list, {index}, x) => [...list.slice(0, index), x, ...list.slice(index + 1)])

      const result = indexSelector
        .mapParams<{ pos: number }>(({pos}) => ({ index: pos }))
        .modify([1, 2, 3], { pos: 1 }, x => x + 5)
      
      expect(result).to.deep.equal([1, 7, 3])
    })
  })

  describe(".withParams()", () => {
    it("presupplies parameters", () => {
      type Foo = {
        [x: string]: number
      }

      const selector = Biselect.from<Foo>()
        .indexBy('x')
        .withParams({ x: "a" })

      const result = selector.get({ "a": 1 })
      expect(result).to.equal(1)
    })

    it("can have different parameters with the same name supplied", () => {
      type Foo = {
        [x: string]: {
          [x: string]: number
        }
      }

      const selector = Biselect.from<Foo>()
        .indexBy('x')
        .withParams({ x: "a" })
        .indexBy('x')
        .withParams({ x: "b" })

      const result = selector.modify({ a: { b: 1 } }, num => num + 1)
      expect(result).to.deep.equal({ a: { b: 2 }})
    })
  })

  describe(".withDefault[Value]()", () => {
    it("ignores the default if the value is found", () => {
      const selector = MaybeSelector.fromGetSet<number[], number>(list => list[0], (list, _, x) => [x, ...list.slice(1)])
        .withDefaultValue(1)

      const result = selector.get([2])
      expect(result).to.equal(2)
    })
    
    it("returns the default if null is found", () => {
      const selector = MaybeSelector.fromGetSet<number[], number>(list => list[0], (list, _, x) => [x, ...list.slice(1)])
        .withDefaultValue(1)

      const result = selector.get([])
      expect(result).to.equal(1)
    })
    
    it("calls the provided default function with the correct arguments if null is found", () => {
      const selector = MaybeSelector.fromGetSet<number[], number, { param: number }>(list => list[0], (list, _, x) => [x, ...list.slice(1)])
        .withDefault((list, { param }) => param)

      const result = selector.get([], { param: 1 })
      expect(result).to.equal(1)
    })

    it("can use a Get", () => {
      const selector = MaybeSelector.fromGetSet<number[], number, { param: number }>(list => list[0], (list, _, x) => [x, ...list.slice(1)])
        .withDefault(Get.create((list, { param }) => param))

      const result = selector.get([], { param: 1 })
      expect(result).to.equal(1)
    })

    it("modifies the default value", () => {
      const selector = MaybeSelector.fromGetSet<number[], number>(list => list[0], (list, _, x) => [x, ...list.slice(1)])
        .withDefaultValue(1)

      const result = selector.modify([], x => x + 1)
      expect(result).to.deep.equal([2])
    })
  })

  describe(".indexBy()", () => {
    it("returns a MaybeSelector even if a default value is provided", () => {
      type Lookup = {
        [key: string]: number
      }

      const selector = MaybeSelector.fromGetSet<Lookup[], Lookup>(list => list[0], (list, _, x) => [x, ...list.slice(1)])
        .indexBy('key', 0)

      const nullResult = selector.get([], { key: "a" })
      expect(nullResult).to.be.null

      const defaultResult = selector.get([{ b: 1 }], { key: "a" })
      expect(defaultResult).to.equal(0)

      const nullModification = selector.modify([], { key: "a" }, x => x + 1)
      expect(nullModification).to.deep.equal([])

      const defaultModification = selector.modify([ { b: 1 } ], { key: "a" }, x => x + 1)
      expect(defaultModification).to.deep.equal([ { b: 1, a: 1 } ])
    })
  })

  it("composes with Get", () => {
    interface Foo { bar: Bar | null }
    interface Bar { qux: number }

    const get = MaybeSelector.fromGetSet<Foo, Bar>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(Get.create((bar: Bar) => bar.qux))

    const result = get({ bar: { qux: 1 } })
    expect(result).to.equal(1)

    const nullResult = get({ bar: null })
    expect(nullResult).to.be.null
  })

  it("composes with Selector", () => {
    interface Foo { bar: Bar | null }
    interface Bar { qux: number }

    const selector = MaybeSelector.fromGetSet<Foo, Bar>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(Selector.fromGetSet<Bar, number>(bar => bar.qux, (bar, _, qux) => ({ qux })))

    const result = selector.modify({ bar: { qux: 1 } }, x => x + 1)
    expect(result).to.deep.equal({ bar: { qux: 2 } })

    const nullResult = selector.modify({ bar: null }, x => x + 1)
    expect(nullResult).to.deep.equal({ bar: null })
  })

  it("composes with MaybeSelector", () => {
    interface Foo { bar: Bar | null }
    interface Bar { qux: number | null }

    const selector = MaybeSelector.fromGetSet<Foo, Bar>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(MaybeSelector.fromGetSet<Bar, number>(bar => bar.qux, (bar, _, qux) => ({ qux })))

    const result = selector.modify({ bar: { qux: 1 } }, x => x + 1)
    expect(result).to.deep.equal({ bar: { qux: 2 } })

    const nullResult = selector.modify({ bar: null }, x => x + 1)
    expect(nullResult).to.deep.equal({ bar: null })

    const nullResult2 = selector.modify({ bar: { qux: null } }, x => x + 1)
    expect(nullResult2).to.deep.equal({ bar: { qux: null } })
  })

  it("composes with Converter", () => {
    interface Foo { bar: string | null }

    const maybeSelector = MaybeSelector.fromGetSet<Foo, string>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(Converter.fromGets<string, string[]>(str => str.split(''), list => list.join('')))

    const result = maybeSelector.modify({ bar: "foo" }, str => str.reverse())
    expect(result).to.deep.equal({ bar: "oof" })
    
    const nullResult = maybeSelector.modify({ bar: null }, str => str.reverse())
    expect(nullResult).to.deep.equal({ bar: null })
  })

  it("composes with MaybeConverter", () => {
    interface Foo { bar: string | null }

    const parseNum = (str: string) => {
      const num = parseFloat(str)
      return isNaN(num) ? null : num
    }

    const maybeSelector = MaybeSelector.fromGetSet<Foo, string>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(MaybeConverter.fromGets(parseNum, num => num.toString()))

    const result = maybeSelector.modify({ bar: "1" }, x => x + 1)
    expect(result).to.deep.equal({ bar: "2" })

    const nullResult = maybeSelector.modify({ bar: "one" }, x => x + 1)
    expect(nullResult).to.deep.equal({ bar: "one" })

    const nullResult2 = maybeSelector.modify({ bar: null }, x => x + 1)
    expect(nullResult2).to.deep.equal({ bar: null })
  })
})