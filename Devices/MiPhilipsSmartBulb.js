require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

MiPhilipsSmartBulb = function(platform, config) {
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
        this.accessories['lightAccessory'] = new MiPhilipsSmartBulbLight(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    return accessoriesArr;
}
inherits(MiPhilipsSmartBulb, Base);

MiPhilipsSmartBulbLight = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['lightName'];
    this.platform = dThis.platform;
}

MiPhilipsSmartBulbLight.prototype.getServices = function() {
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
            maxValue: 5700,
            minStep: 1
        })
        .on('get', this.getColorTemperature.bind(this))
        .on('set', this.setColorTemperature.bind(this));
    services.push(lightService);

    return services;
}

MiPhilipsSmartBulbLight.prototype.getPower = function(callback) {
    var that = this;
    this.device.call("get_prop", ["power"]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsSmartBulb - Light - getPower: " + result);
        callback(null, result[0] === 'on' ? true : false);
    }).catch(function(err) {
        that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsSmartBulb - Light - getPower Error: " + err);
        callback(err);
    });
}

MiPhilipsSmartBulbLight.prototype.setPower = function(value, callback) {
    var that = this;
    that.device.call("set_power", [value ? "on" : "off"]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsSmartBulb - Light - setPower Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }
    }).catch(function(err) {
        that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsSmartBulb - Light - setPower Error: " + err);
        callback(err);
    });
}

MiPhilipsSmartBulbLight.prototype.getBrightness = function(callback) {
    var that = this;
    this.device.call("get_prop", ["bright"]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsSmartBulb - Light - getBrightness: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
        that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsSmartBulb - Light - getBrightness Error: " + err);
        callback(err);
    });
}

MiPhilipsSmartBulbLight.prototype.setBrightness = function(value, callback) {
    var that = this;
    if(value > 0) {
        this.device.call("set_bright", [value]).then(result => {
            that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsSmartBulb - Light - setBrightness Result: " + result);
            if(result[0] === "ok") {
                callback(null);
            } else {
                callback(new Error(result[0]));
            }
        }).catch(function(err) {
            that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsSmartBulb - Light - setBrightness Error: " + err);
            callback(err);
        });
    } else {
        callback(null);
    }
}

MiPhilipsSmartBulbLight.prototype.getColorTemperature = function(callback) {
    var that = this;
    this.device.call("get_prop", ["cct"]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsSmartBulb - Light - getColorTemperature: " + result);
        callback(null, result[0] * 350);
    }).catch(function(err) {
        that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsSmartBulb - Light - getColorTemperature Error: " + err);
        callback(err);
    });
}

MiPhilipsSmartBulbLight.prototype.setColorTemperature = function(value, callback) {
    value = value - 50;
    value = value / 350 * 100;
    value = Math.round(100 - value);
    if(value == 0) {
        value = 1;
    }
    var that = this;
    this.device.call("set_cct", [value]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsSmartBulb - Light - setColorTemperature Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }
    }).catch(function(err) {
        that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsSmartBulb - Light - setColorTemperature Error: " + err);
        callback(err);
    });
}
