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
    function init() {
      if ( ! this.worldDAO ) {
        console.assert("context bad!")
      }
    },

    function remove() {},
    function error() {},
    function eof() {},

    function frameStep(
      /* number // seconds since the last frame  */ ft) {
      var e = this.owner; if ( ! e ) return;
      //if ( ! e  || e.destroyed ) return; // if destroyed before getting processed this frame

      this.frameTime = ft;
      this.move();
      this.collide();
      e.updateSprite();
      this.worldUpdate();
    },

    /** Applies movement and physics calculations required for a frame. */
    function move() {
      /** Changes velocity of the given entity. */
      var ft = this.frameTime;
      var e = this.owner; if ( ! e ) return;
      e.vx += e.ax * ft;
      e.vy += e.ay * ft;
      e.vrotation += e.arotation * ft;

      /** Changes position of the given entity. */
      e.x += e.vx * ft;
      e.y += e.vy * ft;
      e.rotation += e.vrotation * ft;

      e.engine.applyThrust(e);

    },

    function collide() {
      //if ( Math.random() < 0.1 ) { return; }

      // TODO: radius check too
      this.owner.overlappingEntities.select(this);
    },

    function collideWith(o) {

      var e = this.owner; if ( ! e ) return;
      if ( e === o ) return;

      //play impact sound
      //e.audioManager.play("impact", e);

      var nvex = (e.vx * (e.mass - o.mass) + (2 * o.mass * o.vx)) / (e.mass + o.mass);
      var nvey = (e.vy * (e.mass - o.mass) + (2 * o.mass * o.vy)) / (e.mass + o.mass);
      var nvox = (o.vx * (o.mass - e.mass) + (2 * e.mass * e.vx)) / (e.mass + o.mass);
      var nvoy = (o.vy * (o.mass - e.mass) + (2 * e.mass * e.vy)) / (e.mass + o.mass);

      e.vx = nvex;
      e.vy = nvey;
      o.vx = nvox;
      o.vy = nvoy;

    },
    function worldUpdate() {
      var e = this.owner; if ( ! e ) return;
      if ( e.x > 1600+1000 || e.y > 900+1000 || // be default, check for waaay out of bounds
           e.x < -1000 || e.y < -1000 ) {
        e.uninstall();
      } else {
        this.worldDAO.put(e);
      }
    },
  ]
});


foam.CLASS({
  package: 'tabletop',
  name: 'BulletControllerBase',
  extends: 'tabletop.EntityController',
  methods: [
    /** Also check for out of bounds and destroy self */
    function worldUpdate() {
      var e = this.owner; if ( ! e ) return;
      if ( e.x > 1600+100 || e.y > 900+100 ||
           e.x < -100 || e.y < -100 ) {
        e.uninstall();
      } else {
        this.worldDAO.put(e);
      }
    },

    function collideWith(o) {
      this.SUPER(o);
      var e = this.owner; if ( ! e ) return;
      e.x = -99999; // trigger removal
      e.damage.iHitYou(o);
    }
  ]
});
foam.CLASS({
  package: 'tabletop',
  name: 'BulletController',
  extends: 'tabletop.BulletControllerBase',
  axioms: [ foam.pattern.Pooled.create() ],
  methods: [
    function pooledDestroy() {}
  ]
});


foam.CLASS({
  package: 'tabletop',
  name: 'BasicControllerBase',
  extends: 'tabletop.EntityController',
  methods: [
    function worldUpdate() {
      var e = this.owner; if ( ! e ) return;
      var r = e.br*2;
      if ( e.x > 1600+100+r || e.y > 900+100+r ||
           e.x < -100-r || e.y < -100-r ) {
        e.uninstall();
      } else {
        this.worldDAO.put(e);
      }
    },

    function move() {
      var ft = this.frameTime;
      var e = this.owner; if ( ! e ) return;
      /** Changes velocity of the given entity. */
      e.vx += e.ax * ft;
      e.vy += e.ay * ft;
      e.vrotation += e.arotation * ft;

      /** Changes position of the given entity. */
      e.x += e.vx * ft;
      e.y += e.vy * ft;
      e.rotation += e.vrotation * ft;

      e.engine.applyThrust(e);

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
  methods: [
    function pooledDestroy() {}
  ]

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
        var e = this.owner; if ( ! e ) return;
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
    SHOT_COOL_DOWN: 3 // TODO: weapon
  },

  properties: [
    {
      name: 'coolDown',
      factory: function() { return Math.random() * 3; }
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
      var e = this.owner; if ( ! e ) return;
      var b = this.Entity.create({
        x: e.x,
        y: e.y,
        br: 5,
        hull: {basehp:1, currhp: 1},
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
      b.sprite.imageIndex = 'coin';
      b.sprite.scaleX = 0.1;
      b.sprite.scaleY = 0.1;

      this.aimTowards({ x: this.target.x, y: this.target.y }, b, 100, Math.random() * 0.4 - 0.2);
      b.install();
      e.audioManager.play("Laser_Gun", e);
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
  ],
  methods: [
    function pooledDestroy() { this.target = undefined; }
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
  ],
  methods: [
    function pooledDestroy() { this.target = undefined; }
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
    function pooledDestroy() { this.timeToLive = 0.5; },
  ]
});


foam.CLASS({
  package: 'tabletop',
  name: 'CarrierController',
  extends: 'tabletop.BasicControllerBase',
  requires: [
    'tabletop.Entity',
  ],

  constants: {
    SHOT_COOL_DOWN: 4 // TODO: weapon
  },

  properties: [
    {
      name: 'coolDown',
      factory: function() { return Math.random() * 4; }
    },
    {
      name: 'target',
      postSet: function(old,nu) {
        if ( nu ) { nu.onDestroy(this.clearTarget); }
      }
    },
    {
      // enemy wave to create each interval
      name: 'wave',
    }
  ],

  methods: [
    function move() {
      this.SUPER();

      if ( this.wave ) {
        // shoot!
        this.coolDown -= this.frameTime;
        if ( this.coolDown < 0 ) {
          this.coolDown = this.SHOT_COOL_DOWN;
          this.shoot();
        }
      }
    },

    function shoot() {
      var e = this.owner; if ( ! e ) return;
      this.wave && this.wave.install(e.x, e.y);
    }
  ],
});