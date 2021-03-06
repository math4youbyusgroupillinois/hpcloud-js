/* ============================================================================
(c) Copyright 2013 Hewlett-Packard Development Company, L.P.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights to
use, copy, modify, merge,publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
============================================================================ */

var assert = require('assert');
var IdentityServices = require('../lib/identityservices');
var Identity = require('../lib/identity');
var conf = require('./config');
var Decoder = require('string_decoder');
//var Buffer = require('buffer');

assert.notEqual(0, conf.identity.endpoint.length);

var idservice = new IdentityServices(conf.identity.endpoint);

var opts = {
  apiAccessKeyCredentials: {
    accessKey: conf.identity.account,
    secretKey: conf.identity.secret
  },
  tenantId: conf.identity.tenantid
};

console.log("Test IdentityServices.authenticate().");
idservice.authenticate(opts, function (e, identity) {

  if (e) {
    console.log('Identification failed: %d, %s', arguments[1], arguments[2]);
    assert.ok(false);
    return;
  }

  assert.equal(identity.tenantId(), conf.identity.tenantid);
  //assert.equal(identity.tenantName(), conf.identity.tenantname);
  assert.equal(identity.user().name, conf.identity.username);
  assert.ok(0 < identity.serviceCatalog().length);
  assert.ok(identity.tenantName().length > 0);
  assert.ok(identity.token().length > 0);

  var region = 'region-a.geo-1';
  assert.equal(region, identity.serviceByName('object-store', region).region);

  region = 'az-2.region-a.geo-1';
  assert.equal(region, identity.serviceByName('compute', region).region);

  try {
    assert.fail(identity.serviceByName('No-Such-Service'));
  } catch (e) {
    //
  }

});

/**
 * Test authenticating as a User.
 */
var idservice_testAccountAuth = new IdentityServices(conf.identity.endpoint);

console.log("Test IdentityServices.authenticateAsUser().");
idservice_testAccountAuth.setTenantId(conf.identity.tenantid).authenticateAsUser(conf.identity.username, conf.identity.password, function (e, identity) {

  if (e) {
    console.log('Identification failed: %d, %s', arguments[1], arguments[2]);
    assert.ok(false);
    return;
  }


  assert.equal(identity.tenantId(), conf.identity.tenantid);
  //assert.equal(identity.tenantName(), conf.identity.tenantname);
  assert.equal(identity.user().name, conf.identity.username);
  assert.ok(0 < identity.serviceCatalog().length);
  assert.ok(identity.tenantName().length > 0);
  assert.ok(identity.token().length > 0);

  var idservice_Tenants = new IdentityServices(conf.identity.endpoint);

  idservice_Tenants.tenants(identity, function (e, tenants) {
    assert.ok(tenants.length > 0);
  });
});

console.log("Test IdentityServices.authenticateAsAccount().");
var idservice_testUserAuth = new IdentityServices(conf.identity.endpoint);
idservice_testUserAuth
  .setTenantId(conf.identity.tenantid)
  .authenticateAsAccount(conf.identity.account, conf.identity.secret, function (e, identity) {

  if (e) {
    console.log('Identification failed: %d, %s', arguments[1], arguments[2]);
    assert.ok(false);
    return;
  }


  assert.equal(identity.tenantId(), conf.identity.tenantid);
  //assert.equal(identity.tenantName(), conf.identity.tenantname);
  assert.equal(identity.user().name, conf.identity.username);
  assert.ok(0 < identity.serviceCatalog().length);
  assert.ok(identity.tenantName().length > 0);
  assert.ok(identity.token().length > 0);

  assert.ok(identity.roles().length > 2);
});

console.log('Test IdentityServices.rescope().');

var rescope_opts = {
  apiAccessKeyCredentials: {
    accessKey: conf.identity.account,
    secretKey: conf.identity.secret
  },
  //tenantId: conf.identity.tenantid
};
var idservice_rescope = new IdentityServices(conf.identity.endpoint);
idservice_rescope.authenticate(rescope_opts, function (e, identity) {

  // Make sure tenant isn't set already:
  assert.equal(undefined, identity.tenantId());

  // Test the rescope.
  idservice_rescope.setTenantId(conf.identity.tenantid).rescope(identity, function (e, newident){
    //assert.equal(identity.tenantName(), conf.identity.tenantname);
    assert.equal(newident.user().name, conf.identity.username);
    assert.ok(0 < newident.serviceCatalog().length);
    assert.ok(newident.tenantName().length > 0);
    assert.ok(newident.token().length > 0);
    assert.equal(newident.tenantId(), conf.identity.tenantid);
  });

});
