import { expect } from 'chai'
import 'mocha'
import { Selector } from './Selector';
import { MaybeSelector } from './MaybeSelector';
import { Converter } from './Converter';
import { MaybeConverter } from './MaybeConverter';
import { MaybeGet } from './MaybeGet';
import { Get } from './Get';

describe("MaybeGet", () => {

  it("doesn't permit a param argument when Params is empty", () => {
    const get = MaybeGet.create((num: number) => num.toString())
    const result = get(1)
    
    expect(result).to.equal("1")
  })

  it("requires and uses a param argument when Params is not empty", () => {
    const get = MaybeGet.create<number, string, { append: string }>((num, param) => num.toString() + param.append)
    const result = get(1, { append: "0" })

    expect(result).to.equal("10")
  })

  describe(".map()", () => {
    it("can map the result", () => {
      const get = MaybeGet.create((num: number) => num.toString())
        .map(str => str[0])

      const result = get(12)

      expect(result).to.equal("1")
    })

    it("passes params", () => {
      const get = MaybeGet.create((num: number, params: string) => num.toString())
        .map((str, params) => str + params)

      const result = get(12, "3")

      expect(result).to.equal("123")
    })

    it("ignores null values", () => {
      const get = MaybeGet.create((num: number) => num === 0 ? null : num.toString())
        .map(str => str[0])

      const result = get(0)

      expect(result).to.be.null
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
      const get = MaybeGet.create<number, number, Params1>((num, p) => num + p.x)
        .mapParams<Params2>(p2 => ({ x: p2.y }))
  
      const result = get(1, { y: 2 })
      expect(result).to.equal(3)
    })
  })

  describe(".combine()", () => {
    it("combines with another MaybeGet", () => {
      interface Foo {
        bar: number
        sha: string
      }

      const getBar = MaybeGet.create((foo: Foo) => foo.bar)
      const getSha = MaybeGet.create((foo: Foo) => foo.sha)
      const combined = getBar.combine(getSha)

      const result = combined({ bar: 1, sha: "a" })

      expect(result).to.deep.equal([1, "a"])
    })

    it("combines with several other MaybeGets", () => {
      interface Foo {
        bar: number
        sha: string
        qux: boolean
        date: Date
      }

      const getBar = MaybeGet.create((foo: Foo) => foo.bar)
      const getSha = MaybeGet.create((foo: Foo) => foo.sha)
      const getQux = MaybeGet.create((foo: Foo) => foo.qux)
      const getDate = MaybeGet.create((foo: Foo) => foo.date)
      const combined = getBar.combine(getSha, getQux, getDate)

      const date = new Date()
      const result = combined({ bar: 1, sha: "a", qux: false, date })

      expect(result).to.deep.equal([1, "a", false, date])
    })
  })

  describe(".choose()", () => {
    it("creates a new MaybeGet", () => {
      interface Foo {
        bar: string | number
      }

      const isString = (x: any): x is string => typeof x === "string"
      const getBar = MaybeGet.create((foo: Foo) => foo.bar)
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

    const getBar = MaybeGet.create((foo: Foo) => foo.bar)
    const getQux = Get.create((bar: Bar) => bar.qux)
    const get = getBar.compose(getQux)

    const result = get({ bar: { qux: 1 } })
    
    expect(result).to.equal(1)
  })

  it("composes with MaybeGet", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }

    const getBar = MaybeGet.create((foo: Foo) => foo.bar)
    const getQux = MaybeGet.create((bar: Bar) => bar.qux)
    const get = getBar.compose(getQux)

    const result = get({ bar: { qux: 1 } })
    
    expect(result).to.equal(1)
  })

  it("composes with Selector", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }

    const get = MaybeGet.create((foo: Foo) => foo.bar)
      .compose(Selector.fromGetSet<Bar, number>(b => b.qux, (b, _, qux) => ({ qux })))

    const result = get({ bar: { qux: 1 } })
    
    expect(result).to.equal(1)
  })

  it("composes with MaybeSelector", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number | null }

    const get = MaybeGet.create((foo: Foo) => foo.bar)
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

    const get = MaybeGet.create((foo: Foo) => foo.bar)
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

    const get = MaybeGet.create((foo: Foo) => foo.bar)
      .compose(MaybeConverter.fromGets(parseNum, num => num.toString()))

    const result = get({ bar: "1" })
    expect(result).to.equal(1)

    const nullResult = get({ bar: "one" })
    expect(nullResult).to.be.null
  })
})