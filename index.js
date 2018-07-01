module.exports = {
  wrap: function(config) {
    return {
      flags: config.flags,
      isEnabled: function(flagName) {
        flag = this.flags[flagName]
        return flag.enabled
      }
    }
  }
}
