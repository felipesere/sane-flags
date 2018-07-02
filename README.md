[![Build Status](https://travis-ci.org/felipesere/flag-pole.svg?branch=master)](https://travis-ci.org/felipesere/flag-pole)

# Welcome to `Flag Pole`

Flag pole is a small, focused library to add feature flags to your application.

## Be Explicit

_You should be able to see all the available feature flags._

Because there might be subtle interactions between multiple flags, its key see what is available at any time.
This also allows you to better sunset flags.

## features.js

To make feature flags easyily discoverable, it is recommended to have a file called something like `feature.js`.
This will hold all of your configuration and should be imported wherever you want to switch features on and off.

Here is an example `features.js` file:
```javascript
var flagPole = require('flag-pole')

var features = flagPole.wrap({
  flags: {
    dynamic_contact_form: {
      description: 'New contact form that dynamically fills form based on accounts contacts.',
      enabled: false
    }
  }
})
```

## Use cases

### Globally turn a feature on or off

When you want to ship a piece of code, without having it really running in production.
This makes super sense if you practice continuos integration.

Given the following file containing all your features flags:

```javascript
var flagPole = require('flag-pole')

module.exports = flagPole.wrap({
  flags: {
    dynamic_contact_form: {
      description: 'New contact form that dynamically fills form based on accounts contacts.',
      enabled: false
    }
  }
})
```

You should be able to import that file and check for flags:

```javascript
var features = require('./features')

if(features.isEnabled('dynamic_contact_form')) {
  // do something differently...
}
```

### Hook into alternative sources

Maybe you load a configuration from a remote system or the user can switch flags on and off at runtime.
For these cases, flag-pole allows you to hook in alternative `sources`.
These sources can be a simple function that gets a flag definition or an object that has a function called `isEnabled` and takes a flag defintion:

```javascript
var naiveSource = function(flag) {
  // some way to define if flag should be on
}

var complexSource = {
  isEnabled: function(flag) {
    // some way to define if flag should be on
  }
}
```

Its important that the entire `flag` object is passed in as an argument.
This forces you to define those flags and maintain our core principle: make flags explicit.
It also gives you the flexibility to add any attributues to the flag definition that you need to check them against a source.

See the `process environemnt flag` source.

### Handling different environments

Sometimes you want to have features enabled in lower environments but keep them off in others.
For such cases, `flag-pole` supports an `environments` key in the configuration and more complex values for `enabled`.
In the spirit of our explicit configuration, you will have to list all available environemnts and declare which one you are in:

```javascript
module.exports = flagPole.wrap({
  flags: {
    dynamic_contact_form: {
      description: 'New contact form that dynamically fills form based on accounts contacts.',
      enabled: {
        dev: true,
        qa: false,
        prod: false
      }
    }
  },
  environments: {
    available: ['dev', 'qa', 'prod'],
    current: process.env.APPLICATION_ENV
  }
})
```

To be able to ensure consistency, any key underneath `enabled` must be present in `environments.available`.
Using `process.env.APPLICATION_ENV` is just an example here.


## Consistency

`flag-pole` is fairly strict in what it expects to see in your configuration.
Every flag MUST have a `description` and an `enabled` key.
To use the per-environemnt configuration of enabled, you MUST declare the available environments in the `environments` key.
Failure to do so will throw an error when calling `wrap(config)` to avoid odd behaviour and enforce good practices as far as possible.

## Extras

### Flags from process environemnt

If you want to enable flags using the process environemnt, you can hook in the source provided by `flag-pole` and configure the flags with an extra property `environment_flag`:

```javascript
const features = flagPole.wrap({
  flags: {
    really_cool_feature: {
      description: 'a feature which will be activated with a process variable',
      enabled: false,
      environment_flag: 'THIS_IS_THE_FLAG'
    }
  },
  sources: [flagPole.sources.processEnvSource]
})
```

Using a separate key to name the process environemnt flag to look for ensures your feature names are not coupled to a naming convention from the processes.
