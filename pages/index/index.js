var CryptoJS = require('../../utils/crypto-js/crypto-js');
var Util = require('../../utils/util');

class BlePacket{
  static s_sn = 0;
  static s_ask_sn = 0;

  static packet(pkt){
    var data_len = 0;

    if(pkt.data) {
      data_len = pkt.data.length;
    }
    var totalReal = 4+4+2+2+data_len+2;
    var total = totalReal;
    if(totalReal%16 != 0) total=Math.ceil(totalReal/16)*16;

    var arr8 = new Uint8Array(total);
    
    this.wordsToBytes(arr8, 0, s_sn);
    this.wordsToBytes(arr8, 4, s_ask_sn);
    this.shortsToBytes(arr8, 8, pkt.func_code);
    this.shortsToBytes(arr8, 10, pkt.data_len); //pkt.data_len不是真正的长度，有可能是dp个数

    for(var i=0; i < data_len; i++){
      arr8[12+i] = pkt.data[i];
    }
    var crc16 = CRC16(arr8, totalReal - 2);
    arr8[totalReal - 2] = crc16[0];
    arr8[totalReal - 1] = crc16[1];

    //后面填充部分置0
    for(var i=totalReal; i<total; i++){
      arr8[i] = 0;
    }
    return arr8;
  }
  

  parse(arr8){
    var packet_len = arr8.length;
    var pkt = {};

    pkt.sn = arr8[0] << 24 &0xff000000 | arr8[1] <<16 &0xff0000 | arr8[2] <<8 &0xff00 | arr8[3] &0xff;
    pkt.ask_sn = arr8[4] << 24 &0xff000000 | arr8[5] <<16 &0xff0000 | arr8[6] <<8 &0xff00 | arr8[7] &0xff;
    pkt.func_code = arr8[8] << 8 & 0xff00 | arr8[9] & 0xff;
    pkt.data_len = arr8[10] << 8 & 0xff00 | arr8[11] & 0xff;

    if(Math.ceil((pkt.data_len + 14)/16)*16 != arr8.length){
      console.log('parse error: length is not correct');
      return;
    }
    pkt.data = new Uint8Array(pkt.data_len);
    for(var i=0; i<pkt.data_len; i++){
      pkt.data[i] = arr8[12+i];
    }
    return pkt;
  }

  parseDeviceMsg(arr){
    var dev_msg = {};
    var offset = 0;

    dev_msg.gujian_version1 = arr[offset++] << 8 | arr[offset++];
    dev_msg.protocal_version = arr[offset++] << 8  | arr[offset++];
    dev_msg.flag = arr[offset++];
    dev_msg.bond = arr[offset++];
    dev_msg.srand = new Uint8Array(6);
    for(var i=0; i<6; i++){
      dev_msg.srand[i] = arr[offset++]
    }
    dev_msg.hardware_version1 = arr[offset++] << 8  | arr[offset++];
    dev_msg.auth_key = new Uint8Array(32);
    for(var i=0; i<32; i++){
      dev_msg.auth_key[i] = arr[offset++];
    }
    dev_msg.gujian_version2 = arr[offset++] <<16  | arr[offset++] <<8  | arr[offset++];
    dev_msg.hardware_version2 = arr[offset++] <<16  | arr[offset++] <<8  | arr[offset++];
    dev_msg.commu_ability = arr[offset++] << 8 | arr[offset++];
    offset++;//reserve
    dev_msg.virtual_id = new Uint8Array(22);
    for(var i=0; i<22; i++){
      dev_msg.virtual_id[i] = arr[offset++];
    }
    return dev_msg;

  }

  static randomIv(){
    var str = '';
  
    //把随机的数映射为可见字符，即使说不一定必须
    //0~9 a~z A~Z _@ 64个字符
    for(var i=0; i<16; i++){
      var char;
      var rand = Math.floor(Math.random()*64)
      
      if(rand <10) char = String.fromCharCode(48+rand);
      else if(rand < 36) char =String.fromCharCode(97+rand-10);
      else if(rand < 62) char =String.fromCharCode(65+rand - 36);
      else if(rand == 62) char = '_';
      else char = '@';
      str+=char;
    }
    return str;
  }

  static printBytes(arr){
    var str = '';
    var tab = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
    for(var i=0; i<arr.length; i++){
      str+='0x';
      var hi = Math.floor(arr[i]/16);
      var lo = arr[i]%16;
      str+=tab[hi];
      str+=tab[lo];
      str+=',';
    }
    console.log(str);
  }

  static bytesToWords(arr, index, d, index2){
    arr[index] = d[index2] << 24 &0xff000000 | d[index2] <<16 &0xff0000 | d[index2] <<8 &0xff00 | d[index2] &0xff;
  }
  static wordsToBytes(arr, index, d){
    arr[index] = d >>> 24 & 0xff;
    arr[index+1] = d >>> 16 & 0xff;
    arr[index+2] = d >>> 8 & 0xff;
    arr[index+3] = d & 0xff;
  }
  static shortsToBytes(arr, index, d){
    arr[index] = d >>> 8 & 0xff;
    arr[index+1] = d & 0xff;
  }


}
function bytesToHex(arr){
  var str = '';
  var tab = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];

  for(var i=0; i<arr.length; i++){
    str += tab[arr[i] >>>4];
    str += tab[arr[i] & 0x0f];
  }
  return str;
}
function hexToBytes(str){
  if(str.length % 2 != 0){
    return null;
  }
  var arr = new Uint8Array(str.length/2);
  for(var i=0; i<str.length/2; i++){
    var hi = str.charCodeAt(i*2);
    var lo = str.charCodeAt(i*2+1);
    if(hi>=48 & hi <=57){
      var h = hi-48;
    }else if(hi>=65 && hi<=70){
      var h = hi-64+10;
    } else if(hi>=97 && hi<=102){
      var h = hi-97+10;
    }else{
      throw 'hex str format error';
    }
    if(lo>=48 & lo <=57){
      var l = lo-48;
    }else if(lo>=65 && lo<=70){
      var l = lo-64+10;
    } else if(lo>=97 && lo<=102){
      var l = lo-97+10;
    }else{
      throw 'hex str format error';
    }
    arr[i] = h << 4 | l;
  }
  return arr;
}

Page({
  data:{
    bSearchOne:false,
    bSearchError: false,
    errMes:null,
    deviceFound:null,
    bSearching:false,
    bConnected:false,
    bBinded:false,
    readSnTab:{}
  },
  resetStatus(){
    this.setData({
      bSearchDone:false,
      bSearchError: false,
      errMes:null,
      deviceFound:null,
      bSearching:false
    });
  },
  searchBle(){
    var pg = this;
    this.resetStatus();
    wx.openBluetoothAdapter({
      success:function(res){
        console.log('初始化蓝牙成功:',res);
        pg.startDiscovery();
      },
      fail:function(res){
        console.log('初始化蓝牙失败：', res);
        pg.setData({
          bSearchError:true,
          errMsg:'蓝牙设备初始化错误'
        })
      }
    });
  },
  
  startDiscovery(){
    var pg = this;
    wx.startBluetoothDevicesDiscovery({
      success:function(res){
        console.log('start discovery success:',res);
        wx.onBluetoothDeviceFound(function(res){
          console.log('found new devices');
          for(var i=0; i<res.devices.length; i++){
            console.log(res.devices[i]);
            console.log(res.devices[i].advertisServiceUUIDs);
          }
          wx.stopBluetoothDevicesDiscovery({
            fail:function(res){
              console.log('stopBluetoothDevicesDiscovery error:',res);
            }
          });
          pg.setData({
            deviceFound:res.devices[0],
            bSearchOne:true,
            bSearching:false
          })
        });
        
      },
      fail:function(res){
        console.log('start discovery fail:', res);
      },
      services:['0000A201-0000-1000-8000-00805F9B34FB']
    });
    this.setData({
      bSearching:true
    });
  },
  
  connectBle(){
    var pg = this;
    this.data.deviceFound.deviceUUID = "bc83912be7b75198";//假设我已经算出来了
    wx.createBLEConnection({
      deviceId:pg.data.deviceFound.deviceId,
      success(res){
        console.log('连接成功');
        pg.setData({
          bConnected:true
        });
      },
      fail(res){
        console.log('连接失败');
      }
    });
    wx.notifyBLECharacteristicValueChange({
      deviceId: pg.data.deviceFound.deviceId,
      serviceId: '1910',
      characteristicId: '2b10',
      state:true,
      type:'notification',
      success:function(res){
        console.log('notify set success');
      },
      fail: function(res){
        console.log('notify failed : ',res)
      }
    });
    wx.onBLECharacteristicValueChange(characteristicValueChange);
  },
  aes_encrypt(arr, key, iv, func_succ){
    //var str = bytesToHex(arr);
    wx.request({
      url: 'https://suo.zhongyeyl.cn/wxapi/secret/ase_cbc_encrypt',
      method: 'POST',
      data: arr,
      key: key,
      iv: iv,
      success:func_succ,
      fail:function(res){
        console.log('aes encrypt fail:', res)
      }
    });
  },
  aes_decrypt(arr, key, iv, func_succ){
    wx.request({
      url: 'https://suo.zhongyeyl.cn/wxapi/secret/ase_cbc_decrypt',
      method: 'POST',
      data: arr,
      key: key,
      iv: iv,
      success:func_succ,
      fail:function(res){
        console.log('aes encrypt fail:', res)
      }
    });
  },
  writeBle(arr, func_succ){
    wx.writeBLECharacteristicValue({
      deviceId: pg.data.deviceFound.deviceId,
      serviceId: '1910',
      characteristicId: '2b11', 
      value: arr.buffer,
      success: function(res){
        BlePacket.s_sn++;
        func_succ(res);
      },
      fail: function(res){
        console.log('write ble error:', res);
      }
    });
  },
  //不知道这个是不是多余
  readBle(){
    wx.readBLECharacteristicValue({
      deviceId: pg.data.deviceFound.deviceId,
      serviceId: '1910',
      characteristicId: '2b10',
      success:function(res){
        console.log("readBLECharacteristicValue success");
      },
      fail:function(res){
        console.log("readBLECharacteristicValue fail:",res);
      }
    });
  },
  characteristicValueChange(res){
    var arr = new Uint8Array(res.value);
    var iv = arr.subarray(1,17);
    var encrypted_arr = arr.subarray(17,arr.length);
    var that = this;
    
    if((arr.length - 17) % 16 !=0){
      console.log('length error');
      return;
    }

    //secret_key_1
    if(arr[0] == 1){
      var key = this.data.secret_key_1;
    }else if(arr[0] == 5){
      var key = this.data.session_key;
    }else{
      console.log("secert flags error:",err[0]);
    }

    //decrypt
    aes_decrypt(encrypted_arr, key, iv, function(res){
      var decrypted_arr = res.data.decrypt_data;
      var pkt = BlePacket.parse(decrypted_arr);
      if(!pkt){
        console.log('packet parse error');
      }
      if(pkt.func_code == 0 && that.data.readSnTab.getDeviceMsg){
        that.data.readSnTab.getDeviceMsg = undefined; //读取到了就把标志清空
        that.analyzeDeviceMsgPacket(pkt);
      }else if(that.readFlags == 2){
        that.analyzePairPacket(pkt);
      }

    })

  },

  analyzeDeviceMsgPacket(pkt){
    this.data.devMsg = BlePacket.parseDeviceMsg(pkt.data);
    if(this.data.devMsg.bond){
      console.log('蓝牙设备已绑定');
      return;
    }
    //开始绑定
    var secret_key_2 = getSecretKey2();
    

  },
  analyzePairPacket(pkt){

  },
  bindBle(){
    //https://suo.zhongyeyl.cn/wxapi/secret/get_secret_key_1?device_id=bc83912be7bcQEag
    var that = this;
    wx.request({
      url: 'https://suo.zhongyeyl.cn/wxapi/secret/get_secret_key_1',
      method: 'POST',
      device_id: that.data.deviceFound.deviceUUID,
      success:function(res){
        that.data.secret_key_1 = res.data.secret_key_1;
        that.data.server_rand = res.data.server_rand;
        that.getDeviceMsg();
      },
      fail:function(res){
        console.log('get secret key faile:', res);
      }
    });

  },
  getDeviceMsg(){
    var pkt = {};
    pkt.flag = 0;
    pkt.sn = BlePacket.s_sn;
    pkt.ask_sn = BlePacket.s_ask_sn;
    var arr = BlePacket.packet(pkt);
    var that = this;

    this.aes_encrypt(arr, this.data.secret_key_1, server_rand, function(res){
      var arr_encrypted = res.data.encrypt_data; //暂时这样
      var arr_all = new Uint8Array(arr_encrypted.length+17);
        arr_all.set(arr_encrypted,17);
        arr_all[0] = 1;
        for(var i=0; i<16; i++){
          arr_all[1+i] = that.data.server_rand.charCodeAt(i);
        }
        writeBle(arr_all, function(){
          that.data.readSnTab.getDeviceMsg = BlePacket.s_sn;
          //不知道是否需要
          readBle();
        });
    });
  }
})