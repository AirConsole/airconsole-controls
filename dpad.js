function DPad(el, opts) {
  var me = this;
  opts = opts || {}
  opts.distance = opts.distance || { x: 10, y: 10};
  me.distance = {
    x: opts.distance.x || opts.distance,
    y: opts.distance.y || opts.distance
  };
  me.diagonal = opts.diagonal || false;

  var log_cb = function(name) {
    return function (key, pressed) {
      if (!opts.log) {
        return;
      }
      if (window.console && window.console.log) {
        window.console.log("dpad.js " + name + "(" +
                           Array.prototype.slice.call(arguments).join(", ") +
                           ");");
      }
    };
  };

  me.change_cb = opts["directionchange"] || log_cb("directionchange");
  me.start_cb = opts["touchstart"] || log_cb("touchstart");
  me.end_cb = opts["touchend"] || log_cb("touchend");

  if (typeof el == "string") {
    el = document.getElementById(el);
  }

  me.container = el;
  me.relative = me.container.getElementsByClassName("dpad-relative")[0];
  if (me.relative) {
    me.relative.style.position = "absolute";
    me.placeRelative(0, 0);
  }

  me.container.addEventListener("touchstart", function(e) {
    me.onStart(me.getRelativePos(e.targetTouches[0]));
    e.preventDefault();
  });
  me.container.addEventListener("touchmove", function(e) {
    me.onMove(me.getRelativePos(e.targetTouches[0]));
    e.preventDefault();
  });
  me.container.addEventListener("touchend", function(e) {
    me.onEnd();
    e.preventDefault();
  });
  var mouse_down = false;
  if (!("ontouchstart" in document.createElement("div"))) {
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
  me.state = {};
  me.state[DPad.UP] = false;
  me.state[DPad.DOWN] = false;
  me.state[DPad.LEFT] = false;
  me.state[DPad.RIGHT] = false;
  me.elements = {};
  me.elements[DPad.UP] = el.getElementsByClassName("dpad-arrow-up")[0];
  me.elements[DPad.DOWN] = el.getElementsByClassName("dpad-arrow-down")[0];
  me.elements[DPad.LEFT] = el.getElementsByClassName("dpad-arrow-left")[0];
  me.elements[DPad.RIGHT] = el.getElementsByClassName("dpad-arrow-right")[0];
  me.resetState();
}

DPad.UP = "up";
DPad.DOWN = "down";
DPad.LEFT = "left";
DPad.RIGHT = "right";

DPad.prototype.resetState = function() {
  var me = this;
  me.setState(DPad.UP, false);
  me.setState(DPad.DOWN, false);
  me.setState(DPad.LEFT, false);
  me.setState(DPad.RIGHT, false);
};

DPad.prototype.setState = function(direction, pressed) {
  var me = this;
  if (me.state[direction] != pressed) {
    me.state[direction] = pressed;
    if (me.change_cb) {
      me.change_cb(direction, pressed);
    }
    if (pressed) {
      me.elements[direction].className += " dpad-arrow-active";
    } else {
      me.elements[direction].className =
          me.elements[direction].className.replace(" dpad-arrow-active", "");
    }
    return true;
  }
  return false;
};

DPad.prototype.onStart = function(pos) {
  var me = this;
  me.base = pos;
  me.had_direction = false;
  me.container.className += " dpad-active";
  me.start_cb();
};

DPad.prototype.onMove = function(pos) {
  var me = this;
  var dx = pos.x - me.base.x;
  var dy = pos.y - me.base.y;

  var too_much = Math.max(Math.abs(dx / me.distance.x),
                          Math.abs(dy / me.distance.y), 1);
  dx /= too_much;
  dy /= too_much;

  var eps = 0.999;

  if (dx >= me.distance.x * eps) {
    dx = me.distance.x;
    if (me.setState(DPad.RIGHT, true)) {
      me.had_direction = true;
      if (!me.diagonal) {
        me.base.y = pos.y;
      }
    }
  } else if (dx <= -me.distance.x * eps) {
    dx = -me.distance.x;
    if (me.setState(DPad.LEFT, true) ) {
      me.had_direction = true;
      if (!me.diagonal) {
        me.base.y = pos.y;
      }
    }
  }
  if (dy >= me.distance.y * eps) {
    dy = me.distance.y;
    if (me.setState(DPad.DOWN, true) ) {
      me.had_direction = true;
      if (!me.diagonal) {
        me.base.x = pos.x;
      }
    }
  } else if (dy <= -me.distance.y * eps) {
    dy = -me.distance.y;
    if (me.setState(DPad.UP, true) ) {
      me.had_direction = true;
      if (!me.diagonal) {
        me.base.x = pos.x;
      }
    }
  }
  if (dx <= 0 && me.state[DPad.RIGHT]) {
    me.setState(DPad.RIGHT, false);
  }
  if (dx >= 0 && me.state[DPad.LEFT]) {
    me.setState(DPad.LEFT, false);
  }
  if (dy <= 0 && me.state[DPad.DOWN]) {
    me.setState(DPad.DOWN, false);
  }
  if (dy >= 0 && me.state[DPad.UP]) {
    me.setState(DPad.UP, false);
  }
  me.placeRelative(dx, dy);
};

DPad.prototype.placeRelative = function(dx, dy) {
  var me = this;
  if (!me.relative) {
    return;
  }
  var style = me.relative.style;
  style.left = me.distance.x + dx;
  style.right = me.distance.x - dx;
  style.top = me.distance.y + dy;
  style.bottom = me.distance.y - dy;
};

DPad.prototype.onEnd = function() {
  var me = this;
  me.container.className = me.container.className.replace(" dpad-active", "");
  me.end_cb(me.had_direction);
  me.placeRelative(0, 0);
  me.resetState();
};

DPad.prototype.getRelativePos = function(e) {
  var me = this;
  var rect = me.container.getBoundingClientRect();
  return { "x": e.pageX - rect.left, "y": e.pageY - rect.top };
};
