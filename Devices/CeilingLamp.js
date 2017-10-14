require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
CeilingLamp = function(platform, config) {
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
    if(this.config['lightName'] && this.config['lightName'] != "") {
        this.accessories['LightAccessory'] = new CeilingLampCeilingLamp(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    return accessoriesArr;
}
inherits(CeilingLamp, Base);

CeilingLampCeilingLamp = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['lightName'];
    this.token = dThis.config['token'];
    this.platform = dThis.platform;
}

CeilingLampCeilingLamp.prototype.getServices = function() {
    var that = this;
    var services = [];
    var tokensan = this.token.substring(this.token.length-8);
    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "Philips")
        .setCharacteristic(Characteristic.Model, "Philips Ceiling Lamp")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);
    
    var CeilingLampService = new Service.Lightbulb(this.name, "CeilingLamp");
    var CeilingLampOnCharacteristic = CeilingLampService.getCharacteristic(Characteristic.On);
    
    CeilingLampOnCharacteristic
        .on('get', function(callback) {
            this.device.call("get_prop", ["power"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]CeilingLamp - getPower: " + result);
                callback(null, result[0] === 'on' ? true : false);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]CeilingLamp - getPower Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.device.call("set_power", [value ? "on" : "off"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]CeilingLamp - setPower Result: " + result);
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]CeilingLamp - setPower Error: " + err);
                callback(err);
            });
        }.bind(this));
    CeilingLampService
        .addCharacteristic(Characteristic.Brightness)
        .on('get', function(callback) {
            this.device.call("get_prop", ["bright"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]CeilingLamp - getBrightness: " + result);
                callback(null, result[0]);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]CeilingLamp - getBrightness Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            if(value > 0) {
                this.device.call("set_bright", [value]).then(result => {
                    that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]CeilingLamp - setBrightness Result: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));
                    }
                }).catch(function(err) {
                    that.platform.log.error("[MiPhilipsLightPlatform][ERROR]CeilingLamp - setBrightness Error: " + err);
                    callback(err);
                });
            } else {
                callback(null);
            }
        }.bind(this));
    CeilingLampService
        .addCharacteristic(Characteristic.Saturation)
        .on('get', function(callback) {
            this.device.call("get_prop", ["cct"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]CeilingLamp - getSaturation: " + result);
                callback(null, result[0]);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]CeilingLamp - getSaturation Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value,callback) {
            if(value > 0) {
                this.device.call("set_cct", [value]).then(result => {
                    that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]CeilingLamp - setSaturation Result: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));
                    }
                }).catch(function(err) {
                    that.platform.log.error("[MiPhilipsLightPlatform][ERROR]CeilingLamp - setSaturation Error: " + err);
                    callback(err);
                });
             } else {
                callback(null);
            }
        }.bind(this));
    services.push(CeilingLampService);
    return services;
}
