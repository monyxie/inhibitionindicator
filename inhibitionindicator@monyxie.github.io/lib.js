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

import Gio from 'gi://Gio';

/** @type {DBusConnection|null} */
let bus;

function getBus() {
    if (!bus) {
        // Get the session D-Bus
        bus = Gio.bus_get_sync(Gio.BusType.SESSION, null);
    }
    return bus;
}

/**
 * @returns {Promise<string>}
 */
export function getInhibitorAppId(objectPath) {
    return new Promise((resolve, reject) => {
        getBus().call(
            'org.gnome.SessionManager',
            objectPath,
            'org.gnome.SessionManager.Inhibitor',
            'GetAppId',
            null,
            null,
            Gio.DBusCallFlags.NONE,
            -1,
            null,
            (conn, res) => {
                const data = conn.call_finish(res)
                if (data) {
                    resolve(data.get_child_value(0).get_string()[0])
                } else {
                    reject("D-Bus call failed")
                }
            }
        );
    })
}

/**
 * @returns {Promise<string>}
 */
export function getInhibitorReason(objectPath) {
    return new Promise((resolve, reject) => {
        getBus().call(
            'org.gnome.SessionManager',
            objectPath,
            'org.gnome.SessionManager.Inhibitor',
            'GetReason',
            null,
            null,
            Gio.DBusCallFlags.NONE,
            -1,
            null,
            (conn, res) => {
                const data = conn.call_finish(res)
                if (data) {
                    resolve(data.get_child_value(0).get_string()[0])
                } else {
                    reject("D-Bus call failed")
                }
            }
        );
    })
}


/**
 * @returns {Promise<string[]>}
 */
export function getInhibitorIds() {
    return new Promise((resolve, reject) => {
        getBus().call(
            'org.gnome.SessionManager',
            '/org/gnome/SessionManager',
            'org.gnome.SessionManager',
            'GetInhibitors',
            null,
            null,
            Gio.DBusCallFlags.NONE,
            -1,
            null,
            (conn, res) => {
                // data type string: (ao)
                const data = conn.call_finish(res)
                if (data) {
                    resolve(data.get_child_value(0).get_objv())
                } else {
                    reject("D-Bus call failed")
                }
            }
        );
    })
}


/** @type {number|null} */
let addedSubId = null;
/** @type {number|null} */
let removedSubId = null;
/** @type {Array<() => void>} */
const listeners = []

/**
 * @param callback () => void
 */
export function addInhibitorChangeListener(callback) {
    listeners.push(callback)
    if (!addedSubId) {
        addedSubId = getBus().signal_subscribe(
            'org.gnome.SessionManager',
            'org.gnome.SessionManager',
            'InhibitorAdded',
            '/org/gnome/SessionManager',
            null,
            null,
            () => {
                for (const cb of listeners) {
                    cb()
                }
            }
        );
    }
    if (!removedSubId) {
        removedSubId = getBus().signal_subscribe(
            'org.gnome.SessionManager',
            'org.gnome.SessionManager',
            'InhibitorRemoved',
            '/org/gnome/SessionManager',
            null,
            null,
            () => {
                for (const cb of listeners) {
                    cb()
                }
            }
        );
    }
}

export function clearInhibitorChangeListener() {
    listeners.splice(0)
    if (addedSubId) {
        getBus().signal_unsubscribe(addedSubId)
        addedSubId = null
    }
    if (removedSubId) {
        getBus().signal_unsubscribe(removedSubId)
        removedSubId = null
    }
}
