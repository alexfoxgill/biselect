import { expect } from 'chai'
import 'mocha'
import { Selector } from './Selector';
import { Get } from './Get';
import { MaybeSelector } from './MaybeSelector';
import { Converter } from './Converter';
import { MaybeConverter } from './MaybeConverter';

describe("MaybeSelector", () => {

  it("gets", () => {
    interface Foo { bar: number | null }
    const selector = MaybeSelector.fromGetSet<Foo, number, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))

    const result = selector.get({ bar: 1 })
    expect(result).to.equal(1)

    const nullResult = selector.get({ bar: null })
    expect(nullResult).to.equal(null)
  })

  it("sets", () => {
    interface Foo { bar: number | null }
    const maybeSelector = MaybeSelector.fromGetSet<Foo, number, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))

    const result = maybeSelector.set({ bar: 1 }, 2)
    expect(result).to.deep.equal({ bar: 2 })
    
    const nullResult = maybeSelector.set({ bar: null }, 2)
    expect(nullResult).to.deep.equal({ bar: 2 })
  })
  
  it("modifies", () => {
    interface Foo { bar: number | null }
    const maybeSelector = MaybeSelector.fromGetSet<Foo, number, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))

    const result = maybeSelector.modify({ bar: 1 }, x => x + 1)
    expect(result).to.deep.equal({ bar: 2 })
    
    const nullResult = maybeSelector.modify({ bar: null }, x => x + 1)
    expect(nullResult).to.deep.equal({ bar: null })
  })


  it("composes with Get", () => {
    interface Foo { bar: Bar | null }
    interface Bar { qux: number }

    const get = MaybeSelector.fromGetSet<Foo, Bar, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(Get.create((bar: Bar) => bar.qux))

    const result = get({ bar: { qux: 1 } })
    expect(result).to.equal(1)

    const nullResult = get({ bar: null })
    expect(nullResult).to.be.null
  })

  it("composes with Selector", () => {
    interface Foo { bar: Bar | null }
    interface Bar { qux: number }

    const selector = MaybeSelector.fromGetSet<Foo, Bar, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(Selector.fromGetSet<Bar, number, {}>(bar => bar.qux, (bar, _, qux) => ({ qux })))

    const result = selector.modify({ bar: { qux: 1 } }, x => x + 1)
    expect(result).to.deep.equal({ bar: { qux: 2 } })

    const nullResult = selector.modify({ bar: null }, x => x + 1)
    expect(nullResult).to.deep.equal({ bar: null })
  })

  it("composes with MaybeSelector", () => {
    interface Foo { bar: Bar | null }
    interface Bar { qux: number | null }

    const selector = MaybeSelector.fromGetSet<Foo, Bar, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(MaybeSelector.fromGetSet<Bar, number, {}>(bar => bar.qux, (bar, _, qux) => ({ qux })))

    const result = selector.modify({ bar: { qux: 1 } }, x => x + 1)
    expect(result).to.deep.equal({ bar: { qux: 2 } })

    const nullResult = selector.modify({ bar: null }, x => x + 1)
    expect(nullResult).to.deep.equal({ bar: null })

    const nullResult2 = selector.modify({ bar: { qux: null } }, x => x + 1)
    expect(nullResult2).to.deep.equal({ bar: { qux: null } })
  })

  it("composes with Converter", () => {
    interface Foo { bar: Bar | null }
    interface Bar { qux: number }
    interface Sha { pow: number }

    const maybeSelector = MaybeSelector.fromGetSet<Foo, Bar, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(Converter.fromGets<Bar, Sha, {}>(bar => ({ pow: bar.qux }), sha => ({ qux: sha.pow })))

    const result = maybeSelector.modify({ bar: { qux: 1 } }, sha => ({ pow: sha.pow + 1 }))
    expect(result).to.deep.equal({ bar: { qux: 2 } })
    
    const nullResult = maybeSelector.modify({ bar: null }, sha => ({ pow: sha.pow + 1 }))
    expect(nullResult).to.deep.equal({ bar: null })
  })

  it("composes with MaybeConverter", () => {
    interface Foo { bar: string | null }

    const parseNum = (str: string) => {
      const num = parseFloat(str)
      return isNaN(num) ? null : num
    }

    const maybeSelector = MaybeSelector.fromGetSet<Foo, string, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(MaybeConverter.fromGets(parseNum, num => num.toString()))

    const result = maybeSelector.modify({ bar: "1" }, x => x + 1)
    expect(result).to.deep.equal({ bar: "2" })

    const nullResult = maybeSelector.modify({ bar: "one" }, x => x + 1)
    expect(nullResult).to.deep.equal({ bar: "one" })

    const nullResult2 = maybeSelector.modify({ bar: null }, x => x + 1)
    expect(nullResult2).to.deep.equal({ bar: null })
  })
})