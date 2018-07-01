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

const missing = (flagName) => {
  throw `There is no feature named '${flagName}'. Check in your features file to see if there was a spelling mistake.`
}

module.exports = {
  wrap: (config) => {
    for (const flagName in config.flags) {
      if (!config.flags[flagName].hasOwnProperty('description')) {
        throw `The feature flag ${flagName} did not have a 'description'. Please ensure you describe a feature flag in a few words to allow fellow engineers to avoid guessing`
      }
    }

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
          missing(flagName)
        }
      }
    }
  },
  sources: {
    processEnvSource: (flag) => process.env[flag.environment_flag]
  }
}
