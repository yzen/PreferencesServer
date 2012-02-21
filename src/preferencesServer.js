(function () {

    "use strict";

    var express = require("express"),
        fluid = require("infusion"),
        gpii = fluid.registerNamespace("gpii");

    fluid.require("../../../../../src/source.js");
        
    process.on("uncaughtException", function (err) {
        console.log("Uncaught Exception: " + err);
        process.exit(1);
    });

    process.on("SIGTERM", function () {
        process.exit(0);
    });
    
    fluid.defaults("gpii.preferencesServer", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        preInitFunction: "gpii.preferencesServer.preInit",
        finalInitFunction: "gpii.preferencesServer.finalInit",
        components: {
            userSource: {
                type: "gpii.source",
                options: {
                    writable: true,
                    path: "/user/:id?"
                }
            }
        }
    });
    
    gpii.preferencesServer.preInit = function (that) {
        that.server = express.createServer(
//      In case we want to support https
//        {
//            key: fs.readFileSync('path/to/key.pem'),
//            cert: fs.readFileSync('path/to/cert.pem')
//        }
        );
        that.server.configure(function () {
            that.server.use(express.bodyParser());
        });
        that.server.configure("production", function () {
            // Set production options.
            fluid.staticEnvironment.production = fluid.typeTag("gpii.production");
        });
        that.server.configure("development", function () {
            // Set development options.
            fluid.staticEnvironment.production = fluid.typeTag("gpii.development");
        });
    };
    
    gpii.preferencesServer.finalInit = function (that) {
        that.server.listen(8080);
    };
    
    fluid.demands("gpii.dataSource", ["gpii.development", "userSource"], {
        options: {
            url: "%db/test/data/user/%id.json"
        }
    });
    
    fluid.demands("gpii.dataSource", ["gpii.production", "userSource"], {
        options: {
            host: "0.0.0.0",
            port: 5984,
            url: "%db/user/%id"
        }
    });
    
    gpii.preferencesServer();
    
})();