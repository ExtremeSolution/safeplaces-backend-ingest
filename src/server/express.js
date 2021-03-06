const express = require('express');
const http = require('http');
const Promise = require('bluebird');
const cors = require('cors');
const bodyParser = require('body-parser');
const expressLogger = require('../logger/express');
const errorHandler = require('./errorHandler');
const notFoundHandler = require('./notFoundHandler');
const responseTimeHandler = require('./responseTimeHandler');

const expressSession = require('express-session');
const cookieParser = require('cookie-parser');

class Server {
  constructor() {
    this._app = express();

    const bodyParseJson = bodyParser.json({
      type:'*/*',
      limit: '50mb'
    })
    const bodyParseEncoded = bodyParser.urlencoded({ extended: false })

    this._app.use(cors());
    this._app.use(cookieParser());
    this._app.use(expressLogger()); // Log Request
    this._app.use(bodyParseJson);
    this._app.use(bodyParseEncoded);
    this._app.use(
      expressSession({
        secret: 'keyboard cat',
        resave: true,
        saveUninitialized: true,
      }),
    );

    this._app.use(responseTimeHandler())
    
    this._router = express.Router();
    this._app.use('/', this._router);

    process.nextTick(() => {
      this._app.use(notFoundHandler());
      this._app.use(errorHandler())
    })

    this._server = http.createServer(this._app);
  }

  get app() {
    return this._app;
  }

  start(port = 3000) {
    if (!port) throw new Error('Port not set.');

    return Promise.fromCallback(cb => this._server.listen(port, cb));
  }


  close() {
    this._server.close();
  }

  /**
   * @method get
   */
  get() {
    return this._router.get(...arguments);
  }

  /**
   * @method get
   */
  post() {
    return this._router.post(...arguments);
  }

  /**
   * @method put
   */
  put() {
    return this._router.put(...arguments);
  }

  /**
   * @method delete
   */
  delete() {
    return this._router.delete(...arguments);
  }

  /**
   * @method wrapAsync
   */
  wrapAsync(fn) {
    return function(req, res, next) {
      fn(req, res, next).catch(next)
    }
  }
}

module.exports = Server;
