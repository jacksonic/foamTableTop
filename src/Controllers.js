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
  imports: [
    'worldDAO',
    'worldWidth',
    'worldHeight',
  ],

  properties: [
    {
      name: 'owner',
    },
    {
      class: 'Simple',
      name: 'frameTime',
    }
  ],

  listeners: [
    {
      name: 'put',
      code: function(o) {
        this.collideWith(o);
      },
    }
  ],
  methods: [
    function remove() {},
    function error() {},
    function eof() {},
    
    function frameStep(
      /* number // seconds since the last frame  */ ft) {
      this.frameTime = ft;
      this.move();
      this.collide();
      this.owner.updateSprite();
      this.worldUpdate();
    },

    /** Applies movement and physics calculations required for a frame. */
    function move() {
      /** Changes velocity of the given entity. */
      var ft = this.frameTime;
      var e = this.owner;
      e.vx += e.ax * ft;
      e.vy += e.ay * ft;
      e.vrotation += e.arotation * ft;

      /** Changes position of the given entity. */
      e.x += e.vx * ft;
      e.y += e.vy * ft;
      e.rotation += e.vrotation * ft;
    },

    function collide() {
      //if ( Math.random() < 0.1 ) { return; }

      // TODO: radius check too
      this.owner.overlappingEntities.select(this);
    },

    function collideWith(o) {
      var ft = this.frameTime;
      var e = this.owner;
      if ( e === o ) return;

      //play impact sound
      e.audioManager.play("impact", e);

      // position angle
      var ax = e.x - o.x, ay = e.y - o.y;
      var len = (Math.sqrt(ax*ax+ay*ay) || 1);
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
    function worldUpdate() {
      this.worldDAO.put(this.owner);
    }
  ]
});


foam.CLASS({
  package: 'tabletop',
  name: 'BulletController',
  extends: 'tabletop.EntityController',
  axioms: [ foam.pattern.Pooled.create() ],
  methods: [
    /** Also check for out of bounds and destroy self */
    function worldUpdate() {
      var e = this.owner;
      if ( e.x > 1600+100 || e.y > 900+100 ||
           e.x < -100 || e.y < -100 ) {
        e.uninstall();
      } else {
        // don't update, since nothing needs to collide with us
        //this.worldDAO.put(e);
      }
    },

    function collideWith(o) {
      var ft = this.frameTime;
      var e = this.owner;
      if ( e === o ) return;

      // don't collide with other bullets // TODO: select specific world planes
      //if ( e.cls_.isInstance(o) || tabletop.PlayerEntity.isInstance(o) ) return;

      //TODO: hurt o

      //play impact sound
      e.audioManager.play("impact", e);
      e.damage.iHitYou(e, o);

      // position angle
      var ax = e.x - o.x, ay = e.y - o.y;
      var len = (Math.sqrt(ax*ax+ay*ay) || 1);
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
  axioms: [ foam.pattern.Pooled.create() ],
  methods: [
    function worldUpdate() {
      var e = this.owner;
      if ( e.x > 1600+100 || e.y > 900+100 ||
           e.x < -100 || e.y < -100 ) {
        e.uninstall();
      } else {
        this.worldDAO.put(e);
      }
    },
    
    function move() {
      var ft = this.frameTime;
      var e = this.owner;
      /** Changes velocity of the given entity. */
      e.vx += e.ax * ft;
      e.vy += e.ay * ft;
      e.vrotation += e.arotation * ft;

      /** Changes position of the given entity. */
      e.x += e.vx * ft;
      e.y += e.vy * ft;
      e.rotation += e.vrotation * ft;

      // if ( e.x > 1600+100 || e.y > 900+100 ||
      //      e.x < -100 || e.y < -100 ) {
      //   var cx = 1600 / 2 - 25;
      //   var cy = 900 / 2 - 25;
      //   e.vx = 0;
      //   e.vy = 0;
      //   switch (Math.floor(Math.random() * 4)) {
      //   case 0:
      //     e.x = -100;
      //     e.y = cy + Math.random() * 50;
      //     e.ax = 40 + Math.random()*50;
      //     e.ay = 0;
      //     e.rotation = Math.PI*1.5;
      //     break;
      //   case 1:
      //     e.x = 1600 + 100;
      //     e.y = cy + Math.random() * 50;
      //     e.ax = -(40 + Math.random()*50);
      //     e.ay = 0;
      //     e.rotation = Math.PI*0.5;
      //     break;
      //   case 2:
      //     e.y = -80;
      //     e.x = cx + Math.random() * 50;
      //     e.ax = 0;
      //     e.ay = 40 + Math.random()*50;
      //     e.rotation = Math.PI;
      //     break;
      //   case 3:
      //     e.y = 900 + 100;
      //     e.x = cx + Math.random() * 50;
      //     e.ax = 0;
      //     e.ay = -(40 + Math.random()*50);
      //     e.rotation = 0;
      //     break;
      //   };
      // }
    },
    function collide() {

    }
  ]
});



