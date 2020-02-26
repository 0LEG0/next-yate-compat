/**
 * @file index.js
 * @author Anton <aucyxob@gmail.com>
 * @version 0.0.5
 * @license Apache-2.0
 * @description Nodejs library compatible with javascript.yate Yate module.
 * @requires "next-yate"
 * @see https://github.com/0LEG0/next-yate-compat
 * @see https://docs.yate.ro/wiki/Javascript_Reference
 */
"use strict";

// imports
const { Console } = require("console");
const { Yate, YateMessage, DumpStream } = require("next-yate");

/**
 * Creates Objects compatible to javascript.yate Yate module:
 * Engine,
 * Message,
 * Channel
 * @function
 * @global
 * @param {Object} options - options for network connection
 * @returns {(Engine|Message|Channel)} {Engine, Message, Channel}
 * @see Engine
 * @see Message
 * @example
 * const {Engine} = require("next-yate-compat").getEngine({host: "127.0.0.1"});
 * Engine.output("Hello World!");
 * @see https://docs.yate.ro/wiki/Javascript_Reference
 */
function getEngine(options) {
	let _yate = new Yate(options);
	let _dstream = new DumpStream();
	let _dconsole = new Console(_dstream);

	if (!_yate._host) console = _yate.getConsole();
	_yate.on("_debug", console.log);
	_yate.init();

	/**
	 * Message
	 * @constructs
	 * @namespace Message
	 * @param {string} name - message name (required)
	 * @param {boolean} broadcast - (not used)
	 * @param {Object} params - paramerers (optional)
	 * @returns {Message}
	 * @example
	 * const {Engine, Message} = require("next-yate-compat").getEngine();
	 * let m = new Message("engine.status");
	 * let status = await m.dispatch();
	 * @see https://docs.yate.ro/wiki/Javascript_Message
	 * @see getEngine
	 */
	const Message = function(name, broadcast, params) {
		let message = new YateMessage(name, broadcast, params);

		/**
		 * @memberof Message
		 * @instance
		 * @method enqueue
		 */
		message.enqueue = () => _yate.enqueue(this);
		/**
		 * @memberof Message
		 * @instance
		 * @method dispatch
		 * @async
		 */
		message.dispatch = async function() {
			return _yate.dispatch(this);
		};

		return message;
	};
	//Message.__proto__ = _yate;
	/**
	 * @method Message.install
	 */
	Message.install = (...args) => _yate.install(...args);
	/**
	 * @method Message.uninstall
	 */
	Message.uninstall = (...args) => _yate.uninstall(...args);
	/**
	 * @method Message.watch
	 */
	Message.watch = (...args) => _yate.watch(...args);
	/**
	 * @method Message.unwatch
	 */
	Message.unwatch = (...args) => _yate.unwatch(...args);
	//Message.handlers; TODO
	//Message.installHook; TODO
	//Message.uninstallHook; TODO
	/**
	 * @method Message.trackName
	 */
	Message.trackName = (arg) => {
		_yate.setlocal( () => {	_yate._trackname = arg	}, "trackparam", arg );
	};

	/**
	 * Engine
	 * @namespace Engine
	 * @static
	 * @see https://docs.yate.ro/wiki/Javascript_Engine
	 * @example
	 * const {Engine, Message} = require("next-yate").getEngine();
	 * Engine.output("Hello World!");
	 */
	const Engine = {
		DebugFail: 0, 0: "FAIL",
		DebugTest: 1, 1: "TEST",
		DebugCrit: 2, 2: "CRIT",
		DebugGoOn: 2,
		DebugConf: 3, 3: "CONF",
		DebugStub: 4, 4: "STUB",
		DebugWarn: 5, 5: "WARN",
		DebugMild: 6, 6: "MILD",
		DebugNote: 7, 7: "NOTE",
		DebugCall: 8, 8: "CALL",
		DebugInfo: 9, 9: "INFO",
		DebugAll: 10, 10: "ALL"
	};
	//Engine.shared TODO
	Engine.name = process.argv[1];
	Engine._debugLevel = 8;
	Engine._debugName = _yate._trackname;
	Engine._debug = true;
	/** @method Engine.output */
	Engine.output = (...args) => _yate.output(...args);
	/** @method Engine.debug */
	Engine.debug = (level, ...args) => {
		if (typeof level === "number"  && level > -1 && Engine._debug && Engine._debugLevel >= level)
			Engine.output(new Date().toISOString(),	`<${Engine._debugName}:${Engine[level]}>`, ...args);
	};
	/** @method Engine.alarm */
	Engine.alarm = (level, ...args) => {
		if (typeof level === "string" && typeof args[0] === "number") {
			level = args[0];
			args.splice(0, 1);
		}
		if (typeof level === "number" && level > -1 && level < 11) {
			Engine.output(new Date().toISOString(),	`<${Engine._debugName}:${Engine[level]}>`, ...args);
		}
	};
	/**
	 * @method Engine.sleep
	 * @param {number} seconds
	 * @async
	 */
	Engine.sleep = function(sec) {
		return new Promise(resolve => {
			setTimeout(resolve, sec * 1000);
		});
	};
	/**
	 * @method Engine.usleep
	 * @param {number} milliseconds
	 * @async
	 */
	Engine.usleep = function(usec) {
		return new Promise(resolve => {
			setTimeout(resolve, Math.floor(usec / 1000));
		});
	};
	Engine.yield = () => {}; // not used
	Engine.idle = () => {}; // not used
	//Engine.restart = () => {}; TODO
	/**
	 * @method Engine.dump_r
	 * @async
	 */
	Engine.dump_r = (...args) => {
		// based on JSON.stringify
		//return args.reduce( (prev, item) => (prev += JSON.stringify(item, null, 2)), "");
		// based on async console output
		return new Promise( resolve => {
			_dstream.once("dump", resolve);
			_dconsole.log(...args);	
		});
	};
	/** @method Engine.print_r */
	Engine.print_r = (...args) => _yate.getConsole().log(...args);
	/**
	 * @method Engine.dump_t
	 * @async
	 */
	Engine.dump_t = (...args) => {
		return new Promise( resolve => {
			_dstream.once("dump", resolve);
			_dconsole.table(...args);	
		});
	};
	/** @method Engine.print_t */
	Engine.print_t = (...args) => _yate.getConsole().table(...args);
	/** @method Engine.debugName */
	Engine.debugName = (name) => {
		if (typeof name === "string") Engine._debugName = name;
		else return Engine._debugName;
	};
	/** @method Engine.debugLevel */
	Engine.debugLevel = (level) => {
		if (typeof level === "number") Engine._debugLevel = level;
		else return Engine._debugLevel;
	};
	/** @method Engine.debugEnabled */
	Engine.debugEnabled = (value) => {
		if (typeof level === "boolean") Engine._debug = value;
		else return Engine._debug;
	};
	/** @method Engine.debugAt */
	Engine.debugAt = (level) => (level <= Engine._debugLevel);
	/** @method Engine.setDebug */
	Engine.setDebug = function(command) {
		// TODO
		if (typeof command === "boolean") Engine._debug = command;
	};
	/** @method Engine.started */
	Engine.started = () => _yate._connected;
	//Engine.runParams TODO
	//Engine.configFile TODO
	/** @method Engine.setInterval */
	Engine.setInterval = (...args) => setInterval(...args);
	/** @method Engine.setTimeout */
	Engine.setTimeout = (...args) => setTimeout(...args);
	/** @method Engine.clearInterval */
	Engine.clearInterval = (id) => clearInterval(id);
	/** @method Engine.clearTimeout */
	Engine.clearTimeout = (id) => clearTimeout(id);
	/** @method Engine.replaceParams */
	Engine.replaceParams = function(buf, params) {
		// TODO (buf, params, sqlEscape, extraEsc)
		// eslint-disable-next-line no-useless-escape
		let str = buf.split(/(\$\{[^\$\{\}]+\})/);
		let res = [];
		for (let i = 0; i < str.length; i++) {
			let key = str[i].match(/\$\{(.+)\}/);
			if (key !== null) {
				if (key[1] in params) res.push(params[key[1]]);
			} else res.push(str[i]);
		}
		return res.join("");
	};
	/** @method Engine.atob */
	Engine.atob = (encoded) => Buffer.from(encoded, "base64");
	/** @method Engine.btoa */
	Engine.btoa = (line) => Buffer.from(line).toString("base64");
	//Engine.atoh TODO
	//Engine.htoa TODO
	//Engine.btoh TODO
	//Engine.htob TODO
	/**
	 * Set/Get Engine specific parameter
	 * @method Engine.setLocal
	 * @async
	 */
	Engine.setLocal = function(...args) { return _yate.setlocal(...args) };

	/**
	 * @namespace Channel
	 * @description Channel object is only available in direct script execution in channel mode and Engine initialization with '{channel: true}' option.
	 * @example
	 * regexroute.conf:
	 * ^NNN=extmodule/nodata/node.sh example.js
	 * 
	 * example.js
	 * const {Engine, Message, Channel} = require("next-yate-compat").getEngine({channel: true});
	 * Channel.init(main, {autoring: true});
	 * async function main(message) {
	 *     await Channel.callTo("wave/play/./share/sounds/welcome.au");
	 *     await Channel.answered();
	 *     Channel.callJust("conf/333", {"lonely": true});
	 * }
	 * @see http://docs.yate.ro/wiki/Javascript_IVR_example
	 */
	const Channel = _yate._channel;

	return { Engine, Message, Channel };
}


module.exports = {
	getEngine
};
