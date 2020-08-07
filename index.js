const errors = {
  unknown_feature: (flagName) =>
    `There is no feature named '${flagName}'. Check in your features file to see if there was a spelling mistake.`,
  missing_description: (flagName) =>
    `The feature flag ${flagName} did not have a 'description'. Please ensure you describe a feature flag in a few words to allow fellow engineers to avoid guessing`,
  missing_enabled: (flagName) =>
    `The feature flag ${flagName} has no key 'enabled'. It is a healthy practice to make statements about the state of the flag explicit. If you rely on a source to enable it, at least mark it as 'enabled: false' in the config.`,
  unknown_env_enabled: (flagName, envInFlag, configuredEnvs) =>
    `The feature flag ${flagName} is configured for ${envInFlag} that is not listed in environments.available: ${configuredEnvs}. Please check if this is an error.`,
  missing_environment: () =>
    'You need to configure which environments are available to your application under config.environments.available as an array of strings. This allows us to check your config for consistency'
}

const checkConsistency = (config) => {
  for (const flagName in config.flags) {
    const flag = config.flags[flagName]
    if (!flag.hasOwnProperty('description')) {
      throw errors.missing_description(flagName)
    }

    if (!flag.hasOwnProperty('enabled')) {
      throw errors.missing_enabled(flagName)
    }

    if (typeof flag.enabled === 'object') {
      if (config.environments) {
        const configuredEnvs = config.environments.available || []
        for (const envInFlag in flag.enabled) {
          if (!configuredEnvs.includes(envInFlag)) {
            throw errors.unknown_env_enabled(
              flagName,
              envInFlag,
              configuredEnvs
            )
          }
        }
      } else {
        throw errors.missing_environment()
      }
    }
  }
}

const checkSources = (sources, flag) => {
  for (const source of sources) {
    if (typeof source === 'function' && source(flag)) {
      return true
    }
    if (typeof source === 'object' && source.isEnabled(flag)) {
      return true
    }
  }
}

const hardEnabled = (environments, flag) => {
  if (typeof flag.enabled === 'boolean') {
    return flag.enabled
  }

  if (environments) {
    return flag.enabled[environments.current]
  }
}

module.exports = {
  wrap: (config) => {
    checkConsistency(config)
    const { flags, sources = [], environments = false } = config

    const toggle = (self, flagName, { to: value, around: closure }) => {
      const oldFlagValue = self.isEnabled(flagName)
      flags[flagName].enabled = value

      try {
        return closure()
      } finally {
        flags[flagName].enabled = oldFlagValue
      }
    }

    const toggleAsync = async (
      self,
      flagName,
      { to: value, around: closure }
    ) => {
      const oldFlagValue = self.isEnabled(flagName)
      flags[flagName].enabled = value

      try {
        return await closure()
      } finally {
        flags[flagName].enabled = oldFlagValue
      }
    }

    return {
      isEnabled: function(flagName) {
        const flag = flags[flagName]
        if (flag) {
          flag.name = flagName
          return (
            hardEnabled(environments, flag) ||
            checkSources(sources, flag) ||
            false
          )
        } else {
          throw errors.unknown_feature(flagName)
        }
      },

      state: function() {
        return Object.keys(flags).map((flagName) => {
          return {
            name: flagName,
            enabled: this.isEnabled(flagName),
            description: flags[flagName].description
          }
        })
      },

      enabling: function(flagName, closure) {
        return toggle(this, flagName, { to: true, around: closure })
      },

      disabling: function(flagName, closure) {
        return toggle(this, flagName, { to: false, around: closure })
      },

      enablingAsync: async function(flagName, closure) {
        return toggleAsync(this, flagName, { to: true, around: closure })
      },

      disablingAsync: async function(flagName, closure) {
        return toggleAsync(this, flagName, { to: false, around: closure })
      },

      testBox: function() {
        const features = this
        let changedFlags = []

        const set = (flagName, { to: value }) => {
          const isEnabled = features.isEnabled(flagName)
          changedFlags = changedFlags.concat({
            flag: flagName,
            originalValue: isEnabled
          })
          flags[flagName].enabled = value
        }

        return {
          enable: (flagName) => set(flagName, { to: true }),

          disable: (flagName) => set(flagName, { to: false }),

          reset: () => {
            changedFlags.forEach(
              ({ flag, originalValue }) => (flags[flag].enabled = originalValue)
            )

            changedFlags = []
          }
        }
      }
    }
  },
  sources: {
    processEnvSource: (flag) => {
      const value = process.env[flag.environment_flag]
      return value === '1' || value === 'true'
    }
  }
}
