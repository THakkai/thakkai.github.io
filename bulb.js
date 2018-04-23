'use strict';

let ledCharacteristic = null;
let poweredOn = false;

function onConnected() {
    document.querySelector('.connect-button').classList.add('hidden');
    document.querySelector('.color-buttons').classList.remove('hidden');
    document.querySelector('.mic-button').classList.remove('hidden');
    document.querySelector('.power-button').classList.remove('hidden');
    poweredOn = true;
}

function onDisconnected() {
    document.querySelector('.connect-button').classList.remove('hidden');
    document.querySelector('.color-buttons').classList.add('hidden');
    document.querySelector('.mic-button').classList.add('hidden');
    document.querySelector('.power-button').classList.add('hidden');
}

function connect() {
    console.log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice(
        {
            filters: [{ services: ['0000cc02-0000-1000-8000-00805f9b34fb'] }]
        })
        .then(device => {
            console.log('> Found ' + device.name);
            console.log('Connecting to GATT Server...');
            device.addEventListener('gattserverdisconnected', onDisconnected)
            return device.gatt.connect();
        })
        .then(server => {
            console.log('Getting Service 0xcc02 - Light control...');
            return server.getPrimaryService('0000cc02-0000-1000-8000-00805f9b34fb');
        })
        .then(service => {
            console.log('Getting Characteristic 0xee03 - Light control...');
            return service.getCharacteristic('0000ee03-0000-1000-8000-00805f9b34fb');
        })
        .then(characteristic => {
            console.log('All ready!');
            ledCharacteristic = characteristic;
            onConnected();
        })
        .catch(error => {
            console.log('Argh! ' + error);
        });
}

function powerOn() {
  let data = new Uint8Array([0x01, 0xFF, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00]);
  return ledCharacteristic.writeValue(data)
      .catch(err => console.log('Error when powering on! ', err))
      .then(() => {
          poweredOn = true;
          toggleButtons();
      });
}

function powerOff() {
  let data = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  return ledCharacteristic.writeValue(data)
      .catch(err => console.log('Error when switching off! ', err))
      .then(() => {
          poweredOn = false;
          toggleButtons();
      });
}

function togglePower() {
    if (poweredOn) {
        powerOff();
    } else {
        powerOn();
    }
}

function toggleButtons() {
    Array.from(document.querySelectorAll('.color-buttons button')).forEach(function(colorButton) {
      colorButton.disabled = !poweredOn;
    });
    document.querySelector('.mic-button button').disabled = !poweredOn;
}

function setColor(red, green, blue, white) {
    let data = new Uint8Array([0x01, green, 0x01, 0x00, 0x01, blue, 0x01, red, 0x01, white]);
	console.log(data);
    return ledCharacteristic.writeValue(data)
        .catch(err => console.log('Error when writing value! ', err));
}

function red() {
    return setColor(0xFF, 0x0, 0x0, 0x0)
        .then(() => console.log('Color set to Red'));
}

function green() {
    return setColor(0x0, 0xFF, 0x0, 0x0)
        .then(() => console.log('Color set to Green'));
}

function blue() {
    return setColor(0x0, 0x0, 0xFF, 0x0)
        .then(() => console.log('Color set to Blue'));
}

var sleep_counter = 255; // max color
var time = 10000; // 10s
var increment = 15; // color decrement sleep_counter/increment=number of step

function nightmode() {
	setTimeout( function() {
		i=i-increment;
		if  (i > 1) {
			setColor(i, 0, 0, 0);
			nightmode();
		}
		else {
			powerOff();
			sleep_counter = 255; //reset counter
		}
	}, time);
}

function listen() {
    annyang.start({ continuous: true });
	annyang.setLanguage('fr-FR');
}

// Voice commands
annyang.addCommands({
    'rouge': red,
    'vert': green,
    'bleu': blue,
    'jaune': () => setColor(127, 127, 0, 0),
    'orange': () => setColor(127, 35, 0, 0),
    'violet': () => setColor(127, 0, 127, 0),
    'rose': () => setColor(180, 12, 44, 0),
    'cyan': () => setColor(0, 127, 127, 0),
    'blanc': () => setColor(127, 127, 127, 0),
    'allumer': powerOn,
    'eteindre': powerOff,
	'mode nuit': nightmode
});

// API Call GET
function $_GET(param) {
	var vars = {};
	window.location.href.replace( location.hash, '' ).replace( 
		/[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
		function( m, key, value ) { // callback
			vars[key] = value !== undefined ? value : '';
		}
	);

	if ( param ) {
		return vars[param] ? vars[param] : null;	
	}
	return vars;
}

var night_mode = $_GET('nightmode');
if (night_mode) {
	nightmode();
}

// Install service worker - for offline support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('serviceworker.js');
}