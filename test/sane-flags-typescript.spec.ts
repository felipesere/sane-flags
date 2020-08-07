import * as saneFlags from "../index.js";
// import "../index.d.ts"
import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {  Source} from '../index.js'

use(chaiAsPromised)

describe('the sane-flags in typescript', () => {
  let config = {
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
  }
  it('can check if features are enabled', () => {
    let features = saneFlags.wrap(config)
    expect(features.isEnabled('dynamic_contact_form')).to.be.true
  })

  it('can check if features are disabled', () => {
    let features = saneFlags.wrap(config)
    expect(features.isEnabled('disabled_feature')).to.be.false
  })

  describe('supports external sources', () => {
    const naiveSource: Source = (flag) => flag.name === 'from_the_naive_source'

    const complexSource: Source = {
      isEnabled: (flag) => flag.name === 'from_the_complex_source'
    }

    const smallerConfig = {
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
    }

    it('as simple functions', () => {
      const featuresWithExtraSource = saneFlags.wrap(smallerConfig)
      expect(featuresWithExtraSource.isEnabled('from_the_naive_source')).to.be
        .true
    })

    it('as objects with an isEnabled function', () => {
      const featuresWithExtraSource = saneFlags.wrap(smallerConfig)
      expect(featuresWithExtraSource.isEnabled('from_the_complex_source')).to.be
        .true
    })
  })

  describe('environments', () => {
    const features = saneFlags.wrap({
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

  it('presents the state of all available features', () => {
    const features = saneFlags.wrap(config);
    expect(features.state()).to.have.deep.members([
      {
        name: 'dynamic_contact_form',
        enabled: true,
        description:
          'The new form that fills in form contacts from the current account'
      },
      {
        name: 'disabled_feature',
        enabled: false,
        description: 'The feature we are working on but have disabled'
      },
      { name: 'enabled_feature', enabled: true, description: 'This is on' },
      {
        name: 'cool_feature',
        enabled: false,
        description: 'The feature we are working on but have disabled'
      }
    ])
  })

  describe('supports tests by...', () => {
    it('...temporariliy enabling features', () => {
      const features = saneFlags.wrap(config);
      features.enabling('disabled_feature', () => {
        expect(features.isEnabled('disabled_feature')).to.eql(true)
      })
      expect(features.isEnabled('disabled_feature')).to.eql(false)
    })

    it('...temporariliy disabling features', () => {
      const features = saneFlags.wrap(config);
      features.disabling('enabled_feature', () => {
        expect(features.isEnabled('enabled_feature')).to.eql(false)
      })
      expect(features.isEnabled('enabled_feature')).to.eql(true)
    })

    it('...resetting feature when exceptions happen', () => {
      const features = saneFlags.wrap(config);
      expect(() =>
        features.enabling('disabled_feature', () => {
          throw Error('this should not have happend')
        })
      ).to.throw()
      expect(features.isEnabled('disabled_feature')).to.eql(false)
    })

    it('...resetting features when exceptions happen async code', async () => {
      const features = saneFlags.wrap(config);
      await expect(
        features.enablingAsync('disabled_feature', () => {
          throw new Error('this shoudl bubble up')
        })
      ).to.eventually.be.rejected

      expect(features.isEnabled('disabled_feature')).to.eql(false)
    })

    it('...temporarily enabling features around async functions', async () => {
      const features = saneFlags.wrap(config);
      let someFunctionHere = async () => features.isEnabled('disabled_feature')

      const wasItEnabled = await expect(
        features.enablingAsync('disabled_feature', async () => {
          return await someFunctionHere()
        })
      ).to.eventually.be.fulfilled

      expect(wasItEnabled).to.eql(true)
      expect(features.isEnabled('disabled_feature')).to.eql(false)
    })

    it('...temporarily disabling features around async functions', async () => {
      const features = saneFlags.wrap(config);
      let someFunctionHere = async () => features.isEnabled('enabled_feature')

      const wasItEnabled = await features.disablingAsync('enabled_feature', async () => {
        return await someFunctionHere()
      })

      expect(wasItEnabled).to.eql(false)
      expect(features.isEnabled('enabled_feature')).to.eql(true)
    })

    it('...allowing you to enable and disable multiple features at once', () => {
      const features = saneFlags.wrap(config);
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
