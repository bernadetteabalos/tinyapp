const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user object with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = testUsers['userRandomID']
    assert.equal(user, expectedUserID);
  });

  it('should return undefined when a email is non-existent', function() {
    const user = getUserByEmail("poop@example.com", testUsers)
    assert.equal(user, undefined);
  });

});