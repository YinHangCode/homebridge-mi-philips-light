require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
MiPhilipsTableLamp2 = function(platform, config) {
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
        this.accessories['mainLightAccessory'] = new MiPhilipsTableLamp2Light(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    return accessoriesArr;
}
inherits(MiPhilipsTableLamp2, Base);

MiPhilipsTableLamp2Light = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['mainLightName'];
    this.secondLightDisable = dThis.config['secondLightDisable'];
    this.secondLightName = dThis.config['secondLightName'];
    this.eyecareSwitchDisable = dThis.config['eyecareSwitchDisable'];
    this.eyecareSwitchName = dThis.config['eyecareSwitchName'];
    this.platform = dThis.platform;
}

MiPhilipsTableLamp2Light.prototype.getServices = function() {
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
    
    var eyecareSwitchService = new Service.Switch(this.eyecareSwitchName || this.name + 'eyecare', "eyecareSwitch");
    var eyecareSwitchOnCharacteristic = eyecareSwitchService.getCharacteristic(Characteristic.On);
    
    mainLightOnCharacteristic
        .on('get', function(callback) {
            this.device.call("get_prop", ["power"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsTableLamp2 - MainLight (" + that.device.address + ") - getPower: " + result);
                callback(null, result[0] === 'on' ? true : false);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsTableLamp2 - MainLight (" + that.device.address + ") - getPower Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.device.call("set_power", [value ? "on" : "off"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsTableLamp2 - MainLight (" + that.device.address + ") - setPower Result: " + result);
                if(result[0] === "ok") {
                    if(value) {
                        eyecareSwitchOnCharacteristic.getValue();
                        secondLightOnCharacteristic.getValue();
                    } else {
                        if(secondLightOnCharacteristic.value) {
                            secondLightOnCharacteristic.updateValue(false);
                        }
                        if(eyecareSwitchOnCharacteristic.value) {
                            eyecareSwitchOnCharacteristic.updateValue(false);
                        }
                    }
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsTableLamp2 - MainLight (" + that.device.address + ") - setPower Error: " + err);
                callback(err);
            });
        }.bind(this));
    mainLightService
        .addCharacteristic(Characteristic.Brightness)
        .on('get', function(callback) {
            this.device.call("get_prop", ["bright"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsTableLamp2 - MainLight (" + that.device.address + ") - getBrightness: " + result);
                callback(null, result[0]);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsTableLamp2 - MainLight (" + that.device.address + ") - getBrightness Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            if(value > 0) {
                this.device.call("set_bright", [value]).then(result => {
                    that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsTableLamp2 - MainLight (" + that.device.address + ") - setBrightness Result: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));
                    }
                }).catch(function(err) {
                    that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsTableLamp2 - MainLight (" + that.device.address + ") - setBrightness Error: " + err);
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
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsTableLamp2 - SecondLight (" + that.device.address + ") - getPower: " + result);
                callback(null, result[0] === 'on' && mainLightOnCharacteristic.value ? true : false);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsTableLamp2 - SecondLight (" + that.device.address + ") - getPower Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.device.call("enable_amb", [value ? "on" : "off"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsTableLamp2 - SecondLight (" + that.device.address + ") - setPower Result: " + result);
                if(result[0] === "ok") {
                    if(value) {
                        mainLightOnCharacteristic.getValue();
                        eyecareSwitchOnCharacteristic.getValue();
                    }
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsTableLamp2 - SecondLight (" + that.device.address + ") - setPower Error: " + err);
                callback(err);
            });
        }.bind(this));
    secondLightService
        .addCharacteristic(Characteristic.Brightness)
        .on('get', function(callback) {
            this.device.call("get_prop", ["ambvalue"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsTableLamp2 - SecondLight (" + that.device.address + ") - getBrightness: " + result);
                callback(null, result[0]);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsTableLamp2 - SecondLight (" + that.device.address + ") - getBrightness Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            if(value > 0) {
                this.device.call("set_amb_bright", [value]).then(result => {
                    that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsTableLamp2 - SecondLight (" + that.device.address + ") - setBrightness Result: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));
                    }
                }).catch(function(err) {
                    that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsTableLamp2 - SecondLight (" + that.device.address + ") - setBrightness Error: " + err);
                    callback(err);
                });
            } else {
                callback(null);
            }
        }.bind(this));
    if(!this.secondLightDisable && this.secondLightName && this.secondLightName != "") {
        services.push(secondLightService);
    }
    
    eyecareSwitchOnCharacteristic
        .on('get', function(callback) {
            this.device.call("get_prop", ["eyecare"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsTableLamp2 - EyecareSwitch (" + that.device.address + ") - getPower: " + result);
                callback(null, result[0] === 'on' && mainLightOnCharacteristic.value ? true : false);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsTableLamp2 - EyecareSwitch (" + that.device.address + ") - getPower Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.device.call("set_eyecare", [value ? "on" : "off"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsTableLamp2 - EyecareSwitch (" + that.device.address + ") - setPower Result: " + result);
                if(result[0] === "ok") {
                    if(value) {
                        mainLightOnCharacteristic.getValue();
                        secondLightOnCharacteristic.getValue();
                    }
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsTableLamp2 - EyecareSwitch (" + that.device.address + ") - setPower Error: " + err);
                callback(err);
            });
        }.bind(this));
    if(!this.eyecareSwitchDisable && this.eyecareSwitchName && this.eyecareSwitchName != "") {
        services.push(eyecareSwitchService);
    }
    
    return services;
}
