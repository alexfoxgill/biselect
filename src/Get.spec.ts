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

  it("can map the result", () => {
    const get = Get.create((num: number) => num.toString())
      .map(str => str[0])

    const result = get(12)

    expect(result).to.equal("1")
  })

  it("combines with another Get", () => {
    interface Foo {
      bar: Bar
      sha: Sha
    }

    interface Bar {
      qux: number
    }

    interface Sha {
      pow: string
    }

    const getBar = Get.create((foo: Foo) => foo.bar)
    const getSha = Get.create((foo: Foo) => foo.sha)
    const combined = getBar.combine(getSha)

    const result = combined({ bar: { qux: 1 }, sha: { pow: "a" }})

    expect(result).to.deep.equal({ qux: 1, pow: "a" })
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