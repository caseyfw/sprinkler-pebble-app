var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var Vibe = require('ui/vibe');

var serverBaseUrl = 'http://home.caseyfulton.com/sprinkler/api/v1';
var sprinklers = [];
var resultsMenu;

var generateMenu = function(data) {
  var items = [];
  for(var i = 0; i < data.length; i++) {
    // Add to menu items array
    items.push({
      title: data[i].name,
      subtitle: data[i].state
    });
  }

  // Finally return whole array
  return items;
};

var refreshMenu = function() {
  ajax(
    {
      url: serverBaseUrl + '/sprinklers',
      type: 'json'
    },
    function(data) {
      // Update model.
      sprinklers = data;
      resultsMenu.items(0, generateMenu(sprinklers));
    },
    function(error) {
      console.log('Failed fetching sprinklers: ' + error);
    }
  );
};

var toggleSprinkler = function(index) {
  // Set new state.
  switch(sprinklers[index].state) {
    case 'on':
    case 'turning_on':
      sprinklers[index].state = 'turning_off';
      break;
    case 'off':
    case 'turning_off':
      sprinklers[index].state = 'turning_on';
      break;
  }
  
  // Send state change to API.
  ajax(
    {
      url: serverBaseUrl + '/sprinkler/' + sprinklers[index].id,
      method: 'put',
      data: sprinklers[index],
      type: 'json'
    },
    function(data) {
      console.log('Succeeded updating sprinkler: ' + index);
    },
    function(error) {
      console.log('Failed fetching sprinklers: ' + error);
    }
  );
  
  // Return new state.
  return sprinklers[index].state;
};

// Show splash screen while waiting for data
var splashWindow = new UI.Window();

// Text element to inform user
var text = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  text: 'Loading sprinklers...',
  font: 'GOTHIC_28_BOLD',
  color: 'black',
  textOverflow : 'wrap',
  textAlign: 'center',
  backgroundColor: 'white'
});

// Add to splashWindow and show
splashWindow.add(text);
splashWindow.show();

// Make the request
ajax(
  {
    url: serverBaseUrl + '/sprinklers',
    type: 'json'
  },
  function(data) {
    // Update model.
    sprinklers = data;

    // Generate menu from model.
    resultsMenu = new UI.Menu({
      sections: [{
        title: 'Sprinklers',
        items: generateMenu(sprinklers)
      }]
    });
    
    resultsMenu.on('select', function(e) {
      // Get selected menu item.
      var item = resultsMenu.item(e.sectionIndex, e.itemIndex);

      // Set loading message.
      item.subtitle = 'Updating...';
      resultsMenu.item(e.sectionIndex, e.itemIndex, item);

      // Toggle the selected sprinkler.
      item.subtitle = toggleSprinkler(e.itemIndex);

      // Update menu item.
      resultsMenu.item(e.sectionIndex, e.itemIndex, item);

      Vibe.vibrate('short');
    });
    
    resultsMenu.on('accelTap', function(e) {
      refreshMenu();
    });
    
    // Show the Menu, hide the splash
    resultsMenu.show();
    splashWindow.hide();
  },
  function(error) {
    console.log('Failed fetching sprinklers: ' + error);
  }
);
