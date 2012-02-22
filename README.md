PreferencesServer
===

A server build with node.js and express that saves and returns user preferences using Apache CouchDB as backend.

---
Calls to preferences server are made with user credentials. 

### Dependencies

- [express](http://expressjs.com/) framework. You can install it using npm:

    npm install express

- [infusion](https://github.com/fluid-project/infusion) framework. You can install it using git and npm:

    git clone git://github.com/fluid-project/infusion.git
    npm install path/to/your/local/infusion/clone

### Run

To run preferences server simply type:

    node src/preferencesServer.js [port=PORTNUMBER]

- You can specify an optional port number to run your preferences server on.