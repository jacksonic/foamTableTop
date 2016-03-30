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

/** Manages a pool of objects */
foam.CLASS({
  package: 'foam.core',
  name: 'ObjectPool',
  
  properties: [
    {
      /** model for new pool objects */
      name: 'of',
    },
    {
      /** Creation arguments for new objects, and args to 
        reset returned objects. */
      name: 'resetArgs',
    },
    {
      name: 'pool_',
      factory: function() { return []; }
    }
  ],
  methods: [
    function pop(opt_args) {
      var ret;
      var pool = this.pool_;
      if ( pool.length > 0 ) {
        ret = pool.splice(-1, 1)[0];
      } else {
        // nothing available, create a new one.
        ret = this.of.create(this.resetArgs, this);
      }
      if ( opt_args ) {
        for (var key in opt_args) {
          ret[key] = opt_args[key];
        }
      }
      if ( ! ret.id ) { ret.id = ret.$UID; } // if no ID, use $UID
      return ret;
    },
    function push(obj) {
      this.reset_(obj);
      this.pool_.push(obj);
    },
    function reset_(obj) {
      var args = this.resetArgs;
      for (var key in args) {
        obj[key] = args[key];
      }
    }
  ]
});

