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

 // Create a buffer and a model that uses it
 var bufferF64 = foam.core.buffer.BufferManager.create({ maxSize: 3000 });
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
 // var bufUser1 = BufUser.create();
 // var bufUser2 = BufUser.create();
 // bufUser1.describe();
 // bufUser2.describe();
 // console.log(bufferF64.buffer);
 //
 // // do some setting
 // bufUser1.a = 1;
 // bufUser1.b = 2;
 // bufUser1.c = 3;
 // bufUser1.describe();
 // console.log(bufferF64.buffer);
 
 //make worker
 var worker = new Worker('testworker.js');
 worker.onmessage = function(ev) {
   if ( ev.data.bufXfer ) {
     bufferF64.buffer = new Float64Array(ev.data.bufXfer);
   }
 }
 
 var copies = [];
 var copiesJSON = [];
 for (var i = 0; i < 999; ++i) {
   copies.push(BufUser.create({
     buffer: bufferF64,
     id: i,
     a: i*2,
     b: i*3,
     c: i*4
   }));
   copiesJSON.push(copies[i].toJSON());
 }
 worker.postMessage( { puts: copiesJSON } );
 
 var outEl = document.getElementById('outputElement');
 var renderFn = function() {
   var text = "Some Values:\n";
   for (var i = 0; i < 10; ++i) {
     var o = copies[i];
     text += o.id + ": " + o.a + ", " + o.b + ", " + o.c + "\n";
   }
   outEl.innerHTML = text;
   worker.postMessage( { bufferRequest: true } );
   requestAnimationFrame(renderFn);
 };
 renderFn();
 
 