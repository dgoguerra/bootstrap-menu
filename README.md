Bootstrap Context Menu
=============================

A context menu plugin using Bootstrap's dropdown component.

It's made to be usable without having to add any specific HTML for
it in the page, and to allow dynamically changing the state of its options
easily.

Depends on jQuery and lodash.

Installation
------------

```
npm install bootstrap-menu
```

Examples
--------

Basic plugin usage

```js
var contextMenu = new ContextMenu({
    // elements that trigger the context menu
    triggersSelector: '.contextMenuBtn',
    actions: {
        firstAction: {
            name: 'Action',
            onClick: function() {
                console.log('First action handler!');
            }
        },
        anotherAction: {
            name: 'Another action',
            onClick: function() {
                console.log('second action handler!');
            }
        },
        thirdAction: {
            name: 'A third action',
            onClick: function() {
            	console.log('Third action handler!');
            }
        }
    }
});
```

License
-------
MIT license - http://www.opensource.org/licenses/mit-license.php
