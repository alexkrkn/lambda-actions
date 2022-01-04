![lambda action](assets/cover.png)

# Installation

```
$ npm i lambda-actions --save
```

# Usage

**`/actions.ts`**
```ts
export const sayHello = (payload) => {
  return { say: `Hello ${payload.names.join(' and ')}!` };
};

export const sayGoodbye = (payload) => {
  return { say: `Goodbye ${payload.name}` };
};
```

**`/index.ts`**
```ts
import { sayHello, sayGoodbye } from './actions';

export const async handler = (event) => {

  // init
  const router = new LambdaActions();

  // register actions
  router.action('say_hello', sayHello);
  // RegExp is also ok
  router.action(/say_(goodbye|ciao|pokedova)/, sayGoodbye);

  // fire an action
  return router.fire({
    action: event.action,
    payload: event.payload,
  });

};
```