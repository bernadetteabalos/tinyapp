const express = require("express");
const app = express();
var cookieParser = require('cookie-parser')
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
const { response } = require("express");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const users = { 
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
}

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "b2xVn2"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "9sm5xK"
  }
}

const userExists = (email) => {
  for (key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return false;
}

const findUrlByUser = (userID, object) => {
  let result = {};
  for (let key of Object.keys(object)) {
    if (object[key].userID === userID) {
      result[key] = object[key];
    }
  }
  return result; 
};

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// })

app.get("/urls", (req, res) => {
  if (!req.cookies['user_id']) {
  res.render('urls_index', {user: "", urls: ""})
  return;
  }
  const templateVars = { user: users[req.cookies["user_id"]], urls: findUrlByUser(users[req.cookies["user_id"]].id, urlDatabase)};
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  if (!templateVars.user) {
    res.redirect('/login');
  }  else {
  res.render("urls_new", templateVars)
  }
});

//Registration page
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], email: req.body.email, password: req.body.password }
  if (templateVars.user) {
    res.redirect('/urls');
  }  else {
    res.render("registration", templateVars);
  }
});

//New URL
app.post("/urls", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], email: req.body.email, password: req.body.password }
  if (!templateVars.user) {
    res.status(401).send('You must be logged in to do that.');
    res.render(templateVars);
  }  else {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL
  urlDatabase[shortURL] = {longURL, userID: templateVars.user.id }
  res.redirect(`/urls/${shortURL}`);
  }
})

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  console.log(urlDatabase[req.params.shortURL].userID)
  console.log(templateVars);
  if (!templateVars.user || (urlDatabase[req.params.shortURL].userID !== templateVars.user.id)) {
    res.status(403).send('This TinyURL does not belong to you.')
    return;
  }
  res.render("urls_show", templateVars);
})
//When clicking short url, redirect to long url
app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(403).send('This TinyURL does not exist.')
    return;
  }
  const templateVars = { user: users[req.cookies["user_id"]] }
  const longURL = urlDatabase[req.params.shortURL].longURL
  res.redirect(longURL), templateVars;
})
//Delete
app.post('/urls/:shortURL/delete', (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], email: req.body.email, password: req.body.password }
  if (!templateVars.user || (urlDatabase[req.params.shortURL].userID !== templateVars.user.id)) {
    res.status(403).send('You may not delete. This TinyURL does not belong to you.')
    return;
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
})
//Edit
app.post('/urls/:shortURL', (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], email: req.body.email, password: req.body.password }
  if (!templateVars.user || (urlDatabase[req.params.shortURL].userID !== templateVars.user.id)) {
    res.status(403).send('You may not edit. This TinyURL does not belong to you.')
    return;
  }
  const shortURL = req.params.shortURL
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL, userID: templateVars.user.id }
  res.redirect(`/urls/${shortURL}`);
})

//Register
app.post('/register', (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send('Invalid email or password.')
  } else if (userExists(req.body.email)) {
    res.status(400).send("Email already exists.");
  } else {
    const newUser = generateRandomString();
    users[newUser] = {};
    users[newUser]['id'] = newUser
    users[newUser]['email'] = req.body.email
    const password = req.body.password
    const hashedPassword = bcrypt.hashSync(password, salt);
    users[newUser]['password'] = hashedPassword
    res.cookie('user_id', newUser);
    console.log(users);
    res.redirect('/urls');
  }
})

//LoginPage
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], email: req.body.email, password: req.body.password }
  if (templateVars.user) {
    res.redirect('/urls');
  } else {
  res.render("login", templateVars);
  }
});

//Login
app.post('/login', (req, res) => {
  console.log(users);
  const { email, password } = req.body
  // console.log(password);
  // console.log(userExists((req.body.email)).password)
  if (!userExists((req.body.email))) {
    res.status(403).send('Email not registered.')
  } else if (userExists((req.body.email)) && !bcrypt.compareSync(password, userExists((req.body.email)).password)) {
    res.status(403).send('Password is incorrect.');
  }
  res.cookie('user_id', userExists((req.body.email)).id);
  res.redirect('/urls');
})

//Logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id', userExists((req.body.email)).id);
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString(length=6){
  return Math.random().toString(20).substr(2, length)
}