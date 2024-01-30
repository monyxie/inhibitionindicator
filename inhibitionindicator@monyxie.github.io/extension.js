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
import Gio from 'gi://Gio';
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
        _init(path) {
            super._init(0.0, _('Inhibition Indicator'));
            this.path = path
            this.icon = new St.Icon({style_class: 'system-status-icon'})
            this._iconYes = Gio.icon_new_for_string(this.path + '/assets/zzz-yes.svg');
            this._iconNo = Gio.icon_new_for_string(this.path + '/assets/zzz-no.svg');
            this._iconUnknown = Gio.icon_new_for_string(this.path + '/assets/zzz-unknown.svg');

            this.icon.gicon = this._iconUnknown;
            this.add_child(this.icon);
        }

        updateStatus(isInhibited) {
            this.icon.gicon = isInhibited ? this._iconNo : this._iconYes;
        }

        clearInhibitors() {
            this.menu.removeAll()
        }

        addInhibitor(inhibitor) {
            const item = new PopupMenu.PopupMenuItem(_(inhibitor));
            this.menu.addMenuItem(item);
        }

        destroy() {
            this.icon.destroy()
            this.icon = null;
            this._iconYes.destroy()
            this._iconYes = null
            this._iconNo.destroy()
            this._iconNo = null
            this._iconUnknown.destroy()
            this._iconUnknown = null
            super.destroy()
        }
    }
);

export default class InhibitionIndicatorExtension extends Extension {
    enable() {
        this._indicator = new Indicator(this.path);
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        addInhibitorChangeListener(() => {
            this.updateInhibitors().catch((e) => {
                console.error(e)
            })
        })


        this.updateInhibitors().catch((e) => {
            console.error(e)
        })
    }

    disable() {
        clearInhibitorChangeListener();
        this._indicator.destroy();
        this._indicator = null;
    }

    async updateInhibitors() {
        let objPaths;
        try {
            objPaths = await getInhibitorIds();
            if (!this._indicator) {
                return;
            }
            this._indicator.updateStatus(!!objPaths.length)
            this._indicator.clearInhibitors()
        } catch (e) {
            console.error(e)
        }

        for (const objPath of objPaths) {
            try {
                const appId = await getInhibitorAppId(objPath);
                const reason = await getInhibitorReason(objPath);
                if (!this._indicator) {
                    return;
                }
                this._indicator.addInhibitor(appId + ': ' + reason)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
