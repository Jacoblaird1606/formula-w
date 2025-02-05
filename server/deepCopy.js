/* 
 * Copyright 2015 phil.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

function _deepCopyArray(source) {
    var copy = [];
    for (var i = 0; i < source.length; i++) {
        copy.push(_deepCopyAny(source[i]));
    }
    return copy;
}

function _deepCopyObject(source) {
    var copy = {};
    for (var key in source) {
        copy[key] = _deepCopyAny(source[key]);
    }
    return copy;
}

function _deepCopyAny(source) {
    var srcType = typeof source;
    if (srcType === 'undefined' || srcType === 'number' || srcType === 'string')
        return source;
    if (srcType === 'array' || (srcType === 'object' && typeof source.length === 'number' && typeof source.push === 'function'))
        return _deepCopyArray(source);
    if (srcType === 'object')
        return _deepCopyObject(source);
    console.log('Got type ' + srcType);
    return source;
}

module.exports = _deepCopyAny;
