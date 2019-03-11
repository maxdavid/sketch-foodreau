const sketch = require('sketch')
const { DataSupplier } = sketch
const util = require('util')

export function onStartup () {
  DataSupplier.registerDataSupplier('public.text', 'Foodreau', 'SupplyData')
}

export function onShutdown () {
  DataSupplier.deregisterDataSuppliers()
}

export function onSupplyData (context) {
  let dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => {
    let data = Math.random().toString()
    DataSupplier.supplyDataAtIndex(dataKey, data, index)
  })
}
