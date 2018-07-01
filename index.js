const checkSources = (sources, flag) => {
  for(const source of sources) {
    if (typeof source === 'function' && source(flag)) {
      return true
    }
    if (typeof source === 'object' && source.isEnabled(flag)) {
      return true
    }
  }
}

module.exports = {
  wrap: (config) => {
    return {
      flags: config.flags,
      sources: config.sources || [],

      isEnabled: function(flagName) {
        flag = this.flags[flagName]
        if (flag ) {
          flag.name = flagName
          return flag.enabled || checkSources(this.sources, flag) || false
        } else {
          throw `There is no feature named '${flagName}'. Check in your features file to see if there was a spelling mistake.`
        }
      }
    }
  }
}
