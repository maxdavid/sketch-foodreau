const sketch = require('sketch')
const { DataSupplier, UI } = sketch
const util = require('util')
const api = require('./.secret.js')

const API_ENDPOINT = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/random?number=1'
const API_KEY = api.spoonacular.apikey
const API_OPTIONS = { 'headers': { 'X-RapidAPI-Key': API_KEY } }


export function onStartup () {
  DataSupplier.registerDataSupplier('public.text', 'Random Recipe Title', 'SupplyRandomTitle')
  DataSupplier.registerDataSupplier('public.text', 'Random Recipe Source', 'SupplyRandomSource')
}

export function onShutdown () {
  DataSupplier.deregisterDataSuppliers()
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
