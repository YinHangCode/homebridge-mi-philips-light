require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

SmartBulb = function(platform, config) {
    this.init(platform, config);
    
    Accessory = platform.Accessory;
    PlatformAccessory = platform.PlatformAccessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;
    UUIDGen = platform.UUIDGen;
    
    this.device = new miio.Device({
        address: this.config['ip'],
        token: this.config['token']
    });
    
    this.accessories = {};
    if(!this.config['lightDisable'] && this.config['lightName'] && this.config['lightName'] != "") {
        this.accessories['lightAccessory'] = new SmartBulbLight(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    return accessoriesArr;
}
inherits(SmartBulb, Base);

SmartBulbLight = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['lightName'];
    this.platform = dThis.platform;
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
        .addCharacteristic(Characteristic.ColorTemperature)
        .setProps({
            minValue: 50,
            maxValue: 400,
            minStep: 1
        })
        .on('get', this.getColorTemperature.bind(this))
        .on('set', this.setColorTemperature.bind(this));
    services.push(lightService);

    return services;
}

SmartBulbLight.prototype.getPower = function(callback) {
    var that = this;
    this.device.call("get_prop", ["power"]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]SmartBulb - Light - getPower: " + result);
        callback(null, result[0] === 'on' ? true : false);
    }).catch(function(err) {
        that.platform.log.error("[MiPhilipsLightPlatform][ERROR]SmartBulb - Light - getPower Error: " + err);
        callback(err);
    });
}

SmartBulbLight.prototype.setPower = function(value, callback) {
    var that = this;
    that.device.call("set_power", [value ? "on" : "off"]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]SmartBulb - Light - setPower Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }
    }).catch(function(err) {
        that.platform.log.error("[MiPhilipsLightPlatform][ERROR]SmartBulb - Light - setPower Error: " + err);
        callback(err);
    });
}

SmartBulbLight.prototype.getBrightness = function(callback) {
    var that = this;
    this.device.call("get_prop", ["bright"]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]SmartBulb - Light - getBrightness: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
        that.platform.log.error("[MiPhilipsLightPlatform][ERROR]SmartBulb - Light - getBrightness Error: " + err);
        callback(err);
    });
}

SmartBulbLight.prototype.setBrightness = function(value, callback) {
    var that = this;
    if(value > 0) {
        this.device.call("set_bright", [value]).then(result => {
            that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]SmartBulb - Light - setBrightness Result: " + result);
            if(result[0] === "ok") {
                callback(null);
            } else {
                callback(new Error(result[0]));
            }
        }).catch(function(err) {
            that.platform.log.error("[MiPhilipsLightPlatform][ERROR]SmartBulb - Light - setBrightness Error: " + err);
            callback(err);
        });
    } else {
        callback(null);
    }
}

SmartBulbLight.prototype.getColorTemperature = function(callback) {
    var that = this;
    this.device.call("get_prop", ["cct"]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]SmartBulb - Light - getColorTemperature: " + result);
        callback(null, result[0] * 350);
    }).catch(function(err) {
        that.platform.log.error("[MiPhilipsLightPlatform][ERROR]SmartBulb - Light - getColorTemperature Error: " + err);
        callback(err);
    });
}

SmartBulbLight.prototype.setColorTemperature = function(value, callback) {
    value = value - 50;
    value = value / 350 * 100;
    value = Math.round(100 - value);
    if(value == 0) {
        value = 1;
    }
    var that = this;
    this.device.call("set_cct", [value]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]SmartBulb - Light - setColorTemperature Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }
    }).catch(function(err) {
        that.platform.log.error("[MiPhilipsLightPlatform][ERROR]SmartBulb - Light - setColorTemperature Error: " + err);
        callback(err);
    });
}
