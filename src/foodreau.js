const sketch = require('sketch')
const { DataSupplier, UI, Settings } = sketch
const os = require('os')
const path = require('path')
const util = require('util')
const fs = require('@skpm/fs')

const FOLDER = path.join(os.tmpdir(), 'com.maxdavid.sketch.foodreau-plugin')

const API_ENDPOINT = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/'
const API_KEYS = ['title','creditText','sourceUrl','image','instructions','servings','readyInMinutes','extendedIngredients','vegetarian','vegan','glutenFree','dairyFree','veryHealthy','cheap','veryPopular','sustainable','lowFodmap','ketogenic','whole30','weightWatcherSmartPoints','pricePerServing','gaps','healthScore','id']
const API_RANDOM_PARAM = 'random?number=1'
const API_NUM_RESULTS = 20
const API_QUERY_PARAM = 'search?number=' + API_NUM_RESULTS + '&query='

let API_KEY = getAPIKey()
let API_OPTIONS = { 'headers': { 'X-RapidAPI-Key': API_KEY } }
const BACKUP_RECIPES = JSON.parse(fs.readFileSync(context.plugin.urlForResourceNamed('backup/recipes.js').path(), 'utf8'))

export function onStartup () {
  DataSupplier.registerDataSupplier('public.text', 'Random Recipe Title', 'SupplyRandomTitle')
  DataSupplier.registerDataSupplier('public.text', 'Random Recipe Source', 'SupplyRandomSource')
  DataSupplier.registerDataSupplier('public.text', 'Random Recipe Content from Layer Names', 'SupplyRandomContent')
  DataSupplier.registerDataSupplier('public.text', 'Search Recipe...', 'SearchRecipe')
  DataSupplier.registerDataSupplier('public.image', 'Random Recipe Image', 'SupplyRandomImage')
  DataSupplier.registerDataSupplier('public.image', 'Search Recipe Image...', 'SearchImage')
}

export function onShutdown () {
  DataSupplier.deregisterDataSuppliers()
  try {
    if (fs.existsSync(FOLDER)) {
      fs.rmdirSync(FOLDER)
    }
  } catch (err) {
    console.error(err)
  }
}

export function getAPIKey () {
  // return api key if exists, return false if not
  if (Settings.settingForKey('foodreau.apikey')) {
    return Settings.settingForKey('foodreau.apikey')
  }
  try { // if not set in plugin settings, maybe it's stored in a file?
    let api = ''
    api = require('./.secret.js')
    return api.spoonacular.apikey
  } catch (err) { return false }
}

export default function onSetAPIKey () {
  let previousKey = '' || Settings.settingForKey('foodreau.apikey')
  if (sketch.version.sketch < 53) {
    const newKey = UI.getStringFromUser("Enter your spoonacular API Key\n\nDon't have one? Register for free:\nhttps://spoonacular.com/food-api", previousKey).trim()
    if (newKey !== 'null') {
      Settings.setSettingForKey('foodreau.apikey', newKey)
      UI.message('API Key successfully set!')
    }
  } else {
    UI.getInputFromUser("Enter your spoonacular API Key\n\nDon't have one? Register for free:\nhttps://spoonacular.com/food-api",
      { initialValue: previousKey },
      (err, newKey) => {
        if (err) { 
          UI.message('No API key set! Using backup recipes...')
          return 
        } else {
          Settings.setSettingForKey('foodreau.apikey', newKey.trim())
          UI.message('API Key successfully set!')
        }
      }
    )
  }
}

export function onSupplyRandomTitle (context) {
  const dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => {
    getRecipe(item, index, dataKey, 'title')
  })
}

export function onSupplyRandomSource (context) {
  const dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => {
    getRecipe(item, index, dataKey, 'creditText')
  })
}

export function onSupplyRandomContent (context) {
  const dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => {
    if (!API_KEYS.includes(item.name) && item.type === 'Text') {
      UI.message('"' + item.name + '" ' + 'is not a valid recipe field name')
    } else {
      getRecipe(item, index, dataKey, item.name)
    }
  })
}

export function onSearchRecipe (context) {
  // retrieve previous search term. If multiple layers are selected, find the first search term in group
  // (thanks https://github.com/BohemianCoding/unsplash-sketchplugin/commit/2e763b049fb34cb4b072fab7147bd05b4c84faa1)
  let selectedLayers = sketch.getSelectedDocument().selectedLayers.layers
  let previousTerms = selectedLayers.map(layer => Settings.layerSettingForKey(layer, 'foodreau.search.term'))
  let firstPreviousTerm = previousTerms.find(term => term !== undefined)
  let previousTerm = firstPreviousTerm || 'Dinner'
  if (sketch.version.sketch < 53) {
    const searchTerm = UI.getStringFromUser('Enter a recipe search term...', previousTerm).trim()
    if (searchTerm !== 'null') {
      selectedLayers.forEach(layer => {
        Settings.setLayerSettingForKey(layer, 'foodreau.search.term', searchTerm)
      })
      const dataKey = context.data.key
      const items = util.toArray(context.data.items).map(sketch.fromNative)
      items.forEach((item, index) => {
        if (!API_KEYS.includes(item.name) && item.type === 'Text') {
          UI.message('"' + item.name + '" ' + 'is not a valid recipe field name')
        } else {
          getRecipe(item, index, dataKey, item.name, searchTerm)
        }
      })
    }
  } else {
    UI.getInputFromUser('Enter a recipe search term...',
      { initialValue: previousTerm },
      (err, searchTerm) => { 
        if (err) { return } else {
          if ((searchTerm = searchTerm.trim()) !== 'null') {
            selectedLayers.forEach(layer => {
              Settings.setLayerSettingForKey(layer, 'foodreau.search.term', searchTerm)
            })
          }
          const dataKey = context.data.key
          const items = util.toArray(context.data.items).map(sketch.fromNative)
          items.forEach((item, index) => {
            if (!API_KEYS.includes(item.name) && item.type === 'Text') {
              UI.message('"' + item.name + '" ' + 'is not a valid recipe field name')
            } else {
              getRecipe(item, index, dataKey, item.name, searchTerm)
            }
          })
        }
      }
    )
  }
}

function getRecipe (item, index, dataKey, section, searchTerm) {
  // section must be in API_KEYS or item be an image
  UI.message('Fetching recipe...')
  if (item.type != 'Text') {
    section = 'image'
  }
  let url = API_ENDPOINT
  if (API_KEY) {
    if (searchTerm) {
      url += API_QUERY_PARAM + searchTerm
    } else {
      url += API_RANDOM_PARAM
    }
    fetch(url, API_OPTIONS)
      .then(res => res.json())
      .then(json => {
        if (json.message) {
          return Promise.reject(json.message)
        } else if (typeof json.recipes !== 'undefined') {
          loadData(json.recipes[0][section], dataKey, index, item)
        } else if (typeof json.results !== 'undefined') {
          fetchRecipeInfo(json, dataKey, index, item, section)
        } else {
          UI.message('Invalid API key, using backup recipes...')
          loadData(BACKUP_RECIPES[section][Math.floor(Math.random() * BACKUP_RECIPES[section].length)], dataKey, index, item)
        }
      })
      .catch(err => {
        console.log(err)
        UI.message('Invalid API key, using backup recipes...')
        loadData(BACKUP_RECIPES[section][Math.floor(Math.random() * BACKUP_RECIPES[section].length)], dataKey, index, item)
      })
  } else {
    loadData(BACKUP_RECIPES[section][Math.floor(Math.random() * BACKUP_RECIPES[section].length)], dataKey, index, item)
  }

  function fetchRecipeInfo (response, dataKey, index, item, section) {
    let rand = Math.floor(Math.random() * API_NUM_RESULTS)
    if (section === 'image') {
      let imageUrl = response['baseUri'] + response.results[rand]['image']
      loadData(imageUrl, dataKey, index, item)
      return
    }
    let url = API_ENDPOINT + response.results[rand].id + '/information'
    fetch(url, API_OPTIONS)
      .then(res => res.json())
      .then(json => {
        if (json.message) {
          return Promise.reject(json.message)
        } else {
          loadData(json[section], dataKey, index, item)
          return json
        }
      })
      .catch(err => console.log(err))
  }

  function loadData (data, dataKey, index, item) {
    if (item.type === 'Text') {
      if (typeof data === 'object') {
        data = convertIngredientsArray(data)
      }
      DataSupplier.supplyDataAtIndex(dataKey, data, index)
    } else {
      return getImageFromURL(data).then(imagePath => {
        if (!imagePath) {
          return
        }
        DataSupplier.supplyDataAtIndex(dataKey, imagePath, index)
      })
    }

    function convertIngredientsArray (data) {
      let text = ''
      for (var ingredient in data) {
        text += data[ingredient]['original'] + '\n'
      }
      return text
    }

    function getImageFromURL (url) {
      return fetch(url)
        .then(res => res.blob())
        .then(saveTempFileFromImageData)
        .catch((err) => {
          console.error(err)
          return context.plugin.urlForResourceNamed('placeholder.png').path()
        })
    }

    function saveTempFileFromImageData (imageData) {
      const guid = NSProcessInfo.processInfo().globallyUniqueString()
      const imagePath = path.join(FOLDER, `${guid}.jpg`)
      try {
        fs.mkdirSync(FOLDER)
      } catch (err) {
        // probably because the folder already exists
      }
      try {
        fs.writeFileSync(imagePath, imageData, 'NSData')
        return imagePath
      } catch (err) {
        console.error(err)
        return undefined
      }
    }
  }
}
