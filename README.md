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
import {flagpole} from 'flagpole'

export const features = flagpole.raise({
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

The file containing all your features

```javascript



```
