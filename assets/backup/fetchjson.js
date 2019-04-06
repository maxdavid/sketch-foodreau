const fs = require('fs');
const fetch = require('node-fetch');

const API_KEY = 'XXX';
const API_OPTIONS = { 'headers': { 'X-RapidAPI-Key': API_KEY } };

const JSON_KEYS = ['title','creditText','sourceUrl','image','instructions','extendedIngredients'];
const BACKUP_FILE = 'recipes.js'

const NUM_BACKUPS = 200;
const API_ENDPOINT = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/random?number=' + NUM_BACKUPS;

let JSON_OBJS = createObjs();

function createBackupRecipes () {
  fetch(API_ENDPOINT, API_OPTIONS)
    .then(res =>res.json())
    .then(json => {
      if (json.message) {
        return Promise.reject(json.message)
      } else if (typeof json.recipes !== 'undefined') {
        return json
      } else {
        return json
      }
    })
    .then(json => processResponse(json))
    .catch(err => console.log(err))
}

function processResponse(json) {

  json['recipes'].forEach(function(recipe) {
    JSON_KEYS.forEach(function(entry) {
      let data = recipe[entry];
      if (typeof data === 'object') {
        data = convertIngredientsArray(data)
      }
      JSON_OBJS[entry].push(data);
      //console.log(JSON.stringify(JSON_OBJS, null, 4));
    });
  });
  writeField(BACKUP_FILE, JSON.stringify(JSON_OBJS, null, 4));
}

function createObjs () {
  let OBJS = {}
  JSON_KEYS.forEach(function(entry) {
    OBJS[entry] = [];
  });
  return OBJS
}

function writeField(file, entry) {
  fs.writeFile(file, entry, (err) => {
    if (err) throw err;
  })
}

function convertIngredientsArray (data) {
  let text = ''
  for (var ingredient in data) {
    text += data[ingredient]['original'] + '\n'
  }
  return text
}

createBackupRecipes();
