/* lodash custom build to load only the functions in use, to obtain
 * a smaller BootstrapMenu build size. */

 function lodash() {
  throw new Error('Custom lodash build for BootstrapMenu build. lodash chaining is not included');
}

lodash.noop = require('_lodash/utility/noop');
lodash.each = require('_lodash/collection/each');
lodash.contains = require('_lodash/collection/contains');
lodash.extend = require('_lodash/object/extend');
lodash.uniqueId = require('_lodash/utility/uniqueId');
lodash.isFunction = require('_lodash/lang/isFunction');

module.exports = lodash;
