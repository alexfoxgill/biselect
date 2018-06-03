import { expect } from 'chai';
import 'mocha';
import {Biselect, Selector, MaybeSelector, Converter, MaybeConverter, DeepPartial} from './index'
import {indexBy, Lookup} from './util'

namespace Fixture {
  export interface Root {
    userModule: UserModule
  }
  
  export interface UserModule {
    users: UserList
    userRoles: Lookup<Lookup<Role>>
  }
  
  export type UserList = Lookup<User>
  
  export interface User {
    id: string
    userName: string
    address: UserAddress
  }

  export type UserAddress = NotSupplied | Address

  export interface NotSupplied {
    type: "notSupplied"
  }

  export interface Address {
    type: "address"
    city: string
    postcode: string
  }

  export type AddressTuple = [string, string]
  
  export enum Role {
    Employee,
    Manager,
    CEO
  }

  export const anneAddress: Address = { type: "address", city: "gotham", postcode: "BA7 M4N" }
  export const anne: User = { id: "1", userName: "anne", address: anneAddress }
  export const bob: User = { id: "b0bby", userName: "bob", address: { type: "notSupplied" } }
  export const clare: User = { id: "3", userName: "clare", address: { type: "notSupplied" } }
  export const users: UserList = indexBy([anne, bob], 'id')
  export const acme = { id: "acme" }
  export const stark = { id: "stark" }
  export const userRoles = {
    [anne.id]: {
      [acme.id]: Role.Manager
    }
  }
  export const userModule: UserModule = {
    users,
    userRoles
  }
  export const root: Root = {
    userModule
  }
}

const reverse = (str: string): string => str.split('').reverse().join('')

const userId = Biselect.from<Fixture.User>().prop('id')
const userName = Biselect.from<Fixture.User>().prop('userName')
const userById = Biselect.from<Fixture.UserList>().index("userId")
const userModule = Biselect.from<Fixture.Root>().prop('userModule')
const usersFromModule = Biselect.from<Fixture.UserModule>().prop('users')
const userAddress = Biselect.from<Fixture.User>().prop('address')
const isAddress = (x: Fixture.UserAddress): x is Fixture.Address => x.type === "address"
const notNull = <T>(x: T | null): x is T => x !== null
const actualAddress = Biselect.from<Fixture.UserAddress>().choose(isAddress)
const city = Biselect.from<Fixture.Address>().prop('city')
const stringSplitter = new Converter<string, string[], {}>(str => str.split(''), list => list.join(''))
const stringToNum = new MaybeConverter<string, number, {}>(
  str => {
    const num = parseFloat(str)
    return isNaN(num) ? null : num
  },
  num => num.toString())
const firstLetter = new MaybeSelector<string, string, {}>(
  str => str.length > 0 ? str[0] : null,
  (str, letter) => str.length > 0 ? letter + str.substring(1) : letter)
const addressToTuple = new Converter<Fixture.Address, Fixture.AddressTuple, {}>(
  a => [a.city, a.postcode],
  ([city, postcode]) => ({ type: "address", city, postcode }))

const userListToLookup = new Converter<Fixture.User[], Lookup<Fixture.User>, {}>(
  list => indexBy(list, 'id'),
  lookup => Object.keys(lookup).map(x => lookup[x]))

describe("Selector", () => {
  it("gets", () => {
    const result = userName.get(Fixture.anne)

    expect(result).to.equal(Fixture.anne.userName)
  })

  it("sets", () => {
    const result = userName.set(Fixture.anne, "bob")

    expect(result).to.deep.equal({ ...Fixture.anne, userName: "bob" })
  })

  it("modifies", () => {
    const result = userName.modify(Fixture.anne, reverse)

    expect(result).to.deep.equal({ ...Fixture.anne, userName: "enna" })
  })

  describe("composed with Selector", () => {
    const usersFromRoot = userModule.compose(usersFromModule)

    it("gets", () => {
      const result = usersFromRoot.get(Fixture.root)

      expect(result).to.deep.equal(Fixture.users)
    })

    it("sets", () => {
      const result = usersFromRoot.set(Fixture.root, {})

      expect(result.userModule.users).to.deep.equal({})
    })
  })

  describe("composed with MaybeSelector", () => {
    const userFromModule = usersFromModule.compose(userById)

    it("gets", () => {
      const result = userFromModule.get(Fixture.userModule, { userId: Fixture.anne.id })

      expect(result).to.equal(Fixture.anne)
    })

    it("gets null", () => {
      const result = userFromModule.get(Fixture.userModule, { userId: Fixture.clare.id })

      expect(result).to.be.null
    })

    it("sets", () => {
      const result = userFromModule.set(Fixture.userModule, Fixture.clare, { userId: Fixture.clare.id })

      expect(result.users[Fixture.clare.id]).to.equal(Fixture.clare)
    })
  })

  describe("composed with Converter", () => {
    const userNameList = userName.compose(stringSplitter)

    it("gets", () => {
      const result = userNameList.get(Fixture.bob)

      expect(result).to.deep.equal(['b', 'o', 'b'])
    })

    it("sets", () => {
      const result = userNameList.set(Fixture.bob, ['b', 'i', 'l', 'l', 'y'])

      expect(result).to.deep.equal({ ...Fixture.bob, userName: "billy" })
    })
  })

  describe("composed with MaybeConverter", () => {
    const actualUserAddress = userAddress.compose(actualAddress) 

    it("gets", () => {
      const result = actualUserAddress.get(Fixture.anne)

      expect(result).to.equal(Fixture.anneAddress)
    })

    it("gets null", () => {
      const result = actualUserAddress.get(Fixture.bob)

      expect(result).to.be.null
    })

    it("sets", () => {
      const result = actualUserAddress.set(Fixture.bob, Fixture.anneAddress)

      expect(result).to.deep.equal({ ...Fixture.bob, address: Fixture.anneAddress })
    })
  })
})

describe("MaybeSelector", () => {
  it("gets", () => {
    const result = userById.get(Fixture.users, { userId: Fixture.bob.id })

    expect(result).to.equal(Fixture.bob)
  })

  it("sets", () => {
    const result = userById.set(Fixture.users, Fixture.clare, { userId: Fixture.clare.id })

    expect(result).to.deep.equal({ ...Fixture.users, [Fixture.clare.id]: Fixture.clare })
  })

  it("modifies", () => {
    const result = userById.modify(Fixture.users, user => ({ ...user, userName: "billy" }), { userId: Fixture.bob.id })

    expect(result).to.deep.equal({ ...Fixture.users, [Fixture.bob.id]: { ...Fixture.bob, userName: "billy" } })
  })

  it("gets null", () => {
    const result = userById.get(Fixture.users, { userId: Fixture.clare.id })

    expect(result).to.be.null
  })

  it("ignores null when modifying", () => {
    const result = userById.modify(Fixture.users, _ => Fixture.clare, { userId: Fixture.clare.id })

    expect(result).to.equal(Fixture.users)
  })

  describe("composed with Selector", () => {
    const userNames = userById.compose(userName)

    it("gets", () => {
      const result = userNames.get(Fixture.users, { userId: Fixture.anne.id })

      expect(result).to.equal(Fixture.anne.userName)
    })

    it("gets null", () => {
      const result = userNames.get(Fixture.users, { userId: Fixture.clare.id })

      expect(result).to.be.null
    })

    it("sets", () => {
      const result = userNames.set(Fixture.users, Fixture.clare.userName, { userId: Fixture.anne.id })

      expect(result).to.deep.equal({ ...Fixture.users, [Fixture.anne.id]: { ...Fixture.anne, userName: Fixture.clare.userName }})
    })
  })

  describe("composed with MaybeSelector", () => {
    const userOrgRole = Biselect.from<Lookup<Lookup<Fixture.Role>>>().index('userId')
    const orgRole = Biselect.from<Lookup<Fixture.Role>>().index('orgId')
    const userRole = userOrgRole.compose(orgRole)

    it("gets", () => {
      const result = userRole.get(Fixture.userRoles, { userId: Fixture.anne.id, orgId: Fixture.acme.id })

      expect(result).to.equal(Fixture.Role.Manager)
    })

    it("gets null", () => {
      const result = userRole.get(Fixture.userRoles, { userId: Fixture.clare.id, orgId: Fixture.acme.id })

      expect(result).to.be.null
    })

    it("sets", () => {
      const result = userRole.set(Fixture.userRoles, Fixture.Role.CEO, { userId: Fixture.anne.id, orgId: Fixture.acme.id })

      expect(result).to.deep.equal({ [Fixture.anne.id]: { [Fixture.acme.id]: Fixture.Role.CEO } })
    })
  })

  describe("composed with Converter", () => {
    const userNames = userById.compose(userName)
    const userNamesAsList = userNames.compose(stringSplitter)

    it("gets", () => {
      const result = userNamesAsList.get(Fixture.users, { userId: Fixture.bob.id })

      expect(result).to.deep.equal(['b', 'o', 'b'])
    })

    it("gets null", () => {
      const result = userNamesAsList.get(Fixture.users, { userId: Fixture.clare.id })

      expect(result).to.be.null
    })

    it("sets", () => {
      const result = userNamesAsList.set(Fixture.users, ['b', 'i', 'l', 'l', 'y'], { userId: Fixture.bob.id })

      expect(result).to.deep.equal({ ...Fixture.users, [Fixture.bob.id]: { ...Fixture.bob, userName: "billy" } })
    })
  })

  describe("composed with MaybeConverter", () => {
    const userIds = userById.compose(userId)
    const userIdsAsNumbers = userIds.compose(stringToNum)

    it("gets", () => {
      const result = userIdsAsNumbers.get(Fixture.users, { userId: Fixture.anne.id })

      expect(result).to.equal(parseFloat(Fixture.anne.id))
    })
    
    it("gets null when the converter fails", () => {
      const result = userIdsAsNumbers.get(Fixture.users, { userId: Fixture.bob.id })

      expect(result).to.be.null
    })

    it("gets null when the selector fails", () => {
      const result = userIdsAsNumbers.get(Fixture.users, { userId: Fixture.clare.id })

      expect(result).to.be.null
    })

    it("sets", () => {
      const initialId = Fixture.anne.id
      const result = userIdsAsNumbers.set(Fixture.users, 2, { userId: Fixture.anne.id })

      expect(result).to.deep.equal({ ...Fixture.users, [initialId]: { ...Fixture.anne, id: "2" } })
    })
  })
})

describe("Converter", () => {
  it("converts", () => {
    const result = stringSplitter.convert(Fixture.bob.userName)

    expect(result).to.deep.equal(['b', 'o', 'b'])
  })

  it("converts back", () => {
    const result = stringSplitter.convertBack(['b', 'o', 'b'])

    expect(result).to.equal(Fixture.bob.userName)
  })

  describe("composed with Selector", () => {
    const tupleToCity = addressToTuple.invert().compose(city)

    it("gets", () => {
      const result = tupleToCity.get(["atlantis", "47L4 N715"])

      expect(result).to.equal("atlantis")
    })

    it("sets", () => {
      const result = tupleToCity.set(["atlantis", "47L4 N715"], "gotham")

      expect(result).to.deep.equal(["gotham", "47L4 N715"])
    })
  })

  describe("composed with MaybeSelector", () => {
    const userListById = userListToLookup.compose(userById)

    it("gets", () => {
      const result = userListById.get([Fixture.anne, Fixture.bob], { userId: Fixture.bob.id })

      expect(result).to.equal(Fixture.bob)
    })

    it("sets", () => {
      const result = userListById.set([Fixture.anne], Fixture.bob, { userId: Fixture.bob.id })

      expect(result).to.deep.equal([Fixture.anne, Fixture.bob])
    })
  })

  describe("composed with Converter", () => {
    const converter = stringSplitter.compose(stringSplitter.invert())

    it("converts", () => {
      const result = converter.convert("foo")

      expect(result).to.equal("foo")
    })

    it("converts back", () => {
      const result = converter.convertBack("foo")

      expect(result).to.equal("foo")
    })
  })

  describe("composed with MaybeConverter", () => {
    const listToNum = stringSplitter.invert().compose(stringToNum)
    
    it("converts", () => {
      const result = listToNum.convert(["1", "0"])
      
      expect(result).to.equal(10)
    })

    it("converts back", () => {
      const result = listToNum.convertBack(10)

      expect(result).to.deep.equal(["1", "0"])
    })
  })
})

describe("MaybeConverter", () => {
  it("converts", () => {
    const result = actualAddress.convert(Fixture.anne.address)

    expect(result).to.equal(Fixture.anneAddress)
  })

  it("converts to null", () => {
    const result = actualAddress.convert(Fixture.bob.address)

    expect(result).to.be.null
  })

  it("converts back", () => {
    const result = actualAddress.convertBack(Fixture.anneAddress)

    expect(result).to.equal(Fixture.anne.address)
  })

  describe("composed with Selector", () => {
    const actualCity = actualAddress.compose(city)

    it("gets", () => {
      const result = actualCity.get(Fixture.anneAddress)

      expect(result).to.equal(Fixture.anneAddress.city)
    })

    it("sets", () => {
      const result = actualCity.set(Fixture.anneAddress, "atlantis")

      expect(result).to.deep.equal({ ...Fixture.anneAddress, city: "atlantis" })
    })
  })

  describe("composed with MaybeSelector", () => {
    const firstCityLetter = city.compose(firstLetter)
    const selector = actualAddress.compose(firstCityLetter)

    it("gets", () => {
      const result = selector.get(Fixture.anneAddress)

      expect(result).to.equal("g")
    })

    it("gets null when converter fails", () => {
      const result = selector.get({ type: "notSupplied" })
      
      expect(result).to.be.null
    })

    it("gets null when selector fails", () => {
      const result = selector.get({ type: "address", city: "", postcode: "P057C0D3" })

      expect(result).to.be.null
    })

    it("sets", () => {
      const result = selector.set(Fixture.anneAddress, "b")

      expect(result).to.deep.equal({ ...Fixture.anneAddress, city: "botham" })
    })
  })

  describe("composed with Converter", () => {
    const converter = actualAddress.compose(addressToTuple)
    
    it("converts", () => {
      const result = converter.convert(Fixture.anneAddress)

      expect(result).to.deep.equal([Fixture.anneAddress.city, Fixture.anneAddress.postcode])
    })

    it("converts null when the converter fails", () => {
      const result = converter.convert({ type: "notSupplied" })

      expect(result).to.be.null
    })

    it("converts back", () => {
      const result = converter.convertBack(["atlantis", "47L4 N715"])

      expect(result).to.deep.equal({ type: "address", city: "atlantis", postcode: "47L4 N715" })
    })
  })

  describe("composed with MaybeConverter", () => {
    const notNullString = Biselect.choose<string | null, string>(notNull)
    const notNullNumber = notNullString.compose(stringToNum)

    it("converts", () => {
      const result = notNullNumber.convert("1")

      expect(result).to.equal(1)
    })

    it("converts null when the first converter fails", () => {
      const result = notNullNumber.convert(null)

      expect(result).to.be.null
    })

    it("converts null when the second converter fails", () => {
      const result = notNullNumber.convert("foo")

      expect(result).to.be.null
    })

    it("converts back", () => {
      const result = notNullNumber.convertBack(1)

      expect(result).to.equal("1")
    })
  })
})

describe("Root", () => {
  describe("prop", () => {
    it("returns nested props", () => {
      const selector = Biselect.from<Fixture.Root>().prop('userModule', 'users')
      const result = selector.get(Fixture.root)

      expect(result).to.equal(Fixture.root.userModule.users)
    })
  })
})

describe("DeepPartial", () => {
  describe("merge", () => {
    it("returns the argument if a string", () => {
      const result = DeepPartial.merge<string>("a", "b")

      expect(result).to.equal("b")
    })

    it("returns the argument if a number", () => {
      const result = DeepPartial.merge<number>(1, 2)

      expect(result).to.equal(2)
    })

    it("performs a shallow merge", () => {
      const result = DeepPartial.merge({ a: 1, b: 2 }, { b: 3 })

      expect(result).to.deep.equal({ a: 1, b: 3 })
    })

    it("performs a deep merge", () => {
      const result = DeepPartial.merge({ a: 1, b: { c: 3, d: 4 }}, { b: { c: 5 } })

      expect(result).to.deep.equal({ a: 1, b: { c: 5, d: 4 }})
    })
  })
})