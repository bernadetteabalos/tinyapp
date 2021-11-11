

const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

const findUrlByUser = (userID, object) => {
  let result = {};
  for (let key of Object.keys(object)) {
    if (object[key].userID === userID) {
      result[key] = object[key];
    }
  }
  return result; 
};

function generateRandomString(length=6){
  return Math.random().toString(20).substr(2, length)
}
module.exports = { getUserByEmail, findUrlByUser, generateRandomString }