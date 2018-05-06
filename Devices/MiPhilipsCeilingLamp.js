require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
MiPhilipsCeilingLamp = function(platform, config) {
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
        this.accessories['LightAccessory'] = new MiPhilipsCeilingLampLight(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);

    this.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);


    return accessoriesArr;
}
inherits(MiPhilipsCeilingLamp, Base);

MiPhilipsCeilingLampLight = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['lightName'];
    this.token = dThis.config['token'];
    this.platform = dThis.platform;
    this.updatetimere = dThis.config["updatetimer"];
    this.interval = dThis.config["interval"];
    if(this.interval == null){
        this.interval = 3;
    }
    this.Lampservice = false;
    this.timer;
    if(this.updatetimere === true){
        this.updateTimer();
    }
}

MiPhilipsCeilingLampLight.prototype.getServices = function() {
    var that = this;
    var services = [];
    var tokensan = this.token.substring(this.token.length-8);
    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "Philips")
        .setCharacteristic(Characteristic.Model, "Philips Ceiling Lamp")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);

    var CeilingLampService = this.Lampservice = new Service.Lightbulb(this.name, "MiPhilipsCeilingLamp");
    var CeilingLampOnCharacteristic = CeilingLampService.getCharacteristic(Characteristic.On);
    CeilingLampService
        .addCharacteristic(Characteristic.ColorTemperature)
        .setProps({
            minValue: 50,
            maxValue: 400,
            minStep: 1
        });
    CeilingLampOnCharacteristic
        .on('get', function(callback) {
            this.device.call("get_prop", ["power"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsCeilingLamp - getPower: " + result);
                callback(null, result[0] === 'on' ? true : false);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsCeilingLamp - getPower Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.device.call("set_power", [value ? "on" : "off"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsCeilingLamp - setPower Result: " + result);
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsCeilingLamp - setPower Error: " + err);
                callback(err);
            });
        }.bind(this));
    CeilingLampService
        .addCharacteristic(Characteristic.Brightness)
        .on('get', function(callback) {
            this.device.call("get_prop", ["bright"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsCeilingLamp - getBrightness: " + result);
                callback(null, result[0]);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsCeilingLamp - getBrightness Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            if(value == 1) {
                this.device.call("set_bricct", [0,0]).then(result => {
                    that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsCeilingLamp - activating night mode: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));
                    }
                }).catch(function(err) {
                    that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsCeilingLamp - activating night mode Error: " + err);
                    callback(err);
                });
            } else if(value > 0) {
                this.device.call("set_bright", [value]).then(result => {
                    that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsCeilingLamp - setBrightness Result: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));
                    }
                }).catch(function(err) {
                        that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsCeilingLamp - setBrightness Error: " + err);
                        callback(err);
                });
            } else {
                callback(null);
            }
        }.bind(this));
    CeilingLampService
        .getCharacteristic(Characteristic.ColorTemperature)
        .on('get', function(callback) {
            this.device.call("get_prop", ["cct"]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsCeilingLamp - getColorTemperature: " + result);
                callback(null, result[0] * 350);
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsCeilingLamp - getColorTemperature Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value,callback) {
            value = value - 50;
            value = value / 350 * 100;
            value = Math.round(100 - value);
            if(value == 0) {
                value = 1;
            }
            that.platform.log.debug("[MiPhilipsLightPlatform]MiPhilipsCeilingLamp - setColorTemperature : " + value + "%");
            this.device.call("set_cct", [value]).then(result => {
                that.platform.log.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsCeilingLamp - setColorTemperature Result: " + result);
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }
            }).catch(function(err) {
                that.platform.log.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsCeilingLamp - setColorTemperature Error: " + err);
                callback(err);
            });
        }.bind(this));
    services.push(CeilingLampService);
    return services;
}

MiPhilipsCeilingLampLight.prototype.updateTimer = function() {
    if (this.updatetimere) {
        clearTimeout(this.timer);
        this.timer = setTimeout(function() {
            if(this.Lampservice !== false){
                this.runTimer();
            }
            this.updateTimer();
        }.bind(this), this.interval * 1000);
    }
}

MiPhilipsCeilingLampLight.prototype.runTimer = function() {
    var that = this;
    this.device.call("get_prop", ["power"]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][" + this.name + "][DEBUG]MiPhilipsCeilingLamp - getPower: " + result);
        this.Lampservice.getCharacteristic(Characteristic.On).updateValue(result[0] === 'on' ? true : false);
    }).catch(function(err) {
        if(err == "Error: Call to device timed out"){
            that.platform.log.debug("[MiPhilipsLightPlatform][ERROR]MiPhilipsCeilingLamp - Lamp Offline");
        }else{
            that.platform.log.error("[MiPhilipsLightPlatform][" + this.name + "][ERROR]MiPhilipsCeilingLamp - getPower Error: " + err);
        }
    });
    this.device.call("get_prop", ["bright"]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][" + this.name + "][DEBUG]MiPhilipsCeilingLamp - getBrightness: " + result);
        this.Lampservice.getCharacteristic(Characteristic.Brightness).updateValue(result[0]);
    }).catch(function(err) {
        if(err == "Error: Call to device timed out"){
            that.platform.log.debug("[MiPhilipsLightPlatform][ERROR]MiPhilipsCeilingLamp - Lamp Offline");
        }else{
            that.platform.log.error("[MiPhilipsLightPlatform][" + this.name + "][ERROR]MiPhilipsCeilingLamp - getBrightness Error: " + err);
        }
    });
    this.device.call("get_prop", ["cct"]).then(result => {
        that.platform.log.debug("[MiPhilipsLightPlatform][" + this.name + "][DEBUG]MiPhilipsCeilingLamp - getSaturation: " + result);
        this.Lampservice.getCharacteristic(Characteristic.Saturation).updateValue(result[0]);
    }).catch(function(err) {
        if(err == "Error: Call to device timed out"){
            that.platform.log.debug("[MiPhilipsLightPlatform][ERROR]MiPhilipsCeilingLamp - Lamp Offline");
        }else{
            that.platform.log.error("[MiPhilipsLightPlatform][" + this.name + "][ERROR]MiPhilipsCeilingLamp - getSaturation Error: " + err);
        }
    });
}
