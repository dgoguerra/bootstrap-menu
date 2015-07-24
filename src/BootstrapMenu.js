'use strict';

var _ = require('lodash');
var $ = require('jquery');

require('jquery-ui/position');


var defaultOptions = {
    /* user-defined function to obtain specific data about the currently
     * opened element, to pass it to the rest of user-defined functions
     * of an action. */
    fetchElementData: _.noop,
    /* what the source of the context menu should be when opened.
     * Valid values are 'mouse' and 'element'. */
    menuSource: 'mouse',
    /* how to calculate the position of the context menu based on its source.
     * Valid values are 'aboveLeft', 'aboveRight', 'belowLeft', and 'belowRight'. */
    menuPosition: 'belowLeft',
    /* the event to listen to open the menu.
     * Valid values are 'click', 'right-click', 'hover' */
    menuEvent: 'right-click',
    /* group actions to render them next to each other, with a separator
     * between each group. */
    actionsGroups: []
};

function renderMenu(_this) {
    var $menu = $('<div class="dropdown bootstrapMenu" style="z-index:1000;position:absolute;" />');

    var $ul = $('<ul class="dropdown-menu" style="position:static;display:block;font-size:0.9em;" />');

    // group all actions following the actionsGroups option, to
    // add a separator between each of them.
    var groups = [];

    // default group where all ungrouped actions will go
    groups[0] = [];

    // add the rest of groups
    _.each(_this.options.actionsGroups, function(groupArr, ind) {
        groups[ind+1] = [];
    });

    // find out if any of the actions has an icon
    var actionsHaveIcon = false;

    // add each action to the group it belongs to, or the default group
    _.each(_this.options.actions, function(action, actionId) {
        var addedToGroup = false;

        _.each(_this.options.actionsGroups, function(groupArr, ind) {
            if (_.contains(groupArr, actionId)) {
                groups[ind+1].push(actionId);
                addedToGroup = true;
            }
        });

        if (addedToGroup === false) {
            groups[0].push(actionId);
        }

        if (typeof action.iconClass !== 'undefined') {
            actionsHaveIcon = true;
        }
    });

    var isFirstNonEmptyGroup = true;
    _.each(groups, function(actionsIds) {
        if (actionsIds.length == 0)
            return;

        if (isFirstNonEmptyGroup === false) {
            $ul.append('<li class="divider"></li>');
        }
        isFirstNonEmptyGroup = false;

        _.each(actionsIds, function(actionId) {
            var action = _this.options.actions[actionId];

            /* At least an action has an icon. Add the icon of the current action,
             * or room to align it with the actions which do have one. */
            if (actionsHaveIcon === true) {
                $ul.append('<li role="presentation" data-action="'+actionId+'">'
                    + '<a href="#" role="menuitem">'
                    + '<i class="fa fa-fw fa-lg ' + (action.iconClass || '') + '"></i> ' + action.name
                    + '</a>'
                    + '</li>'
                );
            }
            // neither of the actions have an icon.
            else {
                $ul.append('<li role="presentation" data-action="'+actionId+'"><a href="#" role="menuitem">'+action.name+'</a></li>');
            }
        });
    });

    return $menu.append($ul);
};

function setupOpenEventListeners(_this) {
    var openEventName = null;

    switch (_this.options.menuEvent) {
        case 'click':
            openEventName = 'click';
            break;
        case 'right-click':
            openEventName = 'contextmenu';
            break;
        case 'hover':
            openEventName = 'mouseenter';
            break;
        default:
            throw new Error("Unknown BootstrapMenu 'menuEvent' option");
    }

    // install the handler for every future elements where
    // the context menu will open
    _this.$context.on(openEventName, _this.selector, function(evt) {
        var $triggerElem = $(this);

        _this.open($triggerElem, evt);

        // cancel event propagation, to avoid it bubbling up to this.$context
        // and closing the context menu as if the user clicked outside the menu.
        return false;
    });
};

function setupCloseEventListeners(_this, $triggerElem) {
    switch (_this.options.menuEvent) {
        case 'click':
            break;
        case 'right-click':
            break;
        case 'hover':
            // close the menu when the mouse is moved outside both
            // the element where the context menu was opened, and
            // the context menu itself.
            var $elemsToCheck = $triggerElem.add(_this.$menu);

            $elemsToCheck.on('mouseleave.BootstrapMenuAction', function(evt) {
                var destElement = evt.toElement || evt.relatedTarget;
                if (!$triggerElem.is(destElement) && !_this.$menu.is(destElement)) {
                    _this.close();
                }
            });
            break;
        default:
            throw new Error("Unknown BootstrapMenu 'menuEvent' option");
    }

    // it the user clicks outside the context menu, close it.
    _this.$context.on('click.BootstrapMenuAction', function() {
        _this.close();
    });
};

var BootstrapMenu = function(selector, options) {
    this.selector = selector;
    this.options = _.extend({}, defaultOptions, options);
    this.init();
};

var existingInstances = [];

BootstrapMenu.prototype.init = function() {
    this.$context = $('body');

    // jQuery object of the rendered context menu. Not part of the DOM yet.
    this.$menu = renderMenu(this);
    this.$menuList = this.$menu.children();

    /* append the context menu to <body> to be able to use "position: absolute"
     * absolute to the whole window. */
    this.$menu.hide().appendTo(this.$context);

    setupOpenEventListeners(this);

    // keep track of all the existing context menu instances in the page
    existingInstances.push(this);
};

BootstrapMenu.prototype.updatePosition = function($triggerElem, event) {
    var menuLocation = null; // my
    var relativeToElem = null; // of
    var relativeToLocation = null; // at

    switch (this.options.menuSource) {
        case 'element':
            relativeToElem = $triggerElem;
            break;
        case 'mouse':
            relativeToElem = event;
            break;
        default:
            throw new Error("Unknown BootstrapMenu 'menuSource' option");
    }

    switch (this.options.menuPosition) {
        case 'belowRight':
            menuLocation = 'right top';
            relativeToLocation = 'right bottom';
            break;
        case 'belowLeft':
            menuLocation = 'left top';
            relativeToLocation = 'left bottom';
            break;
        case 'aboveRight':
            menuLocation = 'right bottom';
            relativeToLocation = 'right top';
            break;
        case 'aboveLeft':
            menuLocation = 'left bottom';
            relativeToLocation = 'left top';
            break;
        default:
            throw new Error("Unknown BootstrapMenu 'menuPosition' option");
    }

    // update the menu's height and width manually
    this.$menu.css({ display: 'block' });

    // once the menu is not hidden anymore, we can obtain its content's height and width,
    // to manually update it in the menu
    this.$menu.css({
        height: this.$menuList.height(),
        width: this.$menuList.width()
    });

    this.$menu.position({ my: menuLocation, at: relativeToLocation, of: relativeToElem });
};

// open the context menu
BootstrapMenu.prototype.open = function($triggerElem, event) {
    var _this = this;

    // first close all open instances of opened context menus in the page
    BootstrapMenu.closeAll();

    var $actions = this.$menu.find('[data-action]');

    // clear previousle hidden and disabled actions
    $actions.show().removeClass('disabled');

    /* go through all actions to update which ones to show
     * enabled/disabled and which ones to hide. */
    $actions.each(function() {
        var $action = $(this);

        var actionId = $action.data('action');
        var action = _this.options.actions[actionId];
        var elemData = _this.options.fetchElementData($triggerElem);

        if (action.isShown && action.isShown(elemData) === false) {
            $action.hide();
            return;
        }

        if (action.isEnabled && action.isEnabled(elemData) === false) {
            $action.addClass('disabled');
        }
    });

    // once it is known which actions are or arent being shown
    // (so we know the final height of the context menu),
    // calculate its position
    this.updatePosition($triggerElem, event);

    this.$menu.show();

    // clear all possible handlers from a previous open event, where an option
    // wasn't selected.
    this.$menu.off('click.BootstrapMenuAction');

    // handler to run when an option is selected
    this.$menu.on('click.BootstrapMenuAction', function(evt) {
        evt.preventDefault();

        var $target = $(evt.target);

        // uninstall the current listener
        _this.$menu.off('click.BootstrapMenuAction');

        var $action = $target.is('[data-action]') ? $target : $target.closest('[data-action]');
        var actionId = $action.data('action');

        // action is disabled, dont do anything
        if ($action.is('.disabled'))
            return;

        var elemData = _this.options.fetchElementData($triggerElem);

        /* call the user click handler. It receives the optional user-defined data,
         * or undefined. */
        _this.options.actions[actionId].onClick(elemData);
    });

    setupCloseEventListeners(this, $triggerElem);
};

// close the context menu
BootstrapMenu.prototype.close = function() {
    this.$context.off('.BootstrapMenuAction');
    this.$menu.hide();
};

// close all instances of context menus
BootstrapMenu.closeAll = function() {
    _.each(existingInstances, function(contextMenu) {
        contextMenu.close();
    });
};

module.exports = BootstrapMenu;
