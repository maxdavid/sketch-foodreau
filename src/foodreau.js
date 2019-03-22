const sketch = require('sketch')
const { DataSupplier, UI } = sketch
const os = require('os')
const path = require('path')
const util = require('util')
const fs = require('@skpm/fs')

const FOLDER = path.join(os.tmpdir(), 'com.sketchapp.foodreau-plugin')

const API_ENDPOINT = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/random?number=1'
const API_KEYS = ['title','creditText','sourceUrl','image','instructions','servings','readyInMinutes','extendedIngredients','vegetarian','vegan','glutenFree','dairyFree','veryHealthy','cheap','veryPopular','sustainable','lowFodmap','ketogenic','whole30','weightWatcherSmartPoints','pricePerServing','gaps','healthScore','id']

let usingAPI = false;
let API_KEY = ''
let API_OPTIONS = ''

export function onStartup () {
  API_KEY = getAPIKey()
  DataSupplier.registerDataSupplier('public.text', 'Random Recipe Title', 'SupplyRandomTitle')
  DataSupplier.registerDataSupplier('public.text', 'Random Recipe Source', 'SupplyRandomSource')
  DataSupplier.registerDataSupplier('public.text', 'Random Recipe Content from Layer Names', 'SupplyRandomContent')
  DataSupplier.registerDataSupplier('public.image', 'Random Recipe Image', 'SupplyRandomImage')
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
  let api = ''
  try {
    api = require('./.secret.js')
    usingAPI = true
    console.log(usingAPI)
    API_OPTIONS = { 'headers': { 'X-RapidAPI-Key': api.spoonacular.apikey } }
    console.log(API_OPTIONS)
    return api.spoonacular.apikey
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      console.log(err)
      return false
    }
  }
}

export function onSupplyRandomTitle (context) {
  const dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => {
    getRandomRecipeSection(item, index, dataKey, 'title')
  })
}

export function onSupplyRandomSource (context) {
  const dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => {
    getRandomRecipeSection(item, index, dataKey, 'creditText')
  })
}

export function onSupplyRandomContent (context) {
  const dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => {
    if (!API_KEYS.includes(item.name)) {
      UI.message('"' + item.name + '" ' + 'is not a valid recipe field name')
    } else {
      getRandomRecipeSection(item, index, dataKey, item.name)
    }
  })
}

export function onSupplyRandomImage (context) {
  const dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => {
    let data = getRandomRecipeImage(item, index, dataKey)
  })
}

function getRandomRecipeSection (item, index, dataKey, section) {
  // section must be in API_KEYS
  UI.message('Fetching recipe...')
  console.log(usingAPI)
  //console.log(API_KEY)
  fetch(API_ENDPOINT, API_OPTIONS)
    .then(res => res.json())
    .then(json => {
      if (json.message) {
        return Promise.reject(json.message)
      } else if (typeof json.recipes !== 'undefined') {
        return json
      } else {
        return json
      }
    })
    .then(json => loadText(json.recipes[0][section], dataKey, index, item))
    .catch(err => console.log(err))

  function loadText (data, dataKey, index, item) {
    if (typeof data === 'object') {
      data = convertIngredientsArray(data)
    }
    console.log(data)
    DataSupplier.supplyDataAtIndex(dataKey, data, index)
  }

  function convertIngredientsArray (data) {
    let text = ''
    for (var ingredient in data) {
      text += data[ingredient]['original'] + '\n'
    }
    return text
  }
}

function getRandomRecipeImage (item, index, dataKey) {
  UI.message('Fetching recipe...')
  fetch(API_ENDPOINT, API_OPTIONS)
    .then(res => res.json())
    .then(json => {
      if (json.message) {
        return Promise.reject(json.message)
      } else if (typeof json.recipes !== 'undefined') {
        return json
      } else {
        return json
      }
    })
    .then(json => loadImage(json.recipes[0]['image'], dataKey, index, item))
    .catch(err => console.log(err))

  function loadImage (data, dataKey, index, item) {
    console.log(data)
    return getImageFromURL(data).then(imagePath => {
      if (!imagePath) {
        return
      }
      DataSupplier.supplyDataAtIndex(dataKey, imagePath, index)
    })
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
