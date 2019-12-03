# Flows

Flows is a library that aim to make writing code concept flow based.

## Why Flows?
Usually when writing code we need to build a good architecture in order to scale and maintain our code.
Nowadays the most common architectures are MVC like, while MVC is great it lack the ability to separate the code
to readable chunks which make the code harder to maintain and scale when the code grows larger.
A flow based approach can help keep the architecture clean, and easy to scale.
When writing in flow base architecture every action (function in flow) can stand by itself, this fact make the code separable which make him also easy to check, debug and develop.

## Installation

```
npm i @codeinkit/flows
```

## Quick Start

```js
const { Flows } = require('@codeinkit/flows');
const flows = new Flows();

function first_action(flowData) {
  console.log('action can do simple staff');
  const variable = 'all variable should be in the function scope (no state outside an action)';

  return {
    ...flowData,
    variable: 'returning object will move all the data to the next action in the flow'
  };
}

function second_action(flowData) {
  console.log(flowData.variable);
}

function third_action(flowData) {
  console.log('flowData is unique on each action therefore you need to add only serialize variable default serialization use JSON.stringify');
  
}

flows.register('flow_name', [first_action, second_action, third_action]);
flows.hook('pre_action', ({flowName, data, i, actionFn}) => {
  console.log(data);
});

flows.execute('flow_name', {});

```

## flows
there are 2 basic things you can do with flow, register and execute.

### Flow Registration
```js
// the flow name should always be a string
// the array in the second parameter is the list of action, each action is a function, 
// it's called action because it's a part of a flow.
// the flows library will execute the actions in order.
flows.register('flow_name', []);
```

### Flow Execution
```js
// the flow name should be a name that was registered, it the flow is not registered an error will occurs
// the second parameter is the initial data that pass to the first action
flows.execute('flow_name', {});
```

## actions
As we discussed earlier an action is a function that exists in flow.
action can be async, meaning it will return promise that resolve some data, if the promise reject and nothing catch the exception it will be available in the exception hook.

### action
An action have a data parameter, returning from action will move the data to the next action.
that data that we move through the action must be serializable with `JSON.stringify()`.

```js
function action(data) {

  return {__flows: {jump: 'other_flow'}};
}
```
action should always return an object if we want to jump to other flow we can use the `__flows` meta data to ask flows to jump.

## hooks

hook registration is done with
```js
flows.hook('hook_name', () => {});
```

there are 5 types of hooks pre_action, post_action, pre_flow, post_flow, exception.

  * pre_flow - run at the beginning of the flow `flows.hook('pre_flow', ({flowName, data}) => {});`
  * post_flow - run at the end of the flow `flows.hook('post_flow', ({flowName, data}) => {});`
  * pre_action - run at the beginning of each action `flows.hook('pre_action', ({flowName, i, actionFn, data}) => {});`
  * post_action - run at the end of each action  `flows.hook('post_action', ({flowName, i, actionFn, data}) => {});`
  * exception - run when exception accrue in action `flows.hook('exception', ({flowName, i, actionFn, data, error}) => {});`

the parameters that pass to the hooks are

  * flowName - a string represent the flow name
  * data - the data that pass from and to action
  * i - the index of the action in the flow
  * actionFn - the function of the action
  * error - the error of the exception

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)