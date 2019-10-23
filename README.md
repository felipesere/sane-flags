[![Build Status](https://travis-ci.org/felipesere/sane-flags.svg?branch=master)](https://travis-ci.org/felipesere/sane-flags)
[![Coverage Status](https://coveralls.io/repos/github/felipesere/sane-flags/badge.svg?branch=master)](https://coveralls.io/github/felipesere/sane-flags?branch=master)
[![npm version](https://badge.fury.io/js/sane-flags.svg)](https://badge.fury.io/js/sane-flags)
[![npm dependencies](https://david-dm.org/felipesere/sane-flags.svg)](https://david-dm.org/felipesere/sane-flags.svg)

# Welcome to `Sane Flags`

`Sane flags` is a small, focused library to add feature flags to your JavaScript application.

## Be Explicit

_You should be able to see all the available feature flags._

Because there might be subtle interactions between multiple flags, its key see what is available at any time.
This also allows you to better sunset flags.

## features.js

To make feature flags easyily discoverable, it is recommended to have a file called something like `feature.js`.
This will hold all of your configuration and should be imported wherever you want to switch features on and off.

Here is an example `features.js` file:
```javascript
var saneFlags = require('sane-flags')

var features = saneFlags.wrap({
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
This makes super sense if you practice continuous integration.

Given the following file containing all your features flags:

```javascript
var saneFlags = require('sane-flags')

module.exports = saneFlags.wrap({
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
For these cases, sane-flags allows you to hook in alternative `sources`.
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

```javascript
module.exports = saneFlags.wrap({
  flags: {
    dynamic_contact_form: {
      description: 'New contact form that dynamically fills form based on accounts contacts.',
      enabled: false
    }
  },
  sources: [complexSource]
})
```

Its important that the entire `flag` object is passed in as an argument.
This forces you to define those flags and maintain our core principle: make flags explicit.
It also gives you the flexibility to add any attributues to the flag definition that you need to check them against a source.

See the [process environment flag](#flags-from-process-environment) source.

### Handling different environments

Sometimes you want to have features enabled in lower environments but keep them off in others.
For such cases, `sane-flags` supports an `environments` key in the configuration and more complex values for `enabled`.
In the spirit of our explicit configuration, you will have to list all available environments and declare which one you are in:

```javascript
module.exports = saneFlags.wrap({
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

## Consistency and Explicitness

`sane-flags` is fairly strict in what it expects to see in your configuration.
Every flag MUST have a `description` and an `enabled` key.
To use the per-environment configuration of enabled, you MUST declare the available environments in the `environments` key.
Failure to do so will throw an error when calling `wrap(config)` to avoid odd behaviour and enforce good practices as far as possible.


## Insight

Sane-flags is able to tell you at any point in time what the state of feature flags are.
This is valuable for example when booting a service and printing the state of the flags to the console.

Given:
```javascript
features = saneFlags.wrap({
  flags: {
    dynamic_contact_form: {
      description:
        'The new form that fills in form contacts from the current account',
      enabled: true
    },

    disabled_feature: {
      description: 'The feature we are working on but have disabled',
      enabled: false
    },
    cool_feature: {
      description: 'The feature we are working on but have disabled',
      enabled: {
        dev: true,
        qa: false
      }
    }
  },
  environments: {
    available: ["dev", "qa"],
    current: "qa"
  }
})
```

Then `.state()` will print a JSON representation that you could turn into a table:

```
features.state() // => [{name: 'dynamic_contact_form', enabled: true, description: '...'}, {name: 'disabled_feature', enabled: false, description: '...'}, ... ]
```

## Feature flags and tests

While developing a new feature that is hidden behind a flag, it makes sense to temporarliy switch it on for specific unit tests.
`sane-flags` provides to helper functions that take a closure  in which a certain flag can be enabled.
Once the closure is complete, `sane-flags` will disable the feature again to ensure there is no test pollution.

Here are examples directly from the test suite:

Synchronous:
```javascript
features.enabling('disabled_feature', () => {
  expect(features.isEnabled('disabled_feature')).to.eql(true)
})
expect(features.isEnabled('disabled_feature')).to.eql(false)
```

Async/Await:
```javascript
await features.enablingAsync('disabled_feature', async () => {
  wasItEnabled = await someFunctionHere()
})
```

Should your closure throw an exception then `sane-flags` will correctly disable the feature again and rethrow the error.

There will be times where you either want to enable/disable combinations of features, possible across multiple tests.
For that case there is a `testBox` inspired by Sinons `sandbox`.
You can enable/disable multiple features on a `testBox` and reset them all at once:

```javascript
const box = features.testBox()
box.enable('disabled_feature')
box.disable('enabled_feature')

expect(features.isEnabled('disabled_feature')).to.eql(true)
expect(features.isEnabled('enabled_feature')).to.eql(false)

box.reset()

expect(features.isEnabled('disabled_feature')).to.eql(false)
expect(features.isEnabled('enabled_feature')).to.eql(true)
```

## Extras

### Flags from process environment

If you want to enable flags using the process environment, you can hook in the source provided by `sane-flags` and configure the flags with an extra property `environment_flag`:

```javascript
const features = saneFlags.wrap({
  flags: {
    really_cool_feature: {
      description: 'a feature which will be activated with a process variable',
      enabled: false,
      environment_flag: 'THIS_IS_THE_FLAG'
    }
  },
  sources: [saneFlags.sources.processEnvSource]
})
```

Using a separate key to name the process environment flag to look for ensures your feature names are not coupled to a naming convention from the processes.

Flags will be enabled if the environment varibale has a value of '1' or 'true'.


## Making a new release.

Use `npx np`. That simple.
