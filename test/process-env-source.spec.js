const saneFlags = require('..')

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

  const features = saneFlags.wrap(config)

  const settings = [
    { value: 1, expect_to_be: 'enabled' },
    { value: true, expect_to_be: 'enabled' },
    { value: 0, expect_to_be: 'disabled' },
    { value: false, expect_to_be: 'disabled' }
  ]

  for (const { value, expect_to_be } of settings) {
    it(`treats a value of ${value} as '${expect_to_be}'`, () => {
      const expectation = (n) => n === (expect_to_be === 'enabled')

      set('THIS_IS_THE_FLAG', { is: value }, () => {
        expect(features.isEnabled('really_cool_feature')).to.satisfy(
          expectation
        )
      })
    })
  }
})

const set = (flag, { is: value }, closure) => {
  process.env[flag] = value
  closure()
  delete process.env[flag]
}
