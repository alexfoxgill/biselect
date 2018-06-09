import { expect } from 'chai'
import 'mocha'
import { Selector } from './Selector';
import { Get } from './Get';
import { MaybeSelector } from './MaybeSelector';
import { Converter } from './Converter';
import { MaybeConverter } from './MaybeConverter';

describe("MaybeConverter", () => {
  const parseNum = (str: string) => {
    const num = parseFloat(str)
    return isNaN(num) ? null : num
  }

  it("gets", () => {
    const converter = MaybeConverter.fromGets<string, number, {}>(parseNum, num => num.toString())

    const result = converter.get("1")
    expect(result).to.equal(1)

    const nullResult = converter.get("one")
    expect(nullResult).to.be.null
  })

  it("reverse gets", () => {
    const converter = MaybeConverter.fromGets<string, number, {}>(parseNum, num => num.toString())

    const result = converter.reverseGet(1)
    expect(result).to.equal("1")
  })

  describe(".withDefault[Value]()", () => {
    it("returns the default if null is found", () => {
      const converter = MaybeConverter.fromGets<string, number, {}>(parseNum, num => num.toString())
        .withDefaultValue(1)

      const result = converter.get("two")
      expect(result).to.equal(1)
    })
    
    it("calls the provided default function with the correc arguments if null is found", () => {
      const converter = MaybeConverter.fromGets<string, number, { param: number }>(parseNum, num => num.toString())
        .withDefault((str, { param }) => str.length + param)

      const result = converter.get("two", { param: 2 })
      expect(result).to.equal(5)
    })

    it("can use a Get", () => {
      const converter = MaybeConverter.fromGets<string, number, { param: number }>(parseNum, num => num.toString())
        .withDefault(Get.create((str, { param }) => str.length + param))

      const result = converter.get("two", { param: 2 })
      expect(result).to.equal(5)
    })
  })
  
  it("composes with Get", () => {
    const get = MaybeConverter.fromGets<string, number, {}>(parseNum, num => num.toString())
      .compose(Get.create(x => x * 2))

    const result = get("1")
    expect(result).to.equal(2)

    const nullResult = get("one")
    expect(nullResult).to.be.null
  })

  it("composes with Selector", () => {
    interface Foo { bar: string }

    const maybeSelector = MaybeConverter.fromGets<Foo | null, Foo, {}>(x => x, x => x)
      .compose(Selector.fromGetSet<Foo, string, {}>(foo => foo.bar, (foo, _, bar) => ({ bar })))

    const result = maybeSelector.modify({ bar: "bar" }, x => "foo" + x)
    expect(result).to.deep.equal({ bar: "foobar" })

    const nullResult = maybeSelector.modify(null, x => "foo" + x)
    expect(nullResult).to.be.null
  })

  it("composes with MaybeSelector", () => {
    const maybeSelector = MaybeConverter.fromGets<string | null, string, {}>(x => x, x => x)
      .compose(MaybeSelector.fromGetSet<string, string, {}>(str => str[0] || null, (str, _, ch) => str.length === 0 ? ch : ch + str.substr(1)))

    const result = maybeSelector.modify("foo", x => x.toUpperCase())
    expect(result).to.equal("Foo")

    const nullResult = maybeSelector.modify("", x => x.toUpperCase())
    expect(nullResult).to.equal("")

    const nullResult2 = maybeSelector.modify(null, x => x.toUpperCase())
    expect(nullResult2).to.be.null
  })

  it("composes with Converter", () => {
    const maybeConverter = MaybeConverter.fromGets<string | null, string, {}>(x => x, x => x)
      .compose(Converter.fromGets<string, string[], {}>(str => str.split(''), list => list.join('')))

    const result = maybeConverter.get("ab")
    expect(result).to.deep.equal(["a", "b"])

    const reverseResult = maybeConverter.reverseGet(["a", "b"])
    expect(reverseResult).to.equal("ab")

    const nullResult = maybeConverter.get(null)
    expect(nullResult).to.be.null
  })

  it("composes with MaybeConverter", () => {
    const maybeConverter = MaybeConverter.fromGets<string | null, string, {}>(x => x, x => x)
      .compose(MaybeConverter.fromGets(parseNum, num => num.toString()))

    const result = maybeConverter.get("10")
    expect(result).to.equal(10)

    const reverseResult = maybeConverter.reverseGet(10)
    expect(reverseResult).to.deep.equal("10")

    const nullResult = maybeConverter.get("not-a-number")
    expect(nullResult).to.be.null

    const nullResult2 = maybeConverter.get(null)
    expect(nullResult2).to.be.null
  })
})