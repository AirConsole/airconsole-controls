var CtrlGenerator = (function() {
  var id_counter = 0;
  var airconsole_obj = null;
  var debug = false;

  var left_ele = document.getElementById('left');
  var middle_ele = document.getElementById('middle');
  var right_ele = document.getElementById('right');

  var Element = {
    left: left_ele,
    middle: middle_ele,
    right: right_ele
  };

  var Type = {
    DPad: 'DPad',
    Joystick: 'Joystick',
    ButtonVertical: 'Button'
  };

  var GeneratorMap = {};
  GeneratorMap[Type.DPad] = generatePad;
  GeneratorMap[Type.Joystick] = generatePad;
  GeneratorMap[Type.ButtonVertical] = generateButtonVertical;

  /**
   * Helper function to clone an element (deep clone)
   * @param {Type.~} type - The element type
   * @return {HTMLElement}
   */
  function cloneElement(type) {
    var ele = document.getElementById('template-' + type).cloneNode(true);
    ele.id = type + "-" + (++id_counter);
    return ele;
  }

  /**
   * Create DPad or Joystick
   * @param {Object} config
   * @param {Element.~} ele - The side element (left, middle or right)
   * @param {Options} side_options - All options of the side
   */
  function generatePad(config, ele, side_options) {
    var dpad_ele = cloneElement(config.type);
    ele.appendChild(dpad_ele);

    var params = config.opts || {};
    var id = config.key || dpad_ele.id;

    if (config.type === Type.DPad) {
      if (!params.directionchange) {
        params.directionchange = function(key, pressed) {
          sendInputEvent(id, pressed, { direction: key });
        }
      }
    }

    if (config.type === Type.Joystick) {
      if (!params.touchmove) {
        params.touchmove = function(point) {
          sendInputEvent(id, true, point);
        }
      }

      if (!params.touchend) {
        params.touchend = function() {
          if (config.on_up_message) {
            sendInputEvent(id, false);
          }
        }
      }
    }

    var obj = new window[config.type](dpad_ele, params);
  }

  /**
   * Create button elements
   * @param {Object} config
   * @param {Element.~} ele - The side element (left, middle or right)
   * @param {Options} side_options - All options of the side
   */
  function generateButtonVertical(config, ele, side_options) {
    var num_of_buttons = side_options.length;
    var height = Math.round(100 / num_of_buttons);

    var button_ele = cloneElement(config.type);
    button_ele.style.height = height + "%";
    var button_text = button_ele.getElementsByClassName('button-text')[0];
    button_text.innerHTML = config.label;
    ele.appendChild(button_ele);

    // AirConsole send methods
    var params = config.opts || {};

    if (!params.down) {
      params.down = function() {
        sendInputEvent(config.key, true);
      }
    }
    if (!params.up) {
      params.up = function() {
        if (config.on_up_message) {
          sendInputEvent(config.key, false);
        }
      }
    }

    var obj = new window[config.type](button_ele, params);
  }

  /**
   * Send AirConsole message
   * @param {String} key - An identifier for the input element
   * @param {Boolean} pressed - If pressed or released
   * @param {Options} params - Additional params
   */
  function sendInputEvent(key, pressed, params) {
    params = params || {};
    var message = {
      key: key,
      pressed: pressed,
      params: params
    };

    if (!airconsole_obj) {
      console.warn("You have to call CtrlGenerator.setAirConsole and pass the airconsole instance!");
    } else {
      if (debug) {
        console.info("Send", message);
      }
      airconsole_obj.message(airconsole_obj.SCREEN, message);
    }
  }

  return {
    Type: Type,
    Element: Element,
    sendInputEvent: sendInputEvent,

    /**
     * Set to true to have debug output in the console
     * @param {Boolean} state
     */
    debug: function(state) {
      debug = state;
      if (state) {
        console.info("CTRL DEBUG MODE ACTIVATED - press some buttons :)");
      }
      return this;
    },

    /**
     * Sets the airconsole object
     * @param {AirConsole} airconsole - The instanciated AirConsole object
     */
    setAirConsole: function(airconsole) {
      airconsole_obj = airconsole;
      return this;
    },

    /**
     * Generates the controller by passed config
     * @param {Object} config
     */
    generate: function (config) {
      for (var side in config) {
        var opts = config[side];
        var ele = Element[side];

        if (!(opts instanceof Array)) {
          opts = [opts];
        }

        for (var i = 0; i < opts.length; i++) {
          var opt = opts[i];
          if (!opt.type || !GeneratorMap[opt.type]) {
            throw "You passed an unknow type in the config properties. Use one of CtrlGenerator.Type.*";
          }
          GeneratorMap[opt.type](opt, ele, opts);
        }
      }
    }
  };
})();
