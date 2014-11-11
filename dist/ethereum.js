require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var AutoProvider=function(userOptions){var options,self,closeWithSuccess,ws;if(!web3.haveProvider()){if(this.sendQueue=[],this.onmessageQueue=[],navigator.qt)return void(this.provider=new web3.providers.QtProvider);userOptions=userOptions||{},options={httprpc:userOptions.httprpc||"http://localhost:8080",websockets:userOptions.websockets||"ws://localhost:40404/eth"},self=this,closeWithSuccess=function(success){ws.close(),success?self.provider=new web3.providers.WebSocketProvider(options.websockets):(self.provider=new web3.providers.HttpRpcProvider(options.httprpc),self.poll=self.provider.poll.bind(self.provider)),self.sendQueue.forEach(function(payload){self.provider(payload)}),self.onmessageQueue.forEach(function(handler){self.provider.onmessage=handler})},ws=new WebSocket(options.websockets),ws.onopen=function(){closeWithSuccess(!0)},ws.onerror=function(){closeWithSuccess(!1)}}};AutoProvider.prototype.send=function(payload){return this.provider?void this.provider.send(payload):void this.sendQueue.push(payload)},Object.defineProperty(AutoProvider.prototype,"onmessage",{set:function(handler){return this.provider?void(this.provider.onmessage=handler):void this.onmessageQueue.push(handler)}}),module.exports=AutoProvider;
},{}],2:[function(require,module,exports){
function formatJsonRpcObject(object){return{jsonrpc:"2.0",method:object.call,params:object.args,id:object._id}}function formatJsonRpcMessage(message){var object=JSON.parse(message);return{_id:object.id,data:object.result,error:object.error}}var HttpRpcProvider=function(host){this.handlers=[],this.host=host};HttpRpcProvider.prototype.sendRequest=function(payload,cb){var data=formatJsonRpcObject(payload),request=new XMLHttpRequest;request.open("POST",this.host,!0),request.send(JSON.stringify(data)),request.onreadystatechange=function(){4===request.readyState&&cb&&cb(request)}},HttpRpcProvider.prototype.send=function(payload){var self=this;this.sendRequest(payload,function(request){self.handlers.forEach(function(handler){handler.call(self,formatJsonRpcMessage(request.responseText))})})},HttpRpcProvider.prototype.poll=function(payload,id){var self=this;this.sendRequest(payload,function(request){var parsed=JSON.parse(request.responseText);!parsed.error&&(parsed.result instanceof Array?0!==parsed.result.length:parsed.result)&&self.handlers.forEach(function(handler){handler.call(self,{_event:payload.call,_id:id,data:parsed.result})})})},Object.defineProperty(HttpRpcProvider.prototype,"onmessage",{set:function(handler){this.handlers.push(handler)}}),module.exports=HttpRpcProvider;
},{}],3:[function(require,module,exports){
function flattenPromise(obj){return obj instanceof Promise?Promise.resolve(obj):obj instanceof Array?new Promise(function(resolve){var promises=obj.map(function(o){return flattenPromise(o)});return Promise.all(promises).then(function(res){for(var i=0;i<obj.length;i++)obj[i]=res[i];resolve(obj)})}):obj instanceof Object?new Promise(function(resolve){var keys=Object.keys(obj),promises=keys.map(function(key){return flattenPromise(obj[key])});return Promise.all(promises).then(function(res){for(var i=0;i<keys.length;i++)obj[keys[i]]=res[i];resolve(obj)})}):Promise.resolve(obj)}function messageHandler(data){if(void 0!==data._event)return void web3.trigger(data._event,data._id,data.data);if(data._id){var cb=web3._callbacks[data._id];cb&&(cb.call(this,data.error,data.data),delete web3._callbacks[data._id])}}var ethWatch,shhWatch,ProviderManager,Filter,ethMethods=function(){var blockCall=function(args){return"string"==typeof args[0]?"eth_blockByHash":"eth_blockByNumber"},transactionCall=function(args){return"string"==typeof args[0]?"eth_transactionByHash":"eth_transactionByNumber"},uncleCall=function(args){return"string"==typeof args[0]?"eth_uncleByHash":"eth_uncleByNumber"},methods=[{name:"balanceAt",call:"eth_balanceAt"},{name:"stateAt",call:"eth_stateAt"},{name:"countAt",call:"eth_countAt"},{name:"codeAt",call:"eth_codeAt"},{name:"transact",call:"eth_transact"},{name:"call",call:"eth_call"},{name:"block",call:blockCall},{name:"transaction",call:transactionCall},{name:"uncle",call:uncleCall},{name:"compile",call:"eth_compile"},{name:"lll",call:"eth_lll"}];return methods},ethProperties=function(){return[{name:"coinbase",getter:"eth_coinbase",setter:"eth_setCoinbase"},{name:"listening",getter:"eth_listening",setter:"eth_setListening"},{name:"mining",getter:"eth_mining",setter:"eth_setMining"},{name:"gasPrice",getter:"eth_gasPrice"},{name:"account",getter:"eth_account"},{name:"accounts",getter:"eth_accounts"},{name:"peerCount",getter:"eth_peerCount"},{name:"defaultBlock",getter:"eth_defaultBlock",setter:"eth_setDefaultBlock"},{name:"number",getter:"eth_number"}]},dbMethods=function(){return[{name:"put",call:"db_put"},{name:"get",call:"db_get"},{name:"putString",call:"db_putString"},{name:"getString",call:"db_getString"}]},shhMethods=function(){return[{name:"post",call:"shh_post"},{name:"newIdentity",call:"shh_newIdentity"},{name:"haveIdentity",call:"shh_haveIdentity"},{name:"newGroup",call:"shh_newGroup"},{name:"addToGroup",call:"shh_addToGroup"}]},ethWatchMethods=function(){var newFilter=function(args){return"string"==typeof args[0]?"eth_newFilterString":"eth_newFilter"};return[{name:"newFilter",call:newFilter},{name:"uninstallFilter",call:"eth_uninstallFilter"},{name:"getMessages",call:"eth_getMessages"}]},shhWatchMethods=function(){return[{name:"newFilter",call:"shh_newFilter"},{name:"uninstallFilter",call:"shh_uninstallFilter"},{name:"getMessage",call:"shh_getMessages"}]},setupMethods=function(obj,methods){methods.forEach(function(method){obj[method.name]=function(){return flattenPromise(Array.prototype.slice.call(arguments)).then(function(args){var call="function"==typeof method.call?method.call(args):method.call;return{call:call,args:args}}).then(function(request){return new Promise(function(resolve,reject){web3.provider.send(request,function(err,result){return err?void reject(err):void resolve(result)})})}).catch(function(err){console.error(err)})}})},setupProperties=function(obj,properties){properties.forEach(function(property){var proto={};proto.get=function(){return new Promise(function(resolve,reject){web3.provider.send({call:property.getter},function(err,result){return err?void reject(err):void resolve(result)})})},property.setter&&(proto.set=function(val){return flattenPromise([val]).then(function(args){return new Promise(function(resolve){web3.provider.send({call:property.setter,args:args},function(err,result){return err?void reject(err):void resolve(result)})})}).catch(function(err){console.error(err)})}),Object.defineProperty(obj,property.name,proto)})},web3={_callbacks:{},_events:{},providers:{},toHex:function(str){var i,n,hex="";for(i=0;i<str.length;i++)n=str.charCodeAt(i).toString(16),hex+=n.length<2?"0"+n:n;return hex},toAscii:function(hex){var code,str="",i=0,l=hex.length;for("0x"===hex.substring(0,2)&&(i=2);l>i&&(code=hex.charCodeAt(i),0!==code);i+=2)str+=String.fromCharCode(parseInt(hex.substr(i,2),16));return str},toDecimal:function(val){return parseInt(val,16)},fromAscii:function(str,pad){pad=void 0===pad?32:pad;for(var hex=this.toHex(str);hex.length<2*pad;)hex+="00";return"0x"+hex},eth:{prototype:Object(),watch:function(params){return new Filter(params,ethWatch)}},db:{prototype:Object()},shh:{prototype:Object(),watch:function(params){return new Filter(params,shhWatch)}},on:function(event,id,cb){return void 0===web3._events[event]&&(web3._events[event]={}),web3._events[event][id]=cb,this},off:function(event,id){return void 0!==web3._events[event]&&delete web3._events[event][id],this},trigger:function(event,id,data){var cb,callbacks=web3._events[event];callbacks&&callbacks[id]&&(cb=callbacks[id])(data)}},eth=web3.eth;setupMethods(eth,ethMethods()),setupProperties(eth,ethProperties()),setupMethods(web3.db,dbMethods()),setupMethods(web3.shh,shhMethods()),ethWatch={changed:"eth_changed"},setupMethods(ethWatch,ethWatchMethods()),shhWatch={changed:"shh_changed"},setupMethods(shhWatch,shhWatchMethods()),ProviderManager=function(){var self,poll;this.queued=[],this.polls=[],this.ready=!1,this.provider=void 0,this.id=1,self=this,(poll=function(){self.provider&&self.provider.poll&&self.polls.forEach(function(data){data.data._id=self.id,self.id++,self.provider.poll(data.data,data.id)}),setTimeout(poll,12e3)})()},ProviderManager.prototype.send=function(data,cb){data._id=this.id,cb&&(web3._callbacks[data._id]=cb),data.args=data.args||[],this.id++,void 0!==this.provider?this.provider.send(data):(console.warn("provider is not set"),this.queued.push(data))},ProviderManager.prototype.set=function(provider){void 0!==this.provider&&void 0!==this.provider.unload&&this.provider.unload(),this.provider=provider,this.ready=!0},ProviderManager.prototype.sendQueued=function(){for(var i=0;this.queued.length;i++)this.send(this.queued[i])},ProviderManager.prototype.installed=function(){return void 0!==this.provider},ProviderManager.prototype.startPolling=function(data,pollId){this.provider&&this.provider.poll&&this.polls.push({data:data,id:pollId})},ProviderManager.prototype.stopPolling=function(pollId){var i,poll;for(i=this.polls.length;i--;)poll=this.polls[i],poll.id===pollId&&this.polls.splice(i,1)},web3.provider=new ProviderManager,web3.setProvider=function(provider){provider.onmessage=messageHandler,web3.provider.set(provider),web3.provider.sendQueued()},web3.haveProvider=function(){return!!web3.provider.provider},Filter=function(options,impl){this.impl=impl,this.callbacks=[];var self=this;this.promise=impl.newFilter(options),this.promise.then(function(id){self.id=id,web3.on(impl.changed,id,self.trigger.bind(self)),web3.provider.startPolling({call:impl.changed,args:[id]},id)})},Filter.prototype.arrived=function(callback){this.changed(callback)},Filter.prototype.changed=function(callback){var self=this;this.promise.then(function(id){self.callbacks.push(callback)})},Filter.prototype.trigger=function(messages){for(var i=0;i<this.callbacks.length;i++)this.callbacks[i].call(this,messages)},Filter.prototype.uninstall=function(){var self=this;this.promise.then(function(id){self.impl.uninstallFilter(id),web3.provider.stopPolling(id),web3.off(impl.changed,id)})},Filter.prototype.messages=function(){var self=this;return this.promise.then(function(id){return self.impl.getMessages(id)})},module.exports=web3;
},{}],4:[function(require,module,exports){
var QtProvider=function(){this.handlers=[];var self=this;navigator.qt.onmessage=function(message){self.handlers.forEach(function(handler){handler.call(self,JSON.parse(message.data))})}};QtProvider.prototype.send=function(payload){navigator.qt.postMessage(JSON.stringify(payload))},Object.defineProperty(QtProvider.prototype,"onmessage",{set:function(handler){this.handlers.push(handler)}}),module.exports=QtProvider;
},{}],5:[function(require,module,exports){
var WebSocketProvider=function(host){this.handlers=[],this.queued=[],this.ready=!1,this.ws=new WebSocket(host);var self=this;this.ws.onmessage=function(event){for(var i=0;i<self.handlers.length;i++)self.handlers[i].call(self,JSON.parse(event.data),event)},this.ws.onopen=function(){self.ready=!0;for(var i=0;i<self.queued.length;i++)self.send(self.queued[i])}};WebSocketProvider.prototype.send=function(payload){if(this.ready){var data=JSON.stringify(payload);this.ws.send(data)}else this.queued.push(payload)},WebSocketProvider.prototype.onMessage=function(handler){this.handlers.push(handler)},WebSocketProvider.prototype.unload=function(){this.ws.close()},Object.defineProperty(WebSocketProvider.prototype,"onmessage",{set:function(provider){this.onMessage(provider)}}),module.exports=WebSocketProvider;
},{}],"web3":[function(require,module,exports){
var web3=require("./lib/main");web3.providers.WebSocketProvider=require("./lib/websocket"),web3.providers.HttpRpcProvider=require("./lib/httprpc"),web3.providers.QtProvider=require("./lib/qt"),web3.providers.AutoProvider=require("./lib/autoprovider"),module.exports=web3;
},{"./lib/autoprovider":1,"./lib/httprpc":2,"./lib/main":3,"./lib/qt":4,"./lib/websocket":5}]},{},[])


//# sourceMappingURL=ethereum.js.map