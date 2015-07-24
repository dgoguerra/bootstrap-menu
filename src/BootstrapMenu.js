(function(window) {

    var factory = function($, _) {
        'use strict';

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
            var $menu = $('<div class="dropdown bootstrapMenu" style="position:absolute;z-index:1000;" />');

            var $ul = $('<ul class="dropdown-menu" role="menu" style="display:block;position:static;margin-bottom:5px;font-size:0.9em;" />');

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

        function calcMenuPosition(_this, $trigger, event) {
            // the element relative to whom the menu must open
            var elemPos = { left: null, top: null };
            var elemDim = { height: null, width: null };

            switch (_this.options.menuSource) {
                case 'mouse':
                    elemPos.left = event.pageX;
                    /* substract 4 pixels frmo the Y axis when relative to the mouse,
                     * to compensate the dropdown's top margin.
                     * TODO: must only do this when menuPosition is below the element
                     * (currently, always). */
                    elemPos.top = event.pageY - 4;
                    elemDim.height = 0;
                    elemDim.width = 0;
                    break;
                case 'element':
                    elemPos.left = $trigger.offset().left;
                    elemPos.top = $trigger.offset().top;
                    elemDim.height = $trigger.outerHeight();
                    elemDim.width = $trigger.outerWidth();
                    break;
                default:
                    throw new Error("Unknown BootstrapMenu 'menuSource' option");
            }

            var menuDim = {
                height: _this.$menu.outerHeight(),
                width: _this.$menu.outerWidth()
            };

            var menuPos = { left: null, top: null };

            switch (_this.options.menuPosition) {
                case 'belowRight':
                    menuPos.left = elemPos.left + elemDim.width - menuDim.width;
                    menuPos.top = elemPos.top + elemDim.height;
                    break;
                case 'belowLeft':
                    menuPos.left = elemPos.left;
                    menuPos.top = elemPos.top + elemDim.height;
                    break;
                default:
                    throw new Error("Unknown BootstrapMenu 'menuPosition' option");
            }

            return menuPos;
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

                var position = calcMenuPosition(_this, $triggerElem, evt);

                _this.open($triggerElem, position.left, position.top);

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

            /* append the context menu to <body> to be able to use "position: absolute"
             * absolute to the whole window. */
            this.$menu.hide().appendTo(this.$context);

            setupOpenEventListeners(this);

            // keep track of all the existing context menu instances in the page
            existingInstances.push(this);
        };

        // open the context menu
        BootstrapMenu.prototype.open = function($trigger, left, top) {
            var _this = this;

            // first close all open instances of opened context menus in the page
            BootstrapMenu.closeAll();

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

                var elemData = _this.options.fetchElementData($trigger);

                /* call the user click handler. It receives the optional user-defined data,
                 * or undefined. */
                _this.options.actions[actionId].onClick(elemData);
            });

            setupCloseEventListeners(this, $trigger);
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

        return BootstrapMenu;
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
            throw new Error('BootstrapMenu requires jQuery');
        }
        if (typeof _ === 'undefined') {
            throw new Error('BootstrapMenu requires lodash');
        }

        // define module only if it doesn't exist yet
        if (typeof BootstrapMenu === 'undefined') {
            window.BootstrapMenu = factory(jQuery, _);
        }
    }

})(window);
