(function () {

    "use strict";

    var express = require("express"),
        fluid = require("infusion"),
        gpii = fluid.registerNamespace("gpii");

    fluid.require("../../../../../src/dataSource.js");
        
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
            userDataSource: {
                type: "gpii.dataSource",
                options: {
                    termMap: {
                        token: "%token"
                    }
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
        that.server.all("/user/:id", function (req, res, next) {
            // params available: id
            req.id = req.params.id;
            next();
        });
    
        that.server.get("/user/:id", function (req, res) {
            that.userDataSource.get({
                token: req.id
            }, function (resp) {
                res.send(resp, 200);
            }, function (message, error) {
                console.log(message);
            });
        });
    
        that.server.listen(8080);
    };
    
    fluid.demands("userDataSource", "gpii.development", {
        options: {
            url: "%db/test/data/user/%token.json"
        }
    });
    
    fluid.demands("userDataSource", "gpii.production", {
        options: {
            host: "0.0.0.0",
            port: 5984,
            url: "%db/user/%token"
        }
    });
    
    gpii.preferencesServer();
    
})();