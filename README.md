Bootstrap Context Menu
=============================

A context menu plugin using Bootstrap's dropdown component.

It's made to be usable without having to add any specific HTML for
it in the page, and to allow dynamically changing the state of its options
easily.

Depends on jQuery and lodash.

* [Demos](https://dgoguerra.github.io/bootstrap-menu/demos.html)


Installation
------------

```
npm install bootstrap-menu
```


Examples
--------

Basic plugin usage

```js
var contextMenu = new ContextMenu('#button', {
  actions: [{
      name: 'Action',
      onClick: function() {
        toastr.info("'Action' clicked!");
      }
    }, {
      name: 'Another action',
      onClick: function() {
        toastr.info("'Another action' clicked!");
      }
    }, {
      name: 'A third action',
      onClick: function() {
        toastr.info("'A third action' clicked!");
      }
  }]
});
```


Options
-------

Context menu initializacion options:

| Name | Description |
| ---- | ----------- |
| `menuSource` | What the source of the context menu should be when opened. Valid values are *mouse* and *element*. Defaults to *mouse* |
| `menuPosition` | how to calculate the position of the context menu based on its source. Valid values are *aboveLeft*, *aboveRight*, *belowLeft*, and *belowRight*. Defaults to *belowLeft*. |
| `menuEvent` | The event to listen to open the menu. Valid values are *click*, *right-click*, *hover*. Defaults to *right-click*. |
| `fetchElementData` | Function to obtain specific data about the currently opened element, to pass it to the rest of user-defined functions of an action. |
| `actions` | Array or object containing the list of actions to be rendered in the context menu. |
| `actionsGroups` | Array to group actions to render them next to each other, with a separator between each group. |

Actions attributes:

| Name | Description |
| ---- | ----------- |
| `name` | The name of the action. |
| `iconClass` | Font Awesome class of the icon to show for the action. |
| `onClick` | Handler to run when an action is clicked. |
| `isShown` | Called before render, decides if the action should be shown or hidden in the context menu. |
| `isEnabled` | Called before render, decides if the action should appear enabled or disabled in the context menu. |


License
-------
MIT license - http://www.opensource.org/licenses/mit-license.php
