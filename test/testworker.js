/*
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

FOAM_BOOT_PATH = "../../vjlofvhjfgm/src/core/";
importScripts(
  "../../vjlofvhjfgm/src/core/foam.js",
  "../../vjlofvhjfgm/src/lib/dao.js",
  "../../vjlofvhjfgm/src/lib/mlang.js",
  "../src/dao/SpatialDAO.js",
  "../src/core/ArrayBuffer.js"
);

var bufferF64 = foam.core.buffer.BufferManager.create();
var copies = [];

foam.CLASS({
  name: 'BufUser',
  properties: [
    [ 'buffer', bufferF64 ], // could alternatively be imported
    {
      class: 'foam.core.buffer.Property',
      name: 'a',
      buffer: 'buffer'
    },
    {
      class: 'foam.core.buffer.Property',
      name: 'b',
      buffer: 'buffer',
      defaultValue: 99.8
    },
    {
      class: 'foam.core.buffer.Property',
      name: 'c',
      buffer: 'buffer',
      factory: function() { return Date.now() / 1000; }
    }
  ]
});

onmessage = function(ev) {
  var json = foam.json.parseString(ev.data);
  json.buffer = bufferF64;
  var e = foam.json.parse(json);
  console.log('Message received from main script', e);
  e.describe();
  
  copies.push(e);
  
  console.log(bufferF64.buffer);

}