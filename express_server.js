const express = require("express");
const app = express();
var cookieParser = require('cookie-parser')
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
const { response } = require("express");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const userExists = (email) => {
  for (key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return false;
}

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// })

app.get("/urls", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render("urls_new", templateVars);
});

//Registration page
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], email: req.body.email, password: req.body.password }
  res.render("registration", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL
  urlDatabase[shortURL] = longURL
  res.redirect(`/urls/${shortURL}`);
})

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
})
//When clicking short url, redirect to long url
app.get('/u/:shortURL', (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL), templateVars;
})
//Delete
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
})
//Edit
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL
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
    users[newUser]['password'] = req.body.password
    res.cookie('user_id', newUser);
    console.log(users[newUser].email);
    res.redirect('/urls');
  }
})

//LoginPage
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], email: req.body.email, password: req.body.password }
  res.render("login", templateVars);
})

//Login
app.post('/login', (req, res) => {
  console.log(users);
  const { email, password } = req.body
  if (!userExists((req.body.email))) {
    res.status(403).send('Email not registered.')
  } else if (userExists((req.body.email)) && password !== userExists((req.body.email)).password) {
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