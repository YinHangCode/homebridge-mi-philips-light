require('./Devices/SmartBulb');

var fs = require('fs');
var packageFile = require("./package.json");
var PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "platforms", "MiPhilipsLightPlatform")) {
        return;
    }
    
    PlatformAccessory = homebridge.platformAccessory;
    Accessory = homebridge.hap.Accessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-mi-philips-light', 'MiPhilipsLightPlatform', MiPhilipsLightPlatform, true);
}

function isConfig(configFile, type, name) {
    var config = JSON.parse(fs.readFileSync(configFile));
    if("accessories" === type) {
        var accessories = config.accessories;
        for(var i in accessories) {
            if(accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if("platforms" === type) {
        var platforms = config.platforms;
        for(var i in platforms) {
            if(platforms[i]['platform'] === name) {
                return true;
            }
        }
    } else {
    }
    
    return false;
}

function MiPhilipsLightPlatform(log, config, api) {
    if(null == config) {
        return;
    }
    
    this.Accessory = Accessory;
    this.PlatformAccessory = PlatformAccessory;
    this.Service = Service;
    this.Characteristic = Characteristic;
    this.UUIDGen = UUIDGen;
    
    this.log = log;
    this.config = config;

    if (api) {
        this.api = api;
    }
    
    this.log.info("[MiPhilipsLightPlatform][INFO]*********************************************************************");
    this.log.info("[MiPhilipsLightPlatform][INFO]           MiPhilipsLightPlatform v%s By YinHang", packageFile.version);
    this.log.info("[MiPhilipsLightPlatform][INFO]  GitHub: https://github.com/YinHangCode/homebridge-mi-philips-light ");
    this.log.info("[MiPhilipsLightPlatform][INFO]                                                QQ Group: 107927710  ");
    this.log.info("[MiPhilipsLightPlatform][INFO]*********************************************************************");
    this.log.info("[MiPhilipsLightPlatform][INFO]start success...");
}

MiPhilipsLightPlatform.prototype = {
    accessories: function(callback) {
        var myAccessories = [];

        var cfgAccessories = this.config['accessories'];
        if(null == cfgAccessories) {
            return;
        }
        
        for (var i = 0; i < cfgAccessories.length; i++) {
            var cfgAccessory = cfgAccessories[i];
            if (cfgAccessory['type'] == "SmartBulb") {
                new SmartBulb(this, cfgAccessory).forEach(function(accessory, index, arr){
                    myAccessories.push(accessory);
                });
            } else if (cfgAccessory['type'] == "TableLamp2") {

            } else if (cfgAccessory['type'] == "CeilingLamp") {

            } else {
            }
        }

        callback(myAccessories);
    }
}
