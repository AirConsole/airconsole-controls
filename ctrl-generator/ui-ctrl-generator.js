// ========================================================
// DEFAULT OUTPUT DEFINED HERE
// ========================================================
var outputAddScript = function(path) {
  return '<script type="text/javascript" src="' + path + '"></script>' + "\n";
};

var outputAddStyle = function(path) {
  return '<link rel="stylesheet" href="' + path + '">' + "\n";
};

var output = "";
output = "<html>\n<head>\n";
output += outputAddStyle('button/button.css');
output += outputAddStyle('dpad/dpad.css');
output += outputAddStyle('joystick/joystick.css');
output += outputAddStyle('ctrl-generator/controller.css');
output += "</head>\n<body>\n";
output += $('#gamepad_code').html();
output += "\n";
output += $('#templates').html();
output += "\n";
output += outputAddScript('http://www.airconsole.com/api/airconsole-1.2.1.js');
output += outputAddScript('dpad/dpad.js');
output += outputAddScript('joystick/joystick.js');
output += outputAddScript('button/button.js');
output += outputAddScript('ctrl-generator/ctrl-generator.js');
output += '<script type="text/javascript">'+ "\n";
output += '{{CONFIG_CODE}}';
output += "\n" + '</script>';
output += "</body></html>";

// ========================================================
// UI GENERATOR
// ========================================================
var UICtrlGenerator = (function(ctrl_generator) {

  var ctrl_generator = ctrl_generator;
  var ui_selects_ele = $('.ui_select');
  var code_output = $('#output');
  var middle_bttn_label = $('#middle_bttn_label');
  var middle_bttn_add = $('#middle_bttn_add');
  var middle_bttn_remove = $('#middle_bttn_remove');

  // A default config
  var ctrl_config = {
    left: {
      type: CtrlGenerator.Type.DPad,
    },
    middle: [
      {
        label: 'START',
        key: 'start'
      },
      {
        label: 'RESET',
        key: 'reset'
      },
      {
        label: 'PIZZA',
        key: 'pizza'
      }
    ],
    right: [
      {
        type: CtrlGenerator.Type.ButtonVertical,
        label: "Defend",
        key: "a"
      },
      {
        type: CtrlGenerator.Type.ButtonVertical,
        label: "Shoot",
        key: "b",
        on_up_message: true
      }
    ]
  };

  var printCode = function() {
    var code = 'var airconsole = new AirConsole({orientation: AirConsole.ORIENTATION_LANDSCAPE});' + "\n";
    code += 'CtrlGenerator.setAirConsole(airconsole);' + "\n";
    code += "CtrlGenerator.generate(" + JSON.stringify(ctrl_config) + ");";
    var output_code = output.replace(/{{CONFIG_CODE}}/, code);
    code_output.val(output_code);
  };

  var generate = function () {
    ctrl_generator.generate(ctrl_config);
    printCode();
  };

  var resetButtonForm = function(side_id) {
    var form_ele = $('.' + side_id + '_form');
    var label = form_ele.find('.button_form_label').val('');
    var key = form_ele.find('.button_form_key').val('');
  };

  var addButtonToCtrl = function(label, key, has_up_event, side_id, selected_type, side_ele) {
    if (!key) {
      key = prompt("The button needs a key to identify the message. E.g. 'shoot' or 'start'");
    }
    var bttn_data = {
      type: ctrl_generator.Type[selected_type],
      label: label,
      key: key,
      on_up_message: has_up_event
    };

    if (!ctrl_config[side_id] || ctrl_config[side_id] === ctrl_generator.Type.EMPTY) {
      ctrl_config[side_id] = [];
    }

    ctrl_config[side_id].push(bttn_data);
    generate();
    resetButtonForm(side_id);
    showInfo(side_ele, selected_type, side_id);
  };

  var addButtonForm = function(form_container_ele, side_id, selected_type, side_ele) {
    var form_ele = $('#template_button_form').clone();
    form_ele.attr("id", "");
    form_ele.addClass(side_id + '_form');
    form_container_ele.append(form_ele);
    form_ele.show();

    form_container_ele.find('.add_bttn').on('click', function() {
      var label = form_ele.find('.button_form_label').val();
      var key = form_ele.find('.button_form_key').val();
      var has_up_event = form_ele.find('.button_form_on_button_up').eq(0).is(":checked");
      addButtonToCtrl(label, key, has_up_event, side_id, selected_type, side_ele);
    });
  };

  var showInfo = function(side_ele, selected_type, side_id) {
    var info_ele = $('#info-' + selected_type).clone();
    var info_container = side_ele.find('.info_container');

    var current_config = ctrl_generator.getGeneratedObjects()[side_id];

    if (current_config instanceof Array) {

    } else {
      if (current_config && current_config.params) {
        info_ele.find('.key').html(current_config.params.key);
      }
    }

    info_container.html('').append(info_ele);
    info_ele.show();
  };

  var onSelectChange = function() {
    var $ele = $(this);
    var side_id = $ele.attr('data-id');
    var selected_type = $ele.find(":selected").val();

    // Clear form ele container
    var side_ele = $ele.parent();
    var form_ele = $ele.parent().find('.form_container').eq(0);
    form_ele.html('');

    // DPad or Joystick
    if (selected_type === ctrl_generator.Type.DPad ||
        selected_type === ctrl_generator.Type.Joystick) {
      ctrl_config[side_id] = {
        type: ctrl_generator.Type[selected_type]
      };

    // EMPTY
    } else if (selected_type === ctrl_generator.Type.EMPTY) {
      ctrl_config[side_id] = ctrl_generator.Type.EMPTY;

    // ButtonVertical
    } else {
      ctrl_config[side_id] = ctrl_generator.Type.EMPTY;
      addButtonForm(form_ele, side_id, selected_type, side_ele);
    }
    generate();
    showInfo(side_ele, selected_type, side_id);
  };

  var onMiddleButtonAdd = function () {
    var label = middle_bttn_label.val();
    ctrl_config['middle'].push({
      label: label,
      key: label
    });
    generate();
    middle_bttn_label.val('');
  };

  var prepareSelectTypes = function() {
    ui_selects_ele.each(function() {
      var $ele = $(this);
      for (var type in ctrl_generator.Type) {
        if (type === ctrl_generator.Type.ButtonMiddle) continue;
        var opt = $('<option value=' + type + '>' + type + '</option>');
        var side_id = $ele.attr('data-id');
        if (type === ctrl_config[side_id].type ||
            (ctrl_config[side_id] instanceof Array && type === 'ButtonVertical')) {
          opt.attr('selected', 'selected');
        }
        $ele.append(opt);
      }
    });

    ui_selects_ele.on('change', onSelectChange);
  };

  middle_bttn_add.on('click', onMiddleButtonAdd);
  middle_bttn_remove.on('click', function() {
    ctrl_config['middle'] = [];
    generate();
  });

  (function() {
    prepareSelectTypes();
  })();

  return {
    ctrl_config: ctrl_config,
    generate: generate
  };

})(CtrlGenerator);
