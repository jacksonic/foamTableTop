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
  name: 'EntityController',
  imports: [ 'worldDAO' ],
  axioms: [ foam.pattern.Singleton ],

  constants: {
    ENTITY_SINK: {
      put: null,
      remove: function() {},
      error: function() {},
      eof: function() {},
    },
  },

  methods: [
    function frameStep(
      /* tabletop.Entity // the entity to adjust */ e,
      /* number // seconds since the last frame  */ ft) {
      this.move(e, ft);
      this.collide(e, ft);
      e.updateSprite();
      this.worldUpdate(e);
    },

    /** Applies movement and physics calculations required for a frame. */
    function move(e, ft) {
      /** Changes velocity of the given entity. */
      e.vx += e.ax * ft;
      e.vy += e.ay * ft;
      e.vrotation += e.arotation * ft;

      /** Changes position of the given entity. */
      e.x += e.vx * ft;
      e.y += e.vy * ft;
      e.rotation += e.vrotation * ft;
    },

    function collide(e, ft) {
      var collideWith = this.collideWith;
      // TODO: radius check too
      var s = Object.create(this.ENTITY_SINK);
      s.put = function(o) {
        collideWith(e, o, ft);
      }
      e.overlappingEntities.select(s);
    },

    function collideWith(e, o, ft) {
      if ( e === o ) return;

      //play impact sound
      e.audioManager.play("impact", e);

      // position angle
      var ax = e.x - o.x, ay = e.y - o.y;
      var len = Math.sqrt(ax*ax+ay*ay) || 1;
      ax = ax / len; // normal vector for direction between the ents
      ay = ay / len;

      // velocity based
      var dx = (e.vx - o.vx),
          dy = (e.vy - o.vy);
      var vlen = (Math.sqrt(dx*dx+dy*dy) || 1) / 2;

      e.vx = (ax * vlen);
      e.vy = (ay * vlen);
      o.vx = -ax * vlen;
      o.vy = -ay * vlen;
    },

    function worldUpdate(e) {
      this.worldDAO.put(e);
    }
  ]
});


foam.CLASS({
  package: 'tabletop',
  name: 'BulletController',
  extends: 'tabletop.EntityController',
  methods: [
    /** Also check for out of bounds and destroy self */
    function worldUpdate(e) {
      if ( e.x > 1100 || e.y > 800 || e.x < -100 || e.y < -100 ) {
        //e.destroy();
        e.manager && e.manager.returnToPool(e);
      } else {
        this.SUPER(e);
      }
    },

    function collideWith(e, o, ft) {
      if ( e === o ) return;

      // don't collide with other bullets // TODO: select specific world planes
      if ( e.cls_.isInstance(o) || tabletop.PlayerEntity.isInstance(o) ) return;

      //TODO: hurt o

      //play impact sound
      e.audioManager.play("impact", e);

      // position angle
      var ax = e.x - o.x, ay = e.y - o.y;
      var len = Math.sqrt(ax*ax+ay*ay) || 1;
      ax = ax / len; // normal vector for direction between the ents
      ay = ay / len;

      // velocity based
      var dx = (e.vx - o.vx),
          dy = (e.vy - o.vy);
      var vlen = (Math.sqrt(dx*dx+dy*dy) || 1) / 2;

      e.x = 9999999; // remove self

      o.vx = -ax * vlen;
      o.vy = -ay * vlen;
    }
  ]
});


foam.CLASS({
  package: 'tabletop',
  name: 'BasicController',
  extends: 'tabletop.EntityController',
  methods: [
    /** Also check for out of bounds and destroy self */
    function move(e, ft) {
      this.SUPER(e, ft);

      if ( e.x > 1100 || e.y > 800 || e.x < -100 || e.y < -100 ) {
        //e.destroy();
        //e.manager.returnToPool(e);
        e.vx = 0;
        e.vy = 0;
        switch (Math.floor(Math.random() * 4)) {
        case 0:
          e.x = -100;
          e.y = 350 + Math.random() * 50;
          e.ax = 40 + Math.random()*50;
          e.ay = 0;
          e.rotation = Math.PI*1.5;
          break;
        case 1:
          e.x = 1100;
          e.y = 350 + Math.random() * 50;
          e.ax = -(40 + Math.random()*50);
          e.ay = 0;
          e.rotation = Math.PI*0.5;
          break;
        case 2:
          e.y = -80;
          e.x = 500 + Math.random() * 50;
          e.ax = 0;
          e.ay = 40 + Math.random()*50;
          e.rotation = Math.PI;
          break;
        case 3:
          e.y = 800;
          e.x = 500 + Math.random() * 50;
          e.ax = 0;
          e.ay = -(40 + Math.random()*50);
          e.rotation = 0;
          break;
        };
      }
    },
    function collide() {

    }
  ]
});



