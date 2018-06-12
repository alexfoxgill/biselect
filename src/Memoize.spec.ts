import { expect } from 'chai'
import 'mocha'
import { Get } from './Get';
import { Memoize } from './Memoize';

describe("Memoize", () => {
  it("retains the value of a Get without calling the underlying function twice", () => {
    interface Foo {
      bar: number
    }

    let calls = 0

    const get = Get.create<Foo, number, { param: number }>((foo, p) => {
      calls++
      return foo.bar
    }).memoize()

    const foo = { bar: 1 }
    const params = { param: 2 }

    const result1 = get(foo, params)
    const result2 = get(foo, params)

    expect(result1).to.equal(result2)
    expect(calls).to.equal(1)
  })

  it("retains the value of a Get if the parameters are shallow-equal", () => {
    interface Foo {
      bar: number
    }

    let calls = 0

    const get = Get.create<Foo, number, { param: number }>((foo, p) => {
      calls++
      return foo.bar
    }).memoize()

    const foo = { bar: 1 }

    const result1 = get(foo, { param: 2 })
    const result2 = get(foo, { param: 2 })

    expect(result1).to.equal(result2)
    expect(calls).to.equal(1)

  })
})