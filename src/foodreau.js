const sketch = require('sketch')
const { DataSupplier, UI } = sketch
const util = require('util')
const api = require('./.secret.js')

const API_ENDPOINT = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/random?number=1'
const API_KEY = api.spoonacular.apikey

export function onStartup () {
  DataSupplier.registerDataSupplier('public.text', 'Random Recipe', 'SupplyRandomRecipe')
}

export function onShutdown () {
  DataSupplier.deregisterDataSuppliers()
}

export function onSupplyRandomRecipe (context) {
  let dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => {
    let data = getRandomRecipe(item, index, dataKey)
    //DataSupplier.supplyDataAtIndex(dataKey, data, index)
  })
}

export function getRandomRecipe (item, index, dataKey) {
  const API_OPTIONS = {
    'headers': {
      'X-RapidAPI-Key': API_KEY
    }
  }

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
    .then(json => loadText(json.recipes[0].title, dataKey, index, item))
    .catch(err => console.log(err))

  function loadText (data, dataKey, index, item) {
    console.log(data)
    DataSupplier.supplyDataAtIndex(dataKey, data, index)
  }
}
