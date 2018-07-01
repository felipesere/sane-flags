const flagPole = require('../index')

describe('the flag pole', () => {
  let features

  beforeEach(() => {
    features = flagPole.wrap({
      flags: {
        dynamic_contact_form: {
          description:
            'The new form that fills in form contacts from the current account',
          enabled: true
        },

        disabled_feature: {
          description: 'The featuer we are working on but have disabled',
          enabled: false
        }
      }
    })
  })

  it('can check if features are enabled', () => {
    expect(features.isEnabled('dynamic_contact_form')).to.be.true
  })

  it('can check if features are disabled', () => {
    expect(features.isEnabled('disabled_feature')).to.be.false
  })

  it('will notify you when asked about unknown features', () => {
    expect(() => {
      features.isEnabled('unknown_feature')
    }).to.throw(
      "There is no feature named 'unknown_feature'. Check in your features file to see if there was a spelling mistake."
    )
  })

  describe('supports external sources', () => {
    let featuresWithExtraSource

    const naiveSource = (flag) => flag.name === 'from_the_naive_source'

    const complexSource = {
      isEnabled: (flag) => flag.name === 'from_the_complex_source'
    }

    beforeEach(() => {
      featuresWithExtraSource = flagPole.wrap({
        flags: {
          from_the_naive_source: {
            description: 'A flag that is enabled by a simple functipon'
          },

          from_the_complex_source: {
            description: 'A flag that is enabled by a complex object'
          }
        },
        sources: [naiveSource, complexSource]
      })
    })

    it('as simple functions', () => {
      expect(featuresWithExtraSource.isEnabled('from_the_naive_source')).to.be
        .true
    })

    it('as objects with an isEnabled function', () => {
      expect(featuresWithExtraSource.isEnabled('from_the_complex_source')).to.be
        .true
    })
  })

  describe('environments', () => {
    const features = flagPole.wrap({
      flags: {
        enabled_in_dev: {
          description: 'This feature should only be turned in in development',
          enabled: {
            dev: true
          }
        },
        enabled_in_qa: {
          description: 'This is only on in QA',
          enabled: {
            dev: false,
            qa: true
          }
        },
        always_on: {
          description: 'Evergreen feature',
          enabled: true
        }
      },
      environments: {
        current: 'dev'
      }
    })

    it('allow you to have different settings for different environments', () => {
      expect(features.isEnabled('enabled_in_dev')).to.be.true
      expect(features.isEnabled('always_on')).to.be.true
      expect(features.isEnabled('enabled_in_qa')).to.be.false
    })
  })

  describe.only('fails with a consistency error when...', () => {
    it('...a flag is missing a description', () => {
      const config = {
        flags: {
          has_no_description: {
            enabled: true
          }
        }
      }

      expect(() => flagPole.wrap(config)).to.throw('')
    })

    it('...flag is configured for an unknown environment')
  })
})
