var EasyWaf = require('easy-waf');
if(EasyWaf.default) {
  EasyWaf = EasyWaf.default;    
}
var fs = require("fs");
var os = require("os");
var url = require("url");
var easywafconfig = {};
var logm = {};
if (fs.existsSync("easywaf-config.json")) easywafconfig = JSON.parse(fs.readFileSync("easywaf-config.json").toString())
easywafconfig.preBlockHook = function(req, moduleInfo, ip) {
  try {
    logm[ip]("Request blocked by EasyWAF. Module: " + moduleInfo.name);
  } catch (ex) {

  }
  return true;
}
easywafconfig.disableLogging = true;
const easyWaf = EasyWaf(easywafconfig);

function Mod() {}
Mod.prototype.callback = function callback(req, res, serverconsole, responseEnd, href, ext, uobject, search, defaultpage, users, page404, head, foot, fd, elseCallback, configJSON, callServerError) {
  return function() {
    logm[req.socket.remoteAddress] = serverconsole.errmessage;
    //REQ.BODY
    function readableHandler() {
      try {
        req.body = req._readableState.buffer._getString();
        if (req.headers["content-type"] == "application/x-www-form-urlencoded") req.body = url.parse("?" + req.body.strip(), true).query;
        if (req.headers["content-type"] == "application/json") req.body = JSON.parse(req.body.strip());
      } catch (ex) {
      }
      
      //EASYWAF
      easyWaf(req, res, function() {
        if (href == "/easywaf-config.json" || (os.platform() == "win32" && href.toLowerCase() == "/easywaf-config.json")) {
          if (callServerError) {
            callServerError(403, "easy-waf-integration/1.0.0");
          } else {
            res.writeHead(403, "Forbidden", {
              "Server": "SVR.JS"
            });
            res.end("403 Forbidden!");
          }
        } else {
          elseCallback();
        }
      });
    }
    if(req._readableState.length > 0 || req._readableState.ended) {
      readableHandler();
    } else {
      req.once("readable", readableHandler);
    }
  }
}
module.exports = Mod;
