import { expect } from 'chai'
import 'mocha'
import { Get } from './Get'
import { Set } from './Set';
import { Selector } from './Selector';
import { Root } from './Root';
import { MaybeSelector } from './MaybeSelector';
import { Converter } from './Converter';
import { MaybeConverter } from './MaybeConverter';

describe("Get", () => {

  it("doesn't permit a param argument when Params is empty", () => {
    const get = Get.create((num: number) => num.toString())
    const result = get(1)
    
    expect(result).to.equal("1")
  })

  it("requires and uses a param argument when Params is not empty", () => {
    const get = Get.create<number, string, { append: string }>((num, param) => num.toString() + param.append)
    const result = get(1, { append: "0" })

    expect(result).to.equal("10")
  })

  describe(".map()", () => {
    it("can map the result", () => {
      const get = Get.create((num: number) => num.toString())
        .map(str => str[0])

      const result = get(12)

      expect(result).to.equal("1")
    })

    it("passes params", () => {
      const get = Get.create((num: number, params: string) => num.toString())
        .map((str, params) => str + params)

      const result = get(12, "3")

      expect(result).to.equal("123")
    })
  })

  describe(".mapParams()", () => {
    it("maps parameter object", () => {
      interface Params1 {
        x: number
      }
      interface Params2 {
        y: number
      }
      const get = Get.create<number, number, Params1>((num, p) => num + p.x)
        .mapParams<Params2>(p2 => ({ x: p2.y }))
  
      const result = get(1, { y: 2 })
      expect(result).to.equal(3)
    })
  })

  describe(".combine()", () => {
    it("combines with another Get", () => {
      interface Foo {
        bar: number
        sha: string
      }

      const getBar = Get.create((foo: Foo) => foo.bar)
      const getSha = Get.create((foo: Foo) => foo.sha)
      const combined = getBar.combine(getSha)

      const result = combined({ bar: 1, sha: "a" })

      expect(result).to.deep.equal([1, "a"])
    })

    it("combines with several other Gets", () => {
      interface Foo {
        bar: number
        sha: string
        qux: boolean
        date: Date
      }

      const getBar = Get.create((foo: Foo) => foo.bar)
      const getSha = Get.create((foo: Foo) => foo.sha)
      const getQux = Get.create((foo: Foo) => foo.qux)
      const getDate = Get.create((foo: Foo) => foo.date)
      const combined = getBar.combine(getSha, getQux, getDate)

      const date = new Date()
      const result = combined({ bar: 1, sha: "a", qux: false, date })

      expect(result).to.deep.equal([1, "a", false, date])
    })
  })

  describe(".choose()", () => {
    it("creates a new Get", () => {
      interface Foo {
        bar: string | number
      }

      const isString = (x: any): x is string => typeof x === "string"
      const getBar = Get.create((foo: Foo) => foo.bar)
      const chosen = getBar.choose(isString)

      const stringResult = chosen({ bar: "hello" })
      expect(stringResult).to.equal("hello")

      const numberResult = chosen({ bar: 1 })
      expect(numberResult).to.be.null
    })
  })

  it("composes with Get", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }

    const get = Get.create((foo: Foo) => foo.bar)
      .compose(Get.create((bar: Bar) => bar.qux))

    const result = get({ bar: { qux: 1 } })
    
    expect(result).to.equal(1)
  })

  it("composes with Selector", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }

    const get = Get.create((foo: Foo) => foo.bar)
      .compose(Selector.fromGetSet<Bar, number>(b => b.qux, (b, _, qux) => ({ qux })))

    const result = get({ bar: { qux: 1 } })
    
    expect(result).to.equal(1)
  })

  it("composes with MaybeSelector", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number | null }

    const get = Get.create((foo: Foo) => foo.bar)
    .compose(MaybeSelector.fromGetSet<Bar, number>(b => b.qux, (b, _, qux) => ({ qux })))

    const result = get({ bar: { qux: 1 } })
    expect(result).to.equal(1)

    const nullResult = get({ bar: { qux: null } })
    expect(nullResult).to.be.null
  })

  it("composes with Converter", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }
    interface Sha { pow: number }

    const get = Get.create((foo: Foo) => foo.bar)
      .compose(Converter.fromGets<Bar, Sha>(bar => ({ pow: bar.qux }), sha => ({ qux: sha.pow })))

    const result = get({ bar: { qux: 1 } })
    
    expect(result).to.deep.equal({ pow: 1 })
  })

  it("composes with MaybeConverter", () => {
    interface Foo { bar: string }

    const parseNum = (str: string) => {
      const num = parseFloat(str)
      return isNaN(num) ? null : num
    }

    const get = Get.create((foo: Foo) => foo.bar)
      .compose(MaybeConverter.fromGets(parseNum, num => num.toString()))

    const result = get({ bar: "1" })
    expect(result).to.equal(1)

    const nullResult = get({ bar: "one" })
    expect(nullResult).to.be.null
  })
})