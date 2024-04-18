const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const WebSocket = require('ws');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');

const userDataPath = './users.json';
const recipeDataPath = './recipe.txt';

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('Connected to WebSocket server!');
});

async function verifyPassword(username, password) {
  try {
    const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
    if (userData[username]) {
      return await bcrypt.compare(password, userData[username]);
    } else {
      return false;
    }
  } catch (err) {
    console.error('Error reading user data:', err);
    return false;
  }
}

app.get('/', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const isValid = await verifyPassword(username, password);

  if (isValid) {
    res.render('form');
  } else {
    res.send('Invalid username or password');
  }
});

app.post('/recipe', (req, res) => {
  const { dishName, imageMethod, ingredients, instructions } = req.body;

  if (!dishName || !imageMethod || !ingredients || !instructions) {
    return res.status(400).send('Моля, попълнете всички полета.');
  }

  const facultyNumber = '125402';
  const sum = dishName.length + imageMethod.length + ingredients.length + instructions.length + parseInt(facultyNumber);

  const recipeData = `${dishName}, ${imageMethod}, ${ingredients}, ${instructions}\n`;

  fs.appendFile(recipeDataPath, recipeData, (err) => {
    if (err) {
      console.error('Error saving recipe:', err);
      return res.status(500).send('Грешка при запазване на рецептата.');
    }
    res.send(`Добавената рецепта е: ${dishName}`);
  });
});

bcrypt.hash('125402', 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  console.log('Hashed password:', hash);
  
  const userData = { "boss": hash };
  fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
});

app.listen(port, () => {
  console.log(`Сървърът работи на http://localhost:${port}`);
});
