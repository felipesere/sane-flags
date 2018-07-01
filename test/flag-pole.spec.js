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

  it('will notify you when asked about unknown features', function() {
    expect( function () { features.isEnabled('unknown_feature') }).to.throw(
      "There is no feature named 'unknown_feature'. Check in your features file to see if there was a spelling mistake."
    )
  })
})
