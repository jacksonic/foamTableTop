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
  package: 'foam.util',
  name: 'Timer',

  properties: [
    {
      class: 'Int',
      name: 'interval',
      help: 'Interval of time between updating time.',
      // units: 'ms',
      value: 10
    },
    {
      class: 'Int',
      name: 'i',
      value: 0
    },
    {
      class: 'Float',
      name: 'timeWarp',
      value: 1.0
    },
    {
      class: 'Int',
      name:  'duration',
      units: 'ms',
      value: -1
    },
    {
      class: 'Float',
      name: 'percent',
      value: 0
    },
    {
      class: 'Int',
      name:  'startTime',
      value: 0
    },
    {
      class: 'Int',
      name:  'time',
      help:  'The current time in milliseconds since epoch.',
      adapt: function(_, t) { return Math.ceil(t); },
      value: 0
    },
    {
      class: 'Int',
      name:  'second',
      help:  'The second of the current minute.',
      value: 0
    },
    {
      class: 'Int',
      name:  'minute',
      help:  'The minute of the current hour.',
      value: 0
    },
    {
      class: 'Int',
      name:  'hour',
      help:  'The hour of the current day.',
      value: 0
    },
    {
      class: 'Boolean',
      name: 'isStarted',
      hidden: true
    },
    {
      class: 'Int',
      name: 'startTime_',
      hidden: true
    }
  ],

  actions: [
    {
      name:  'start',
      help:  'Start the timer.',
      isEnabled:   function(isStarted) { return ! isStarted; },
      code:        function() { this.isStarted = true; this.tick(); }
    },
    {
      name:  'step',
      help:  'Step the timer.',
      code: function()      {
        this.i++;
        this.time  += this.interval * this.timeWarp;
        this.second = this.time /    1000 % 60 << 0;
        this.minute = this.time /   60000 % 60 << 0;
        this.hour   = this.time / 3600000 % 24 << 0;
      }
    },
    {
      name:  'stop',
      help:  'Stop the timer.',
      isEnabled:   function(isStarted) { return isStarted; },
      code:        function() { this.isStarted = false; }
    }
  ],

  listeners: [
    {
      name: 'tick',
      isFramed: true,
      code: function(e) {
        if ( ! this.isStarted ) return;

        var prevTime = this.startTime_;
        this.startTime_ = Date.now();
        this.interval = Math.min(100, this.startTime_ - prevTime);
        this.step();
        this.tick();
      }
    }
  ]
});
