# homebridge-mi-philips-light
[![npm version](https://badge.fury.io/js/homebridge-mi-philips-light.svg)](https://badge.fury.io/js/homebridge-mi-philips-light)

XiaoMi Philips light plugins for HomeBridge.   
   
Thanks for [nfarina](https://github.com/nfarina)(the author of [homebridge](https://github.com/nfarina/homebridge)), [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol), [aholstenson](https://github.com/aholstenson)(the author of [miio](https://github.com/aholstenson/miio)), [Zzm317](https://github.com/Zzm317), all other developer and testers.   
   
**Note: I have only a part of these devices, so some devices don't have tested. If you find bugs, please submit them to [issues](https://github.com/YinHangCode/homebridge-mi-philips-light/issues) or [QQ Group: 107927710](//shang.qq.com/wpa/qunwpa?idkey=8b9566598f40dd68412065ada24184ef72c6bddaa11525ca26c4e1536a8f2a3d).**   

![](https://raw.githubusercontent.com/YinHangCode/homebridge-mi-philips-light/master/images/SmartBulb.jpg)
![](https://raw.githubusercontent.com/YinHangCode/homebridge-mi-philips-light/master/images/TableLamp2.jpg)
![](https://raw.githubusercontent.com/YinHangCode/homebridge-mi-philips-light/master/images/CeilingLamp.jpg)

## Supported Devices
1.SmartBulb(飞利浦智睿球泡灯)   
2.TableLamp2(米家飞利浦智睿台灯二代)   
3.CeilingLamp(飞利浦智睿吸顶灯)   

## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).   
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).   
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.   
3. Install packages.   
```
npm install -g miio homebridge-mi-philips-light
```
## Configuration
```
"platforms": [{
    "platform": "MiPhilipsLightPlatform",
    "deviceCfgs": [{
        "type": "SmartBulb",
        "ip": "192.168.88.xx",
        "token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "lightName": "living room bulb",
        "lightDisable": false
    }, {
        "type": "TableLamp2",
        "ip": "192.168.88.xx",
        "token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "mainLightName": "living room table lamp",
        "secondLightName": "living room table lamp amb",
        "secondLightDisable": false,
        "eyecareSwitchName": "living room table lamp eyecare model",
        "eyecareSwitchDisable": false
    }, {
        "type": "CeilingLamp",
        "ip": "192.168.88.xx",
        "token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "lightName": "living room ceiling lamp",
        "lightDisable": false,
        "updatetimer" : false,
        "interval" : 3
    }]
}]
```
## Get token
Open command prompt or terminal. Run following command:
```
miio --discover
```
Wait until you get output similar to this:
```
Device ID: xxxxxxxx   
Model info: Unknown   
Address: 192.168.88.xx   
Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx via auto-token   
Support: Unknown   
```
"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" is token.   
If token is "???", then reset device and connect device created Wi-Fi hotspot.   
Run following command:   
```
miio --discover --sync
```
Wait until you get output.   
For more information about token, please refer to [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol) and [miio](https://github.com/aholstenson/miio).   
## Version Logs
### 0.2.0
1.add support for Philips Ceiling Lamp.   
### 0.1.1
1.add Philips Table Lamp 2 eyecare mode switch accessory.   
### 0.1.0
1.add support for Philips Table Lamp 2.   
### 0.0.6
1.optimized code.   
### 0.0.5
1.optimized code.   
### 0.0.4
1.fixed bug that 'log of undefined' error.    
2.config item 'accessories' renamed 'deviceCfgs'.   
### 0.0.3
1.fixed bug that many of the same type of device conflict with each other.   
### 0.0.2
1.optimized code.   
### 0.0.1
1.support for Philips Smart Bulb.   
