import { expect } from 'chai'
import 'mocha'
import { Biselect } from '.';
import { Root } from './Root';
import { Extension } from './Extension';

describe("Extension", () => {
  it("is only applied once per object", () => {
    interface Foo {
      bar: number
    }
    interface Foos {
      [key: string]: Foo
    }

    const items: any[] = []
    const extension = Extension.create(x => items.push(x))

    const selector = Root.create<Foos>(extension)
      .indexBy('fooId')
      .prop('bar')
      .withDefaultValue(0)

    expect(items).to.not.be.empty
    const itemsAreDistinct = items.every((x, i, a) => a.indexOf(x) === i)
    expect(itemsAreDistinct).to.be.true
  })
})