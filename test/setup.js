const chaiAsPromised = require('chai-as-promised')
const chai = require('chai')

chai.use(chaiAsPromised)

global.expect = chai.expect
