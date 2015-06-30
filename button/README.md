# Button
A simple button that works well for touch devices and local debugging.

## Example

![alt text](https://github.com/airconsole/airconsole-controls/raw/master/examples/button.png "Button Example")

[Live Demo](https://rawgit.com/AirConsole/airconsole-controls/master/examples/button.html) -
[Source](https://github.com/AirConsole/airconsole-controls/blob/master/examples/button.html)

## General

You need to place & size the button explicitely. It needs to have position **relative/absolute/fixed**.

For example:
```html
<style type=text/css>
  #your-button {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 300px;
    height: 150px;
  }
</style>
```

## Javascript
```javascript
  new Button("your-button", {
    "down": function() {
      // The callback function for when the button is pressed
    },
    "up": function() {
      // The callback function for when the button is released
    }
  });
```

## Styles

The main button element gets the css class "button-active" when it is pressed.

### Optional default styles

If you include ```button.css``` you will get the following default styles:
- A 80 pixel round button that can be used like this:
  ```<div class=button-80></div>```
- A 300x150 pixel rectangular button that can be used like this:
  ```<div class=button-300-150></div>```
