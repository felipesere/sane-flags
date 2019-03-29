import { Config, Flag, saneFlags, Wrapped } from '..'
import {expect} from 'chai'

describe('the sane flags', () => {
  let features: Wrapped

  beforeEach(() => {
    features = saneFlags.wrap({
      flags: {
        dynamic_contact_form: {
          description:
            'The new form that fills in form contacts from the current account',
          enabled: true
        },

        disabled_feature: {
          description: 'The feature we are working on but have disabled',
          enabled: false
        },
        enabled_feature: {
          description: 'This is on',
          enabled: true
        },
        cool_feature: {
          description: 'The feature we are working on but have disabled',
          enabled: {
            dev: true,
            qa: false
          }
        }
      },
      environments: {
        available: ['dev', 'qa'],
        current: 'qa'
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
    let featuresWithExtraSource: Wrapped

    const naiveSource = (flag: Flag) => flag.name === 'from_the_naive_source'

    const complexSource = {
      isEnabled: (flag: Flag) => flag.name === 'from_the_complex_source'
    }

    beforeEach(() => {
      featuresWithExtraSource = saneFlags.wrap({
        flags: {
          from_the_naive_source: {
            description: 'A flag that is enabled by a simple functipon',
            enabled: false
          },

          from_the_complex_source: {
            description: 'A flag that is enabled by a complex object',
            enabled: false
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
    const features: Wrapped = saneFlags.wrap({
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
        available: ['dev', 'qa'],
        current: 'dev'
      }
    })

    it('allow you to have different settings for different environments', () => {
      expect(features.isEnabled('enabled_in_dev')).to.be.true
      expect(features.isEnabled('always_on')).to.be.true
      expect(features.isEnabled('enabled_in_qa')).to.be.false
    })
  })

  describe('fails with a consistency error when...', () => {
    /*
    it('...a flag is missing a description', () => {
      const config: Config = {
        flags: {
          has_no_description: {
            enabled: true
          }
        }
      }

      expect(() => saneFlags.wrap(config)).to.throw('has_no_description')
    })

    it('...a flag is neither enabled nor disabled', () => {
      const config: Config = {
        flags: {
          is_it_enabled: {
            description: 'Is this feature really on?'
          }
        }
      }

      expect(() => saneFlags.wrap(config)).to.throw('is_it_enabled')
    })
    */

    it('...multiple environments are not listed as available', () => {
      const config: Config = {
        flags: {
          anything: {
            description: 'We dont know odd or dev yet',
            enabled: {
              dev: true
            }
          }
        }
      }

      expect(() => saneFlags.wrap(config)).to.throw(
        'You need to configure which environments'
      )
    })

    /*
    it('...a flag is configured for an unexpected environment', () => {
      const config: Config = {
        flags: {
          anything: {
            description: 'We dont know odd or dev yet',
            enabled: {
              odd: true
            }
          }
        },
        environments: {
          available: ['dev']
        }
      }

      expect(() => saneFlags.wrap(config)).to.throw('anything')
    })
  */
  })

  it('prints a table of your configuration', () => {
    const summary = features.summary()

    expect(summary).to.contain('dynamic_contact_form')
    expect(summary).to.contain('disabled_feature')
    expect(summary).to.match(/cool_feature.*false/)
  })

  it('presents the state of all available features', () => {
    expect(features.state()).to.have.deep.members([
      { name: 'dynamic_contact_form', enabled: true, description: 'The new form that fills in form contacts from the current account'},
      { name: 'disabled_feature', enabled: false, description: 'The feature we are working on but have disabled'},
      { name: 'enabled_feature', enabled: true, description: 'This is on'},
      { name: 'cool_feature', enabled: false, description: 'The feature we are working on but have disabled'}
    ])
  })

  describe('supports tests by...', () => {
    it('...temporariliy enabling features', () => {
      features.enabling('disabled_feature', () => {
        expect(features.isEnabled('disabled_feature')).to.eql(true)
        return true
      })
      expect(features.isEnabled('disabled_feature')).to.eql(false)
    })

    it('...temporariliy disabling features', () => {
      features.disabling('enabled_feature', () => {
        expect(features.isEnabled('enabled_feature')).to.eql(false)
        return true
      })
      expect(features.isEnabled('enabled_feature')).to.eql(true)
    })

    it('...resetting feature when exceptions happen', () => {
      expect(() =>
        features.enabling('disabled_feature', () => {
          throw Error('this should not have happend')
        })
      ).to.throw()
      expect(features.isEnabled('disabled_feature')).to.eql(false)
    })

    it('...resetting features when exceptions happen async code', async () => {
      await expect(
        features.enablingAsync('disabled_feature', () => {
          throw new Error('this shoudl bubble up')
        })
      ).to.eventually.be.rejected

      expect(features.isEnabled('disabled_feature')).to.eql(false)
    })

    it('...temporarily enabling features around async functions', async () => {
      let wasItEnabled = false
      let someFunctionHere = async () => features.isEnabled('disabled_feature')

      await expect(
        features.enablingAsync('disabled_feature', async () => {
          wasItEnabled = await someFunctionHere()
          return wasItEnabled
        })
      ).to.eventually.be.fulfilled

      expect(wasItEnabled).to.eql(true)
      expect(features.isEnabled('disabled_feature')).to.eql(false)
    })

    it('...temporarily disabling features around async functions', async () => {
      let wasItDisabled = true
      let someFunctionHere = async () => features.isEnabled('enabled_feature')

      await features.disablingAsync('enabled_feature', async () => {
        wasItDisabled = await someFunctionHere()
      })

      expect(wasItDisabled).to.eql(false)
      expect(features.isEnabled('enabled_feature')).to.eql(true)
    })

    it('...allowing you to enable and disable multiple features at once', () => {
      const box = features.testBox()
      box.enable('disabled_feature')
      box.disable('enabled_feature')

      expect(features.isEnabled('disabled_feature')).to.eql(true)
      expect(features.isEnabled('enabled_feature')).to.eql(false)

      box.reset()

      expect(features.isEnabled('disabled_feature')).to.eql(false)
      expect(features.isEnabled('enabled_feature')).to.eql(true)
    })
  })
})
