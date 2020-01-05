<p align="center">
  <a href="" rel="noopener">
    
  </a>
</p>

<h3 align="center">@codeinkit/flows</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/codeinkit/flows.svg)](https://github.com/codeinkit/flows/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/codeinkit/flows.svg)](https://github.com/codeinkit/flows/pulls)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://choosealicense.com/licenses/mit/)

</div>

---

<p align="center"> 
  Flows is a library that aim to make writing code concept flow based.
  <br> 
</p>

## 📝 Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Deployment](#deployment)
- [Usage](#usage)
- [Built Using](#built_using)
- [Contributing](#contributing)
- [Authors](#authors)
- [Acknowledgments](#acknowledgement)

## 🧐 About <a name = "about"></a>

When writing code we want to build a good architecture in order to scale and maintain our code.

Nowadays the most common architectures are MVC-like (Model View Controller).

MVC is great, but it lacks the ability to separate the code to readable chunks, which makes the code harder to maintain and scale when it grows larger.

A flow based approach can help keep the architecture clean, and easy to scale.

When writing in flow base architecture every action (function in flow) can stand by itself, this fact makes the code separable which also makes it also easy to check, debug and develop.

## 🏁 Getting Started <a name = "getting_started"></a>
### Prerequisites

[NodeJS](https://nodejs.org/)

### Installing

```
npm i @codeinkit/flows
```

## 🔧 Running the tests <a name = "tests"></a>

```
npm test
```
### Example

```js
const { Flows } = require('@codeinkit/flows');

//create the flow
const flows = new Flows();

//first action
function first_action(flowData) {
  console.log('action can do simple staff');
  const variable = 'all variable should be in the function scope (no state outside an action)';
  return {
    ...flowData,
    variable: 'returning object will move all the data to the next action in the flow'
  };
}

//second action
function second_action(flowData) {
  console.log(flowData.variable);
  //this function will throw an exception since it doesn't return an object
  //return {...flowData}
}

//third action
function third_action(flowData) {
  console.log('flowData is unique on each action therefore you need to add only serialize variable default serialization use JSON.stringify');
  return {message:'done'};
}

//register the functions to the flow
flows.register('flow_name', [first_action, second_action, third_action]);

//register a 'pre_action' hook that will printout the input of each function
flows.hook('pre_action', ({flowName, input, output, i, actionFn, error}) => {
  console.log(input);
});

//register an 'exception' hook that will printout the error
flows.hook('exception', ({flowName, input, output, i, actionFn, error}) => {
  console.log(error);
});

//execute the flow
flows.execute('flow_name', {});

```

## 🎈 Usage <a name="usage"></a>
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

### Actions
An action is a function that exists in a flow.

An action can be async, meaning it will return promise that resolve some data. If the promise is rejected and nothing catches the exception it will be available in the exception hook.

An action gets data through the 'data' parameter. That data is the data returned from the previous action (or from the flow execution command, if this is the first action).

Actions are required to return an object when it is done (that will be sent to the next action).
The returned data must be serializable with `JSON.stringify()`.

### The __flows object
When returning a data object from an action, the action can also pass execution instructions to the flow.
It does that by adding a "__flows" object to the returned object.

The __flows object supports the following:

  * done - boolean - indicates to the flow execution to end the flow
  * jump - string - the name of another flow to jump to

#### done example
```js
function action(data) {
  return {__flows: {done: true}};
}
```

#### jump example
```js
function action(data) {
  return {__flows: {jump: 'other_flow'}};
}
```

### Hooks

hook registration is done with
```js
flows.hook('hook_name', () => {});
```

there are 5 types of hooks pre_action, post_action, pre_flow, post_flow, exception.

  * pre_flow - run at the beginning of the flow `flows.hook('pre_flow', ({flowName, input}) => {});`
  * post_flow - run at the end of the flow `flows.hook('post_flow', ({flowName, output}) => {});`
  * pre_action - run at the beginning of each action `flows.hook('pre_action', ({flowName, i, actionFn, input}) => {});`
  * post_action - run at the end of each action  `flows.hook('post_action', ({flowName, i, actionFn, input, output}) => {});`
  * exception - run when exception accrue in action `flows.hook('exception', ({flowName, i, actionFn, input, error}) => {});`

the parameters that pass to the hooks are

  * flowName - a string represent the flow name
  * input - the object provided to the action
  * output - the object returned by the action
  * i - the index of the action in the flow
  * actionFn - the function of the action
  * error - the error of the exception

## ✍️ Authors <a name = "authors"></a>

- [@amitmtrn](https://github.com/amitmtrn) - Idea & Initial work

## Contributing <a name="contributing"></a>

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

