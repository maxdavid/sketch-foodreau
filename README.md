![Foodreau logo](https://github.com/maxdavid/sketch-foodreau/blob/master/assets/icon-rounded-small.png)
# Foodreau
A simple Sketch plugin to fill text and image layers with recipe-related content. Useful for designing food-related layouts without resorting to Lorem Ipsum.

## Installation
### Sketch plugin manager 
In the 'Catalog' tab of [Sketch Plugin Manager,](https://mludowise.github.io/Sketch-Plugin-Manager/) search for 'Foodreau'

### Manual
1. Download zip and extract
2. In Sketch `Plugins > Manage Plugins...`
3. Click the cog-wheel icon in lower right, and select `Reveal Plugins Folder`
4. Move extracted zip to the Plugins directory

## Usage
Can be used like other DataSupplier plugins. Right-click a layer to fill with recipe information, or use the toolbar Data dropdown.

To fill text layers with the appropriate information, the text layer must be named accordingly. Below is a short list of the most commonly used fields:

|Layer name           |Description                                  |
|:--------------------|:--------------------------------------------|
|`title`              |Title of the recipe                          |
|`instructions`       |Full text of recipe preparation instructions |
|`extendedIngredients`|Collected list of recipe ingredients         |
|`creditText`         |Name of recipe source                        |
|`sourceUrl`          |URL of recipe source                         |

Additional fields are [listed in the docs.](https://github.com/maxdavid/sketch-foodreau/blob/master/docs/layer-names.md) Image layer names can be anything.

## Advanced
This plugin comes bundled with a number of offline recipes that be used without restriction. They can be found [here.](https://github.com/maxdavid/sketch-foodreau/blob/master/assets/backup/recipes.js)

If the offline recipes are not enough, this plugin can also connect to [Spoonacular's recipe API.](https://spoonacular.com/food-api) Register for a freemium API key through [RapidAPI.](https://rapidapi.com/spoonacular/api/recipe-food-nutrition/pricing) Clone this repo, then create the file `srv/.secret.js` and store your key like so:
```javascript
export const spoonacular = {
  'apikey' : 'API_KEY_GOES_HERE'
};
```
Run `npm install` to rebuild the plugin, and you should be good to go.

## Upcoming Features
* Keyword recipe searching
* More curated offline backup
* Runner installation
