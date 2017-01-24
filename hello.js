
dcl = require("./lib/device-library.node");
dcl = dcl({debug: true});

var storeFile = (process.argv[2]);
var storePassword = (process.argv[3]);

var humidityModel;

function startVirtualHumidity(device, id) {
    var virtualDev = device.createVirtualDevice(id, humidityModel);

    var sensor = {
        humidity: 0
    };

    var send = function () {
        sensor.humidity = Math.floor(Math.random() * 100);
        if (sensor.humidity > virtualDev.maxThreshold.value) {
            var alert = virtualDev.createAlert('urn:com:oracle:iot:device:humidity_sensor:too_humid');
            alert.fields.humidity = sensor.humidity;
            alert.raise();
        }
        virtualDev.update(sensor);
    };

    setInterval(send, 3000);

    virtualDev.onChange = function (tupples) {
        tupples.forEach( function (tupple) {
            var show = {
                name: tupple.attribute.id,
                lastUpdate: tupple.attribute.lastUpdate,
                oldValue: tupple.oldValue,
                newValue: tupple.newValue
            };
            console.log('------------------ON CHANGE HUMIDITY---------------------');
            console.log(JSON.stringify(show, null, 4));
            console.log('---------------------------------------------------------');
            sensor[tupple.attribute.id] = tupple.newValue;
        });
    };

    virtualDev.onError = function (tupple) {
        var show = {
            newValues: tupple.newValues,
            tryValues: tupple.tryValues,
            errorResponse: tupple.errorResponse
        };
        console.log('------------------ON ERROR HUMIDITY---------------------');
        console.log(JSON.stringify(show,null,4));
        console.log('--------------------------------------------------------');
        for (var key in tupple.newValues) {
            sensor[key] = tupple.newValues[key];
        }
    };

}

function getModelHumidity(device) {
    device.getDeviceModel('urn:com:oracle:iot:device:humidity_sensor', function (response, error) {
        if (error) {
            console.log('-------------ERROR ON GET HUMIDITY DEVICE MODEL-------------');
            console.log(error.message);
            console.log('------------------------------------------------------------');
            return;
        }
        console.log('-----------------HUMIDITY DEVICE MODEL----------------------');
        console.log(JSON.stringify(response,null,4));
        console.log('------------------------------------------------------------');
        humidityModel = response;
        startVirtualHumidity(device, device.getEndpointId());
    });
}

var dcd = new dcl.device.DirectlyConnectedDevice(storeFile, storePassword);
if (dcd.isActivated()) {
    getModelHumidity(dcd);
} else {
    dcd.activate(['urn:com:oracle:iot:device:humidity_sensor'], function (device, error) {
        if (error) {
            console.log('-----------------ERROR ON ACTIVATION------------------------');
            console.log(error.message);
            console.log('------------------------------------------------------------');
            return;
        }
        dcd = device;
        console.log(dcd.isActivated());
        if (dcd.isActivated()) {
            getModelHumidity(dcd);
        }
    });
}