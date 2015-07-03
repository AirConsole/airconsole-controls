/**
 * An object containing a configuration for the Joystick constructor.
 * @typedef {object} JoystickConfig
 * @property {Function} touchstart -
 *           The callback that gets called when the Joystick is touched
 * @property {Joystick~touchMoveCallback} touchmove -
 *           The callback that gets called when the Joystick is moved
 * @property {Function} touchend -
 *           The callback that gets called when the Joystick is released
 * @property {number} distance - The maximum amount of pixels a joystick can be
 *                               moved. Default: 10
 * @property {boolean} log - Debug output iff a callback is not set.
 */

/**
 * A coordinate is an object with an x and y property.
 * @typedef {object} Joystick~Offset
 * @param {number} x - The x offset. A value between -1 and 1;
 * @param {number} y - The y offset. A value between -1 and 1;
 */

/**
 * This callback is called when the direction of a DPad changes.
 * @callback Joystick~touchMoveCallback
 * @param {Joystick~Offset} offset - The offset of the joystick.
 */

/**
 * A coordinate is an object with an x and y property.
 * @typedef {object} Joystick~Coordinate
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 */

/**
 * An analogue relative joystick.
 * @param {HTMLElement|string} el - The HTML container element or its ID.
 * @param {JoystickConfig} opts - Constructor config.
 * @constructor
 */
function Joystick(el, opts) {
  var me = this;
  opts = opts || {}
  me.distance = opts.distance || 10;

  var log_cb = function(name) {
    return function (data) {
      if (!opts.log) {
        return;
      }
      if (window.console && window.console.log) {
        window.console.log("joystick.js " + name + "(" +
                           Array.prototype.slice.call(arguments).join(", ") +
                           ");");
      }
    };
  };

  me.start_cb = opts["touchstart"] || log_cb("touchstart");
  me.move_cb = opts["touchmove"] || log_cb("touchmove");
  me.end_cb = opts["touchend"] || log_cb("touchend");

  if (typeof el == "string") {
    el = document.getElementById(el);
  }

  me.container = el;
  me.relative = me.container.getElementsByClassName("joystick-relative")[0];
  if (me.relative) {
    me.relative.style.position = "absolute";
    me.placeRelative(0, 0);
  }

  me.container.addEventListener("touchstart", function(e) {
    me.onStart(me.getRelativePos(e.touches[0]));
    e.preventDefault();
  });
  me.container.addEventListener("touchmove", function(e) {
    me.onMove(me.getRelativePos(e.touches[0]));
    e.preventDefault();
  });
  me.container.addEventListener("touchend", function(e) {
    me.onEnd();
    e.preventDefault();
  });
  var mouse_down = false;
  if (true) {
    me.container.addEventListener("mousedown", function(e) {
      me.onStart(me.getRelativePos(e));
      mouse_down = true;
      e.preventDefault();
    });
    me.container.addEventListener("mousemove", function(e) {
      if (mouse_down) {
        me.onMove(me.getRelativePos(e));
      }
      e.preventDefault();
    });
    me.container.addEventListener("mouseup", function(e) {
      me.onEnd();
      mouse_down = false;
      e.preventDefault();
    })
  }
  me.distance_sq = Math.pow(me.distance, 2);
}

/**
 * Gets called when the Joystick gets touched
 * @param {Joystick~Coordinate} pos - The position of the initial touch.
 */
Joystick.prototype.onStart = function(pos) {
  var me = this;
  me.base = pos;
  me.container.className += " joystick-active";
  me.start_cb();
};

/**
 * Gets called when the Joystick is moved.
 * @param {Joystick~Coordinate} pos
 */
Joystick.prototype.onMove = function(pos) {
  var me = this;
  var dx = pos.x - me.base.x;
  var dy = pos.y - me.base.y;
  var distance_sq = (dx*dx + dy*dy);
  if (distance_sq > me.distance_sq) {
    var distance = Math.sqrt(distance_sq);
    var normalized_dx = dx / distance;
    var normalized_dy = dy / distance;
    me.base.x = pos.x - normalized_dx * me.distance;
    me.base.y = pos.y - normalized_dy * me.distance;
    dx = pos.x - me.base.x;
    dy = pos.y - me.base.y;
  }
  me.move_cb({"x": dx / me.distance, "y": dy / me.distance});
  me.placeRelative(dx, dy);

};

/**
 * Gets called when the the Joystick is released.
 */
Joystick.prototype.onEnd = function() {
  var me = this;
  me.placeRelative(0, 0);
  me.container.className =
      me.container.className.replace(" joystick-active", "");
  me.end_cb();
};

/**
 * Returns the page offset of an event
 * @param {Event} e - An event
 * @return {Joystick~Coordinate}
 */
Joystick.prototype.getRelativePos = function(e) {
  var me = this;
  var rect = me.container.getBoundingClientRect();
  return { "x": e.pageX - rect.left, "y": e.pageY - rect.top };
};

/**
 * Places the relative joystick element.
 * @param {number} dx - The x offset in pixels
 * @param {number} dy - The y offset in pixels
 */
Joystick.prototype.placeRelative = function(dx, dy) {
  var me = this;
  if (!me.relative) {
    return;
  }
  var style = me.relative.style;
  style.left = (me.distance + dx) + "px";
  style.right = (me.distance - dx) + "px";
  style.top = (me.distance + dy) + "px";
  style.bottom = (me.distance - dy) + "px";
};