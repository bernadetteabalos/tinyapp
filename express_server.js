//Required for intialization
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const cookieSession = require('cookie-session');
const { getUserByEmail, findUrlByUser, generateRandomString } = require('./helpers');

//Cookie Session
app.use(cookieSession({
  name: 'session',
  secret: 'this',

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//-----Test Users------
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
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "b2xVn2"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "9sm5xK"
  }
};

//Home
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  res.redirect('/login');
});

//List of urls
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).send('You must be logged in to see this page.');
    res.render('urls_index', {user: "", urls: ""});
    return;
  }
  const templateVars = { user: users[req.session.user_id], urls: findUrlByUser(users[req.session.user_id].id, urlDatabase)};
  res.render("urls_index", templateVars);
  
});

//New url page display
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (!templateVars.user) {
    res.redirect('/login');
    return;
  }
  res.render("urls_new", templateVars);
});

//Registration page display
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id], email: req.body.email, password: req.body.password };
  if (templateVars.user) {
    res.redirect('/urls');
  }  else {
    res.render("registration", templateVars);
  }
});

//New URL
app.post("/urls", (req, res) => {
  const templateVars = { user: users[req.session.user_id], email: req.body.email, password: req.body.password };
  if (!templateVars.user) {
    res.status(401).send('You must be logged in to do that.');
    res.render(templateVars);
  }  else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[shortURL] = {longURL, userID: templateVars.user.id };
    res.redirect(`/urls/${shortURL}`);
  }
});

//Short url page display
app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(403).send('This TinyURL does not exist.');
    return;
  }
  const templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  if (!templateVars.user || (urlDatabase[req.params.shortURL].userID !== templateVars.user.id)) {
    res.status(403).send('This TinyURL does not belong to you.');
    return;
  }
  res.render("urls_show", templateVars);
});
//When clicking short url, redirect to long url
app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(403).send('This TinyURL does not exist.');
    return;
  }
  const templateVars = { user: users[req.session.user_id] };
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL), templateVars;
});
//Delete
app.post('/urls/:shortURL/delete', (req, res) => {
  const templateVars = { user: users[req.session.user_id], email: req.body.email, password: req.body.password };
  if (!templateVars.user || (urlDatabase[req.params.shortURL].userID !== templateVars.user.id)) {
    res.status(403).send('You may not delete. This TinyURL does not belong to you.');
    return;
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});
//Edit
app.post('/urls/:shortURL', (req, res) => {
  const templateVars = { user: users[req.session.user_id], email: req.body.email, password: req.body.password };
  if (!templateVars.user || (urlDatabase[req.params.shortURL].userID !== templateVars.user.id)) {
    res.status(403).send('You may not edit. This TinyURL does not belong to you.');
    return;
  }
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL, userID: templateVars.user.id };
  res.redirect(`/urls/${shortURL}`);
});

//Register Functioning
app.post('/register', (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send('Invalid email or password.');
  } else if (getUserByEmail(req.body.email, users)) {
    res.status(400).send("Email already exists.");
  } else {
    const newUser = generateRandomString();
    users[newUser] = {};
    users[newUser]['id'] = newUser;
    users[newUser]['email'] = req.body.email;
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, salt);
    users[newUser]['password'] = hashedPassword;
    req.session.user_id = newUser;
    res.redirect('/urls');
  }
});

//Login Page Display
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.user_id], email: req.body.email, password: req.body.password };
  if (templateVars.user) {
    res.redirect('/urls');
  } else {
    res.render("login", templateVars);
  }
});

//Login Functioning
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!getUserByEmail(email, users)) {
    res.status(403).send('Email not registered.');
  } else if (getUserByEmail(email, users) && !bcrypt.compareSync(password, getUserByEmail(email, users).password)) {
    res.status(403).send('Password is incorrect.');
  }
  req.session.user_id = getUserByEmail(email, users).id;
  res.redirect('/urls');
});

//Logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

//Listening
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
