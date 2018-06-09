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
    const selector = Selector.fromGetSet<Foo, number, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))

    const result = selector.get({ bar: 1 })

    expect(result).to.equal(1)
  })

  it("sets", () => {
    interface Foo { bar: number }
    const selector = Selector.fromGetSet<Foo, number, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))

    const result = selector.set({ bar: 1 }, 2)

    expect(result).to.deep.equal({ bar: 2 })
  })
  
  it("modifies", () => {
    interface Foo { bar: number }
    const selector = Selector.fromGetSet<Foo, number, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))

    const result = selector.modify({ bar: 1 }, x => x + 1)

    expect(result).to.deep.equal({ bar: 2 })
  })


  it("composes with Get", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }

    const get = Selector.fromGetSet<Foo, Bar, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(Get.create((bar: Bar) => bar.qux))

    const result = get({ bar: { qux: 1 } })
    
    expect(result).to.equal(1)
  })

  it("composes with Selector", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }

    const selector = Selector.fromGetSet<Foo, Bar, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(Selector.fromGetSet<Bar, number, {}>(bar => bar.qux, (bar, _, qux) => ({ qux })))

    const result = selector.modify({ bar: { qux: 1 } }, x => x + 1)
    
    expect(result).to.deep.equal({ bar: { qux: 2 } })
  })

  it("composes with MaybeSelector", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number | null }

    const selector = Selector.fromGetSet<Foo, Bar, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(MaybeSelector.fromGetSet<Bar, number, {}>(bar => bar.qux, (bar, _, qux) => ({ qux })))

    const result = selector.modify({ bar: { qux: 1 } }, x => x + 1)
    expect(result).to.deep.equal({ bar: { qux: 2 } })

    const nullResult = selector.modify({ bar: { qux: null } }, x => x + 1)
    expect(nullResult).to.deep.equal({ bar: { qux: null } })
  })

  it("composes with Converter", () => {
    interface Foo { bar: string }

    const selector = Selector.fromGetSet<Foo, string, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(Converter.fromGets<string, string[], {}>(str => str.split(''), list => list.join('')))

    const result = selector.modify({ bar: "foo" }, str => str.reverse())
    
    expect(result).to.deep.equal({ bar: "oof" })
  })

  it("composes with MaybeConverter", () => {
    interface Foo { bar: string }

    const parseNum = (str: string) => {
      const num = parseFloat(str)
      return isNaN(num) ? null : num
    }

    const maybeSelector = Selector.fromGetSet<Foo, string, {}>(foo => foo.bar, (foo, _, bar) => ({ bar }))
      .compose(MaybeConverter.fromGets(parseNum, num => num.toString()))

    const result = maybeSelector.modify({ bar: "1" }, x => x + 1)
    expect(result).to.deep.equal({ bar: "2" })

    const nullResult = maybeSelector.modify({ bar: "one" }, x => x + 1)
    expect(nullResult).to.deep.equal({ bar: "one" })
  })
})