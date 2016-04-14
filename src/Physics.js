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

/** implement this trait to gain some physics functions */
foam.CLASS({
  package: 'tabletop',
  name: 'Physics',

  methods: [
    function rotateTowards(target, e, opt_angleAdjust) {
      var dx = target.x - e.x;
      var dy = target.y - e.y;
      var theta = Math.atan2(dy,dx);

      theta = theta + (opt_angleAdjust || 0);

      e.rotation = theta;
    },
    function aimTowards(target, e, velocity, opt_angleAdjust) {
      var dx = target.x - e.x;
      var dy = target.y - e.y;
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

