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

/**
  Base class for entities. Includes world position, rendering information, etc.
*/
foam.CLASS({
  package: 'tabletop',
  name: 'Physics',
  requires: [
    'foam.mlang.Expressions as EXPRS',
    'foam.dao.ArraySink',
  ],
  imports: [
    'worldDAO',
    'time',
  ],

  properties: [
    [ 'previousTime', -1 ],
    {
      /** Queries the world for entities with velocity or acceleration above zero */
      name: 'entitesToMoveDAO',
      factory: function() {
        var m = this.EXPRS.create();
        return this.worldDAO.get().where(m.EQ(tabletop.Entity.MOVE_REQUIRED, true));
      }
    },
  ],

  methods: [
    function init() {
      this.previousTime = this.time.get();
      this.time.subscribe(this.runFrame);
    },
  ],

  listeners: [
    {
      name: 'runFrame',
      code: function() {
        // time since last frame computed (in seconds)
        var ft = Math.min((this.time.get() - this.previousTime) / 1000, 0.1);
        this.previousTime = this.time.get();

        var self = this;
//         var c = foam.mlang.sink.Count.create();
//         this.entitesToMoveDAO.select(c);
//         console.log("Moving ",c.value);
        this.entitesToMoveDAO.select({
          put: function(e) {
            e.moveStep(ft);
          },
          remove: function() {},
          error: function() {},
          eof: function() {},
        });
      }
    }
  ]

});
