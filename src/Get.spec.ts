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

  it("requires a param argument when Params is not empty", () => {
    const get = Get.create<number, string, { param: string }>(num => num.toString())
    const result = get(1, { param: "" })

    expect(result).to.equal("1")
  })

  it("can map the result", () => {
    const get = Get.create((num: number) => num.toString())
      .map(str => str[0])

    const result = get(12)

    expect(result).to.equal("1")
  })

  it("composes with Selector", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }

    const get = Get.create((foo: Foo) => foo.bar)
      .compose(Selector.fromGetSet<Bar, number, {}>(b => b.qux, (b, _, qux) => ({ qux })))

    const result = get({ bar: { qux: 1 } })
    
    expect(result).to.equal(1)
  })

  it("composes with MaybeSelector", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number | null }

    const get = Get.create((foo: Foo) => foo.bar)
    .compose(MaybeSelector.fromGetSet<Bar, number, {}>(b => b.qux, (b, _, qux) => ({ qux })))

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
      .compose(Converter.fromGets<Bar, Sha, {}>(bar => ({ pow: bar.qux }), sha => ({ qux: sha.pow })))

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