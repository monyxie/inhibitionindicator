/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

"use strict";

import GObject from 'gi://GObject';
import St from 'gi://St';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {
    addInhibitorChangeListener,
    clearInhibitorChangeListener,
    getInhibitorAppId,
    getInhibitorIds,
    getInhibitorReason
} from "./lib.js";

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _('Inhibition Indicator'));

            this.icon = new St.Icon({
                icon_name: 'face-smile-big-symbolic',
                style_class: 'system-status-icon',
            });

            this.add_child(this.icon);
        }

        updateStatus(isInhibited) {
            this.icon.set_icon_name(isInhibited ? 'face-uncertain-symbolic' : 'face-smile-big-symbolic')
        }

        clearInhibitors() {
            this.menu.removeAll()
        }

        addInhibitor(inhibitor) {
            const item = new PopupMenu.PopupMenuItem(_(inhibitor));
            // item.connect('activate', () => {
            //     Main.notify(_('Whatʼs down, folks?'));
            // });
            this.menu.addMenuItem(item);
        }
    }
);

export default class InhibitionIndicatorExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        addInhibitorChangeListener(() => {
            getInhibitorIds().then((objPaths) => {
                if (!this._indicator) {
                    return;
                }
                this._indicator.updateStatus(!!objPaths.length)
                this._indicator.clearInhibitors()
                for (const objPath of objPaths) {
                    Promise.all([
                        getInhibitorAppId(objPath),
                        getInhibitorReason(objPath),
                    ]).then(([appId, reason]) => {
                        if (!this._indicator) {
                            return;
                        }
                        this._indicator.addInhibitor(appId + ': ' + reason)
                    })
                }
            });
        })
    }

    disable() {
        clearInhibitorChangeListener();
        this._indicator.destroy();
        this._indicator = null;
    }
}
