const sketch = require('sketch')
const { DataSupplier, UI } = sketch
const os = require('os')
const path = require('path')
const util = require('util')
const fs = require('@skpm/fs')

const api = require('./.secret.js')

const API_ENDPOINT = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/random?number=1'
const API_KEY = api.spoonacular.apikey
const API_OPTIONS = { 'headers': { 'X-RapidAPI-Key': API_KEY } }

const FOLDER = path.join(os.tmpdir(), 'com.sketchapp.foodreau-plugin')

export function onStartup () {
  DataSupplier.registerDataSupplier('public.text', 'Random Recipe Title', 'SupplyRandomTitle')
  DataSupplier.registerDataSupplier('public.text', 'Random Recipe Source', 'SupplyRandomSource')
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

export function onSupplyRandomTitle (context) {
  const dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => {
    let data = getRandomRecipeSection(item, index, dataKey, 'title')
  })
}

export function onSupplyRandomSource (context) {
  const dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => {
    let data = getRandomRecipeSection(item, index, dataKey, 'creditText')
  })
}

export function onSupplyRandomImage (context) {
  const dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => {
    let data = getRandomRecipeImage(item, index, dataKey)
  })
}

export function getRandomRecipeSection (item, index, dataKey, section) {
  // section can be 'title' 'creditText' etc
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
    console.log(data)
    DataSupplier.supplyDataAtIndex(dataKey, data, index)
  }
}

export function getRandomRecipeImage (item, index, dataKey) {
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
        // TODO: something wrong happened, show something to the user
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
        //return context.plugin.urlForResourceNamed('placeholder.png').path()
      })
  }

  function saveTempFileFromImageData (imageData) {
    const guid = NSProcessInfo.processInfo().globallyUniqueString()
    const imagePath = path.join(FOLDER, `${guid}.jpg`)
    try {
      fs.mkdirSync(FOLDER)
    } catch (err) {
      // probably because the folder already exists
      // TODO: check that it is really because it already exists
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
