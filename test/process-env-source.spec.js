const saneFlags = require('../index')

describe('the process env source', () => {
  const config = {
    flags: {
      really_cool_feature: {
        description:
          'a feature which will be activated with a process variable',
        enabled: false,
        environment_flag: 'THIS_IS_THE_FLAG'
      }
    },
    sources: [saneFlags.sources.processEnvSource]
  }

  it("enables flags based on the 'environment_flag' key", () => {
    features = saneFlags.wrap(config)

    process.env['THIS_IS_THE_FLAG'] = 1
    expect(features.isEnabled('really_cool_feature')).to.be.true
    delete process.env['THIS_IS_THE_FLAG']
    expect(features.isEnabled('really_cool_feature')).to.be.false
  })
})
