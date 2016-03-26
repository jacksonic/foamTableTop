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
    'id',
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
  if ( ev.data.puts ) { ev.data.puts.forEach(function(o) {  
    var json = foam.json.parseString(o);
    json.buffer = bufferF64;
    var e = foam.json.parse(json);
  
    copies.push(e);

    //console.log('Message received from main script', e);
  }); }
  if ( ev.data.bufXfer ) {
    //console.log('backbuffer xfer');
    backBuffer = ev.data.bufXfer;
  }
  if ( ev.data.bufferRequest ) {
    //console.log('buffer request');
    var backBuffer = new Float64Array(bufferF64.buffer.length);
    backBuffer.set(bufferF64.buffer); // copy buffer contents
    postMessage({ bufXfer: backBuffer.buffer }, [backBuffer.buffer]); // transfer copy
  }
}

setInterval(function() {
  for(var i = 0; i < copies.length; ++i) {
    var o = copies[i];
    o.a += 1;
    o.b *= 0.99;
    o.c -=1;
  }
}, 16);

