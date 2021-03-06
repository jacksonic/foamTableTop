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
  name: 'PlayerController',
  extends: 'tabletop.EntityController',
  requires: [
    'tabletop.BulletController',
    'tabletop.Entity',
  ],
  constants: {
    SHOT_COOL_DOWN: 0.15
  },
  properties: [
    [ 'coolDown', 1 ],
    {
      name: 'target',
      factory: function() { return { x: 800, y: 450 }; }
    },


  ],

  methods: [
    /** Applies movement and physics calculations required for a frame. */
    function move() {
      // Doesn't move, no super

      this.coolDown -= this.frameTime;
      if ( this.coolDown < 0 ) {
        this.coolDown = this.SHOT_COOL_DOWN;
        this.shoot();
      }
    },
  ],

  listeners: [
    {
      name: 'shoot',
      code: function() {
        var e = this.owner;
        var b = this.Entity.create({
          x: e.x,
          y: e.y,
          br: 10,
          bplane: 1,
          collisionPlane: 0,
          rotation: e.rotation,
          manager: e,
          controller: this.BulletController.create(),
        });
        b.damage.damaging = true;
        b.damage.hurt = 1;
        b.damage.killed.sub(e.manager.killedSomething);

        // TODO: clean up sprite init
        b.sprite.x = e.x;
        b.sprite.y = e.y;
        b.sprite.rotation = e.rotation;
        b.sprite.imageIndex = 'bullet';
        b.sprite.scaleX = 0.3;
        b.sprite.scaleY = 0.3;

        this.aimTowards({ x: this.target.x, y: this.target.y }, b, 1000, Math.random() * 0.2 - 0.1);
        e.rotation = b.rotation;
        b.install();
        e.audioManager.play("impact", e);
      }
    }
  ]
});


foam.CLASS({
  package: 'tabletop',
  name: 'PlayerManager',
  extends: 'tabletop.EntityManager',
  requires: [
    'tabletop.Entity',
    'tabletop.ImageSprite',
    'tabletop.TextSprite',
    'tabletop.Hull',
    'tabletop.PlayerController'
  ],
  imports: [
    'worldDAO',
    'worldWidth',
    'worldHeight',
  ],
  properties: [
    {
      name: 'main',
      factory: function() {
        var h = this.Hull.create({
          basehp: 10,
          currhp: 10
        });

        var s = this.ImageSprite.create({
          x: this.x,
          y: this.y,
          scaleX: 0.5,
          scaleY: 0.5,
          rotation: this.rotation,
          imageIndex: 'claw',
        });
        var t = this.TextSprite.create({
          y: -55,
          color: 'red'
        });
        t.text$.follow(h.currhp$);
        s.addChild(t);

        var ptsT = this.TextSprite.create({
          y: -30,
          color: 'lightgreen'
        });
        ptsT.text$.follow(this.points$);
        s.addChild(ptsT);

        return this.Entity.create({
          id: 'player' + this.$UID,
          bplane: 3,
          vx: 1,
          br: 40,
          sprite: s,
          hull: h,
          controller: this.PlayerController.create(),
          manager: this
        });
      },
    },
    {
      name: 'points',
      value: 0
    },
    {
      name: 'corner',
      factory: function() { return [0,0]; },
      postSet: function(old,nu) {
        var r;
        if ( nu[0] ) {
          r = nu[1] ? Math.PI * 5/4 : Math.PI * 3/4;
        } else {
          r = nu[1] ? Math.PI * 7/4 : Math.PI * 1/4;
        }


        Math.PI * ( nu[0] ? 1 : -1 ) * ( nu[1] ? 1/4 : 3/4 );

        if ( this.main ) {
          this.main.x = nu[0] ? 1600 - 20 : 20;
          this.main.y = nu[1] ? 900 - 20 : 20;
          this.main.rotation = r;
        }
        this.restartButton.x = nu[0] ? 1600 - 20 : 20;
        this.restartButton.y = nu[1] ? 900 - 20 : 20;
        this.restartButton.rotation = r;
      }
    },
    {
      name: 'restartButton',
      factory: function() {
        var s = this.ImageSprite.create({
          imageIndex: 'greenPlate',
        });
        var t = this.TextSprite.create({
          y: -55,
          text: 'Start',
          color: 'lightgreen'
        });
        s.addChild(t);

        return s;
      },
    }
  ],
  methods: [
    function init() {
      this.main.install();
      this.corner = this.corner;
      this.main.onDestroy(this.clearEntity);
      this.healMe();
    },
    /** Click/tap from user, in world coordinates */
    function clickEvent(x,y) {
      console.log('player click', this.corner, x, y);

      if ( this.main ) {
        this.main.controller.target = { x: x, y: y };
      } else {
        this.reset();
      }
    },

    function reset() {
      this.restartButton.uninstall();
      this.points = 0;
      this.main = undefined;
      this.main.install();
      this.corner = this.corner;
      this.main.onDestroy(this.clearEntity);
    }
  ],
  listeners: [
    {
      name: 'clearEntity',
      code: function() {
        this.main = null;
        this.restartButton.install();
      }
    },
    {
      name: 'healMe',
      code: function() {
        if ( this.main ) {
          this.main.hull.heal(1);
          setTimeout(this.healMe, 5000);
        }
      }
    },
    {
      name: 'killedSomething',
      code: function(_, _, target) {
        //console.log('killed', target);
        this.points += target.hull.basehp;
      }
    }
  ]
});
