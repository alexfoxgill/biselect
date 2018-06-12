import { expect } from 'chai'
import 'mocha'
import { Modify } from './Modify';
import { Set } from './Set';

describe("Modify", () => {
  it("modifies", () => {
    interface Foo { bar: number }
    const modify = Modify.create<Foo, number>((foo, p, f) => ({ bar: f(foo.bar) }))

    const result = modify({ bar: 1 }, x => x + 1)
    expect(result).to.deep.equal({ bar: 2 })
  })

  it("modifies with params", () => {
    interface Foo { bar: number }
    const modify = Modify.create<Foo, number, { param: number }>((foo, p, f) => ({ bar: f(foo.bar) }))

    const result = modify({ bar: 1 }, { param: 1 }, x => x + 1)
    expect(result).to.deep.equal({ bar: 2 })
  })

  it("merges", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number, sha: string }
    const modify = Modify.create<Foo, Bar>((foo, p, f) => ({ bar: f(foo.bar) }))

    const result = modify.merge({ bar: { qux: 1, sha: "pow" }  }, { qux: 2 })
    expect(result).to.deep.equal({ bar: { qux: 2, sha: "pow" }})
  })

  it("merges with params", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number, sha: string }
    const modify = Modify.create<Foo, Bar, { param: number }>((foo, p, f) => ({ bar: f(foo.bar) }))

    const result = modify.merge({ bar: { qux: 1, sha: "pow" }  }, { param: 1 }, { qux: 2 })
    expect(result).to.deep.equal({ bar: { qux: 2, sha: "pow" }})
  })

  it("deep merges", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number, sha: Sha }
    interface Sha {
      pow: string
      ping: number
    }
    const modify = Modify.create<Foo, Bar>((foo, p, f) => ({ bar: f(foo.bar) }))

    const result = modify.deepMerge({ bar: { qux: 1, sha: { pow: "pow", ping: 1 } } }, { sha: { ping: 2 } })
    expect(result).to.deep.equal({ bar: { qux: 1, sha: { pow: "pow", ping: 2 } } })
  })

  it("deep merges with params", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number, sha: Sha }
    interface Sha {
      pow: string
      ping: number
    }
    const modify = Modify.create<Foo, Bar, { params: number }>((foo, p, f) => ({ bar: f(foo.bar) }))

    const result = modify.deepMerge({ bar: { qux: 1, sha: { pow: "pow", ping: 1 } } }, { params: 1 }, { sha: { ping: 2 } })
    expect(result).to.deep.equal({ bar: { qux: 1, sha: { pow: "pow", ping: 2 } } })
  })

  it("composes with another Modify", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }
    const modify = Modify.create<Foo, Bar>((foo, p, f) => ({ bar: f(foo.bar) }))
      .compose(Modify.create<Bar, number>((bar, p, f) => ({ qux: f(bar.qux) })))

    const result = modify({ bar: { qux: 1 } }, x => x + 1)
    expect(result).to.deep.equal({ bar: { qux: 2 } })
  })

  it("composes with another Modify with params", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }
    const modify = Modify.create<Foo, Bar, { param: number }>((foo, p, f) => ({ bar: f(foo.bar) }))
      .compose(Modify.create<Bar, number>((bar, p, f) => ({ qux: f(bar.qux) })))

    const result = modify({ bar: { qux: 1 } }, { param: 3 }, x => x + 1)
    expect(result).to.deep.equal({ bar: { qux: 2 } })
  })

  it("composes with Set", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }
    const modify = Modify.create<Foo, Bar>((foo, p, f) => ({ bar: f(foo.bar) }))
      .compose(Set.create<Bar, number>((bar, p, qux) => ({ qux })))

    const result = modify({ bar: { qux: 1 } }, 2)
    expect(result).to.deep.equal({ bar: { qux: 2 } })
  })

  it("composes with Set with params", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }
    const set = Modify.create<Foo, Bar, { param: number }>((foo, p, f) => ({ bar: f(foo.bar) }))
      .compose(Set.create<Bar, number>((bar, p, qux) => ({ qux })))

    const result = set({ bar: { qux: 1 } }, { param: 3 }, 2)
    expect(result).to.deep.equal({ bar: { qux: 2 } })
  })
})