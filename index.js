module.exports = {
  wrap: function(config) {
    return {
      flags: config.flags,
      isEnabled: function(flagName) {
        flag = this.flags[flagName]
        if (flag ) {
          return flag.enabled
        } else {
          throw `There is no feature named '${flagName}'. Check in your features file to see if there was a spelling mistake.`
        }
      }
    }
  }
}
