(function () {

    "use strict";

    var fluid = require("infusion"),
        gpii = fluid.registerNamespace("gpii"),
        fs = require("fs"),
        http = require("http"),
        path = require("path"),
        eUC = "encodeURIComponent:";
        
    fluid.defaults("gpii.dataSource", {
        gradeNames: ["autoInit", "fluid.littleComponent"],
        components: {
            urlExpander: {
                type: "gpii.dataSource.urlExpander"
            }
        },
        invokers: {
            get: "gpii.dataSource.get",
            resolveUrl: "gpii.dataSource.resolveUrl"
        },
        url: "",
        termMap: {},
        writable: false
    });

    fluid.defaults("gpii.dataSource.urlExpander", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        vars: {
            db: ""
        },
        finalInitFunction: "gpii.dataSource.urlExpander.finalInit"
    });
    
    gpii.dataSource.urlExpander.finalInit = function (that) {
        that.expand = function (url) {
            return fluid.stringTemplate(url, that.options.vars);
        };
    };
    
    fluid.demands("gpii.dataSource.urlExpander", "gpii.development", {
        options: {
            vars: {
                db: path.join(__dirname)
            }
        }
    });

    fluid.demands("gpii.dataSource.get", "gpii.development", {
        funcName: "gpii.dataSource.FSGet",
        args: [
            "{dataSource}.options.responseParser",
            "{dataSource}.resolveUrl",
            "{arguments}.0",
            "{arguments}.1",
            "{arguments}.2"
        ]
    });

    fluid.demands("gpii.dataSource.get", "gpii.production", {
        funcName: "gpii.dataSource.DBGet",
        args: [
            "{dataSource}.options.responseParser",
            "{dataSource}.options.host",
            "{dataSource}.options.port",
            "{dataSource}.resolveUrl",
            "{arguments}.0",
            "{arguments}.1",
            "{arguments}.2"
        ]
    });

    fluid.demands("gpii.dataSource.resolveUrl", "gpii.dataSource", {
        funcName: "gpii.dataSource.resolveUrl",
        args: ["{urlExpander}.expand", "{dataSource}.options.url", "{dataSource}.options.termMap", "{arguments}.0"]
    });

    gpii.dataSource.DBGet = function (responseParser, host, port, resolveUrl, directModel, callback, errorCallback) {
        var path = resolveUrl(directModel);
        http.get({
            host: host,
            port: port,
            path: path
        }, function (res) {
            var data = JSON.parse(res.body);
            if (responseParser) {
                data = typeof responseParser === "string" ?
                    fluid.invokeGlobalFunction(responseParser, [data, directModel]) : responseParser(data, directModel);
            }
            callback(data);
        }).on("error", function (error) {
            errorCallback(error.message, error);
        });
    };

    gpii.dataSource.FSGet = function (responseParser, resolveUrl, directModel, callback, errorCallback) {
        var fileName = resolveUrl(directModel);
        fs.readFile(fileName, function (error, data) {
            if (error) {
                errorCallback(error.message, error);
            }
            data = JSON.parse(data);
            if (responseParser) {
                data = typeof responseParser === "string" ?
                    fluid.invokeGlobalFunction(responseParser, [data, directModel]) : responseParser(data, directModel);
            }
            callback(data);
        });
    };

    gpii.dataSource.resolveUrl = function (expand, url, termMap, directModel) {
        var map = fluid.copy(termMap);
        map = fluid.transform(map, function (entry) {
            var encode = false;
            if (entry.indexOf(eUC) === 0) {
                encode = true;
                entry = entry.substring(eUC.length);
            }
            if (entry.charAt(0) === "%") {
                entry = fluid.get(directModel, entry.substring(1));
            }
            if (encode) {
                entry = encodeURIComponent(entry);
            }
            return entry;
        });
        var replaced = fluid.stringTemplate(url, map);
        replaced = expand(replaced);
        return replaced;
    };

})();