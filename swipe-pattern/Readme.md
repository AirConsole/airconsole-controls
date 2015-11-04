# SwipePattern

A pattern of circles, which you can connect by swiping.

## Example

[Live Demo](https://rawgit.com/AirConsole/airconsole-controls/master/examples/swipe-pattern.html)

## Javascript

```javascript
  // The first argument can be an html element or and element id. The second argument are options.
  new DPad("my-dpad", {
      // Gets called when the amount of pixels swiped has been exceeded
      // Param is active directions {down: <Boolean>, left: <Boolean>, up: <Boolean>, right: <Boolean>}
      "onTrigger": function(direction_map) {},
      // Gets called when the DPad is touched.
      "touchstart": function() {},
      // Gets called when the DPad is released.
      "touchend": function(had_direction) {},
      // (Optional) Minimum distance (px) to swipe until triggering the onTrigger function
      "min_swiped_distance": 30,
      // (Optional) allowed_directions: All, Horizontal or Vertical
      "allowed_directions": SwipeArea.AllowDirections.All
      // (Optional) diagonal: For All-Directions, enables diagonal swipe detection
      "diagonal": false
    });
```
