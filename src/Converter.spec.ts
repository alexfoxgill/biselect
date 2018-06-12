import { expect } from 'chai'
import 'mocha'
import { Selector } from './Selector';
import { Get } from './Get';
import { MaybeSelector } from './MaybeSelector';
import { Converter } from './Converter';
import { MaybeConverter } from './MaybeConverter';

describe("Converter", () => {

  it("gets", () => {
    const converter = Converter.fromGets<string, string[]>(str => str.split(''), list => list.join(''))

    const result = converter.get("foo")
    expect(result).to.deep.equal(["f", "o", "o"])
  })

  it("reverse gets", () => {
    const converter = Converter.fromGets<string, string[]>(str => str.split(''), list => list.join(''))

    const result = converter.reverseGet(["f", "o", "o"])
    expect(result).to.deep.equal("foo")
  })
  

  it("composes with Get", () => {
    const get = Converter.fromGets<string, string[]>(str => str.split(''), list => list.join(''))
      .compose(Get.create(list => list.reverse()))

    const result = get("foo")
    expect(result).to.deep.equal(["o", "o", "f"])
  })

  it("composes with Selector", () => {
    interface Foo { bar: string }
    interface Sha { pow: string }
    interface Bar { qux: string }

    const selector = Converter.fromGets<Foo, Sha>(foo => ({ pow: foo.bar }), sha => ({ bar: sha.pow }))
      .compose(Selector.fromGetSet<Sha, string>(sha => sha.pow, (sha, _, pow) => ({ pow })))

    const result = selector.modify({ bar: "bar" }, x => "foo" + x)
    expect(result).to.deep.equal({ bar: "foobar" })
  })

  it("composes with MaybeSelector", () => {
    const maybeSelector = Converter.fromGets<string, string[]>(str => str.split(''), list => list.join(''))
      .compose(MaybeSelector.fromGetSet<string[], string>(list => list[0] || null, (list, _, ch) => list.length === 0 ? [ch] : [ch, ...list.slice(1)]))

    const result = maybeSelector.modify("foo", x => x.toUpperCase())
    expect(result).to.equal("Foo")

    const nullResult = maybeSelector.modify("", x => x.toUpperCase())
    expect(nullResult).to.equal("")
  })

  it("composes with Converter", () => {
    const converter = Converter.fromGets<string, string[]>(str => str.split(','), list => list.join(','))
      .compose(Converter.fromGets<string[], string>(list => list.join('|'), str => str.split('|')))

    const result = converter.get("a,b")
    expect(result).to.equal("a|b")

    const reverseResult = converter.reverseGet("a|b")
    expect(reverseResult).to.equal("a,b")
  })

  it("composes with MaybeConverter", () => {
    const parseNum = (str: string) => {
      const num = parseFloat(str)
      return isNaN(num) ? null : num
    }

    const maybeConverter = Converter.fromGets<string[], string>(list => list.join(''), str => str.split(''))
      .compose(MaybeConverter.fromGets(parseNum, num => num.toString()))

    const result = maybeConverter.get(["1", "0"])
    expect(result).to.equal(10)

    const reverseResult = maybeConverter.reverseGet(10)
    expect(reverseResult).to.deep.equal(["1", "0"])

    const nullResult = maybeConverter.get(["not", "a", "number"])
    expect(nullResult).to.be.null
  })
})