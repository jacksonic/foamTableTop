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
 /** Manages a swappable TypeArray buffer of values for quick transfer to/from web workers.
  foam.core.buffer.Property directly stores/gets its values from an allocated space in a buffer. */
foam.CLASS({
  package: 'foam.core.buffer'
  name: 'BufferManager',
  
  properties: [
    {
      name: 'type',
      defaultValue: Float64Array
    },
    {
      name: 'buffer',
      factory: function() {
        return new (this.type)(this.maxSize);
      }
    },
    {
      name: 'maxSize',
      defaultValue: 1000,
    },
    {
      name: 'lastFreeIndex',
      defaultValue: 0
    }
  ],
  methods: [
    function allocate() {
      if (this.lastFreeIndex > this.maxSize) { throw new Error("BufferManager buffer size exeeded");
      return this.lastFreeIndex++;
    },
    // TODO: deallocation... weakmap?
    function set(idx, val) {
      this.buffer[idx] = val;
    },
    function get(idx) {
      return this.buffer[idx];
    }
  ]

})
 

foam.CLASS({
  package: 'foam.core.buffer',
  extends: 'foam.core.Property',
  name: 'Property',
  requires: ['foam.core.buffer.BufferManager'],

  properties: [
    {
      name: 'buffer',
      factory: function() {
        return this.BufferManager.create();
      }
    }
  ],
  methods: [
    function installInProto(proto) {
      var buffer = this.buffer;
      var name = this.name;
      var factory = this.factory;
      var defVal = this.defaultValue;

      // getter and setter pull/insert the value to/from a buffer
      var getter = function() {
        var idx = this.instance_[name];
        if ( ! idx ) { 
          if ( factory ) {
            setter.call(this, factory());
          } else if ( defVal ) {
            return defVal;
          }
        }
        return buffer.get(idx);
      }

      var setter = function(val) {
        var idx = this.instance_[name];
        if ( ! idx ) {
          idx = this.instance_[name] = buffer.allocate();
        }
        buffer.set(idx, val);
      }

      this.getter = getter; // TODO: better way to inject these?
      this.setter = setter;

      this.SUPER(proto);
    }

  ]

})

