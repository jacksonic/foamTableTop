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


/*foam.CLASS({
  package: 'tabletop',
  name: 'AudioHolder',
  requires: [
    'tabletop.Audio',
  ],
  exports: [
    'audioLib',
  ],
  properties: [
    {
      name: 'audioLib',
      factory: function() {
        return new Object();
      }
    },
  ],
  methods: [
    function init() {
      this.audioLib.impact = (this.Audio.create({
        ident: 'impact',
        instances: 3,
        src: 'src/assets/impact.mp3',
        vol: 0.3,
      });
    }
  ],
  listeners: [
});*/
foam.CLASS({
  package: 'tabletop',
  name: 'AudioManager',
  implements: ['foam.mlang.Expressions'],
  requires: [
    'tabletop.Audio',
    'foam.dao.ArrayDAO',
    'foam.dao.ArraySink',
    'foam.mlang.sink.Map',
  ],
  exports: [
    'audioMap',
  ],
  properties: [
    {
      /** The group of managed sounds */
      name: 'audioMap',
      factory: function() {
        return {};
      }
    }
  ],
  methods: [
    function init() {
      this.audioMap['impact'] = this.Audio.create({
        ident: 'impact',
        instances: 3,
        src: 'src/assets/impact.mp3',
        vol: 0.05,
        cooldown: 75,
      });
      this.audioMap['Laser_Gun'] = this.Audio.create({
        ident: 'Laser_Gun',
        instances: 3,
        src: 'src/assets/Laser_Gun.mp3',
        vol: 0.3,
        cooldown: 75,
      });
      this.audioMap['Big_Explosion_Cut_Off'] = this.Audio.create({
        ident: 'Big_Explosion_Cut_Off',
        instances: 10,
        src: 'src/assets/Big_Explosion_Cut_Off.mp3',
        vol: 0.3,
        cooldown: 75,
      });
    },
    function play(soundname, soundorigin) {
      var aud = this.audioMap[soundname];
      aud.playInstance(soundorigin === "startup");
    },
  ],
});
/**
  Base class for audio players.
*/
foam.CLASS({
  package: 'tabletop',
  name: 'Audio',
  properties: [
    { /** identifier */
      name: 'ident',
    },
    { /** max simultaneous instances of that sound */
      name: 'instances',
      value: 4,
    },
    { /** current instance */
      name: 'currentInstance',
      value: 0,
    },
    { /** source file */
      name: 'src',
    },
    { /** playback volume */
      name: 'vol',
      value: 0.5,
    },
    { /** cooldown between plays of the sound */
      name: 'cooldown',
      value: 500,
    },
    { /** time the sound was last played */
      name: 'lastplayed',
      value: 0,
    },
  ],
  methods: [
    function init() { /** adds the required number of audio sources to the HTML */
      //var sources = "";
      for (i = 0; i < this.instances; i++) {
        //sources = sources + '<audio id="' + this.ident + i + '"><source src="' + this.src + '" type="audio/mpeg"></audio>';
        var el = document.createElement('audio');
        el.id = this.ident + i;
        var src = document.createElement('source');
        src.src = this.src;
        src.type = "audio/mpeg";
        el.appendChild(src);
        document.body.appendChild(el);
      }
      //document.body.innerHTML = document.body.innerHTML + sources;
    },
    function playInstance(cmnd) { /** reset the next instance in order and play it, if the sound is off cooldown */
      if (cmnd) {
        for (i = 0; i < this.instances; i++) {
          var startPlay = document.getElementById(this.ident + i);
          startPlay.volume = 0;
          startPlay.play();
        }
      }
      else {
        if (this.lastplayed + this.cooldown < Date.now()) {
          var toBePlayed = document.getElementById(this.ident + this.currentInstance);
          //toBePlayed.pause();
          toBePlayed.currentTime = 0;
          toBePlayed.volume = this.vol;
          toBePlayed.play();
          this.currentInstance++;
          if (this.currentInstance === this.instances) {
            this.currentInstance = 0;
          }
          this.lastplayed = Date.now();
        }
      }
    }
  ],
});
