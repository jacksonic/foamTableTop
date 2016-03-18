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
      defaultValue: 4,
    },
    { /** current instance */
      name: 'currentInstance',
      defaultValue: 0,
    },
    { /** source file */
      name: 'src'
    },
    { /** playback volume */
      name: 'vol'
    },
  ],

  methods: [
    function init() {
      var sources = "";
      for (i = 0; i < this.instances; i++) {
        sources = sources + '<audio id="' + this.ident + i + '"><source src="' + this.src + '" type="audio/mpeg"></audio>';
      }
      document.body.innerHTML = document.body.innerHTML + sources;
    },
    function playInstance() {
      var toBePlayed = document.getElementById(this.ident + this.currentInstance);
      toBePlayed.pause();
      toBePlayed.currentTime = 0;
      toBePlayed.volume = this.vol;
      toBePlayed.play();
      this.currentInstance++;
      if (this.currentInstance === this.instances) {
        this.currentInstance = 0;
      }
    }
  ],
});
var impact = tabletop.Audio.create({ident: 'impact', instances: 3, src: 'assets/impact.mp3', vol: 0.3,});