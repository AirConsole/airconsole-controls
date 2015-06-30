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

Joystick.prototype.onStart = function(pos) {
  var me = this;
  me.base = pos;
  me.start_cb();
};

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

Joystick.prototype.onEnd = function() {
  var me = this;
  me.placeRelative(0, 0);
  me.end_cb();
};

Joystick.prototype.getRelativePos = function(e) {
  var me = this;
  var rect = me.container.getBoundingClientRect();
  return { "x": e.pageX - rect.left, "y": e.pageY - rect.top };
};

Joystick.prototype.placeRelative = function(dx, dy) {
  var me = this;
  if (!me.relative) {
    return;
  }
  var style = me.relative.style;
  style.left = me.distance + dx;
  style.right = me.distance - dx;
  style.top = me.distance + dy;
  style.bottom = me.distance - dy;
};