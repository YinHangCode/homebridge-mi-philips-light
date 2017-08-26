require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
var deviceThis, device;

SmartBulb = function(platform, config) {
    this.init(platform, config);
    
    Accessory = platform.Accessory;
    PlatformAccessory = platform.PlatformAccessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;
    UUIDGen = platform.UUIDGen;
    
    deviceThis = this;
    device = new miio.Device({
        address: deviceThis.config['ip'],
        token: deviceThis.config['token']
    });
    
    this.accessories = {};
    if(!this.config['lightDisable'] && this.config['lightName'] && this.config['lightName'] != "") {
        this.accessories['lightAccessory'] = new SmartBulbLight();
    }
    
    return this.obj2array(this.accessories);
}
inherits(SmartBulb, Base);

SmartBulbLight = function() {
    this.name = deviceThis.config['lightName'];
}

SmartBulbLight.prototype.getServices = function() {
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "Philips Smart Bulb")
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
    services.push(infoService);
    
    var lightService = new Service.Lightbulb(this.name);
    lightService
        .getCharacteristic(Characteristic.On)
        .on('get', this.getPower.bind(this))
        .on('set', this.setPower.bind(this));
    lightService
        .addCharacteristic(Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));
    lightService
        .addCharacteristic(Characteristic.Saturation)
        .on('get', this.getSaturation.bind(this))
        .on('set', this.setSaturation.bind(this));
    services.push(lightService);

    return services;
}

SmartBulbLight.prototype.getPower = function(callback) {
    device.call("get_prop", ["power"]).then(result => {
        deviceThis.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]SmartBulb - Light - getPower: " + result);
        callback(null, result[0] === 'on' ? 1 : 0);
    }).catch(function(err) {
        deviceThis.platform.log.error("[MiPhilipsLightPlatform][ERROR]SmartBulb - Light - getPower Error: " + err);
        callback(true);
    });
}

SmartBulbLight.prototype.setPower = function(value, callback) {
    if(value) {
        device.call("set_power", ['on']);
    } else {
        device.call("set_power", ['off']);
    }
    
    callback(null);    
}

SmartBulbLight.prototype.getBrightness = function(callback) {
    device.call("get_prop", ["bright"]).then(result => {
        deviceThis.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]SmartBulb - Light - getBrightness: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
        deviceThis.platform.log.error("[MiPhilipsLightPlatform][ERROR]SmartBulb - Light - getBrightness Error: " + err);
        callback(true);
    });
}

SmartBulbLight.prototype.setBrightness = function(value, callback) {
    device.call("set_bright", [value]);
    
    callback(null);    
}

SmartBulbLight.prototype.getSaturation = function(callback) {
    device.call("get_prop", ["cct"]).then(result => {
        deviceThis.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]SmartBulb - Light - getSaturation: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
        deviceThis.platform.log.error("[MiPhilipsLightPlatform][ERROR]SmartBulb - Light - getSaturation Error: " + err);
        callback(true);
    });
}

SmartBulbLight.prototype.setSaturation = function(value, callback) {
    device.call("set_cct", [value]);
    
    callback(null);    
}
