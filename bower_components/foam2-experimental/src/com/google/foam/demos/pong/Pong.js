/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
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
  package: 'com.google.foam.demos.pong',
  name: 'Ball',
  extends: 'foam.graphics.Circle',

  implements: [
    'foam.physics.Physical',
//    'foam.graphics.MotionBlur'
  ],

  properties: [
    {
      name: 'vx',
      preSet: function(_, v) { return Math.sign(v) * Math.max(5, Math.abs(v)); }
    }
  ]
});


foam.CLASS({
  package: 'com.google.foam.demos.pong',
  name: 'Paddle',
  extends: 'foam.graphics.Circle',

  implements: [
    'foam.physics.Physical',
//    'foam.graphics.Shadow'
  ],

  properties: [
    [ 'color', 'white' ],
    [ 'radius', 30 ],
    {
      name: 'mass',
      factory: function() { return this.INFINITE_MASS; }
    }
  ]
});


foam.CLASS({
  package: 'com.google.foam.demos.pong',
  name: 'Pong',
  extends: 'foam.graphics.Box',

  requires: [
    'com.google.foam.demos.pong.Ball',
    'com.google.foam.demos.pong.Paddle',
    'foam.graphics.Box',
    'foam.graphics.CView',
    'foam.graphics.Label',
    'foam.physics.PhysicsEngine'
  ],

  constants: {
    PADDLE_SPEED: 10
  },

  properties: [
    [ 'color', 'lightgray' ],
    [ 'width',  800 ],
    [ 'height', 300 ],
    {
      name: 'ball',
      factory: function() { return this.Ball.create({color: 'white', radius: 20}); }
    },
    {
      name: 'lPaddle',
      factory: function() { return this.Paddle.create(); }
    },
    {
      name: 'rPaddle',
      factory: function() { return this.Paddle.create(); }
    },
    {
      class: 'Int',
      name: 'lScore'
    },
    {
      class: 'Int',
      name: 'rScore'
    },
    {
      name: 'collider',
      factory: function() { return this.PhysicsEngine.create(); }
    }
  ],

  listeners: [
    {
      name: 'onBallMove',
      isFramed: true,
      code: function() {
        var ball = this.ball;

        if ( ball.velocity >  20 ) ball.velocity =  20;
        if ( ball.velocity < -20 ) ball.velocity = -20;

        // Bounce off of top wall
        if ( ball.y - ball.radius <= 0 ) {
          ball.vy = Math.abs(ball.vy);
        }
        // Bounce off of bottom wall
        if ( ball.y + ball.radius >= this.height ) {
          ball.vy = -Math.abs(ball.vy);
        }
        // Bounce off of left wall
        if ( ball.x <= 0 ) {
          this.rScore++;
          ball.x = 150;
          ball.vx *= -1;
        }
        // Bounce off of right wall
        if ( ball.x >= this.width ) {
          this.lScore++;
          ball.x = this.width - 150;
          ball.vx *= -1;
        }
        // Reset scores
        if ( this.lScore == 100 || this.rScore == 100 ) {
          this.lScore = this.rScore = 0;
        }
      }
    }
  ],

  actions: [
    {
      name: 'lUp',
//      keyboardShortcuts: [ 'q' ],
      code: function() { this.lPaddle.y -= this.PADDLE_SPEED; }
    },
    {
      name: 'lDown',
//      keyboardShortcuts: [ 'a' ],
      code: function() { this.lPaddle.y += this.PADDLE_SPEED; }
    },
    {
      name: 'rUp',
//      keyboardShortcuts: [ 38 /* up arrow */ ],
      code: function() { this.rPaddle.y -= this.PADDLE_SPEED; }
    },
    {
      name: 'rDown',
//      keyboardShortcuts: [ 40 /* down arrow */ ],
      code: function() { this.rPaddle.y += this.PADDLE_SPEED; }
    }
  ],

  methods: [
    function init() {
      this.SUPER();

      var lScoreLabel = this.Label.create({
        text$: this.lScore$,
        align: 'center',
        x: this.width/4,
        y: 25,
        color: 'white',
        font: '70px Arial',
        width: 200,
        height: 70});

      var rScoreLabel = this.Label.create({
        text$: this.rScore$,
        align: 'center',
        x: this.width/2,
        y: 25,
        color: 'white',
        font: '70px Arial',
        width: 200,
        height: 70});

      this.addChildren(
          this.Box.create({x: this.width/2-5, width:10, height: this.height, border:'rgba(0,0,0,0)' , color: 'white'}),
          this.ball,
          lScoreLabel,
          rScoreLabel,
          this.lPaddle,
          this.rPaddle);

      // Position Paddles
      this.lPaddle.x = 25+this.lPaddle.radius;
      this.rPaddle.x = this.width-25-this.rPaddle.radius;
      this.lPaddle.y = this.rPaddle.y = this.height/2-this.rPaddle.radius;

      // Setup Ball
      this.ball.x  = 110;
      this.ball.y  = this.rPaddle.y;
      this.ball.vx = this.ball.vy = 10;

      this.ball.x$.sub(this.onBallMove);

      // Setup Physics
      this.collider.add(this.ball, this.lPaddle, this.rPaddle).start();
    }
  ]
});
