/**
 * An object containing a configuration for the RateLimiter constructor.
 * @typedef {object} RateLimiterConfig
 * @property {number|undefined} rate_limit - Maximum amount of AirConsole calls
 *           per second. Default is 25. Max is 25.
 * @property {number|undefined} no_rate_limit_for_first_calls - You can disable
 *           rate limiting for the first X calls during one second.
 *           The following calls will be slower during the first second, so we
 *           do not burst over the rate_limit. Default is 2. Max is 5.
 */


/**
 * The Rate Limiter helps you to send less than 25 messages per second.
 * It does this for messages and Custom Device States.
 * It sends data immediately in the beginning and then starts
 * rate limiting if the rate is too high: It merges the data together and
 * sends it in intervals so the rate limit is not exceeded.
 *
 * This is how the merging works when requests start being rate limited:
 * If you send { "a": 1, "b": 2 } and then {"a": 3, "c": 4}, the actual rate
 * limited message is merged to { "a": 3, "b": 2, "c": 4 }.
 * Note that all fields are present, but "a" was overwritten by a later
 * call while "b" was untouched by the later call and "c" was added
 * by the later call.
 *
 * Also note that because data might be delayed through rate limiting,
 * custom device states might not be immediately updated in the airconsole
 * object. Just use RateLimiter.getCustomDeviceState(device_id) instead which
 * merges the pending data of device states and returns up-to-date data.
 *
 * @param airconsole - The AirConsole object
 * @param airconsole - The constructor configuration.
 * @constructor
 */
function RateLimiter(airconsole, opts) {
  opts = opts || {};
  this.airconsole = airconsole;
  this.pending = {};
  this.rate = {};
  this.timeout = {};
  this.running_at_limit = {};
  this.rate_limit = Math.min(opts.rate_limit || 25, 25);
  this.no_rate_limit_for_first_calls = Math.min(
      opts.no_rate_limit_for_first_calls || 2, 5);
}

/**
 * This is the rate-limited version of AirConsole.message(device_id, data).
 * @param device_id
 * @param data
 */
RateLimiter.prototype.message = function(device_id, data) {
  var rate_limit_id = device_id;
  if (device_id == undefined) {
    rate_limit_id = "";
  }
  if (this.pending[rate_limit_id] == undefined) {
    this.pending[rate_limit_id] = [];
  }
  for (var i = 0; i < this.pending[rate_limit_id].length; ++i) {
    var pending = this.pending[rate_limit_id][i];
    if (pending.action == "message" && pending.device_id == device_id) {
      this.mergeData_(data, pending.data);
      this.send_(rate_limit_id);
      return;
    }
  }
  this.pending[rate_limit_id].push({
    action: "message",
    device_id: device_id,
    data: data
  });
  this.send_(rate_limit_id);
}

/**
 * Rate-limited version of AirConsole.broadcast(device_id).
 * @param data
 */
RateLimiter.prototype.broadcast = function(data) {
  this.message(undefined, data);
}

/**
 * Rate-limited version of AirConsole.setCustomDeviceState(data).
 * @param data
 */
RateLimiter.prototype.setCustomDeviceState = function(data) {
  this.setCustomDeviceState_(data, true);
}

/**
 * Rate-limited version of AirConsole.setCustomDeviceStateProperty(key, value).
 * @param data
 */
RateLimiter.prototype.setCustomDeviceStateProperty = function(key, value) {
  var data = {};
  data[key] = value;
  this.setCustomDeviceState_(data);
}

/**
 * Returns the up-to-date Custom Device State of a device, even if the data
 * was not yet sent. Equivalent to AirConsole.getCustomDeviceState(device_id)
 * without rate-limiting.
 * @param device_id
 * @returns {*}
 */
RateLimiter.prototype.getCustomDeviceState = function(device_id) {
  var me = this;
  if ((device_id == undefined || device_id == me.airconsole.getDeviceId()) &&
      this.pending[""]) {
    for (var i = 0; i < this.pending[""].length; ++i) {
      var pending = this.pending[""][i];
      if (pending.action == "custom") {
        if (pending.clear) {
          return pending.data;
        }
        var copy = {};
        var existing = me.airconsole.getCustomDeviceState();
        if (existing) {
          this.mergeData_(existing, copy);
        }
        this.mergeData_(pending.data, copy);
        return copy;
      }
    }
  }
  return me.airconsole.getCustomDeviceState(device_id);
}

// ---------------------- ONLY PRIVATE FUNCTIONS BELLOW ----------------------

/**
 * @param data
 * @param clear
 * @private
 */
RateLimiter.prototype.setCustomDeviceState_ = function(data, clear) {
  if (this.pending[""] == undefined) {
    this.pending[""] = [];
  }
  for (var i = 0; i < this.pending[""].length; ++i) {
    var pending = this.pending[""][i];
    if (pending.action == "custom") {
      if (clear) {
        pending.data = data;
        pending.clear = true;
      } else {
        this.mergeData_(data, pending.data);
      }
      this.send_("");
      return;
    }
  }
  this.pending[""].push({
    action: "custom",
    data: data,
    clear: clear
  });
  this.send_("");
}

/**
 * @param add
 * @param data
 * @private
 */
RateLimiter.prototype.mergeData_ = function(add, data) {
  for (var key in add) {
    if (add.hasOwnProperty(key)) {
      data[key] = add[key];
    }
  }
}

/**
 * @private
 */
RateLimiter.prototype.send_ = function(rate_limit_id) {
  var me = this;
  if (!me.pending[rate_limit_id] ||
      !me.pending[rate_limit_id].length ||
      me.timeout[rate_limit_id]) {
    return;
  }
  if (!me.rate[rate_limit_id]) {
    me.rate[rate_limit_id] = [];
  }
  var now = new Date().getTime();
  while(me.rate[rate_limit_id].length &&
        me.rate[rate_limit_id][0] < now - 1000) {
    me.rate[rate_limit_id].shift();
  }
  var timeout = 0;
  if (me.rate[rate_limit_id].length >= me.no_rate_limit_for_first_calls) {
    var delay = 1000 / (me.rate_limit - me.no_rate_limit_for_first_calls);
    if (me.no_rate_limit_for_first_calls &&
        me.rate[rate_limit_id].length >= 2 &&
        me.rate[rate_limit_id][1] - me.rate[rate_limit_id][0] >= delay) {
      me.running_at_limit[rate_limit_id] = true;
    }
    if (me.running_at_limit[rate_limit_id]) {
      delay = 1000 / me.rate_limit;
    }
    timeout = delay - Math.min(
        delay,
        now - me.rate[rate_limit_id][me.rate[rate_limit_id].length-1]);
  } else {
    me.running_at_limit[rate_limit_id] = false;
  }
  me.timeout[rate_limit_id] = window.setTimeout(function() {
    me.timeout[rate_limit_id] = undefined;
    me.rate[rate_limit_id].push(new Date().getTime());
    var pending = me.pending[rate_limit_id].shift();
    if (pending.action == "message") {
      me.airconsole.message(pending.device_id, pending.data);
    } else if (pending.action == "custom") {
      var data = pending.data;
      if (!pending.clear) {
        data = me.airconsole.getCustomDeviceState();
        if (!data) {
          data = pending.data;
        } else {
          me.mergeData_(pending.data, data);
        }
      }
      me.airconsole.setCustomDeviceState(data);
    }
  }, timeout);
}
