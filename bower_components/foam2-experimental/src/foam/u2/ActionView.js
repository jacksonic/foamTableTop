/**
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
  package: 'foam.u2',
  name: 'ActionView',
  extends: 'foam.u2.View',

  axioms: [
    foam.u2.CSS.create({code: function() {/*
      ^ {
        -webkit-box-shadow: inset 0 1px 0 0 #ffffff;
        box-shadow: inset 0 1px 0 0 #ffffff;
        background: -webkit-gradient( linear, left top, left bottom, color-stop(0.05, #ededed), color-stop(1, #dfdfdf) );
        background: -moz-linear-gradient( center top, #ededed 5%, #dfdfdf 100% );
        background-color: #ededed;
        -moz-border-radius: 3px;
        -webkit-border-radius: 3px;
        border-radius: 3px;
        border: 1px solid #dcdcdc;
        display: inline-block;
        color: #777777;
        font-family: arial;
        font-size: 12px;
        font-weight: bold;
        margin: 2px;
        padding: 4px 16px;
        text-decoration: none;
        visibility: hidden;
      }

      ^available {
        visibility: visible;
      }

      ^:hover {
        background: -webkit-gradient( linear, left top, left bottom, color-stop(0.05, #dfdfdf), color-stop(1, #ededed) );
        background: -moz-linear-gradient( center top, #dfdfdf 5%, #ededed 100% );
        background-color: #dfdfdf;
      }

      ^ img {
        vertical-align: middle;
      }

      ^:disabled { color: #bbb; -webkit-filter: grayscale(0.8); }
    */}})
  ],

  properties: [
    'action',
    {
      name: 'label',
      expression: function(action) { return action.label; }
    }
  ],

  methods: [
    function initE() {
      this.nodeName = 'button';
      this.
        cssClass(this.myCls()).
        enableCls(this.myCls('available'), this.action.createIsAvailable$(this.data$)).
        attrs({disabled: this.action.createIsEnabled$(this.data$).map(function(e) { return e ? false : 'disabled'; })}).
        on('click', this.click).
        add(this.label$);
    }
  ],

  listeners: [
    function click() {
      this.action.maybeCall(this.__subContext__, this.data);
    }
  ]
});
