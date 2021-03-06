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
  Actions are high-level executable behaviours that are typically
  triggered by users and represented as buttons or menus.

  Actions are installed as methods on the class, but contain more
  meta-information than regular methods. Meta-information includes
  information needed to surface to action in a meaningful way to
  users, and includes things like the label to appear in the button
  or menu, a speech-label for i18n, help text, dynamic functions to
  enable or disable and hide or unhide the UI associated with this Action.

  Actions implement the Action Design Pattern.
*/
foam.CLASS({
  package: 'foam.core',
  name: 'Action',

  properties: [
    {
      class: 'String',
      name: 'name',
      required: true
    },
    {
      class: 'String',
      name: 'label',
      expression: function(name) { return foam.String.labelize(name); }
    },
    {
      class: 'String',
      name: 'speechLabel',
      expression: function(label) { return label; }
    },
    {
      class: 'String',
      name: 'help'
    },
    {
      class: 'Boolean',
      name: 'isDefault',
      help: 'Indicates if this is the default action.',
      value: false
    },
    {
      class: 'Function',
      name: 'isAvailable',
      label: 'Available',
      value: function() { return true; },
      help: 'Function to determine if action is available.'
    },
    {
      class: 'Function',
      name: 'isEnabled',
      label: 'Enabled',
      value: function() { return true; },
      help: 'Function to determine if action is enabled.'
    },
    {
      class: 'Function',
      name: 'code',
      required: true,
      value: null
    }
  ],

  methods: [
    function isEnabledFor(data) {
      return foam.Function.withArgs(this.isEnabled, data);
    },

    function createIsEnabled$(data$) {
      var e = foam.core.ExpressionSlot.create({
        code: this.isEnabled
      });

      e.obj$ = data$;
      // e.obj = data$.get();

      return e;
      /*
        // TODO: use when obj$: data$ works.
      return foam.core.ExpressionSlot.create({
        obj$: data$,
        code: this.isEnabled
      });
      */
    },

    function isAvailableFor(data) {
      return foam.Function.withArgs(this.isAvailable, data);
    },

    function createIsAvailable$(data$) {
      var e = foam.core.ExpressionSlot.create({
        code: this.isAvailable
      });

      e.obj$ = data$;
      // e.obj = data$.get();

      return e;
      /*
        // TODO: use when obj$: data$ works.
      return foam.core.ExpressionSlot.create({
        obj$: data$,
        code: this.isAvailable
      });
      */
    },

    function maybeCall(ctx, data) {
      if ( this.isEnabledFor(data) && this.isAvailableFor(data) ) {
        this.code.call(data, ctx, this);
        data.pub('action', this.name, this);
        return true;
      }

      return false;
    },

    function installInClass(c) {
      c.installConstant(this.name, this);
    },

    function installInProto(proto) {
      var action = this;
      proto[this.name] = function() {
        return action.maybeCall(this.__context__, this);
      };
    }
  ]
});


/** Add Action support to Model. */
foam.CLASS({
  refines: 'foam.core.Model',

  properties: [
    {
      class: 'AxiomArray',
      of: 'Action',
      name: 'actions',
      adaptArrayElement: function(o, prop) {
        return typeof o === 'function' ?
            foam.core.Action.create({name: o.name, code: o}) :
            foam.lookup(prop.of).create(o) ;
      }
    }
  ]
});
