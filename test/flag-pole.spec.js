var flagPole = require('../index')

describe('the flag pole', function () {
  var features

  beforeEach(function () {
    features = flagPole.wrap({
      flags: {
        dynamic_contact_form: {
          enabled: true
        },

        disabled_feature: {
          enabled: false
        }
      }
    })
  })

  it('can check if features are enabled', function() {
    expect(features.isEnabled('dynamic_contact_form')).to.be.true
  })

  it('can check if features are disabled', function() {
    expect(features.isEnabled('disabled_feature')).to.be.false
  })
})
