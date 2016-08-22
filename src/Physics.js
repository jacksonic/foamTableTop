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
  package: 'tabletop',
  name: 'Point',
  extends: 'foam.geo.Point',
  
  axioms: [ foam.pattern.Pooled.create() ],
  
  properties: [
    {
      class: 'Simple',
      name: 'x'
    },
    {
      class: 'Simple',
      name: 'y'
    },
    {
      class: 'Simple',
      name: 'plane'
    }
  ],
  methods: [
    function getAxisNames() { return [ 'x' , 'y', 'plane' ]; },
    function toArray() { return [ this.x , this.y, this.plane ]; },
    function map(fn) {
      /** Copies this, calls supplied fn with each axis value and Property */
      var ret = this.clone();
      ret['x'] = fn(this.x, this.X);
      ret['y'] = fn(this.y, this.Y);
      ret['plane'] = fn(this.plane, this.PLANE);
      return ret;
    }
  ]
});
foam.CLASS({
  package: 'tabletop',
  name: 'PointProxy',
  extends: 'foam.geo.Point',
  
  properties: [
    {
      name: 'x',
      getter: function() { return this.source_.x + (this.offset_ || 0); },
      setter: function(v) {  },
    },
    {
      name: 'y',
      getter: function() { return this.source_.y + (this.offset_ || 0); },
      setter: function(v) {  },
    },
    {
      /** Returns the set value if any, or the proxied value from source_ */
      name: 'plane',
      getter: function() {
        return ( typeof this.instance_.plane == 'undefined' ) ? 
          this.source_.plane : this.instance_.plane;
      },
    },
    {
      class: 'Simple',
      name: 'source_',
    },
    {
      class: 'Simple',
      name: 'offset_',
    }
  ],
  methods: [
    function getAxisNames() { return [ 'x' , 'y', 'plane' ]; },
    function toArray() { return [ this.x , this.y, this.plane ]; },
    function map(fn) {
      /** Copies this, calls supplied fn with each axis value and Property */
      var ret = this.clone();
      ret['x'] = fn(this.x, this.X);
      ret['y'] = fn(this.y, this.Y);
      ret['plane'] = fn(this.plane, this.PLANE);
      return ret;
    },
    
    function sub() {
      return this.source_.sub.apply(this.source_, arguments);
    }
  ]
});

foam.CLASS({
  package: 'tabletop',
  name: 'RadialBoundingBox',
  extends: 'foam.geo.BoundingBox',
  
  requires: ['tabletop.PointProxy'],
  
  properties: [
    {
      class: 'Float',
      name: 'radius',
    },
    {
      of: 'foam.geo.Point',
      name: 'location',
    },
    {
      name: 'upper',
      expression: function(location, radius) {
        if ( ! location ) return undefined;
        var ret = this.PointProxy.create({ source_: location, offset_: radius });
        return ret;
      }
    },
    {
      name: 'lower',
      expression: function(location, radius) {
        if ( ! location ) return undefined;
        var ret = this.PointProxy.create({ source_: location, offset_: -radius });
        return ret;
      }
    },
  ]
});

foam.CLASS({
  package: 'tabletop',
  name: 'ProxyBoundingBox',
  extends: 'foam.geo.BoundingBox',
  
  requires: ['tabletop.PointProxy'],
  
  properties: [
    {
      name: 'source',
    },
    {
      name: 'overridePlane',
    },
    {
      name: 'upper',
      expression: function(source, overridePlane) {
        var ret = this.PointProxy.create({ source_: source.upper });
        if ( typeof this.overridePlane !== 'undefined' ) ret.plane = this.overridePlane;
        return ret;
      }
    },
    {
      name: 'lower',
      expression: function(source, overridePlane) {
        var ret = this.PointProxy.create({ source_: source.lower });
        if ( typeof this.overridePlane !== 'undefined' ) ret.plane = this.overridePlane;
        return ret;
      }
    },
  ]
});


/** implement this trait to gain some physics functions */
foam.CLASS({
  package: 'tabletop',
  name: 'Physics',

  methods: [
    function rotateTowards(target, e, opt_angleAdjust) {
      var dx = target.location.x - e.location.x;
      var dy = target.location.y - e.location.y;
      var theta = Math.atan2(dy,dx);

      theta = theta + (opt_angleAdjust || 0);

      e.rotation = theta;
    },
    function aimTowards(target, e, velocity, opt_angleAdjust) {
      var dx = target.location.x - e.location.x;
      var dy = target.location.y - e.location.y;
      var theta = Math.atan2(dy,dx);
      //var r     = Math.sqrt(dx*dx+dy*dy);
      //r = r < 0 ? Math.max(-velocity, r) : Math.min(velocity, r);
      var r = velocity;

      theta = theta + (opt_angleAdjust || 0);

      e.vx = r*Math.cos(theta);
      e.vy = r*Math.sin(theta);
      e.rotation = theta;
    },
    // function accelerateTowards(target, e, velocity, opt_angleAdjust) {
    //   var dx = target.x - e.x;
    //   var dy = target.y - e.y;
    //   var theta = Math.atan2(dy,dx);
    //   //var r     = Math.sqrt(dx*dx+dy*dy);
    //   //r = r < 0 ? Math.max(-velocity, r) : Math.min(velocity, r);
    //   var r = velocity;
    //
    //   theta = theta + (opt_angleAdjust || 0);
    //
    //   e.ax = r*Math.cos(theta);
    //   e.ay = r*Math.sin(theta);
    //   e.rotation = -theta;
    // },

  ],

});

