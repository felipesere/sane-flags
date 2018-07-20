var AsciiTable = require('ascii-table')

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

    return {
      flags: config.flags,
      sources: config.sources || [],
      environments: config.environments || false,

      isEnabled: function(flagName) {
        flag = this.flags[flagName]
        if (flag) {
          flag.name = flagName
          return (
            hardEnabled(this.environments, flag) ||
            checkSources(this.sources, flag) ||
            false
          )
        } else {
          throw errors.unknown_feature(flagName)
        }
      },

      summary: function() {
        const table = new AsciiTable('Tracked featurs')
        table.setHeading('name', 'description', 'enabled?')

        for (const flagName in this.flags) {
          const flag = this.flags[flagName]
          table.addRow(flagName, flag.description, this.isEnabled(flagName))
        }
        return table.toString()
      },

      enabling: function(flagName, closure) {
        const oldFlagValue = this.isEnabled(flagName)
        this.flags[flagName].enabled = true

        try {
          return closure()
        } finally {
          this.flags[flagName].enabled = oldFlagValue
        }
      },

      enablingAsync: async function(flagName, closure) {
        const oldFlagValue = this.isEnabled(flagName)
        this.flags[flagName].enabled = true

        try {
          return await closure()
        } finally {
          this.flags[flagName].enabled = oldFlagValue
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
