Bootstrap Context Menu
=============================

A context menu plugin using Bootstrap's dropdown component.

It's made to be usable without having to add any specific HTML for
it in the page, and to allow dynamically changing the state of its options
easily.

Depends on [jQuery](https://jquery.com/). It uses Bootstrap's styling classes, and if using the `iconClass` option, also Font Awesome.


* [Demos](https://dgoguerra.github.io/bootstrap-menu/demos.html)


Installation
------------

The easiest way to use BootstrapMenu is installing it from NPM:

```
npm install bootstrap-menu
```

and include it with your with your build system ([Browserify](http://browserify.org/), [Webpack](https://webpack.github.io/docs/what-is-webpack.html), etc).

```js
var BootstrapMenu = require('bootstrap-menu');

var menu = new BootstrapMenu('#dropdownButton', {
  actions: /* ... */
});
```

Alternatively you can use the standalone build found at `dist/BootstrapMenu.min.js`. It expects jQuery to be included, and exposes `BootstrapMenu` globally.

```html
<script src="//code.jquery.com/jquery-2.1.4.min.js"></script>
<script src="dist/BootstrapMenu.min.js"></script>

<!-- ... -->

<script>
  var menu = new BootstrapMenu('#dropdownButton', {
    actions: /* ... */
  });
</script>
```

To rebuild the distributables locally, run:

```
npm install
./build.sh
```


Usage
-----

BootstrapMenu receives a string with the selector of the elements to listen to as first argument, and an `options` object as second argument.

The `options` object must have at least an `actions` array containing the actions to show in the context menu.

```js
var contextMenu = new BootstrapMenu('#button', {
  actions: [{
      name: 'Action',
      onClick: function() {
        // run when the action is clicked
      }
    }, {
      name: 'Another action',
      onClick: function() {
        // run when the action is clicked
      }
    }, {
      name: 'A third action',
      onClick: function() {
        // run when the action is clicked
      }
  }]
});
```


Options
-------

Context menu initializacion options:

| Name | Type | Description |
| ---- | ---- | ----------- |
| `menuSource` | string | What the source of the context menu should be when opened. Valid values are *mouse* and *element*. Defaults to *mouse*. |
| `menuPosition` | string | How to calculate the position of the context menu based on its source. Valid values are *aboveLeft*, *aboveRight*, *belowLeft*, and *belowRight*. Defaults to *belowLeft*. |
| `menuEvent` | string | The event to listen to open the menu. Valid values are *click*, *right-click*, *hover*. Defaults to *right-click*. |
| `fetchElementData` | function | Obtain specific data about the currently opened element, to pass it to the rest of user-defined functions of an action. |
| `actions` | array&#124;object | Array or object containing the list of actions to be rendered in the context menu. |
| `actionsGroups` | array | Array to group actions to render them next to each other, with a separator between each group. |

Actions attributes:

| Name | Type | Description |
| ---- | ---- | ----------- |
| `name` | string | The name of the action. |
| `iconClass` | string | Font Awesome class of the icon to show for the action. |
| `onClick` | function | Handler to run when an action is clicked. If `fetchElementData` was defined, receives as first argument its returned value. |
| `isShown` | function | Called before render, decides if the action should be shown or hidden in the context menu. If `fetchElementData` was defined, receives as first argument its returned value. |
| `isEnabled` | function | Called before render, decides if the action should appear enabled or disabled in the context menu. If `fetchElementData` was defined, receives as first argument its returned value. |


License
-------
MIT license - http://www.opensource.org/licenses/mit-license.php
