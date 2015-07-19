(function(window) {

    var factory = function($, _) {
        'use strict';

        var defaultOptions = {
            /* user-defined function to obtain specific data about the currently
             * opened element, to pass it to the rest of user-defined functions
             * of an action. */
            fetchElementData: _.noop,
            /* how to calculate the position where the context menu opens.
             * Valid values are 'mouse' and 'belowElemLeft', 'belowElemRight' */
            menuPosition: 'mouse',
            /* the event to listen to open the menu.
             * Valid values are 'right_click', 'left_click', 'hover' */
            menuEvent: 'left_click',
            /* group actions to render them next to each other, with a separator
             * between each group. */
            actionsGroups: []
        };

        function renderMenu(_this) {
            var $menu = $('<div class="dropdown" style="position:absolute;z-index:1000;" />');

            var $ul = $('<ul class="dropdown-menu" role="menu" style="display:block;position:static;margin-bottom:5px;" />');

            // group all actions following the actionsGroups option, to
            // add a separator between each of them.
            var groups = [];

            // default group where all ungrouped actions will go
            groups[0] = [];

            // add the rest of groups
            _.each(_this.options.actionsGroups, function(groupArr, ind) {
                groups[ind+1] = [];
            });

            _.each(_this.options.actions, function(action, actionId) {
                var addedToGroup = false;

                _.each(_this.options.actionsGroups, function(groupArr, ind) {
                    if (_.contains(groupArr, actionId)) {
                        groups[ind+1].push(actionId);
                        addedToGroup = true;
                    }
                });

                if (addedToGroup == false) {
                    groups[0].push(actionId);
                }
            });

            var isFirstNonEmptyGroup = true;
            _.each(groups, function(actionsIds) {
                if (actionsIds.length == 0)
                    return;

                if (isFirstNonEmptyGroup == false) {
                    $ul.append('<li class="divider"></li>');
                }
                isFirstNonEmptyGroup = false;

                _.each(actionsIds, function(actionId) {
                    var action = _this.options.actions[actionId];
                    $ul.append('<li role="presentation" data-action="'+actionId+'"><a href="#" role="menuitem">'+action.name+'</a></li>');
                });
            });

            return $menu.append($ul);
        };

        function calcMenuPosition(_this, $trigger, event) {
            var triggerElemPos = {
                left: $trigger.offset().left,
                top: $trigger.offset().top
            };

            var triggerElemDim = {
                height: $trigger.outerHeight(),
                width: $trigger.outerWidth()
            };

            var menuDim = {
                height: _this.$menu.outerHeight(),
                width: _this.$menu.outerWidth()
            };

            var menuPos = { left: null, top: null };

            switch (_this.options.menuPosition) {
                case 'mouse':
                    var mousePos = { left: event.offsetX, top: event.offsetY };
                    menuPos.left = mousePos.left + triggerElemPos.left;
                    menuPos.top = mousePos.top + triggerElemPos.top;
                    break;

                case 'belowElemLeft':
                    menuPos.left = triggerElemPos.left + triggerElemDim.width;
                    menuPos.top = triggerElemPos.top + triggerElemDim.height;

                    menuPos.left -= triggerElemDim.width;
                    break;

                case 'belowElemRight':
                    menuPos.left = triggerElemPos.left + triggerElemDim.width;
                    menuPos.top = triggerElemPos.top + triggerElemDim.height;

                    menuPos.left -= menuDim.width;
                    break;
            };

            return menuPos;
        };

        function setupOpenEventListeners(_this) {
            var openEventName = null;

            switch (_this.options.menuEvent) {
                case 'right_click':
                    openEventName = 'click';
                    break;
                case 'left_click':
                    openEventName = 'contextmenu';
                    break;
                case 'hover':
                    openEventName = 'mouseenter';
                    break;
                default:
                    throw new Error("Unknown ContextMenu 'menuEvent' option");
            }

            // install the handler for every future elements where
            // the context menu will open
            _this.$context.on(openEventName, _this.selector, function(evt) {
                var $triggerElem = $(this);

                var position = calcMenuPosition(_this, $triggerElem, evt);

                _this.open($triggerElem, position.left, position.top);

                // cancel event propagation, to avoid it bubbling up to this.$context
                // and closing the context menu as if the user clicked outside the menu.
                return false;
            });
        };

        function setupCloseEventListeners(_this, $triggerElem) {
            switch (_this.options.menuEvent) {
                case 'right_click':
                    break;
                case 'left_click':
                    break;
                case 'hover':
                    // close the menu when the mouse is moved outside both
                    // the element where the context menu was opened, and
                    // the context menu itself.
                    var $elemsToCheck = $triggerElem.add(_this.$menu);

                    $elemsToCheck.on('mouseleave.ContextMenuAction', function(evt) {
                        var destElement = evt.toElement || evt.relatedTarget;
                        if (!$triggerElem.is(destElement) && !_this.$menu.is(destElement)) {
                            _this.close();
                        }
                    });
                    break;
                default:
                    throw new Error("Unknown ContextMenu 'menuEvent' option");
            }

            // it the user clicks outside the context menu, close it.
            _this.$context.on('click.ContextMenuAction', function() {
                _this.close();
            });
        };

        var ContextMenu = function(selector, options) {
            this.selector = selector;
            this.options = _.extend({}, defaultOptions, options);
            this.init();
        };

        var existingInstances = [];

        ContextMenu.prototype.init = function() {
            this.$context = $('body');

            // jQuery object of the rendered context menu. Not part of the DOM yet.
            this.$menu = renderMenu(this);

            /* append the context menu to <body> to be able to use "position: absolute"
             * absolute to the whole window. */
            this.$menu.hide().appendTo(this.$context);

            setupOpenEventListeners(this);

            // keep track of all the existing context menu instances in the page
            existingInstances.push(this);
        };

        // open the context menu
        ContextMenu.prototype.open = function($trigger, left, top) {
            var _this = this;

            // first close all open instances of opened context menus in the page
            ContextMenu.closeAll();

            this.$menu.css({ display: 'block', left: left, top: top });

            var $actions = this.$menu.find('[data-action]');

            // clear previousle hidden and disabled actions
            $actions.show().removeClass('disabled');

            /* go through all actions to update which ones to show
             * enabled/disabled and which ones to hide. */
            $actions.each(function() {
                var $action = $(this);

                var actionId = $action.data('action');
                var action = _this.options.actions[actionId];
                var elemData = _this.options.fetchElementData($trigger);

                if (action.isShown && action.isShown(elemData) === false) {
                    $action.hide();
                    return;
                }

                if (action.isEnabled && action.isEnabled(elemData) === false) {
                    $action.addClass('disabled');
                }
            });

            // clear all possible handlers from a previous open event, where an option
            // wasn't selected.
            this.$menu.off('click.ContextMenuAction');

            // handler to run when an option is selected
            this.$menu.on('click.ContextMenuAction', function(evt) {
                evt.preventDefault();

                var $target = $(evt.target);

                // uninstall the current listener
                _this.$menu.off('click.ContextMenuAction');

                var $action = $target.is('[data-action]') ? $target : $target.closest('[data-action]');
                var actionId = $action.data('action');

                // action is disabled, dont do anything
                if ($action.is('.disabled'))
                    return;

                var elemData = _this.options.fetchElementData($trigger);

                /* call the user click handler. It receives the optional user-defined data,
                 * or undefined. */
                _this.options.actions[actionId].onClick(elemData);
            });

            setupCloseEventListeners(this, $trigger);
        };

        // close the context menu
        ContextMenu.prototype.close = function() {
            this.$context.off('.ContextMenuAction');
            this.$menu.hide();
        };

        // close all instances of context menus
        ContextMenu.closeAll = function() {
            _.each(existingInstances, function(contextMenu) {
                contextMenu.close();
            });
        };

        return ContextMenu;
    };

    // Define as an AMD module if possible
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'lodash'], factory);
    }
    // Node/CommonJS
    else if (typeof exports === 'object') {
        factory(require('jquery'), require('lodash'));
    }
    // Otherwise simply initialise as normal, stopping multiple evaluation
    else {
        // check that the module dependencies are defined
        if (typeof jQuery === 'undefined') {
            throw new Error('ContextMenu requires jQuery');
        }
        if (typeof _ === 'undefined') {
            throw new Error('ContextMenu requires lodash');
        }

        // define module only if it doesn't exist yet
        if (typeof ContextMenu === 'undefined') {
            window.ContextMenu = factory(jQuery, _);
        }
    }

})(window);
