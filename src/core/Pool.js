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


foam.CLASS({
  package: 'foam.pattern',
  name: 'Pooled',
  axioms: [ foam.pattern.Singleton.create() ],
  
  methods: [
    function installInClass(cls) {
      // TODO: global for now, but could be anywhere that is 'per-process' and can
      // be accessed for clearing out pools when desired
      if ( ! foam.__FOAM_objectPools__ ) { foam.__FOAM_objectPools__ = {}; }
      var pool = foam.__FOAM_objectPools__[cls];
      if ( ! pool ) {
        pool = foam.__FOAM_objectPools__[cls] = [];
      }
      
      var oldCreate = cls.create;
      cls.create = function(args, X) {
      
        var nu;
        if ( pool.length ) {
          nu = pool.splice(-1, 1)[0];
          nu.destroyed = false;
          nu.initArgs(args, X);
          nu.init && nu.init();
        } else {
          nu = oldCreate.apply(this, arguments); 
        }  
        return nu;
      }
      
      var oldDestroy = cls.prototype.destroy;
      cls.prototype.destroy = function() {
        if ( this.destroyed ) return;

        // Run destroy process on the object, but leave its privates empty but intact
        // to avoid reallocating them
        var inst_ = this.instance_;
        var priv_ = this.private_; 
        
        oldDestroy.apply(this, arguments);

        for ( var ikey in inst_ ) { delete inst_[ikey]; }
        for ( var pkey in priv_ ) { delete priv_[pkey]; }
          
        this.instance_ = inst_;  
        this.private_ = priv_;
        
        // put the empty husk into the pool
        pool.push(this);
      }
    },
  ]  
});
