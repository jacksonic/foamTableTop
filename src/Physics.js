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
        return this.worldDAO.get().where(m.NOT(m.AND(
          m.EQ(tabletop.Entity.VX, 0),
          m.EQ(tabletop.Entity.VY, 0),
          m.EQ(tabletop.Entity.AX, 0),
          m.EQ(tabletop.Entity.AY, 0),
          m.EQ(tabletop.Entity.AROTATION, 0),
          m.EQ(tabletop.Entity.VROTATION, 0)
        )));
      }
    },
    {
      /** Retains results of entitesToMoveDAO select for the frame */
      name: 'entitiesToMoveSink',
      factory: function() {
        return this.ArraySink.create();
      }
    }
  ],

  methods: [
    function init() {
      this.previousTime = this.time.get();
      this.time.subscribe(this.runFrame);
    },

    function applyAccel(/* tabletop.Entity // the entity to alter */ ent,
                        /* number // the ms time since the last frame */ ft) {
      /** Changes velocity of the given entity. */
      ent.vx += ent.ax * ft;
      ent.vy += ent.ay * ft;
      ent.vrotation += ent.arotation * ft;
    },
    function applyVelocity(ent, ft) {
      /** Changes position of the given entity. */
      ent.x += ent.vx * ft;
      ent.y += ent.vy * ft;
      ent.rotation += ent.vrotation * ft;
    },
    function applyMovement(ent, ft) {
      /** Changes processes collisions or other results of changed position. */
      // TODO: collision check and entity reaction


      this.worldDAO.get().put(ent);
    },
  ],

  listeners: [
    {
      name: 'runFrame',
      //isMerged: true,
      //mergeDelay: 32,
      //isFramed: true,
      code: function() {
        // time since last frame computed (in seconds)
        var ft = Math.min((this.time.get() - this.previousTime) / 1000, 0.1);
        this.previousTime = this.time.get();

        var entsToMove = this.entitiesToMoveSink;
        entsToMove.a = []; // quick reset

        this.entitesToMoveDAO.select(entsToMove);

        // iterate over the results and process their movement
        var e;
        for (var i = 0; i < entsToMove.a.length; ++i) {
          e = entsToMove.a[i];
          this.applyAccel(e, ft);
          this.applyVelocity(e, ft);
          this.applyMovement(e, ft);
        }
      }
    }
  ]

});
