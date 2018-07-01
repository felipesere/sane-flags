# Welcome to `Flag Pole`

Flag pole is a small, focused library to add feature flags to your application.

## Priorities and Values

_You should be able to see all the available feature flags._

Because there might be subtle interactions between multiple flags, its key see what is available at any time.
This also allows you to better sunset flags.

## features.js

To make feature flags easyily discoverable, I suggest having a file called something resembling feature.js.
This will hold all of your configuration and should be imported wherever you want to switch features on and off.

Here is an example `features.js` file:
```javascript
var flagPole = require('flagPole')

var features = flagpole.wrap({
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
var flagPole = require('flagPole')

module.exports = flagpole.wrap({
  flags: {
    dynamic_contact_form: {
      description: 'New contact form that dynamically fills form based on accounts contacts.',
      enabled: false
    }
  }
})

You should be able to import that file and check for flags:

```javascript
var features = require('./features')

if(features.isEnabled('dynamic_contact_form')) {
  // do something differently...
}

### Hook in alternative sources

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
