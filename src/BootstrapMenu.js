'use strict';

var classNames = require('classnames');
var $ = require('jquery');
require('jquery-ui/ui/position');

// modular lodash requires
var _ = function() {
  throw new Error('Custom lodash build for BootstrapMenu. lodash chaining is not included');
};

_.noop = require('lodash/utility/noop');
_.each = require('lodash/collection/each');
_.contains = require('lodash/collection/contains');
_.extend = require('lodash/object/extend');
_.uniqueId = require('lodash/utility/uniqueId');
_.isFunction = require('lodash/lang/isFunction');


var defaultOptions = {
    /* container of the context menu, where it will be created and where
     * event listeners will be installed. */
    container: 'body',

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
    menuEvent: 'right-click', // TODO rename to menuAction in next mayor version

    /* group actions to render them next to each other, with a separator
     * between each group. */
    actionsGroups: [],

    /* In some weird cases, another plugin may be installing 'click' listeners
     * in the anchors used for each action of the context menu, and stopping
     * the event bubbling before it reachs this plugin's listener.
     *
     * For those cases, _actionSelectEvent can be used to change the event we
     * listen to, for example to 'mousedown'.
     *
     * Unless the context menu is not working due to this and a workaround is
     * needed, this option can be safely ignored.
     */
    _actionSelectEvent: 'click'
};

function renderMenu(_this) {
    var $menu = $('<div class="dropdown bootstrapMenu" style="z-index:10000;position:absolute;" />');

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
                $ul.append(
                    '<li role="presentation" data-action="'+actionId+'">' +
                    '<a href="#" role="menuitem">' +
                    '<i class="fa fa-fw fa-lg ' + (action.iconClass || '') + '"></i> ' +
                    '<span class="actionName"></span>' +
                    '</a>' +
                    '</li>'
                );
            }
            // neither of the actions have an icon.
            else {
                $ul.append(
                    '<li role="presentation" data-action="'+actionId+'">' +
                    '<a href="#" role="menuitem"><span class="actionName"></span></a>' +
                    '</li>'
                );
            }
        });
    });

    return $menu.append($ul);
}

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
    _this.$container.on(openEventName + _this.namespace, _this.selector, function(evt) {
        var $openTarget = $(this);

        _this.open($openTarget, evt);

        // cancel event propagation, to avoid it bubbling up to this.$container
        // and closing the context menu as if the user clicked outside the menu.
        return false;
    });
}

function clearOpenEventListeners(_this) {
    _this.$container.off(_this.namespace);
}

function setupActionsEventListeners(_this) {
    var actionSelectEvent = _this.options._actionSelectEvent + _this.namespace;

    // handler to run when an option is selected
    _this.$menu.on(actionSelectEvent, function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        var $target = $(evt.target);

        // either a divider or the menu (not an option inside it) was clicked,
        // don't do anything
        if ($target.is('.divider') || $target.is('.dropdown-menu')) {
            return;
        }

        var $action = $target.is('[data-action]') ? $target : $target.closest('[data-action]');
        var actionId = $action.data('action');

        // action is disabled, dont do anything
        if ($action.is('.disabled'))
            return;

        var targetData = _this.options.fetchElementData(_this.$openTarget);

        /* call the user click handler. It receives the optional user-defined data,
         * or undefined. */
        _this.options.actions[actionId].onClick(targetData);

        // close the menu
        _this.close();
    });
}

function clearActionsEventListeners(_this) {
    _this.$menu.off(_this.namespace);
}

function setupCloseEventListeners(_this) {
    switch (_this.options.menuEvent) {
        case 'click':
            break;
        case 'right-click':
            break;
        case 'hover':
            // close the menu when the mouse is moved outside both
            // the element where the context menu was opened, and
            // the context menu itself.
            var $elemsToCheck = _this.$openTarget.add(_this.$menu);

            $elemsToCheck.on('mouseleave' + _this.closeNamespace, function(evt) {
                var destElement = evt.toElement || evt.relatedTarget;
                if (!_this.$openTarget.is(destElement) && !_this.$menu.is(destElement)) {
                    $elemsToCheck.off(_this.closeNamespace);
                    _this.close();
                }
            });
            break;
        default:
            throw new Error("Unknown BootstrapMenu 'menuEvent' option");
    }

    // it the user clicks outside the context menu, close it.
    _this.$container.on('click' + _this.closeNamespace, function() {
        _this.close();
    });
}

function clearCloseEventListeners(_this) {
    _this.$container.off(_this.closeNamespace);
}

var BootstrapMenu = function(selector, options) {
    this.selector = selector;
    this.options = _.extend({}, defaultOptions, options);

    // namespaces to use when registering event listeners
    this.namespace = _.uniqueId('.BootstrapMenu_');
    this.closeNamespace = _.uniqueId('.BootstrapMenuClose_');

    this.init();
};

var existingInstances = [];

BootstrapMenu.prototype.init = function() {
    this.$container = $(this.options.container);

    // jQuery object of the rendered context menu. Not part of the DOM yet.
    this.$menu = renderMenu(this);
    this.$menuList = this.$menu.children();

    /* append the context menu to <body> to be able to use "position: absolute"
     * absolute to the whole window. */
    this.$menu.hide().appendTo(this.$container);

    /* the element in which the context menu was opened. Updated every time
     * the menu is opened. */
    this.$openTarget = null;

    /* event that triggered the context menu to open. Updated every time
     * the menu is opened. */
    this.openEvent = null;

    setupOpenEventListeners(this);

    setupActionsEventListeners(this);

    // keep track of all the existing context menu instances in the page
    existingInstances.push(this);
};

BootstrapMenu.prototype.updatePosition = function() {
    var menuLocation = null; // my
    var relativeToElem = null; // of
    var relativeToLocation = null; // at

    switch (this.options.menuSource) {
        case 'element':
            relativeToElem = this.$openTarget;
            break;
        case 'mouse':
            relativeToElem = this.openEvent;
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
BootstrapMenu.prototype.open = function($openTarget, event) {
    var _this = this;

    // first close all open instances of opened context menus in the page
    BootstrapMenu.closeAll();

    this.$openTarget = $openTarget;

    this.openEvent = event;

    var targetData = _this.options.fetchElementData(_this.$openTarget);

    var $actions = this.$menu.find('[data-action]');

    // clear previously hidden actions
    $actions.show();

    /* go through all actions to update the text to show, which ones to show
     * enabled/disabled and which ones to hide. */
    $actions.each(function() {
        var $action = $(this);

        var actionId = $action.data('action');
        var action = _this.options.actions[actionId];

        var classes = action.classNames || null;

        if (classes && _.isFunction(classes))
            classes = classes(targetData);

        $action.attr('class', classNames(classes || ''));

        if (action.isShown && action.isShown(targetData) === false) {
            $action.hide();
            return;
        }

        // the name provided for an action may be dynamic, provided as a function
        $action.find('.actionName').html(
            _.isFunction(action.name) && action.name(targetData) || action.name
        );

        if (action.isEnabled && action.isEnabled(targetData) === false) {
            $action.addClass('disabled');
        }
    });

    // once it is known which actions are or arent being shown
    // (so we know the final height of the context menu),
    // calculate its position
    this.updatePosition();

    this.$menu.show();

    setupCloseEventListeners(this);
};

// close the context menu
BootstrapMenu.prototype.close = function() {
    // hide the menu
    this.$menu.hide();

    clearCloseEventListeners(this);
};

BootstrapMenu.prototype.destroy = function() {
    this.close();
    clearOpenEventListeners(this);
    clearActionsEventListeners(this);
};

// close all instances of context menus
BootstrapMenu.closeAll = function() {
    _.each(existingInstances, function(contextMenu) {
        contextMenu.close();
    });
};

module.exports = BootstrapMenu;
