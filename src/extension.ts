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

import GObject from "gi://GObject";
import St from "gi://St";
import Gio from "gi://Gio";
import {
    Extension,
    gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import {
    addInhibitorChangeListener,
    cleanUp,
    getInhibitorAppId,
    getInhibitorIds,
    getInhibitorReason,
} from "./lib.js";

class Indicator extends PanelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    protected _menuItems: PopupMenu.PopupMenuItem[] = [];
    protected _path: string;
    protected _icon: St.Icon | null;
    protected _iconYes: Gio.Icon | null;
    protected _iconNo: Gio.Icon | null;
    protected _iconUnknown: Gio.Icon | null;
    // Make tsc stop complaining about PopupDummyMenu not having certain members
    declare menu: PopupMenu.PopupMenu<PopupMenu.PopupMenu.SignalMap>;
    protected _extension: InhibitionIndicatorExtension | null;

    protected _isInhibited: boolean = false;

    protected _handler_ids: number[] = [];

    constructor(extension: InhibitionIndicatorExtension) {
        super(0.0, _("Inhibition Indicator"));
        this._extension = extension;
        this._path = extension.path;
        this._icon = new St.Icon({ style_class: "system-status-icon" });
        this._iconYes = Gio.icon_new_for_string(
            this._path + "/assets/zzz-yes.svg",
        );
        this._iconNo = Gio.icon_new_for_string(
            this._path + "/assets/zzz-no.svg",
        );
        this._iconUnknown = Gio.icon_new_for_string(
            this._path + "/assets/zzz-unknown.svg",
        );

        this._icon.gicon = this._iconUnknown;
        this.add_child(this._icon);

        const handler_id = extension.settings?.connect(
            "changed::hide-indicator-when-not-inhibited",
            () => {
                this.updateStatus(this._isInhibited);
            },
        );
        if (handler_id) {
            this._handler_ids.push(handler_id);
        }
    }

    updateStatus(isInhibited: boolean) {
        const gicon = isInhibited ? this._iconNo : this._iconYes;
        if (this._icon && gicon) {
            this._icon.gicon = gicon;
        }

        if (
            !isInhibited &&
            this._extension
                ?.getSettings()
                ?.get_boolean("hide-indicator-when-not-inhibited") === true
        ) {
            this.visible = false;
        } else {
            this.visible = true;
        }

        this._isInhibited = isInhibited;
    }

    clearInhibitors() {
        this.menu.removeAll();

        // no need to call "destroy()" on the menu items
        // because "menu.removeAll()" already done so

        this._menuItems = [];
    }

    addInhibitor(inhibitor: string) {
        const item = new PopupMenu.PopupMenuItem(inhibitor);
        this._menuItems.push(item);
        this.menu.addMenuItem(item);
    }

    destroy() {
        for (const handle_id of this._handler_ids) {
            this._extension?.settings?.disconnect(handle_id);
        }
        this._handler_ids = [];
        this.clearInhibitors();
        this._icon?.destroy();
        this._icon = null;
        this._iconYes = null;
        this._iconNo = null;
        this._iconUnknown = null;
        super.destroy();
    }
}

export default class InhibitionIndicatorExtension extends Extension {
    protected _settings: Gio.Settings | null = null;
    protected _indicator: Indicator | null = null;
    protected _updateGeneration: number = 0;

    get settings() {
        return this._settings;
    }

    enable() {
        this._settings = this.getSettings();

        const positioningSettings = ["enable-positioning", "position-box", "position-number"];
        for (const setting of positioningSettings) {
            this.settings?.connect(`changed::${setting}`, () =>
                this._handlePositioningChanged(),
            );
        }

        this.createIndicator();

        addInhibitorChangeListener(() => {
            this.updateInhibitors();
        });

        this.updateInhibitors();
    }

    _handlePositioningChanged() {
        this.destroyIndicator();
        this.createIndicator();
        this.updateInhibitors();
    }

    createIndicator() {
        if (!this._indicator) {
            this._indicator = new Indicator(this);

            // uuid: inhibitionindicator@monyxie.github.io
            if (this._settings?.get_boolean("enable-positioning")) {
                const boxMap = {
                    0: "left",
                    1: "center",
                    2: "right",
                };

                const positionNumber =
                    this._settings?.get_int("position-number");
                const boxNumber = this._settings?.get_int("position-box");
                const box =
                    boxNumber in boxMap
                        ? boxMap[boxNumber as 0 | 1 | 2]
                        : "right";
                Main.panel.addToStatusArea(
                    this.uuid,
                    this._indicator,
                    positionNumber,
                    box,
                );
            } else {
                Main.panel.addToStatusArea(this.uuid, this._indicator);
            }
        }
    }

    disable() {
        cleanUp();
        this.destroyIndicator();
        this._settings = null;
    }

    destroyIndicator() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }

    async updateInhibitors() {
        const generation = ++this._updateGeneration;
        
        try {
            const objPaths = await getInhibitorIds();
            
            const promises = objPaths.map((objPath) =>
                Promise.all([
                    getInhibitorAppId(objPath),
                    getInhibitorReason(objPath),
                ]),
            );
            const settled = await Promise.allSettled(promises);
            const inhibitors = settled
                .filter(
                    (r): r is PromiseFulfilledResult<[string, string]> =>
                        r.status === "fulfilled",
                )
                .map((r) => r.value);
            const inhibited = !!inhibitors.length;

            // No awaits past this point.
            if (!this._indicator || generation !== this._updateGeneration) {
                return;
            }

            this._indicator.updateStatus(inhibited);
            this._indicator.clearInhibitors();
            
            for (const [appId, reason] of inhibitors) {
                this._indicator.addInhibitor(appId + ": " + reason);
            }
        } catch (e) {
            console.error(e);
        }
    }
}
