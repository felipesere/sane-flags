const flagPole = require('../index')

describe('the process env source', () => {
  const config = {
    flags: {
      really_cool_feature: {
        enabled: false,
        environment_flag: 'THIS_IS_THE_FLAG'
      }
    },
    sources: [flagPole.sources.processEnvSource]
  }

  it("enables flags based on the 'environment_flag' key", () => {
    features = flagPole.wrap(config)

    process.env['THIS_IS_THE_FLAG'] = 1
    expect(features.isEnabled('really_cool_feature')).to.be.true
    delete process.env['THIS_IS_THE_FLAG']
    expect(features.isEnabled('really_cool_feature')).to.be.false
  })
})
