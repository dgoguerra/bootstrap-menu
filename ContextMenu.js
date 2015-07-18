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
            menuPosition: 'mouse'
        };

        var ContextMenu = function(options) {
            this.options = _.extend({}, defaultOptions, options);
            this.init();
        };

        var renderMenu = function(actions, groupsArr) {
            var $menu = $('<div class="dropdown" style="position:absolute;z-index:1000;" />');

            var $ul = $('<ul class="dropdown-menu" role="menu" style="display:block;position:static;margin-bottom:5px;" />');

            // se agrupa las acciones según groupsArr, para poner un separador entre cada grupo.
            var actionsGroups = [];

            // grupo por defecto donde irán todas las acciones
            actionsGroups[0] = [];

            // se crea el resto de grupos que se ha dado
            _.each(groupsArr, function(groupArr, ind) {
                actionsGroups[ind+1] = [];
            });

            _.each(actions, function(action, actionId) {
                var addedToGroup = false;

                _.each(groupsArr, function(groupArr, ind) {
                    if (_.contains(groupArr, actionId)) {
                        actionsGroups[ind+1].push(actionId);
                        addedToGroup = true;
                    }
                });

                if (addedToGroup == false) {
                    actionsGroups[0].push(actionId);
                }
            });

            var isFirstNonEmptyGroup = true;

            _.each(actionsGroups, function(actionsIds) {
                if (actionsIds.length == 0)
                    return;

                if (isFirstNonEmptyGroup == false) {
                    $ul.append('<li class="divider"></li>');
                }
                isFirstNonEmptyGroup = false;

                _.each(actionsIds, function(actionId) {
                    var action = actions[actionId];
                    $ul.append('<li role="presentation" data-action="'+actionId+'"><a href="#" role="menuitem">'+action.name+'</a></li>');
                });
            });

            return $menu.append($ul);
        };

        var calcMenuPosition = function(event, $triggerElem) {
            var position = { left: null, top: null };

            switch (this.options.menuPosition) {
                case 'mouse':
                    position.left = event.offsetX + $triggerElem.offset().left;
                    position.top = event.offsetY + $triggerElem.offset().top;
                    break;

                case 'belowElemLeft':
                    position.left = $triggerElem.offset().left + $triggerElem.outerWidth();
                    position.top = $triggerElem.offset().top + $triggerElem.outerHeight();
                    break;

                case 'belowElemRight':
                    position.left = $triggerElem.offset().left + $triggerElem.outerWidth();
                    position.top = $triggerElem.offset().top + $triggerElem.outerHeight();

                    position.left -= this.$menu.outerWidth();
                    break;
            };

            return position;
        };

        ContextMenu.prototype.init = function() {
            var _this = this;

            this.$body = $('body');

            // el context menu.
            this.$menu = renderMenu(this.options.actions, this.options.actionsGroups);
            //this.$menu = $(this.options.menuSelector);

            /* se mueve el context menu a <body>, para poder usar "position: absolute"
             * absoluto a toda la página */
            this.$menu.hide().appendTo(this.$body);

            // el evento con el que se abre el context menu
            var menuEvent = this.options.menuEvent || 'contextmenu';

            // instalar handler para todos los futuros elementos
            // en los que se abrirá el context menu
            this.$body.on(menuEvent, this.options.triggersSelector, function(evt) {
                var $triggerElem = $(this);

                var position = calcMenuPosition.call(_this, evt, $triggerElem);

                _this.open($triggerElem, position.left, position.top);

                // cancelar propagación del evento, para evitar que suba hasta $body
                // y se cierre el context menu como si se hubiera pinchado fuera.
                return false;
            });
        };

        // abrir el context menu dado un evento
        ContextMenu.prototype.open = function($trigger, left, top) {
            var _this = this;

            this.$menu.css({ display: 'block', left: left, top: top });

            /* se valida las opciones para ver cuáles mostrar y cuáles no
             * para el trigger actual.
             */
            var $actions = this.$menu.find('[data-action]');

            $actions
                .show()
                .removeClass('disabled')
                .each(function() {
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

            // limpiar los handlers que pueda haber de una ejecución anterior, en la que
            // no se haya llegado a seleccionar una acción.
            this.$menu.off('click.ContextMenuAction');

            /* Handler para gestionar las acciones cuando se selecciona una. */
            this.$menu.on('click.ContextMenuAction', function(evt) {
                evt.preventDefault();

                var $target = $(evt.target);

                // se desinstala el listener actual
                _this.$menu.off('click.ContextMenuAction');

                var $action = $target.is('[data-action]') ? $target : $target.closest('[data-action]');
                var actionName = $action.data('action');

                var elemData = _this.options.fetchElementData($trigger);

                /* llamar al handler del usuario. Se le pasa el nombre de la acción
                 * que se ha llamado, y los datos del trigger para el que se ha
                 * abierto el context menu. */
                _this.options.actions[actionName].onClick(elemData);
            });

            // si se pincha fuera del contextmenu, cerrarlo
            this.$body.on('click.ContextMenuAction', function() {
                _this.close();
            });
        };

        // cerrar el context menu actual
        ContextMenu.prototype.close = function() {
            this.$body.off('.ContextMenuAction');
            this.$menu.hide();
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
