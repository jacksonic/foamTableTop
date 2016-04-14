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
  implements: ['tabletop.Physics'],
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
      var vlen = (Math.sqrt(dx*dx+dy*dy) || 1);
      var massDist = e.mass / o.mass;

      e.vx +=  ax * vlen / massDist;
      e.vy +=  ay * vlen / massDist;
      o.vx += -ax * vlen * massDist;
      o.vy += -ay * vlen * massDist;
    },
    function worldUpdate() {
      this.worldDAO.put(this.owner);
    }
  ]
});


foam.CLASS({
  package: 'tabletop',
  name: 'BulletControllerBase',
  extends: 'tabletop.EntityController',
  methods: [
    /** Also check for out of bounds and destroy self */
    function worldUpdate() {
      var e = this.owner;
      if ( e.x > 1600+100 || e.y > 900+100 ||
           e.x < -100 || e.y < -100 ) {
        e.uninstall();
      } else {
        this.worldDAO.put(e);
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
      e.damage.iHitYou(o);

      // position angle
      var ax = e.x - o.x, ay = e.y - o.y;
      var len = (Math.sqrt(ax*ax+ay*ay) || 1);
      ax = ax / len; // normal vector for direction between the ents
      ay = ay / len;

      // velocity based
      var dx = (e.vx - o.vx),
          dy = (e.vy - o.vy);
      var vlen = (Math.sqrt(dx*dx+dy*dy) || 1);
      var massDistrib = e.mass / o.mass;
      e.x = 9999999; // remove self

      o.vx = -ax * vlen * massDistrib;
      o.vy = -ay * vlen * massDistrib;
    }
  ]
});
foam.CLASS({
  package: 'tabletop',
  name: 'BulletController',
  extends: 'tabletop.BulletControllerBase',
  axioms: [ foam.pattern.Pooled.create() ],
  methods: [
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
  ],
});


foam.CLASS({
  package: 'tabletop',
  name: 'BasicControllerBase',
  extends: 'tabletop.EntityController',
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

    },
    function collide() {

    }
  ]
});

foam.CLASS({
  package: 'tabletop',
  name: 'BasicController',
  extends: 'tabletop.BasicControllerBase',
  axioms: [ foam.pattern.Pooled.create() ],
});

foam.CLASS({
  package: 'tabletop',
  name: 'TargetingControllerTrait',
  
  properties: [
    {
      name: 'target',
      postSet: function(old,nu) {
        if ( nu ) { nu.onDestroy(this.clearTarget); }
      }
    }
  ],
  
  methods: [
    function move() {
      if ( this.target ) { 
        var e = this.owner;
        this.rotateTowards(this.target, e);
        e.engine.applyThrust(e); 
      }
      this.SUPER();
    },
  ],
  listeners: [
    {
      name: 'clearTarget',
      code: function() {
        this.target = null;
      }
    }
  ]
});

foam.CLASS({
  package: 'tabletop',
  name: 'AwesomeShotControllerTrait',
  requires: [
    'tabletop.Entity',
    'tabletop.BulletController'
  ],

  constants: {
    SHOT_COOL_DOWN: 2 // TODO: weapon
  },
  
  properties: [
    {
      name: 'coolDown',
      factory: function() { return Math.random() * 2; }
    },
    {
      name: 'target',
      postSet: function(old,nu) {
        if ( nu ) { nu.onDestroy(this.clearTarget); }
      }
    }
  ],
  
  methods: [
    function move() {
      this.SUPER();
      
      if ( this.target ) { 
        // shoot!
        this.coolDown -= this.frameTime;
        if ( this.coolDown < 0 ) {
          this.coolDown = this.SHOT_COOL_DOWN;
          this.shoot();
        }
      }
    },
    
    function shoot() {
      var e = this.owner;
      var b = this.Entity.create({
        x: e.x,
        y: e.y,
        br: 3,
        bplane: e.bplane,
        collisionPlane: this.target.bplane,
        rotation: e.rotation,
        manager: e,
        controller: this.BulletController.create(),
      });
      b.damage.damaging = true;
      b.damage.hurt = 1; // TODO: weapon 
      
      // TODO: clean up sprite init
      b.sprite.x = e.x;
      b.sprite.y = e.y;
      b.sprite.rotation = e.rotation;
      b.sprite.imageIndex = 2;
      b.sprite.scaleX = 0.2;
      b.sprite.scaleY = 0.2;
      
      this.aimTowards({ x: this.target.x, y: this.target.y }, b, 400, Math.random() * 0.4 - 0.2);
      b.install();
      e.audioManager.play("impact", e);
    }
  ],
  listeners: [
    {
      name: 'clearTarget',
      code: function() {
        this.target = null;
      }
    }
  ]
});

foam.CLASS({
  package: 'tabletop',
  name: 'TargetPlayerController',
  extends: 'tabletop.BulletControllerBase',
  implements: [
    'tabletop.TargetingControllerTrait'
  ],
  axioms: [ foam.pattern.Pooled.create() ],
  imports: [
    'players',
  ],
  properties: [
    {
      name: 'target',
      factory: function() {
        return this.players[Math.floor(Math.random()*4)].main; // random player
      }
    }
  ]
  
});

foam.CLASS({
  package: 'tabletop',
  name: 'ShootPlayerController',
  extends: 'tabletop.BasicControllerBase',
  implements: [
    'tabletop.AwesomeShotControllerTrait'
  ],
  axioms: [ foam.pattern.Pooled.create() ],
  imports: [
    'players',
  ],
  properties: [
    {
      name: 'target',
      factory: function() {
        return this.players[Math.floor(Math.random()*4)].main; // random player
      }
    }
  ]
  
});



foam.CLASS({
  package: 'tabletop',
  name: 'ExplodingController',
  extends: 'tabletop.EntityController',
  axioms: [ foam.pattern.Pooled.create() ],
  
  properties: [
    {
      /** time until uninstall() of this entity */
      name: 'timeToLive',
      value: 0.5,
    },
  ],
  
  methods: [
    function worldUpdate() {
      this.timeToLive -= this.frameTime;
      if ( this.timeToLive < 0 ) {
        this.owner.uninstall();
      }
    },
    function collide() { },
  ]
});