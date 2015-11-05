# SwipeAnalog

A relative-swipe pad which does not trigger on touchend, but when a certain
amount of pixel has been swiped. Other than SwipeDigigal, SwipeAnalog returns a direction
vector.

## Example

[Live Demo](https://rawgit.com/AirConsole/airconsole-controls/master/examples/swipe-area.html)

## Javascript

```javascript
  // The first argument can be an html element or and element id. The second argument are options.
  new SwipeAnalog("my-swipe-analog", {
      // Gets called when the amount of pixels swiped has been exceeded
      // Param is the direction vector
      "onTrigger": function(direction_map) {},
      // Gets called when the SwipeAnalog is touched.
      "touchstart": function() {},
      // Gets called when the SwipeAnalog is released.
      "touchend": function(had_direction) {},
      // (Optional) Minimum distance (px) to swipe until triggering the onTrigger function
      "min_swipe_distance": 30
    });
```
