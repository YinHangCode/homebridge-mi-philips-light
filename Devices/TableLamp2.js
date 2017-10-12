require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
TableLamp2 = function(platform, config) {
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
    if(this.config['mainLightName'] && this.config['mainLightName'] != "") {
        this.accessories['mainLightAccessory'] = new TableLamp2MainLight(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    return accessoriesArr;
}
inherits(TableLamp2, Base);

TableLamp2MainLight = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['mainLightName'];
    this.secondLightDisable = dThis.config['secondLightDisable'];
    this.secondLightName = dThis.config['secondLightName'];
    this.platform = dThis.platform;
}

TableLamp2MainLight.prototype.getServices = function() {
    var that = this;
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "Philips Table Lamp 2")
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
    services.push(infoService);
    
    var mainLightService = new Service.Lightbulb(this.name, "mainLight");
    var mainLightOnCharacteristic = mainLightService.getCharacteristic(Characteristic.On);
    
    var secondLightService = new Service.Lightbulb(this.secondLightName || this.name + 'se', "secondLight");
    var secondLightOnCharacteristic = secondLightService.getCharacteristic(Characteristic.On);
    
    mainLightOnCharacteristic
        .on('get', function(callback) {
            this.device.call("get_prop", ["power"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]TableLamp2 - MainLight - getPower: " + result);
                callback(null, result[0] === 'on' ? true : false);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]TableLamp2 - MainLight - getPower Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.device.call("set_power", [value ? "on" : "off"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]TableLamp2 - MainLight - setPower Result: " + result);
                if(result[0] === "ok") {
                    if(value) {
                        this.device.call("get_prop", ["ambstatus"]).then(result => {
                            that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]TableLamp2 - SecondLight - getPower: " + result);
                            secondLightOnCharacteristic.updateValue(result[0] === 'on' ? true : false);
                            callback(null);
                        }).catch(function(err) {
                            that.platform.log.error("[MiPhilipsLightPlatform][ERROR]TableLamp2 - SecondLight - getPower Error: " + err);
                            callback(err);
                        });
                    } else {
                        if(secondLightOnCharacteristic.value) {
                            secondLightOnCharacteristic.updateValue(false);
                        }
                        callback(null);
                    }
                } else {
                    callback(new Error(result[0]));
                }
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]TableLamp2 - MainLight - setPower Error: " + err);
                callback(err);
            });
        }.bind(this));
    mainLightService
        .addCharacteristic(Characteristic.Brightness)
        .on('get', function(callback) {
            this.device.call("get_prop", ["bright"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]TableLamp2 - MainLight - getBrightness: " + result);
                callback(null, result[0]);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]TableLamp2 - MainLight - getBrightness Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            if(value > 0) {
                this.device.call("set_bright", [value]).then(result => {
                    that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]TableLamp2 - MainLight - setBrightness Result: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));
                    }
                }).catch(function(err) {
                    that.platform.log.error("[MiPhilipsLightPlatform][ERROR]TableLamp2 - MainLight - setBrightness Error: " + err);
                    callback(err);
                });
            } else {
                callback(null);
            }
        }.bind(this));
    services.push(mainLightService);
    
    secondLightOnCharacteristic
        .on('get', function(callback) {
            this.device.call("get_prop", ["ambstatus"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]TableLamp2 - SecondLight - getPower: " + result);
                callback(null, result[0] === 'on' && mainLightOnCharacteristic.value ? true : false);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]TableLamp2 - SecondLight - getPower Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.device.call("enable_amb", [value ? "on" : "off"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]TableLamp2 - SecondLight - setPower Result: " + result);
                if(result[0] === "ok") {
                    if(value && !mainLightOnCharacteristic.value) {
                        mainLightOnCharacteristic.updateValue(true);
                    }
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]TableLamp2 - SecondLight - setPower Error: " + err);
                callback(err);
            });
        }.bind(this));
    secondLightService
        .addCharacteristic(Characteristic.Brightness)
        .on('get', function(callback) {
            this.device.call("get_prop", ["ambvalue"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]TableLamp2 - SecondLight - getBrightness: " + result);
                callback(null, result[0]);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]TableLamp2 - SecondLight - getBrightness Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            if(value > 0) {
                this.device.call("set_amb_bright", [value]).then(result => {
                    that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]TableLamp2 - SecondLight - setBrightness Result: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));
                    }
                }).catch(function(err) {
                    that.platform.log.error("[MiPhilipsLightPlatform][ERROR]TableLamp2 - SecondLight - setBrightness Error: " + err);
                    callback(err);
                });
            } else {
                callback(null);
            }
        }.bind(this));
    if(!this.secondLightDisable && this.secondLightName && this.secondLightName != "") {
        services.push(secondLightService);
    }
    
    return services;
}
