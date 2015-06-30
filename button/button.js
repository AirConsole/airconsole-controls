function Button(el, opts) {
  var me = this;
  opts = opts || {}

  var log_cb = function(name) {
    return function () {
      if (!opts.log) {
        return;
      }
      if (window.console && window.console.log) {
        window.console.log("button.js " + name);
      }
    };
  };

  me.down_cb = opts["down"] || log_cb("down");
  me.up_cb = opts["up"] || log_cb("up");

  if (typeof el == "string") {
    el = document.getElementById(el);
  }

  me.container = el;

  me.container.addEventListener("touchstart", function(e) {
    me.down();
    e.preventDefault();
  });
  me.container.addEventListener("touchmove", function(e) {
    e.preventDefault();
  });
  me.container.addEventListener("touchend", function(e) {
    me.up();
    e.preventDefault();
  });
  if (!("ontouchstart" in document.createElement("div"))) {
    me.container.addEventListener("mousedown", function(e) {
      me.down();
    });
    me.container.addEventListener("mouseup", function(e) {
      me.up();
    })
  }
}

Button.prototype.down = function() {
  this.container.className += " button-active";
  this.down_cb();
};


Button.prototype.up = function() {
  this.container.className
  this.container.className =
      this.container.className.replace(" button-active", "");
  this.up_cb();
};