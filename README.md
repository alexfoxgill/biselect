# Biselect

Two-way selectors for Redux-like applications, TypeScript-first.

## Motivation

Redux store shape is defined by reducers - but the `connect` method in redux gives selectors the whole store to choose props from, meaning we need to duplicate the store shape there too. And in some cases, reducers use selectors to get the state of the store before modifying it.

Wouldn't it be easier if selectors defined the shape of the store, and let you modify as well as retrieve data?

## Examples

Select a property of an object:
```typescript
interface User {
  name: string
}
const nameSelector = Biselect.from<User>().prop('name')
const bond: User = { name: "Bond" }

nameSelector.get(bond) // "Bond"
nameSelector.set(bond, "James") // { name: "James" }
nameSelector.modify(bond, name => "James " + name) // { name: "James Bond" }
```

Select an object from a "dictionary" object:
```typescript
interface Users {
  [key: string]: User
}
const users: Users = {
  "007": { name: "James Bond" }
}

const userSelector = Biselect.from<Users>().index('userId')

userSelector.get(users, { userId: "007" }) // { name: "James Bond" }
userSelector.get(users, { userId: "006" }) // null
userSelector.set(users, { name: "Alec Trevelyan" }, { userId: "006" })
// { "007": { name: "James Bond" }, "006": { name: "Alec Trevelyan" } }
```

Compose the two together:
```typescript
const users: Users = {
  "006": { name: "Alec Trevelyan" },
  "007": { name: "James Bond" }
}

const userNameSelector = userSelector.compose(nameSelector)

userNameSelector.get(users, { userId: "007" }) // "James Bond"
userNameSelector.modify(users, name => name.split('').reverse().join(''), { userId: "007" })
// { "006": { name: { "Alec Trevelyan" }, "007": { name: "dnoB semaJ" }}
```

Or just chain functions:

```typescript
const userNameSelector = Biselect.from<Users>().indexBy('userId').prop('name')
```

## Isn't this just Lenses with another name?

Mostly. Lenses do not have a secondary "parameter" argument like Selectors do, and the general field of Optics is entrenched in opaque FP terminology. This library is an attempt to bridge the gap between useful functional concepts and the pragmatic needs of everyday programming.
