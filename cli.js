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

'use strict';

import GLib from 'gi://GLib';

import {
    addInhibitorChangeListener,
    getInhibitorAppId,
    getInhibitorIds,
    getInhibitorReason,
} from './inhibitionindicator@monyxie.github.io/lib.js';

const mainLoop = new GLib.MainLoop(null, false);

function printInhibitors() {
    getInhibitorIds().then((objPaths) => {
        console.log('Number of inhibitors: ' + objPaths.length);
        for (const objPath of objPaths) {
            Promise.all([
                getInhibitorAppId(objPath),
                getInhibitorReason(objPath),
            ]).then(([appId, reason]) => {
                console.log(appId + ': ' + reason);
            });
        }
    });
}

printInhibitors();

addInhibitorChangeListener(() => {
    printInhibitors();
});

mainLoop.run();
