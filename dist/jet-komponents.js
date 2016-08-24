/**
 *    _     _      _                                 _
 *   |_|___| |_   | |_ ___ _____ ___ ___ ___ ___ ___| |_ ___
 *   | | -_|  _|  | '_| . |     | . | . |   | -_|   |  _|_ -|
 *  _| |___|_|    |_,_|___|_|_|_|  _|___|_|_|___|_|_|_| |___|
 * |___|                        |_|
 *
 * jet-komponents - Jet components used in knockout way
 * @version v0.5.4
 * @link http://github.com/bpmsoasolutions/jet-komponents
 * @license MIT, http://github.com/bpmsoasolutions/jet-komponents/LICENSE
 *
 * Using RequireJS 2.2.0 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/requirejs/LICENSE
 */

/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.2.0 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/requirejs/LICENSE
 */
//Not using strict: uneven strict support in browsers, #392, and causes
//problems with requirejs.exec()/transpiler plugins that may not be strict.
/*jslint regexp: true, nomen: true, sloppy: true */
/*global window, navigator, document, importScripts, setTimeout, opera */

var requirejs, require, define;
(function (global) {
    var req, s, head, baseElement, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath,
        version = '2.2.0',
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        op = Object.prototype,
        ostring = op.toString,
        hasOwn = op.hasOwnProperty,
        isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
        //PS3 indicates loaded and complete, but need to wait for complete
        //specifically. Sequence is 'loading', 'loaded', execution,
        // then 'complete'. The UA check is unfortunate, but not sure how
        //to feature test w/o causing perf issues.
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
                      /^complete$/ : /^(complete|loaded)$/,
        defContextName = '_',
        //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        contexts = {},
        cfg = {},
        globalDefQueue = [],
        useInteractive = false;

    //Could match something like ')//comment', do not lose the prefix to comment.
    function commentReplace(match, multi, multiText, singlePrefix) {
        return singlePrefix || '';
    }

    function isFunction(it) {
        return ostring.call(it) === '[object Function]';
    }

    function isArray(it) {
        return ostring.call(it) === '[object Array]';
    }

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    /**
     * Helper function for iterating over an array backwards. If the func
     * returns a true value, it will break out of the loop.
     */
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    function getOwn(obj, prop) {
        return hasProp(obj, prop) && obj[prop];
    }

    /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    function mixin(target, source, force, deepStringMixin) {
        if (source) {
            eachProp(source, function (value, prop) {
                if (force || !hasProp(target, prop)) {
                    if (deepStringMixin && typeof value === 'object' && value &&
                        !isArray(value) && !isFunction(value) &&
                        !(value instanceof RegExp)) {

                        if (!target[prop]) {
                            target[prop] = {};
                        }
                        mixin(target[prop], value, force, deepStringMixin);
                    } else {
                        target[prop] = value;
                    }
                }
            });
        }
        return target;
    }

    //Similar to Function.prototype.bind, but the 'this' object is specified
    //first, since it is easier to read/figure out what 'this' will be.
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }

    function scripts() {
        return document.getElementsByTagName('script');
    }

    function defaultOnError(err) {
        throw err;
    }

    //Allow getting a global that is expressed in
    //dot notation, like 'a.b.c'.
    function getGlobal(value) {
        if (!value) {
            return value;
        }
        var g = global;
        each(value.split('.'), function (part) {
            g = g[part];
        });
        return g;
    }

    /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
    function makeError(id, msg, err, requireModules) {
        var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
        e.requireType = id;
        e.requireModules = requireModules;
        if (err) {
            e.originalError = err;
        }
        return e;
    }

    if (typeof define !== 'undefined') {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    if (typeof requirejs !== 'undefined') {
        if (isFunction(requirejs)) {
            //Do not overwrite an existing requirejs instance.
            return;
        }
        cfg = requirejs;
        requirejs = undefined;
    }

    //Allow for a require config object
    if (typeof require !== 'undefined' && !isFunction(require)) {
        //assume it is a config object.
        cfg = require;
        require = undefined;
    }

    function newContext(contextName) {
        var inCheckLoaded, Module, context, handlers,
            checkLoadedTimeoutId,
            config = {
                //Defaults. Do not set a default for map
                //config to speed up normalize(), which
                //will run faster if there is no default.
                waitSeconds: 7,
                baseUrl: './',
                paths: {},
                bundles: {},
                pkgs: {},
                shim: {},
                config: {}
            },
            registry = {},
            //registry of just enabled modules, to speed
            //cycle breaking code when lots of modules
            //are registered, but not activated.
            enabledRegistry = {},
            undefEvents = {},
            defQueue = [],
            defined = {},
            urlFetched = {},
            bundlesMap = {},
            requireCounter = 1,
            unnormalizedCounter = 1;

        /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
        function trimDots(ary) {
            var i, part;
            for (i = 0; i < ary.length; i++) {
                part = ary[i];
                if (part === '.') {
                    ary.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i === 1 && ary[2] === '..') || ary[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        ary.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @param {Boolean} applyMap apply the map config to the value. Should
         * only be done if this normalization is for a dependency ID.
         * @returns {String} normalized name
         */
        function normalize(name, baseName, applyMap) {
            var pkgMain, mapValue, nameParts, i, j, nameSegment, lastIndex,
                foundMap, foundI, foundStarMap, starI, normalizedBaseParts,
                baseParts = (baseName && baseName.split('/')),
                map = config.map,
                starMap = map && map['*'];

            //Adjust any relative paths.
            if (name) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // If wanting node ID compatibility, strip .js from end
                // of IDs. Have to do this here, and not in nameToUrl
                // because node allows either .js or non .js to map
                // to same file.
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                // Starts with a '.' so need the baseName
                if (name[0].charAt(0) === '.' && baseParts) {
                    //Convert baseName to array, and lop off the last part,
                    //so that . matches that 'directory' and not name of the baseName's
                    //module. For instance, baseName of 'one/two/three', maps to
                    //'one/two/three.js', but we want the directory, 'one/two' for
                    //this normalization.
                    normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                    name = normalizedBaseParts.concat(name);
                }

                trimDots(name);
                name = name.join('/');
            }

            //Apply map config if available.
            if (applyMap && map && (baseParts || starMap)) {
                nameParts = name.split('/');

                outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join('/');

                    if (baseParts) {
                        //Find the longest baseName segment match in the config.
                        //So, do joins on the biggest to smallest lengths of baseParts.
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

                            //baseName segment has config, find if it has one for
                            //this name.
                            if (mapValue) {
                                mapValue = getOwn(mapValue, nameSegment);
                                if (mapValue) {
                                    //Match, update name to the new value.
                                    foundMap = mapValue;
                                    foundI = i;
                                    break outerLoop;
                                }
                            }
                        }
                    }

                    //Check for a star map match, but just hold on to it,
                    //if there is a shorter segment match later in a matching
                    //config, then favor over this star map.
                    if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                        foundStarMap = getOwn(starMap, nameSegment);
                        starI = i;
                    }
                }

                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                }

                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join('/');
                }
            }

            // If the name points to a package's name, use
            // the package main instead.
            pkgMain = getOwn(config.pkgs, name);

            return pkgMain ? pkgMain : name;
        }

        function removeScript(name) {
            if (isBrowser) {
                each(scripts(), function (scriptNode) {
                    if (scriptNode.getAttribute('data-requiremodule') === name &&
                            scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                        scriptNode.parentNode.removeChild(scriptNode);
                        return true;
                    }
                });
            }
        }

        function hasPathFallback(id) {
            var pathConfig = getOwn(config.paths, id);
            if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                //Pop off the first array value, since it failed, and
                //retry
                pathConfig.shift();
                context.require.undef(id);

                //Custom require that does not do map translation, since
                //ID is "absolute", already mapped/resolved.
                context.makeRequire(null, {
                    skipMap: true
                })([id]);

                return true;
            }
        }

        //Turns a plugin!resource to [plugin, resource]
        //with the plugin being undefined if the name
        //did not have a plugin prefix.
        function splitPrefix(name) {
            var prefix,
                index = name ? name.indexOf('!') : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }
            return [prefix, name];
        }

        /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         * @param {Boolean} applyMap: apply the map config to the ID.
         * Should only be true if this map is for a dependency.
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var url, pluginModule, suffix, nameParts,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName = '';

            //If no name, then it means it is a require call, generate an
            //internal name.
            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            nameParts = splitPrefix(name);
            prefix = nameParts[0];
            name = nameParts[1];

            if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = getOwn(defined, prefix);
            }

            //Account for relative paths if there is a base name.
            if (name) {
                if (prefix) {
                    if (pluginModule && pluginModule.normalize) {
                        //Plugin is loaded, use its normalize method.
                        normalizedName = pluginModule.normalize(name, function (name) {
                            return normalize(name, parentName, applyMap);
                        });
                    } else {
                        // If nested plugin references, then do not try to
                        // normalize, as it will not normalize correctly. This
                        // places a restriction on resourceIds, and the longer
                        // term solution is not to normalize until plugins are
                        // loaded and all normalizations to allow for async
                        // loading of a loader plugin. But for now, fixes the
                        // common uses. Details in #1131
                        normalizedName = name.indexOf('!') === -1 ?
                                         normalize(name, parentName, applyMap) :
                                         name;
                    }
                } else {
                    //A regular module.
                    normalizedName = normalize(name, parentName, applyMap);

                    //Normalized name may be a plugin ID due to map config
                    //application in normalize. The map config values must
                    //already be normalized, so do not need to redo that part.
                    nameParts = splitPrefix(normalizedName);
                    prefix = nameParts[0];
                    normalizedName = nameParts[1];
                    isNormalized = true;

                    url = context.nameToUrl(normalizedName);
                }
            }

            //If the id is a plugin id that cannot be determined if it needs
            //normalization, stamp it with a unique ID so two matching relative
            //ids that may conflict can be separate.
            suffix = prefix && !pluginModule && !isNormalized ?
                     '_unnormalized' + (unnormalizedCounter += 1) :
                     '';

            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ?
                        prefix + '!' + normalizedName :
                        normalizedName) + suffix
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (!mod) {
                mod = registry[id] = new context.Module(depMap);
            }

            return mod;
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (hasProp(defined, id) &&
                    (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                    fn(defined[id]);
                }
            } else {
                mod = getModule(depMap);
                if (mod.error && name === 'error') {
                    fn(mod.error);
                } else {
                    mod.on(name, fn);
                }
            }
        }

        function onError(err, errback) {
            var ids = err.requireModules,
                notified = false;

            if (errback) {
                errback(err);
            } else {
                each(ids, function (id) {
                    var mod = getOwn(registry, id);
                    if (mod) {
                        //Set error on module, so it skips timeout checks.
                        mod.error = err;
                        if (mod.events.error) {
                            notified = true;
                            mod.emit('error', err);
                        }
                    }
                });

                if (!notified) {
                    req.onError(err);
                }
            }
        }

        /**
         * Internal method to transfer globalQueue items to this context's
         * defQueue.
         */
        function takeGlobalQueue() {
            //Push all the globalDefQueue items into the context's defQueue
            if (globalDefQueue.length) {
                each(globalDefQueue, function(queueItem) {
                    var id = queueItem[0];
                    if (typeof id === 'string') {
                        context.defQueueMap[id] = true;
                    }
                    defQueue.push(queueItem);
                });
                globalDefQueue = [];
            }
        }

        handlers = {
            'require': function (mod) {
                if (mod.require) {
                    return mod.require;
                } else {
                    return (mod.require = context.makeRequire(mod.map));
                }
            },
            'exports': function (mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    if (mod.exports) {
                        return (defined[mod.map.id] = mod.exports);
                    } else {
                        return (mod.exports = defined[mod.map.id] = {});
                    }
                }
            },
            'module': function (mod) {
                if (mod.module) {
                    return mod.module;
                } else {
                    return (mod.module = {
                        id: mod.map.id,
                        uri: mod.map.url,
                        config: function () {
                            return getOwn(config.config, mod.map.id) || {};
                        },
                        exports: mod.exports || (mod.exports = {})
                    });
                }
            }
        };

        function cleanRegistry(id) {
            //Clean up machinery used for waiting modules.
            delete registry[id];
            delete enabledRegistry[id];
        }

        function breakCycle(mod, traced, processed) {
            var id = mod.map.id;

            if (mod.error) {
                mod.emit('error', mod.error);
            } else {
                traced[id] = true;
                each(mod.depMaps, function (depMap, i) {
                    var depId = depMap.id,
                        dep = getOwn(registry, depId);

                    //Only force things that have not completed
                    //being defined, so still in the registry,
                    //and only if it has not been matched up
                    //in the module already.
                    if (dep && !mod.depMatched[i] && !processed[depId]) {
                        if (getOwn(traced, depId)) {
                            mod.defineDep(i, defined[depId]);
                            mod.check(); //pass false?
                        } else {
                            breakCycle(dep, traced, processed);
                        }
                    }
                });
                processed[id] = true;
            }
        }

        function checkLoaded() {
            var err, usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                reqCalls = [],
                stillLoading = false,
                needCycleCheck = true;

            //Do not bother if this call was a result of a cycle break.
            if (inCheckLoaded) {
                return;
            }

            inCheckLoaded = true;

            //Figure out the state of all the modules.
            eachProp(enabledRegistry, function (mod) {
                var map = mod.map,
                    modId = map.id;

                //Skip things that are not enabled or in error state.
                if (!mod.enabled) {
                    return;
                }

                if (!map.isDefine) {
                    reqCalls.push(mod);
                }

                if (!mod.error) {
                    //If the module should be executed, and it has not
                    //been inited and time is up, remember it.
                    if (!mod.inited && expired) {
                        if (hasPathFallback(modId)) {
                            usingPathFallback = true;
                            stillLoading = true;
                        } else {
                            noLoads.push(modId);
                            removeScript(modId);
                        }
                    } else if (!mod.inited && mod.fetched && map.isDefine) {
                        stillLoading = true;
                        if (!map.prefix) {
                            //No reason to keep looking for unfinished
                            //loading. If the only stillLoading is a
                            //plugin resource though, keep going,
                            //because it may be that a plugin resource
                            //is waiting on a non-plugin cycle.
                            return (needCycleCheck = false);
                        }
                    }
                }
            });

            if (expired && noLoads.length) {
                //If wait time expired, throw error of unloaded modules.
                err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                err.contextName = context.contextName;
                return onError(err);
            }

            //Not expired, check for a cycle.
            if (needCycleCheck) {
                each(reqCalls, function (mod) {
                    breakCycle(mod, {}, {});
                });
            }

            //If still waiting on loads, and the waiting load is something
            //other than a plugin resource, or there are still outstanding
            //scripts, then just try back later.
            if ((!expired || usingPathFallback) && stillLoading) {
                //Something is still waiting to load. Wait for it, but only
                //if a timeout is not already in effect.
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function () {
                        checkLoadedTimeoutId = 0;
                        checkLoaded();
                    }, 50);
                }
            }

            inCheckLoaded = false;
        }

        Module = function (map) {
            this.events = getOwn(undefEvents, map.id) || {};
            this.map = map;
            this.shim = getOwn(config.shim, map.id);
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0;

            /* this.exports this.factory
               this.depMaps = [],
               this.enabled, this.fetched
            */
        };

        Module.prototype = {
            init: function (depMaps, factory, errback, options) {
                options = options || {};

                //Do not do more inits if already done. Can happen if there
                //are multiple define calls for the same module. That is not
                //a normal, common case, but it is also not unexpected.
                if (this.inited) {
                    return;
                }

                this.factory = factory;

                if (errback) {
                    //Register for errors on this module.
                    this.on('error', errback);
                } else if (this.events.error) {
                    //If no errback already, but there are error listeners
                    //on this module, set up an errback to pass to the deps.
                    errback = bind(this, function (err) {
                        this.emit('error', err);
                    });
                }

                //Do a copy of the dependency array, so that
                //source inputs are not modified. For example
                //"shim" deps are passed in here directly, and
                //doing a direct modification of the depMaps array
                //would affect that config.
                this.depMaps = depMaps && depMaps.slice(0);

                this.errback = errback;

                //Indicate this module has be initialized
                this.inited = true;

                this.ignore = options.ignore;

                //Could have option to init this module in enabled mode,
                //or could have been previously marked as enabled. However,
                //the dependencies are not known until init is called. So
                //if enabled previously, now trigger dependencies as enabled.
                if (options.enabled || this.enabled) {
                    //Enable this module and dependencies.
                    //Will call this.check()
                    this.enable();
                } else {
                    this.check();
                }
            },

            defineDep: function (i, depExports) {
                //Because of cycles, defined callback for a given
                //export can be called more than once.
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports;
                }
            },

            fetch: function () {
                if (this.fetched) {
                    return;
                }
                this.fetched = true;

                context.startTime = (new Date()).getTime();

                var map = this.map;

                //If the manager is for a plugin managed resource,
                //ask the plugin to load it now.
                if (this.shim) {
                    context.makeRequire(this.map, {
                        enableBuildCallback: true
                    })(this.shim.deps || [], bind(this, function () {
                        return map.prefix ? this.callPlugin() : this.load();
                    }));
                } else {
                    //Regular dependency.
                    return map.prefix ? this.callPlugin() : this.load();
                }
            },

            load: function () {
                var url = this.map.url;

                //Regular dependency.
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url);
                }
            },

            /**
             * Checks if the module is ready to define itself, and if so,
             * define it.
             */
            check: function () {
                if (!this.enabled || this.enabling) {
                    return;
                }

                var err, cjsModule,
                    id = this.map.id,
                    depExports = this.depExports,
                    exports = this.exports,
                    factory = this.factory;

                if (!this.inited) {
                    // Only fetch if not already in the defQueue.
                    if (!hasProp(context.defQueueMap, id)) {
                        this.fetch();
                    }
                } else if (this.error) {
                    this.emit('error', this.error);
                } else if (!this.defining) {
                    //The factory could trigger another require call
                    //that would result in checking this module to
                    //define itself again. If already in the process
                    //of doing that, skip this work.
                    this.defining = true;

                    if (this.depCount < 1 && !this.defined) {
                        if (isFunction(factory)) {
                            //If there is an error listener, favor passing
                            //to that instead of throwing an error. However,
                            //only do it for define()'d  modules. require
                            //errbacks should not be called for failures in
                            //their callbacks (#699). However if a global
                            //onError is set, use that.
                            if ((this.events.error && this.map.isDefine) ||
                                req.onError !== defaultOnError) {
                                try {
                                    exports = context.execCb(id, factory, depExports, exports);
                                } catch (e) {
                                    err = e;
                                }
                            } else {
                                exports = context.execCb(id, factory, depExports, exports);
                            }

                            // Favor return value over exports. If node/cjs in play,
                            // then will not have a return value anyway. Favor
                            // module.exports assignment over exports object.
                            if (this.map.isDefine && exports === undefined) {
                                cjsModule = this.module;
                                if (cjsModule) {
                                    exports = cjsModule.exports;
                                } else if (this.usingExports) {
                                    //exports already set the defined value.
                                    exports = this.exports;
                                }
                            }

                            if (err) {
                                err.requireMap = this.map;
                                err.requireModules = this.map.isDefine ? [this.map.id] : null;
                                err.requireType = this.map.isDefine ? 'define' : 'require';
                                return onError((this.error = err));
                            }

                        } else {
                            //Just a literal value
                            exports = factory;
                        }

                        this.exports = exports;

                        if (this.map.isDefine && !this.ignore) {
                            defined[id] = exports;

                            if (req.onResourceLoad) {
                                var resLoadMaps = [];
                                each(this.depMaps, function (depMap) {
                                    resLoadMaps.push(depMap.normalizedMap || depMap);
                                });
                                req.onResourceLoad(context, this.map, resLoadMaps);
                            }
                        }

                        //Clean up
                        cleanRegistry(id);

                        this.defined = true;
                    }

                    //Finished the define stage. Allow calling check again
                    //to allow define notifications below in the case of a
                    //cycle.
                    this.defining = false;

                    if (this.defined && !this.defineEmitted) {
                        this.defineEmitted = true;
                        this.emit('defined', this.exports);
                        this.defineEmitComplete = true;
                    }

                }
            },

            callPlugin: function () {
                var map = this.map,
                    id = map.id,
                    //Map already normalized the prefix.
                    pluginMap = makeModuleMap(map.prefix);

                //Mark this as a dependency for this plugin, so it
                //can be traced for cycles.
                this.depMaps.push(pluginMap);

                on(pluginMap, 'defined', bind(this, function (plugin) {
                    var load, normalizedMap, normalizedMod,
                        bundleId = getOwn(bundlesMap, this.map.id),
                        name = this.map.name,
                        parentName = this.map.parentMap ? this.map.parentMap.name : null,
                        localRequire = context.makeRequire(map.parentMap, {
                            enableBuildCallback: true
                        });

                    //If current map is not normalized, wait for that
                    //normalized name to load instead of continuing.
                    if (this.map.unnormalized) {
                        //Normalize the ID if the plugin allows it.
                        if (plugin.normalize) {
                            name = plugin.normalize(name, function (name) {
                                return normalize(name, parentName, true);
                            }) || '';
                        }

                        //prefix and name should already be normalized, no need
                        //for applying map config again either.
                        normalizedMap = makeModuleMap(map.prefix + '!' + name,
                                                      this.map.parentMap);
                        on(normalizedMap,
                            'defined', bind(this, function (value) {
                                this.map.normalizedMap = normalizedMap;
                                this.init([], function () { return value; }, null, {
                                    enabled: true,
                                    ignore: true
                                });
                            }));

                        normalizedMod = getOwn(registry, normalizedMap.id);
                        if (normalizedMod) {
                            //Mark this as a dependency for this plugin, so it
                            //can be traced for cycles.
                            this.depMaps.push(normalizedMap);

                            if (this.events.error) {
                                normalizedMod.on('error', bind(this, function (err) {
                                    this.emit('error', err);
                                }));
                            }
                            normalizedMod.enable();
                        }

                        return;
                    }

                    //If a paths config, then just load that file instead to
                    //resolve the plugin, as it is built into that paths layer.
                    if (bundleId) {
                        this.map.url = context.nameToUrl(bundleId);
                        this.load();
                        return;
                    }

                    load = bind(this, function (value) {
                        this.init([], function () { return value; }, null, {
                            enabled: true
                        });
                    });

                    load.error = bind(this, function (err) {
                        this.inited = true;
                        this.error = err;
                        err.requireModules = [id];

                        //Remove temp unnormalized modules for this module,
                        //since they will never be resolved otherwise now.
                        eachProp(registry, function (mod) {
                            if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                                cleanRegistry(mod.map.id);
                            }
                        });

                        onError(err);
                    });

                    //Allow plugins to load other code without having to know the
                    //context or how to 'complete' the load.
                    load.fromText = bind(this, function (text, textAlt) {
                        /*jslint evil: true */
                        var moduleName = map.name,
                            moduleMap = makeModuleMap(moduleName),
                            hasInteractive = useInteractive;

                        //As of 2.1.0, support just passing the text, to reinforce
                        //fromText only being called once per resource. Still
                        //support old style of passing moduleName but discard
                        //that moduleName in favor of the internal ref.
                        if (textAlt) {
                            text = textAlt;
                        }

                        //Turn off interactive script matching for IE for any define
                        //calls in the text, then turn it back on at the end.
                        if (hasInteractive) {
                            useInteractive = false;
                        }

                        //Prime the system by creating a module instance for
                        //it.
                        getModule(moduleMap);

                        //Transfer any config to this other module.
                        if (hasProp(config.config, id)) {
                            config.config[moduleName] = config.config[id];
                        }

                        try {
                            req.exec(text);
                        } catch (e) {
                            return onError(makeError('fromtexteval',
                                             'fromText eval for ' + id +
                                            ' failed: ' + e,
                                             e,
                                             [id]));
                        }

                        if (hasInteractive) {
                            useInteractive = true;
                        }

                        //Mark this as a dependency for the plugin
                        //resource
                        this.depMaps.push(moduleMap);

                        //Support anonymous modules.
                        context.completeLoad(moduleName);

                        //Bind the value of that module to the value for this
                        //resource ID.
                        localRequire([moduleName], load);
                    });

                    //Use parentName here since the plugin's name is not reliable,
                    //could be some weird string with no path that actually wants to
                    //reference the parentName's path.
                    plugin.load(map.name, localRequire, load, config);
                }));

                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap;
            },

            enable: function () {
                enabledRegistry[this.map.id] = this;
                this.enabled = true;

                //Set flag mentioning that the module is enabling,
                //so that immediate calls to the defined callbacks
                //for dependencies do not trigger inadvertent load
                //with the depCount still being zero.
                this.enabling = true;

                //Enable each dependency
                each(this.depMaps, bind(this, function (depMap, i) {
                    var id, mod, handler;

                    if (typeof depMap === 'string') {
                        //Dependency needs to be converted to a depMap
                        //and wired up to this module.
                        depMap = makeModuleMap(depMap,
                                               (this.map.isDefine ? this.map : this.map.parentMap),
                                               false,
                                               !this.skipMap);
                        this.depMaps[i] = depMap;

                        handler = getOwn(handlers, depMap.id);

                        if (handler) {
                            this.depExports[i] = handler(this);
                            return;
                        }

                        this.depCount += 1;

                        on(depMap, 'defined', bind(this, function (depExports) {
                            if (this.undefed) {
                                return;
                            }
                            this.defineDep(i, depExports);
                            this.check();
                        }));

                        if (this.errback) {
                            on(depMap, 'error', bind(this, this.errback));
                        } else if (this.events.error) {
                            // No direct errback on this module, but something
                            // else is listening for errors, so be sure to
                            // propagate the error correctly.
                            on(depMap, 'error', bind(this, function(err) {
                                this.emit('error', err);
                            }));
                        }
                    }

                    id = depMap.id;
                    mod = registry[id];

                    //Skip special modules like 'require', 'exports', 'module'
                    //Also, don't call enable if it is already enabled,
                    //important in circular dependency cases.
                    if (!hasProp(handlers, id) && mod && !mod.enabled) {
                        context.enable(depMap, this);
                    }
                }));

                //Enable each plugin that is used in
                //a dependency
                eachProp(this.pluginMaps, bind(this, function (pluginMap) {
                    var mod = getOwn(registry, pluginMap.id);
                    if (mod && !mod.enabled) {
                        context.enable(pluginMap, this);
                    }
                }));

                this.enabling = false;

                this.check();
            },

            on: function (name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            emit: function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
                if (name === 'error') {
                    //Now that the error handler was triggered, remove
                    //the listeners, since this broken Module instance
                    //can stay around for a while in the registry.
                    delete this.events[name];
                }
            }
        };

        function callGetModule(args) {
            //Skip modules already defined.
            if (!hasProp(defined, args[0])) {
                getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
            }
        }

        function removeListener(node, func, name, ieName) {
            //Favor detachEvent because of IE9
            //issue, see attachEvent/addEventListener comment elsewhere
            //in this file.
            if (node.detachEvent && !isOpera) {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                if (ieName) {
                    node.detachEvent(ieName, func);
                }
            } else {
                node.removeEventListener(name, func, false);
            }
        }

        /**
         * Given an event from a script node, get the requirejs info from it,
         * and then removes the event listeners on the node.
         * @param {Event} evt
         * @returns {Object}
         */
        function getScriptData(evt) {
            //Using currentTarget instead of target for Firefox 2.0's sake. Not
            //all old browsers will be supported, but this one was easy enough
            //to support and still makes sense.
            var node = evt.currentTarget || evt.srcElement;

            //Remove the listeners once here.
            removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
            removeListener(node, context.onScriptError, 'error');

            return {
                node: node,
                id: node && node.getAttribute('data-requiremodule')
            };
        }

        function intakeDefines() {
            var args;

            //Any defined modules in the global queue, intake them now.
            takeGlobalQueue();

            //Make sure any remaining defQueue items get properly processed.
            while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null) {
                    return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' +
                        args[args.length - 1]));
                } else {
                    //args are id, deps, factory. Should be normalized by the
                    //define() function.
                    callGetModule(args);
                }
            }
            context.defQueueMap = {};
        }

        context = {
            config: config,
            contextName: contextName,
            registry: registry,
            defined: defined,
            urlFetched: urlFetched,
            defQueue: defQueue,
            defQueueMap: {},
            Module: Module,
            makeModuleMap: makeModuleMap,
            nextTick: req.nextTick,
            onError: onError,

            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            configure: function (cfg) {
                //Make sure the baseUrl ends in a slash.
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                        cfg.baseUrl += '/';
                    }
                }

                // Convert old style urlArgs string to a function.
                if (typeof cfg.urlArgs === 'string') {
                    var urlArgs = cfg.urlArgs;
                    cfg.urlArgs = function(id, url) {
                        return (url.indexOf('?') === -1 ? '?' : '&') + urlArgs;
                    };
                }

                //Save off the paths since they require special processing,
                //they are additive.
                var shim = config.shim,
                    objs = {
                        paths: true,
                        bundles: true,
                        config: true,
                        map: true
                    };

                eachProp(cfg, function (value, prop) {
                    if (objs[prop]) {
                        if (!config[prop]) {
                            config[prop] = {};
                        }
                        mixin(config[prop], value, true, true);
                    } else {
                        config[prop] = value;
                    }
                });

                //Reverse map the bundles
                if (cfg.bundles) {
                    eachProp(cfg.bundles, function (value, prop) {
                        each(value, function (v) {
                            if (v !== prop) {
                                bundlesMap[v] = prop;
                            }
                        });
                    });
                }

                //Merge shim
                if (cfg.shim) {
                    eachProp(cfg.shim, function (value, id) {
                        //Normalize the structure
                        if (isArray(value)) {
                            value = {
                                deps: value
                            };
                        }
                        if ((value.exports || value.init) && !value.exportsFn) {
                            value.exportsFn = context.makeShimExports(value);
                        }
                        shim[id] = value;
                    });
                    config.shim = shim;
                }

                //Adjust packages if necessary.
                if (cfg.packages) {
                    each(cfg.packages, function (pkgObj) {
                        var location, name;

                        pkgObj = typeof pkgObj === 'string' ? {name: pkgObj} : pkgObj;

                        name = pkgObj.name;
                        location = pkgObj.location;
                        if (location) {
                            config.paths[name] = pkgObj.location;
                        }

                        //Save pointer to main module ID for pkg name.
                        //Remove leading dot in main, so main paths are normalized,
                        //and remove any trailing .js, since different package
                        //envs have different conventions: some use a module name,
                        //some use a file name.
                        config.pkgs[name] = pkgObj.name + '/' + (pkgObj.main || 'main')
                                     .replace(currDirRegExp, '')
                                     .replace(jsSuffixRegExp, '');
                    });
                }

                //If there are any "waiting to execute" modules in the registry,
                //update the maps for them, since their info, like URLs to load,
                //may have changed.
                eachProp(registry, function (mod, id) {
                    //If module already has init called, since it is too
                    //late to modify them, and ignore unnormalized ones
                    //since they are transient.
                    if (!mod.inited && !mod.map.unnormalized) {
                        mod.map = makeModuleMap(id, null, true);
                    }
                });

                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },

            makeShimExports: function (value) {
                function fn() {
                    var ret;
                    if (value.init) {
                        ret = value.init.apply(global, arguments);
                    }
                    return ret || (value.exports && getGlobal(value.exports));
                }
                return fn;
            },

            makeRequire: function (relMap, options) {
                options = options || {};

                function localRequire(deps, callback, errback) {
                    var id, map, requireMod;

                    if (options.enableBuildCallback && callback && isFunction(callback)) {
                        callback.__requireJsBuild = true;
                    }

                    if (typeof deps === 'string') {
                        if (isFunction(callback)) {
                            //Invalid call
                            return onError(makeError('requireargs', 'Invalid require call'), errback);
                        }

                        //If require|exports|module are requested, get the
                        //value for them from the special handlers. Caveat:
                        //this only works while module is being defined.
                        if (relMap && hasProp(handlers, deps)) {
                            return handlers[deps](registry[relMap.id]);
                        }

                        //Synchronous access to one module. If require.get is
                        //available (as in the Node adapter), prefer that.
                        if (req.get) {
                            return req.get(context, deps, relMap, localRequire);
                        }

                        //Normalize module name, if it contains . or ..
                        map = makeModuleMap(deps, relMap, false, true);
                        id = map.id;

                        if (!hasProp(defined, id)) {
                            return onError(makeError('notloaded', 'Module name "' +
                                        id +
                                        '" has not been loaded yet for context: ' +
                                        contextName +
                                        (relMap ? '' : '. Use require([])')));
                        }
                        return defined[id];
                    }

                    //Grab defines waiting in the global queue.
                    intakeDefines();

                    //Mark all the dependencies as needing to be loaded.
                    context.nextTick(function () {
                        //Some defines could have been added since the
                        //require call, collect them.
                        intakeDefines();

                        requireMod = getModule(makeModuleMap(null, relMap));

                        //Store if map config should be applied to this require
                        //call for dependencies.
                        requireMod.skipMap = options.skipMap;

                        requireMod.init(deps, callback, errback, {
                            enabled: true
                        });

                        checkLoaded();
                    });

                    return localRequire;
                }

                mixin(localRequire, {
                    isBrowser: isBrowser,

                    /**
                     * Converts a module name + .extension into an URL path.
                     * *Requires* the use of a module name. It does not support using
                     * plain URLs like nameToUrl.
                     */
                    toUrl: function (moduleNamePlusExt) {
                        var ext,
                            index = moduleNamePlusExt.lastIndexOf('.'),
                            segment = moduleNamePlusExt.split('/')[0],
                            isRelative = segment === '.' || segment === '..';

                        //Have a file extension alias, and it is not the
                        //dots from a relative path.
                        if (index !== -1 && (!isRelative || index > 1)) {
                            ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                            moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                        }

                        return context.nameToUrl(normalize(moduleNamePlusExt,
                                                relMap && relMap.id, true), ext,  true);
                    },

                    defined: function (id) {
                        return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
                    },

                    specified: function (id) {
                        id = makeModuleMap(id, relMap, false, true).id;
                        return hasProp(defined, id) || hasProp(registry, id);
                    }
                });

                //Only allow undef on top level require calls
                if (!relMap) {
                    localRequire.undef = function (id) {
                        //Bind any waiting define() calls to this context,
                        //fix for #408
                        takeGlobalQueue();

                        var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

                        mod.undefed = true;
                        removeScript(id);

                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];

                        //Clean queued defines too. Go backwards
                        //in array so that the splices do not
                        //mess up the iteration.
                        eachReverse(defQueue, function(args, i) {
                            if (args[0] === id) {
                                defQueue.splice(i, 1);
                            }
                        });
                        delete context.defQueueMap[id];

                        if (mod) {
                            //Hold on to listeners in case the
                            //module will be attempted to be reloaded
                            //using a different config.
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events;
                            }

                            cleanRegistry(id);
                        }
                    };
                }

                return localRequire;
            },

            /**
             * Called to enable a module if it is still in the registry
             * awaiting enablement. A second arg, parent, the parent module,
             * is passed in for context, when this method is overridden by
             * the optimizer. Not shown here to keep code compact.
             */
            enable: function (depMap) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                    getModule(depMap).enable();
                }
            },

            /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
            completeLoad: function (moduleName) {
                var found, args, mod,
                    shim = getOwn(config.shim, moduleName) || {},
                    shExports = shim.exports;

                takeGlobalQueue();

                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        args[0] = moduleName;
                        //If already found an anonymous module and bound it
                        //to this name, then this is some other anon module
                        //waiting for its completeLoad to fire.
                        if (found) {
                            break;
                        }
                        found = true;
                    } else if (args[0] === moduleName) {
                        //Found matching define call for this script!
                        found = true;
                    }

                    callGetModule(args);
                }
                context.defQueueMap = {};

                //Do this after the cycle of callGetModule in case the result
                //of those calls/init calls changes the registry.
                mod = getOwn(registry, moduleName);

                if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                    if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                        if (hasPathFallback(moduleName)) {
                            return;
                        } else {
                            return onError(makeError('nodefine',
                                             'No define call for ' + moduleName,
                                             null,
                                             [moduleName]));
                        }
                    } else {
                        //A script that does not call define(), so just simulate
                        //the call for it.
                        callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
                    }
                }

                checkLoaded();
            },

            /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             * Note that it **does not** call normalize on the moduleName,
             * it is assumed to have already been normalized. This is an
             * internal API, not a public one. Use toUrl for the public API.
             */
            nameToUrl: function (moduleName, ext, skipExt) {
                var paths, syms, i, parentModule, url,
                    parentPath, bundleId,
                    pkgMain = getOwn(config.pkgs, moduleName);

                if (pkgMain) {
                    moduleName = pkgMain;
                }

                bundleId = getOwn(bundlesMap, moduleName);

                if (bundleId) {
                    return context.nameToUrl(bundleId, ext, skipExt);
                }

                //If a colon is in the URL, it indicates a protocol is used and it is just
                //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                //or ends with .js, then assume the user meant to use an url and not a module id.
                //The slash is important for protocol-less URLs as well as full paths.
                if (req.jsExtRegExp.test(moduleName)) {
                    //Just a plain path, not module name lookup, so just return it.
                    //Add extension if it is included. This is a bit wonky, only non-.js things pass
                    //an extension, this method probably needs to be reworked.
                    url = moduleName + (ext || '');
                } else {
                    //A module that needs to be converted to a path.
                    paths = config.paths;

                    syms = moduleName.split('/');
                    //For each module name segment, see if there is a path
                    //registered for it. Start with most specific name
                    //and work up from it.
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join('/');

                        parentPath = getOwn(paths, parentModule);
                        if (parentPath) {
                            //If an array, it means there are a few choices,
                            //Choose the one that is desired
                            if (isArray(parentPath)) {
                                parentPath = parentPath[0];
                            }
                            syms.splice(0, i, parentPath);
                            break;
                        }
                    }

                    //Join the path parts together, then figure out if baseUrl is needed.
                    url = syms.join('/');
                    url += (ext || (/^data\:|^blob\:|\?/.test(url) || skipExt ? '' : '.js'));
                    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                }

                return config.urlArgs && !/^blob\:/.test(url) ?
                       url + config.urlArgs(moduleName, url) : url;
            },

            //Delegates to req.load. Broken out as a separate function to
            //allow overriding in the optimizer.
            load: function (id, url) {
                req.load(context, id, url);
            },

            /**
             * Executes a module callback function. Broken out as a separate function
             * solely to allow the build system to sequence the files in the built
             * layer in the right sequence.
             *
             * @private
             */
            execCb: function (name, callback, args, exports) {
                return callback.apply(exports, args);
            },

            /**
             * callback for script loads, used to check status of loading.
             *
             * @param {Event} evt the event from the browser for the script
             * that was loaded.
             */
            onScriptLoad: function (evt) {
                //Using currentTarget instead of target for Firefox 2.0's sake. Not
                //all old browsers will be supported, but this one was easy enough
                //to support and still makes sense.
                if (evt.type === 'load' ||
                        (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                    //Reset interactive script so a script node is not held onto for
                    //to long.
                    interactiveScript = null;

                    //Pull out the name of the module and the context.
                    var data = getScriptData(evt);
                    context.completeLoad(data.id);
                }
            },

            /**
             * Callback for script errors.
             */
            onScriptError: function (evt) {
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                    var parents = [];
                    eachProp(registry, function(value, key) {
                        if (key.indexOf('_@r') !== 0) {
                            each(value.depMaps, function(depMap) {
                                if (depMap.id === data.id) {
                                    parents.push(key);
                                    return true;
                                }
                            });
                        }
                    });
                    return onError(makeError('scripterror', 'Script error for "' + data.id +
                                             (parents.length ?
                                             '", needed by: ' + parents.join(', ') :
                                             '"'), evt, [data.id]));
                }
            }
        };

        context.require = context.makeRequire();
        return context;
    }

    /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
    req = requirejs = function (deps, callback, errback, optional) {

        //Find the right context, use default
        var context, config,
            contextName = defContextName;

        // Determine if have config object in the call.
        if (!isArray(deps) && typeof deps !== 'string') {
            // deps is a config object
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = errback;
                errback = optional;
            } else {
                deps = [];
            }
        }

        if (config && config.context) {
            contextName = config.context;
        }

        context = getOwn(contexts, contextName);
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName);
        }

        if (config) {
            context.configure(config);
        }

        return context.require(deps, callback, errback);
    };

    /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
    req.config = function (config) {
        return req(config);
    };

    /**
     * Execute something after the current tick
     * of the event loop. Override for other envs
     * that have a better solution than setTimeout.
     * @param  {Function} fn function to execute later.
     */
    req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
        setTimeout(fn, 4);
    } : function (fn) { fn(); };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    req.version = version;

    //Used to filter out dependencies that are already paths.
    req.jsExtRegExp = /^\/|:|\?|\.js$/;
    req.isBrowser = isBrowser;
    s = req.s = {
        contexts: contexts,
        newContext: newContext
    };

    //Create default context.
    req({});

    //Exports some context-sensitive methods on global require.
    each([
        'toUrl',
        'undef',
        'defined',
        'specified'
    ], function (prop) {
        //Reference from contexts instead of early binding to default context,
        //so that during builds, the latest instance of the default context
        //with its config gets used.
        req[prop] = function () {
            var ctx = contexts[defContextName];
            return ctx.require[prop].apply(ctx, arguments);
        };
    });

    if (isBrowser) {
        head = s.head = document.getElementsByTagName('head')[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //http://dev.jquery.com/ticket/2709
        baseElement = document.getElementsByTagName('base')[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode;
        }
    }

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
    req.onError = defaultOnError;

    /**
     * Creates the node for the load command. Only used in browser envs.
     */
    req.createNode = function (config, moduleName, url) {
        var node = config.xhtml ?
                document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
                document.createElement('script');
        node.type = config.scriptType || 'text/javascript';
        node.charset = 'utf-8';
        node.async = true;
        return node;
    };

    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
    req.load = function (context, moduleName, url) {
        var config = (context && context.config) || {},
            node;
        if (isBrowser) {
            //In the browser so use a script tag
            node = req.createNode(config, moduleName, url);

            node.setAttribute('data-requirecontext', context.contextName);
            node.setAttribute('data-requiremodule', moduleName);

            //Set up load listener. Test attachEvent first because IE9 has
            //a subtle issue in its addEventListener and script onload firings
            //that do not match the behavior of all other browsers with
            //addEventListener support, which fire the onload event for a
            //script right after the script execution. See:
            //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
            //UNFORTUNATELY Opera implements attachEvent but does not follow the script
            //script execution mode.
            if (node.attachEvent &&
                    //Check if node.attachEvent is artificially added by custom script or
                    //natively supported by browser
                    //read https://github.com/requirejs/requirejs/issues/187
                    //if we can NOT find [native code] then it must NOT natively supported.
                    //in IE8, node.attachEvent does not have toString()
                    //Note the test for "[native code" with no closing brace, see:
                    //https://github.com/requirejs/requirejs/issues/273
                    !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                    !isOpera) {
                //Probably IE. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous define call to a name.
                //However, IE reports the script as being in 'interactive'
                //readyState at the time of the define call.
                useInteractive = true;

                node.attachEvent('onreadystatechange', context.onScriptLoad);
                //It would be great to add an error handler here to catch
                //404s in IE9+. However, onreadystatechange will fire before
                //the error handler, so that does not help. If addEventListener
                //is used, then IE will fire error before load, but we cannot
                //use that pathway given the connect.microsoft.com issue
                //mentioned above about not doing the 'script execute,
                //then fire the script load event listener before execute
                //next script' that other browsers do.
                //Best hope: IE10 fixes the issues,
                //and then destroys all installs of IE 6-9.
                //node.attachEvent('onerror', context.onScriptError);
            } else {
                node.addEventListener('load', context.onScriptLoad, false);
                node.addEventListener('error', context.onScriptError, false);
            }
            node.src = url;

            //Calling onNodeCreated after all properties on the node have been
            //set, but before it is placed in the DOM.
            if (config.onNodeCreated) {
                config.onNodeCreated(node, config, moduleName, url);
            }

            //For some cache cases in IE 6-8, the script executes before the end
            //of the appendChild execution, so to tie an anonymous define
            //call to the module name (which is stored on the node), hold on
            //to a reference to this node, but clear after the DOM insertion.
            currentlyAddingScript = node;
            if (baseElement) {
                head.insertBefore(node, baseElement);
            } else {
                head.appendChild(node);
            }
            currentlyAddingScript = null;

            return node;
        } else if (isWebWorker) {
            try {
                //In a web worker, use importScripts. This is not a very
                //efficient use of importScripts, importScripts will block until
                //its script is downloaded and evaluated. However, if web workers
                //are in play, the expectation is that a build has been done so
                //that only one script needs to be loaded anyway. This may need
                //to be reevaluated if other use cases become common.

                // Post a task to the event loop to work around a bug in WebKit
                // where the worker gets garbage-collected after calling
                // importScripts(): https://webkit.org/b/153317
                setTimeout(function() {}, 0);
                importScripts(url);

                //Account for anonymous modules
                context.completeLoad(moduleName);
            } catch (e) {
                context.onError(makeError('importscripts',
                                'importScripts failed for ' +
                                    moduleName + ' at ' + url,
                                e,
                                [moduleName]));
            }
        }
    };

    function getInteractiveScript() {
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        eachReverse(scripts(), function (script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    //Look for a data-main script attribute, which could also adjust the baseUrl.
    if (isBrowser && !cfg.skipDataMain) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        eachReverse(scripts(), function (script) {
            //Set the 'head' where we can append children by
            //using the script's parent.
            if (!head) {
                head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load. If it is there, the path to data main becomes the
            //baseUrl, if it is not already set.
            dataMain = script.getAttribute('data-main');
            if (dataMain) {
                //Preserve dataMain in case it is a path (i.e. contains '?')
                mainScript = dataMain;

                //Set final baseUrl if there is not already an explicit one,
                //but only do so if the data-main value is not a loader plugin
                //module ID.
                if (!cfg.baseUrl && mainScript.indexOf('!') === -1) {
                    //Pull off the directory of data-main for use as the
                    //baseUrl.
                    src = mainScript.split('/');
                    mainScript = src.pop();
                    subPath = src.length ? src.join('/')  + '/' : './';

                    cfg.baseUrl = subPath;
                }

                //Strip off any trailing .js since mainScript is now
                //like a module name.
                mainScript = mainScript.replace(jsSuffixRegExp, '');

                //If mainScript is still a path, fall back to dataMain
                if (req.jsExtRegExp.test(mainScript)) {
                    mainScript = dataMain;
                }

                //Put the data-main script in the files to load.
                cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];

                return true;
            }
        });
    }

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    define = function (name, deps, callback) {
        var node, context;

        //Allow for anonymous modules
        if (typeof name !== 'string') {
            //Adjust args appropriately
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        if (!isArray(deps)) {
            callback = deps;
            deps = null;
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        if (!deps && isFunction(callback)) {
            deps = [];
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies,
            //but only if there are function args.
            if (callback.length) {
                callback
                    .toString()
                    .replace(commentRegExp, commentReplace)
                    .replace(cjsRequireRegExp, function (match, dep) {
                        deps.push(dep);
                    });

                //May be a CommonJS thing even without require calls, but still
                //could use exports, and module. Avoid doing exports and module
                //work though if it just needs require.
                //REQUIRES the function to expect the CommonJS variables in the
                //order listed below.
                deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous define() call, do the interactive
        //work.
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute('data-requiremodule');
                }
                context = contexts[node.getAttribute('data-requirecontext')];
            }
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs. If no context, use the global queue, and get it processed
        //in the onscript load callback.
        if (context) {
            context.defQueue.push([name, deps, callback]);
            context.defQueueMap[name] = true;
        } else {
            globalDefQueue.push([name, deps, callback]);
        }
    };

    define.amd = {
        jQuery: true
    };

    /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
    req.exec = function (text) {
        /*jslint evil: true */
        return eval(text);
    };

    //Set up with config info.
    req(cfg);
}(this));

define("requirejs", function(){});



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (factory) {
    if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && _typeof(module.exports) === 'object') {
        var v = factory(require, exports);if (v !== undefined) module.exports = v;
    } else if (typeof define === 'function' && define.amd) {
        define('jk/utils',["require", "exports"], factory);
    }
})(function (require, exports) {
    

    exports.camelToDash = function (str) {
        return str.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').replace(/([A-Z])/g, function (x, chr) {
            return chr.toLowerCase();
        });
    };
    exports.dashToCamel = function (str) {
        return str.replace(/\W+(.)/g, function (x, chr) {
            return chr.toUpperCase();
        });
    };
    exports.generateShortcutsComponents = function (shortcutsComponents, components) {
        Object.keys(shortcutsComponents).map(function (templateKey) {
            shortcutsComponents[templateKey].map(function (componentKey) {
                var componentTag = exports.camelToDash(componentKey);
                components[componentTag] = {
                    component: componentKey,
                    template: templateKey
                };
            });
        });
    };
    exports.generateCustomComponents = function (customComponents, components) {
        Object.keys(customComponents).map(function (componentKey) {
            var componentConfig = customComponents[componentKey];
            var componentTag = exports.camelToDash(componentKey);
            components[componentTag] = {
                component: componentConfig.component ? componentConfig.component : componentKey,
                template: componentConfig.template,
                defaults: componentConfig.defaults ? componentConfig.defaults : {}
            };
        });
    };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImprL3V0aWxzLmpzIiwiamsvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLENBQUMsVUFBVSxPQUFWLEVBQW1CO0FBQ2hCLFFBQUksUUFBTyxNQUFQLHlDQUFPLE1BQVAsT0FBa0IsUUFBbEIsSUFBOEIsUUFBTyxPQUFPLE9BQWQsTUFBMEIsUUFBNUQsRUFBc0U7QUFDbEUsWUFBSSxJQUFJLFFBQVEsT0FBUixFQUFpQixPQUFqQixDQUFSLENBQW1DLElBQUksTUFBTSxTQUFWLEVBQXFCLE9BQU8sT0FBUCxHQUFpQixDQUFqQjtBQUMzRCxLQUZELE1BR0ssSUFBSSxPQUFPLE1BQVAsS0FBa0IsVUFBbEIsSUFBZ0MsT0FBTyxHQUEzQyxFQUFnRDtBQUNqRCxlQUFPLENBQUMsU0FBRCxFQUFZLFNBQVosQ0FBUCxFQUErQixPQUEvQjtBQUNIO0FBQ0osQ0FQRCxFQU9HLFVBQVUsT0FBVixFQUFtQixPQUFuQixFQUE0QjtBQUMzQjs7QUNSUyxZQUFBLFdBQUEsR0FBYyxVQUFDLEdBQUQ7QUFBQSxlQUN2QixJQUFJLE9BQUosQ0FBWSxNQUFaLEVBQW9CLEdBQXBCLEVBQ0ssT0FETCxDQUNhLG1CQURiLEVBQ2tDLE9BRGxDLEVBRUssT0FGTCxDQUVhLFVBRmIsRUFFeUIsVUFBQyxDQUFELEVBQUksR0FBSjtBQUFBLG1CQUFZLElBQUksV0FBSixFQUFaO0FBQUEsU0FGekIsQ0FEdUI7QUFBQSxLQUFkO0FBS0EsWUFBQSxXQUFBLEdBQWMsVUFBQyxHQUFEO0FBQUEsZUFDdkIsSUFBSSxPQUFKLENBQVksU0FBWixFQUF1QixVQUFDLENBQUQsRUFBSSxHQUFKO0FBQUEsbUJBQVksSUFBSSxXQUFKLEVBQVo7QUFBQSxTQUF2QixDQUR1QjtBQUFBLEtBQWQ7QUFHQSxZQUFBLDJCQUFBLEdBQThCLFVBQUMsbUJBQUQsRUFBc0IsVUFBdEIsRUFBZ0M7QUFDdkUsZUFBTyxJQUFQLENBQVksbUJBQVosRUFBaUMsR0FBakMsQ0FBcUMsVUFBQyxXQUFELEVBQVk7QUFDN0MsZ0NBQW9CLFdBQXBCLEVBQWlDLEdBQWpDLENBQXFDLFVBQUMsWUFBRCxFQUFhO0FBQzlDLG9CQUFJLGVBQWUsUUFBQSxXQUFBLENBQVksWUFBWixDQUFuQjtBQUNBLDJCQUFXLFlBQVgsSUFBMkI7QUFDdkIsK0JBQVcsWUFEWTtBQUV2Qiw4QkFBVTtBQUZhLGlCQUEzQjtBQUlILGFBTkQ7QUFPSCxTQVJEO0FBU0gsS0FWWTtBQVlBLFlBQUEsd0JBQUEsR0FBMkIsVUFBQyxnQkFBRCxFQUFtQixVQUFuQixFQUE2QjtBQUNqRSxlQUFPLElBQVAsQ0FBWSxnQkFBWixFQUE4QixHQUE5QixDQUFrQyxVQUFDLFlBQUQsRUFBYTtBQUMzQyxnQkFBSSxrQkFBa0IsaUJBQWlCLFlBQWpCLENBQXRCO0FBQ0EsZ0JBQUksZUFBZSxRQUFBLFdBQUEsQ0FBWSxZQUFaLENBQW5CO0FBQ0EsdUJBQVcsWUFBWCxJQUEyQjtBQUN2QiwyQkFBWSxnQkFBZ0IsU0FBakIsR0FBOEIsZ0JBQWdCLFNBQTlDLEdBQTBELFlBRDlDO0FBRXZCLDBCQUFVLGdCQUFnQixRQUZIO0FBR3ZCLDBCQUFXLGdCQUFnQixRQUFqQixHQUE2QixnQkFBZ0IsUUFBN0MsR0FBd0Q7QUFIM0MsYUFBM0I7QUFLSCxTQVJEO0FBU0gsS0FWWTtBRGVaLENBbkNEIiwiZmlsZSI6ImprL3V0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdmFyIHYgPSBmYWN0b3J5KHJlcXVpcmUsIGV4cG9ydHMpOyBpZiAodiAhPT0gdW5kZWZpbmVkKSBtb2R1bGUuZXhwb3J0cyA9IHY7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW1wicmVxdWlyZVwiLCBcImV4cG9ydHNcIl0sIGZhY3RvcnkpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgZXhwb3J0cy5jYW1lbFRvRGFzaCA9IChzdHIpID0+IHN0ci5yZXBsYWNlKC9cXFcrL2csICctJylcbiAgICAgICAgLnJlcGxhY2UoLyhbYS16XFxkXSkoW0EtWl0pL2csICckMS0kMicpXG4gICAgICAgIC5yZXBsYWNlKC8oW0EtWl0pL2csICh4LCBjaHIpID0+IGNoci50b0xvd2VyQ2FzZSgpKTtcbiAgICBleHBvcnRzLmRhc2hUb0NhbWVsID0gKHN0cikgPT4gc3RyLnJlcGxhY2UoL1xcVysoLikvZywgKHgsIGNocikgPT4gY2hyLnRvVXBwZXJDYXNlKCkpO1xuICAgIGV4cG9ydHMuZ2VuZXJhdGVTaG9ydGN1dHNDb21wb25lbnRzID0gKHNob3J0Y3V0c0NvbXBvbmVudHMsIGNvbXBvbmVudHMpID0+IHtcbiAgICAgICAgT2JqZWN0LmtleXMoc2hvcnRjdXRzQ29tcG9uZW50cykubWFwKCh0ZW1wbGF0ZUtleSkgPT4ge1xuICAgICAgICAgICAgc2hvcnRjdXRzQ29tcG9uZW50c1t0ZW1wbGF0ZUtleV0ubWFwKChjb21wb25lbnRLZXkpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgY29tcG9uZW50VGFnID0gZXhwb3J0cy5jYW1lbFRvRGFzaChjb21wb25lbnRLZXkpO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudHNbY29tcG9uZW50VGFnXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiBjb21wb25lbnRLZXksXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZUtleVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBleHBvcnRzLmdlbmVyYXRlQ3VzdG9tQ29tcG9uZW50cyA9IChjdXN0b21Db21wb25lbnRzLCBjb21wb25lbnRzKSA9PiB7XG4gICAgICAgIE9iamVjdC5rZXlzKGN1c3RvbUNvbXBvbmVudHMpLm1hcCgoY29tcG9uZW50S2V5KSA9PiB7XG4gICAgICAgICAgICBsZXQgY29tcG9uZW50Q29uZmlnID0gY3VzdG9tQ29tcG9uZW50c1tjb21wb25lbnRLZXldO1xuICAgICAgICAgICAgbGV0IGNvbXBvbmVudFRhZyA9IGV4cG9ydHMuY2FtZWxUb0Rhc2goY29tcG9uZW50S2V5KTtcbiAgICAgICAgICAgIGNvbXBvbmVudHNbY29tcG9uZW50VGFnXSA9IHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQ6IChjb21wb25lbnRDb25maWcuY29tcG9uZW50KSA/IGNvbXBvbmVudENvbmZpZy5jb21wb25lbnQgOiBjb21wb25lbnRLZXksXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IGNvbXBvbmVudENvbmZpZy50ZW1wbGF0ZSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0czogKGNvbXBvbmVudENvbmZpZy5kZWZhdWx0cykgPyBjb21wb25lbnRDb25maWcuZGVmYXVsdHMgOiB7fVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn0pO1xuIiwiZXhwb3J0IGNvbnN0IGNhbWVsVG9EYXNoID0gKHN0cikgPT5cbiAgICBzdHIucmVwbGFjZSgvXFxXKy9nLCAnLScpXG4gICAgICAgIC5yZXBsYWNlKC8oW2EtelxcZF0pKFtBLVpdKS9nLCAnJDEtJDInKVxuICAgICAgICAucmVwbGFjZSgvKFtBLVpdKS9nLCAoeCwgY2hyKSA9PiBjaHIudG9Mb3dlckNhc2UoKSk7XG5cbmV4cG9ydCBjb25zdCBkYXNoVG9DYW1lbCA9IChzdHIpID0+XG4gICAgc3RyLnJlcGxhY2UoL1xcVysoLikvZywgKHgsIGNocikgPT4gY2hyLnRvVXBwZXJDYXNlKCkgKTtcblxuZXhwb3J0IGNvbnN0IGdlbmVyYXRlU2hvcnRjdXRzQ29tcG9uZW50cyA9IChzaG9ydGN1dHNDb21wb25lbnRzLCBjb21wb25lbnRzKSA9PiB7XG4gICAgT2JqZWN0LmtleXMoc2hvcnRjdXRzQ29tcG9uZW50cykubWFwKCh0ZW1wbGF0ZUtleSkgPT4ge1xuICAgICAgICBzaG9ydGN1dHNDb21wb25lbnRzW3RlbXBsYXRlS2V5XS5tYXAoKGNvbXBvbmVudEtleSkgPT4ge1xuICAgICAgICAgICAgbGV0IGNvbXBvbmVudFRhZyA9IGNhbWVsVG9EYXNoKGNvbXBvbmVudEtleSk7XG4gICAgICAgICAgICBjb21wb25lbnRzW2NvbXBvbmVudFRhZ10gPSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50OiBjb21wb25lbnRLZXksXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlS2V5XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZW5lcmF0ZUN1c3RvbUNvbXBvbmVudHMgPSAoY3VzdG9tQ29tcG9uZW50cywgY29tcG9uZW50cykgPT4ge1xuICAgIE9iamVjdC5rZXlzKGN1c3RvbUNvbXBvbmVudHMpLm1hcCgoY29tcG9uZW50S2V5KSA9PiB7XG4gICAgICAgIGxldCBjb21wb25lbnRDb25maWcgPSBjdXN0b21Db21wb25lbnRzW2NvbXBvbmVudEtleV07XG4gICAgICAgIGxldCBjb21wb25lbnRUYWcgPSBjYW1lbFRvRGFzaChjb21wb25lbnRLZXkpO1xuICAgICAgICBjb21wb25lbnRzW2NvbXBvbmVudFRhZ10gPSB7XG4gICAgICAgICAgICBjb21wb25lbnQ6IChjb21wb25lbnRDb25maWcuY29tcG9uZW50KSA/IGNvbXBvbmVudENvbmZpZy5jb21wb25lbnQgOiBjb21wb25lbnRLZXksXG4gICAgICAgICAgICB0ZW1wbGF0ZTogY29tcG9uZW50Q29uZmlnLnRlbXBsYXRlLFxuICAgICAgICAgICAgZGVmYXVsdHM6IChjb21wb25lbnRDb25maWcuZGVmYXVsdHMpID8gY29tcG9uZW50Q29uZmlnLmRlZmF1bHRzIDoge31cbiAgICAgICAgfTtcbiAgICB9KTtcbn07Il19
;


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (factory) {
    if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && _typeof(module.exports) === 'object') {
        var v = factory(require, exports);if (v !== undefined) module.exports = v;
    } else if (typeof define === 'function' && define.amd) {
        define('jk/components',["require", "exports", './utils'], factory);
    }
})(function (require, exports) {
    

    var utils = require('./utils');
    var components = {};
    // Components with no defaults
    var shortcutsComponents = {
        'input': ['ojInputText', 'ojInputPassword', 'ojInputNumber', 'ojInputDateTime', 'ojSlider', 'ojCombobox', 'ojInputSearch', 'ojSwitch'],
        'textarea': ['ojTextArea'],
        'div': ['ojDialog', 'ojSelect', 'ojCheckboxset', 'ojRadioSet', 'ojToolbar', 'ojLedGauge', 'ojDiagram', 'ojLegend', 'ojNBox', 'ojPictoChart', 'ojButtonset', 'ojDataGrid', 'ojTree', 'ojRowExpander', 'ojPagingControl', 'ojTabs'],
        'ul': ['ojMenu', 'ojListView', 'ojIndexer'],
        'button': ['ojButton'],
        'table': ['ojTable']
    };
    // Custom components
    var customComponents = {
        'ojNavigationList': {
            template: 'div',
            defaults: {
                navigationLevel: 'application',
                edge: 'start',
                optionChange: function optionChange() {},
                data: [],
                selection: '',
                item: {
                    template: ''
                }
            }
        },
        'ojChart': {
            template: 'div',
            defaults: {
                type: 'line',
                series: [],
                groups: [],
                animationOnDisplay: 'none',
                animationOnDataChange: 'none',
                orientation: 'vertical',
                hoverBehavior: 'dim'
            }
        }
    };
    utils.generateShortcutsComponents(shortcutsComponents, components);
    utils.generateCustomComponents(customComponents, components);
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = components;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImprL2NvbXBvbmVudHMuanMiLCJqay9jb21wb25lbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxDQUFDLFVBQVUsT0FBVixFQUFtQjtBQUNoQixRQUFJLFFBQU8sTUFBUCx5Q0FBTyxNQUFQLE9BQWtCLFFBQWxCLElBQThCLFFBQU8sT0FBTyxPQUFkLE1BQTBCLFFBQTVELEVBQXNFO0FBQ2xFLFlBQUksSUFBSSxRQUFRLE9BQVIsRUFBaUIsT0FBakIsQ0FBUixDQUFtQyxJQUFJLE1BQU0sU0FBVixFQUFxQixPQUFPLE9BQVAsR0FBaUIsQ0FBakI7QUFDM0QsS0FGRCxNQUdLLElBQUksT0FBTyxNQUFQLEtBQWtCLFVBQWxCLElBQWdDLE9BQU8sR0FBM0MsRUFBZ0Q7QUFDakQsZUFBTyxDQUFDLFNBQUQsRUFBWSxTQUFaLEVBQXVCLFNBQXZCLENBQVAsRUFBMEMsT0FBMUM7QUFDSDtBQUNKLENBUEQsRUFPRyxVQUFVLE9BQVYsRUFBbUIsT0FBbkIsRUFBNEI7QUFDM0I7O0FDUkosUUFBWSxRQUFLLFFBQU0sU0FBTixDQUFqQjtBQUVBLFFBQUksYUFBYSxFQUFqQjs7QUFFQSxRQUFJLHNCQUFzQjtBQUN0QixpQkFBUyxDQUFDLGFBQUQsRUFBZ0IsaUJBQWhCLEVBQW1DLGVBQW5DLEVBQW9ELGlCQUFwRCxFQUF3RSxVQUF4RSxFQUFvRixZQUFwRixFQUFrRyxlQUFsRyxFQUFtSCxVQUFuSCxDQURhO0FBRXRCLG9CQUFZLENBQUMsWUFBRCxDQUZVO0FBR3RCLGVBQU0sQ0FBQyxVQUFELEVBQWEsVUFBYixFQUF5QixlQUF6QixFQUEwQyxZQUExQyxFQUF1RCxXQUF2RCxFQUFvRSxZQUFwRSxFQUFrRixXQUFsRixFQUE4RixVQUE5RixFQUEwRyxRQUExRyxFQUFvSCxjQUFwSCxFQUFvSSxhQUFwSSxFQUFtSixZQUFuSixFQUFpSyxRQUFqSyxFQUE0SyxlQUE1SyxFQUE2TCxpQkFBN0wsRUFBZ04sUUFBaE4sQ0FIZ0I7QUFJdEIsY0FBTSxDQUFDLFFBQUQsRUFBVyxZQUFYLEVBQXlCLFdBQXpCLENBSmdCO0FBS3RCLGtCQUFVLENBQUMsVUFBRCxDQUxZO0FBTXRCLGlCQUFTLENBQUMsU0FBRDtBQU5hLEtBQTFCOztBQVNBLFFBQUksbUJBQW1CO0FBQ25CLDRCQUFvQjtBQUNoQixzQkFBVSxLQURNO0FBRWhCLHNCQUFVO0FBQ04saUNBQWlCLGFBRFg7QUFFTixzQkFBTSxPQUZBO0FBR04sOEJBQWMsd0JBQUEsQ0FBYSxDQUhyQjtBQUlOLHNCQUFNLEVBSkE7QUFLTiwyQkFBVyxFQUxMO0FBTU4sc0JBQU07QUFDRiw4QkFBVTtBQURSO0FBTkE7QUFGTSxTQUREO0FBY25CLG1CQUFVO0FBQ04sc0JBQVUsS0FESjtBQUVOLHNCQUFTO0FBQ0wsc0JBQU0sTUFERDtBQUVMLHdCQUFRLEVBRkg7QUFHTCx3QkFBUSxFQUhIO0FBSUwsb0NBQW9CLE1BSmY7QUFLTCx1Q0FBdUIsTUFMbEI7QUFNTCw2QkFBYSxVQU5SO0FBT0wsK0JBQWU7QUFQVjtBQUZIO0FBZFMsS0FBdkI7QUEyQkEsVUFBTSwyQkFBTixDQUFrQyxtQkFBbEMsRUFBdUQsVUFBdkQ7QUFDQSxVQUFNLHdCQUFOLENBQStCLGdCQUEvQixFQUFpRCxVQUFqRDtBQWNBLFdBQUEsY0FBQSxDQUFBLE9BQUEsRUFBQSxZQUFBLEVBQUEsRUFBQSxPQUFBLElBQUEsRUFBQTtBREpJLFlBQVEsT0FBUixHQ0lXLFVESlg7QUFDSCxDQXBERCIsImZpbGUiOiJqay9jb21wb25lbnRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdmFyIHYgPSBmYWN0b3J5KHJlcXVpcmUsIGV4cG9ydHMpOyBpZiAodiAhPT0gdW5kZWZpbmVkKSBtb2R1bGUuZXhwb3J0cyA9IHY7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW1wicmVxdWlyZVwiLCBcImV4cG9ydHNcIiwgJy4vdXRpbHMnXSwgZmFjdG9yeSk7XG4gICAgfVxufSkoZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBjb25zdCB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbiAgICBsZXQgY29tcG9uZW50cyA9IHt9O1xuICAgIC8vIENvbXBvbmVudHMgd2l0aCBubyBkZWZhdWx0c1xuICAgIGxldCBzaG9ydGN1dHNDb21wb25lbnRzID0ge1xuICAgICAgICAnaW5wdXQnOiBbJ29qSW5wdXRUZXh0JywgJ29qSW5wdXRQYXNzd29yZCcsICdvaklucHV0TnVtYmVyJywgJ29qSW5wdXREYXRlVGltZScsICdvalNsaWRlcicsICdvakNvbWJvYm94JywgJ29qSW5wdXRTZWFyY2gnLCAnb2pTd2l0Y2gnXSxcbiAgICAgICAgJ3RleHRhcmVhJzogWydvalRleHRBcmVhJ10sXG4gICAgICAgICdkaXYnOiBbJ29qRGlhbG9nJywgJ29qU2VsZWN0JywgJ29qQ2hlY2tib3hzZXQnLCAnb2pSYWRpb1NldCcsICdvalRvb2xiYXInLCAnb2pMZWRHYXVnZScsICdvakRpYWdyYW0nLCAnb2pMZWdlbmQnLCAnb2pOQm94JywgJ29qUGljdG9DaGFydCcsICdvakJ1dHRvbnNldCcsICdvakRhdGFHcmlkJywgJ29qVHJlZScsICdvalJvd0V4cGFuZGVyJywgJ29qUGFnaW5nQ29udHJvbCcsICdvalRhYnMnXSxcbiAgICAgICAgJ3VsJzogWydvak1lbnUnLCAnb2pMaXN0VmlldycsICdvakluZGV4ZXInXSxcbiAgICAgICAgJ2J1dHRvbic6IFsnb2pCdXR0b24nXSxcbiAgICAgICAgJ3RhYmxlJzogWydvalRhYmxlJ11cbiAgICB9O1xuICAgIC8vIEN1c3RvbSBjb21wb25lbnRzXG4gICAgbGV0IGN1c3RvbUNvbXBvbmVudHMgPSB7XG4gICAgICAgICdvak5hdmlnYXRpb25MaXN0Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGU6ICdkaXYnLFxuICAgICAgICAgICAgZGVmYXVsdHM6IHtcbiAgICAgICAgICAgICAgICBuYXZpZ2F0aW9uTGV2ZWw6ICdhcHBsaWNhdGlvbicsXG4gICAgICAgICAgICAgICAgZWRnZTogJ3N0YXJ0JyxcbiAgICAgICAgICAgICAgICBvcHRpb25DaGFuZ2U6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiBbXSxcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb246ICcnLFxuICAgICAgICAgICAgICAgIGl0ZW06IHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6ICcnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAnb2pDaGFydCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnZGl2JyxcbiAgICAgICAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2xpbmUnLFxuICAgICAgICAgICAgICAgIHNlcmllczogW10sXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXSxcbiAgICAgICAgICAgICAgICBhbmltYXRpb25PbkRpc3BsYXk6ICdub25lJyxcbiAgICAgICAgICAgICAgICBhbmltYXRpb25PbkRhdGFDaGFuZ2U6ICdub25lJyxcbiAgICAgICAgICAgICAgICBvcmllbnRhdGlvbjogJ3ZlcnRpY2FsJyxcbiAgICAgICAgICAgICAgICBob3ZlckJlaGF2aW9yOiAnZGltJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICB1dGlscy5nZW5lcmF0ZVNob3J0Y3V0c0NvbXBvbmVudHMoc2hvcnRjdXRzQ29tcG9uZW50cywgY29tcG9uZW50cyk7XG4gICAgdXRpbHMuZ2VuZXJhdGVDdXN0b21Db21wb25lbnRzKGN1c3RvbUNvbXBvbmVudHMsIGNvbXBvbmVudHMpO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbiAgICBleHBvcnRzLmRlZmF1bHQgPSBjb21wb25lbnRzO1xufSk7XG4iLCJpbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL3V0aWxzJztcblxubGV0IGNvbXBvbmVudHMgPSB7fTtcbi8vIENvbXBvbmVudHMgd2l0aCBubyBkZWZhdWx0c1xubGV0IHNob3J0Y3V0c0NvbXBvbmVudHMgPSB7XG4gICAgJ2lucHV0JzogWydvaklucHV0VGV4dCcsICdvaklucHV0UGFzc3dvcmQnLCAnb2pJbnB1dE51bWJlcicsICdvaklucHV0RGF0ZVRpbWUnLCAgJ29qU2xpZGVyJywgJ29qQ29tYm9ib3gnLCAnb2pJbnB1dFNlYXJjaCcsICdvalN3aXRjaCddLFxuICAgICd0ZXh0YXJlYSc6IFsnb2pUZXh0QXJlYSddLFxuICAgICdkaXYnOlsnb2pEaWFsb2cnLCAnb2pTZWxlY3QnLCAnb2pDaGVja2JveHNldCcsICdvalJhZGlvU2V0Jywnb2pUb29sYmFyJywgJ29qTGVkR2F1Z2UnLCAnb2pEaWFncmFtJywnb2pMZWdlbmQnLCAnb2pOQm94JywgJ29qUGljdG9DaGFydCcsICdvakJ1dHRvbnNldCcsICdvakRhdGFHcmlkJywgJ29qVHJlZScsICAnb2pSb3dFeHBhbmRlcicsICdvalBhZ2luZ0NvbnRyb2wnLCAnb2pUYWJzJ10sXG4gICAgJ3VsJzogWydvak1lbnUnLCAnb2pMaXN0VmlldycsICdvakluZGV4ZXInXSxcbiAgICAnYnV0dG9uJzogWydvakJ1dHRvbiddLFxuICAgICd0YWJsZSc6IFsnb2pUYWJsZSddXG59O1xuLy8gQ3VzdG9tIGNvbXBvbmVudHNcbmxldCBjdXN0b21Db21wb25lbnRzID0ge1xuICAgICdvak5hdmlnYXRpb25MaXN0Jzoge1xuICAgICAgICB0ZW1wbGF0ZTogJ2RpdicsXG4gICAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgICAgICBuYXZpZ2F0aW9uTGV2ZWw6ICdhcHBsaWNhdGlvbicsXG4gICAgICAgICAgICBlZGdlOiAnc3RhcnQnLFxuICAgICAgICAgICAgb3B0aW9uQ2hhbmdlOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICAgICAgZGF0YTogW10sXG4gICAgICAgICAgICBzZWxlY3Rpb246ICcnLFxuICAgICAgICAgICAgaXRlbToge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiAnJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICAnb2pDaGFydCc6e1xuICAgICAgICB0ZW1wbGF0ZTogJ2RpdicsXG4gICAgICAgIGRlZmF1bHRzOntcbiAgICAgICAgICAgIHR5cGU6ICdsaW5lJyxcbiAgICAgICAgICAgIHNlcmllczogW10sXG4gICAgICAgICAgICBncm91cHM6IFtdLFxuICAgICAgICAgICAgYW5pbWF0aW9uT25EaXNwbGF5OiAnbm9uZScsXG4gICAgICAgICAgICBhbmltYXRpb25PbkRhdGFDaGFuZ2U6ICdub25lJyxcbiAgICAgICAgICAgIG9yaWVudGF0aW9uOiAndmVydGljYWwnLFxuICAgICAgICAgICAgaG92ZXJCZWhhdmlvcjogJ2RpbSdcbiAgICAgICAgfVxuICAgIH1cbn07XG51dGlscy5nZW5lcmF0ZVNob3J0Y3V0c0NvbXBvbmVudHMoc2hvcnRjdXRzQ29tcG9uZW50cywgY29tcG9uZW50cyk7XG51dGlscy5nZW5lcmF0ZUN1c3RvbUNvbXBvbmVudHMoY3VzdG9tQ29tcG9uZW50cywgY29tcG9uZW50cyk7XG5cbi8qXG4gICAgY29tcG9uZW50czp7XG4gICAgICAgIEhUTUxfVEFHX09GX1RIRV9DT01QT05FTlQ6IHtcbiAgICAgICAgICAgIGNvbXBvbmVudDogTkFNRV9PRl9DT01QT05FTlQsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogSFRNTF9DT0RFX09GX1RIRV9URU1QTEFURSxcbiAgICAgICAgICAgIGRlZmF1bHRzOiBPQkpFQ1RfV0lUSF9USEVfREVGQVVMVFNfUFJPUEVSVElFU1xuICAgICAgICB9LFxuICAgICAgICBIVE1MX1RBR19PRl9USEVfQ09NUE9ORU5UMjogeyAuLi4gfSxcblxuICAgICAgICAuLi5cbiAgICB9XG4qL1xuZXhwb3J0IGRlZmF1bHQgY29tcG9uZW50cztcbiJdfQ==
;


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (factory) {
    if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && _typeof(module.exports) === 'object') {
        var v = factory(require, exports);if (v !== undefined) module.exports = v;
    } else if (typeof define === 'function' && define.amd) {
        define('jk/helper',["require", "exports", './components'], factory);
    }
})(function (require, exports) {
    

    var components_1 = require('./components');
    exports.helper = function (name, html, defaults) {
        defaults = defaults ? defaults : {};
        return {
            viewModel: exports.koClass(name, defaults),
            template: html.length > 10 ? html : exports.ojHtml(html)
        };
    };
    exports.register = function (ko) {
        Object.keys(components_1.default).map(function (key) {
            var config = Object.assign({}, {
                component: '',
                template: '',
                defaults: {}
            }, components_1.default[key]);
            ko.components.register(key.replace("oj-", "ojk-"), exports.helper(config.component, config.template, config.defaults));
        });
    };
    exports.koClass = function (name, ojDefaults) {
        var defaultFields = ['click', 'id', 'style', 'css', 'title'];
        return function Class(params) {
            var _this = this;

            _classCallCheck(this, Class);

            this.params = params;
            this.ojcomponent = Object.assign({}, {
                component: name
            }, ojDefaults, params);
            defaultFields.map(function (k) {
                _this[k] = params[k] ? params[k] : '';
            });
        };
    };
    exports.ojHtml = function (name) {
        var defaultFields = ['id', 'title', 'style', 'css'];
        var child = '';
        if (name !== 'input') {
            child = '<!-- ko with:$parent -->        <!-- ko template: { nodes: $componentTemplateNodes } --><!-- /ko -->        <!-- /ko -->';
        }
        var click = '';
        if (name === 'button') {
            click = 'click:click,';
        }
        var attr = '';
        defaultFields.map(function (c, i) {
            attr += '\'' + c + '\':' + c + (i < defaultFields.length - 1 ? ',' : '') + ' ';
        });
        return '<' + name + ' data-bind="' + click + ' attr: {' + attr + '}, ojComponent: ojcomponent"> ' + child + ' </' + name + '>';
    };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImprL2hlbHBlci5qcyIsImprL2hlbHBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxDQUFDLFVBQVUsT0FBVixFQUFtQjtBQUNoQixRQUFJLFFBQU8sTUFBUCx5Q0FBTyxNQUFQLE9BQWtCLFFBQWxCLElBQThCLFFBQU8sT0FBTyxPQUFkLE1BQTBCLFFBQTVELEVBQXNFO0FBQ2xFLFlBQUksSUFBSSxRQUFRLE9BQVIsRUFBaUIsT0FBakIsQ0FBUixDQUFtQyxJQUFJLE1BQU0sU0FBVixFQUFxQixPQUFPLE9BQVAsR0FBaUIsQ0FBakI7QUFDM0QsS0FGRCxNQUdLLElBQUksT0FBTyxNQUFQLEtBQWtCLFVBQWxCLElBQWdDLE9BQU8sR0FBM0MsRUFBZ0Q7QUFDakQsZUFBTyxDQUFDLFNBQUQsRUFBWSxTQUFaLEVBQXVCLGNBQXZCLENBQVAsRUFBK0MsT0FBL0M7QUFDSDtBQUNKLENBUEQsRUFPRyxVQUFVLE9BQVYsRUFBbUIsT0FBbkIsRUFBNEI7QUFDM0I7O0FDUkosUUFBQSxlQUFBLFFBQXVCLGNBQXZCLENBQUE7QUFFYSxZQUFBLE1BQUEsR0FBUyxVQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsUUFBYixFQUFxQjtBQUN2QyxtQkFBWSxRQUFELEdBQWEsUUFBYixHQUF3QixFQUFuQztBQUNBLGVBQU87QUFDSCx1QkFBVyxRQUFBLE9BQUEsQ0FBUSxJQUFSLEVBQWMsUUFBZCxDQURSO0FBRUgsc0JBQVcsS0FBSyxNQUFMLEdBQWMsRUFBZixHQUFxQixJQUFyQixHQUE0QixRQUFBLE1BQUEsQ0FBTyxJQUFQO0FBRm5DLFNBQVA7QUFJSCxLQU5ZO0FBUUEsWUFBQSxRQUFBLEdBQVcsVUFBVSxFQUFWLEVBQVk7QUFDaEMsZUFBTyxJQUFQLENBQVksYUFBQSxPQUFaLEVBQXdCLEdBQXhCLENBQTZCLGVBQUc7QUFDNUIsZ0JBQUksU0FBUyxPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQ1Q7QUFDSSwyQkFBVyxFQURmO0FBRUksMEJBQVUsRUFGZDtBQUdJLDBCQUFVO0FBSGQsYUFEUyxFQUtOLGFBQUEsT0FBQSxDQUFXLEdBQVgsQ0FMTSxDQUFiO0FBT0EsZUFBRyxVQUFILENBQWMsUUFBZCxDQUNJLElBQUksT0FBSixDQUFZLEtBQVosRUFBbUIsTUFBbkIsQ0FESixFQUVJLFFBQUEsTUFBQSxDQUNJLE9BQU8sU0FEWCxFQUVJLE9BQU8sUUFGWCxFQUdJLE9BQU8sUUFIWCxDQUZKO0FBUUgsU0FoQkQ7QUFpQkgsS0FsQlk7QUFvQkEsWUFBQSxPQUFBLEdBQVUsVUFBVSxJQUFWLEVBQWdCLFVBQWhCLEVBQTBCO0FBQzdDLFlBQUksZ0JBQWdCLENBQUMsT0FBRCxFQUFVLElBQVYsRUFBZ0IsT0FBaEIsRUFBeUIsS0FBekIsRUFBZ0MsT0FBaEMsQ0FBcEI7QUFFQSxlQUlJLGVBQVksTUFBWixFQUFrQjtBQUFBOztBQUFBOztBQUNkLGlCQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0EsaUJBQUssV0FBTCxHQUFtQixPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQ2Y7QUFDSSwyQkFBVztBQURmLGFBRGUsRUFJZixVQUplLEVBS2YsTUFMZSxDQUFuQjtBQU9BLDBCQUFjLEdBQWQsQ0FBa0IsVUFBQyxDQUFELEVBQUU7QUFDaEIsc0JBQUssQ0FBTCxJQUFXLE9BQU8sQ0FBUCxDQUFELEdBQWMsT0FBTyxDQUFQLENBQWQsR0FBMEIsRUFBcEM7QUFDSCxhQUZEO0FBR0gsU0FoQkw7QUFrQkgsS0FyQlk7QUF1QkEsWUFBQSxNQUFBLEdBQVMsVUFBQyxJQUFELEVBQUs7QUFFdkIsWUFBSSxnQkFBZ0IsQ0FBQyxJQUFELEVBQU0sT0FBTixFQUFjLE9BQWQsRUFBdUIsS0FBdkIsQ0FBcEI7QUFFQSxZQUFJLFFBQVEsRUFBWjtBQUNBLFlBQUksU0FBUyxPQUFiLEVBQXFCO0FBQ2pCO0FBR0g7QUFDRCxZQUFJLFFBQVEsRUFBWjtBQUNBLFlBQUksU0FBUyxRQUFiLEVBQXNCO0FBQ2xCO0FBQ0g7QUFFRCxZQUFJLE9BQU8sRUFBWDtBQUNBLHNCQUFjLEdBQWQsQ0FBa0IsVUFBUyxDQUFULEVBQVksQ0FBWixFQUFhO0FBQzNCLDJCQUFhLENBQWIsV0FBb0IsQ0FBcEIsSUFBMEIsSUFBSSxjQUFjLE1BQWQsR0FBcUIsQ0FBMUIsR0FBK0IsR0FBL0IsR0FBcUMsRUFBOUQ7QUFDSCxTQUZEO0FBSUEscUJBQVcsSUFBWCxvQkFBOEIsS0FBOUIsZ0JBQThDLElBQTlDLHNDQUFtRixLQUFuRixXQUE4RixJQUE5RjtBQUNILEtBckJZO0FET1osQ0E1REQiLCJmaWxlIjoiamsvaGVscGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdmFyIHYgPSBmYWN0b3J5KHJlcXVpcmUsIGV4cG9ydHMpOyBpZiAodiAhPT0gdW5kZWZpbmVkKSBtb2R1bGUuZXhwb3J0cyA9IHY7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW1wicmVxdWlyZVwiLCBcImV4cG9ydHNcIiwgJy4vY29tcG9uZW50cyddLCBmYWN0b3J5KTtcbiAgICB9XG59KShmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIGNvbnN0IGNvbXBvbmVudHNfMSA9IHJlcXVpcmUoJy4vY29tcG9uZW50cycpO1xuICAgIGV4cG9ydHMuaGVscGVyID0gKG5hbWUsIGh0bWwsIGRlZmF1bHRzKSA9PiB7XG4gICAgICAgIGRlZmF1bHRzID0gKGRlZmF1bHRzKSA/IGRlZmF1bHRzIDoge307XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2aWV3TW9kZWw6IGV4cG9ydHMua29DbGFzcyhuYW1lLCBkZWZhdWx0cyksXG4gICAgICAgICAgICB0ZW1wbGF0ZTogKGh0bWwubGVuZ3RoID4gMTApID8gaHRtbCA6IGV4cG9ydHMub2pIdG1sKGh0bWwpXG4gICAgICAgIH07XG4gICAgfTtcbiAgICBleHBvcnRzLnJlZ2lzdGVyID0gZnVuY3Rpb24gKGtvKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKGNvbXBvbmVudHNfMS5kZWZhdWx0KS5tYXAoa2V5ID0+IHtcbiAgICAgICAgICAgIHZhciBjb25maWcgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50OiAnJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJycsXG4gICAgICAgICAgICAgICAgZGVmYXVsdHM6IHt9XG4gICAgICAgICAgICB9LCBjb21wb25lbnRzXzEuZGVmYXVsdFtrZXldKTtcbiAgICAgICAgICAgIGtvLmNvbXBvbmVudHMucmVnaXN0ZXIoa2V5LnJlcGxhY2UoXCJvai1cIiwgXCJvamstXCIpLCBleHBvcnRzLmhlbHBlcihjb25maWcuY29tcG9uZW50LCBjb25maWcudGVtcGxhdGUsIGNvbmZpZy5kZWZhdWx0cykpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGV4cG9ydHMua29DbGFzcyA9IGZ1bmN0aW9uIChuYW1lLCBvakRlZmF1bHRzKSB7XG4gICAgICAgIHZhciBkZWZhdWx0RmllbGRzID0gWydjbGljaycsICdpZCcsICdzdHlsZScsICdjc3MnLCAndGl0bGUnXTtcbiAgICAgICAgcmV0dXJuIGNsYXNzIENsYXNzIHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xuICAgICAgICAgICAgICAgIHRoaXMub2pjb21wb25lbnQgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudDogbmFtZVxuICAgICAgICAgICAgICAgIH0sIG9qRGVmYXVsdHMsIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgZGVmYXVsdEZpZWxkcy5tYXAoKGspID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1trXSA9IChwYXJhbXNba10pID8gcGFyYW1zW2tdIDogJyc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgO1xuICAgIH07XG4gICAgZXhwb3J0cy5vakh0bWwgPSAobmFtZSkgPT4ge1xuICAgICAgICBsZXQgZGVmYXVsdEZpZWxkcyA9IFsnaWQnLCAndGl0bGUnLCAnc3R5bGUnLCAnY3NzJ107XG4gICAgICAgIGxldCBjaGlsZCA9ICcnO1xuICAgICAgICBpZiAobmFtZSAhPT0gJ2lucHV0Jykge1xuICAgICAgICAgICAgY2hpbGQgPSBgPCEtLSBrbyB3aXRoOiRwYXJlbnQgLS0+XFxcbiAgICAgICAgPCEtLSBrbyB0ZW1wbGF0ZTogeyBub2RlczogJGNvbXBvbmVudFRlbXBsYXRlTm9kZXMgfSAtLT48IS0tIC9rbyAtLT5cXFxuICAgICAgICA8IS0tIC9rbyAtLT5gO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjbGljayA9ICcnO1xuICAgICAgICBpZiAobmFtZSA9PT0gJ2J1dHRvbicpIHtcbiAgICAgICAgICAgIGNsaWNrID0gYGNsaWNrOmNsaWNrLGA7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGF0dHIgPSAnJztcbiAgICAgICAgZGVmYXVsdEZpZWxkcy5tYXAoZnVuY3Rpb24gKGMsIGkpIHtcbiAgICAgICAgICAgIGF0dHIgKz0gYFxcJyR7Y31cXCc6JHtjfSR7KGkgPCBkZWZhdWx0RmllbGRzLmxlbmd0aCAtIDEpID8gJywnIDogJyd9IGA7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gYDwke25hbWV9IGRhdGEtYmluZD1cIiR7Y2xpY2t9IGF0dHI6IHske2F0dHJ9fSwgb2pDb21wb25lbnQ6IG9qY29tcG9uZW50XCI+ICR7Y2hpbGR9IDwvJHtuYW1lfT5gO1xuICAgIH07XG59KTtcbiIsImltcG9ydCBjb21wb25lbnRzIGZyb20gJy4vY29tcG9uZW50cyc7XG5cbmV4cG9ydCBjb25zdCBoZWxwZXIgPSAobmFtZSwgaHRtbCwgZGVmYXVsdHMpID0+IHtcbiAgICBkZWZhdWx0cyA9IChkZWZhdWx0cykgPyBkZWZhdWx0cyA6IHt9O1xuICAgIHJldHVybiB7XG4gICAgICAgIHZpZXdNb2RlbDoga29DbGFzcyhuYW1lLCBkZWZhdWx0cyksXG4gICAgICAgIHRlbXBsYXRlOiAoaHRtbC5sZW5ndGggPiAxMCkgPyBodG1sIDogb2pIdG1sKGh0bWwpXG4gICAgfTtcbn07XG5cbmV4cG9ydCBjb25zdCByZWdpc3RlciA9IGZ1bmN0aW9uIChrbykge1xuICAgIE9iamVjdC5rZXlzKGNvbXBvbmVudHMpLm1hcCgga2V5ID0+IHtcbiAgICAgICAgdmFyIGNvbmZpZyA9IE9iamVjdC5hc3NpZ24oe30sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50OiAnJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJycsXG4gICAgICAgICAgICAgICAgZGVmYXVsdHM6IHt9XG4gICAgICAgICAgICB9LCBjb21wb25lbnRzW2tleV0pO1xuXG4gICAgICAgIGtvLmNvbXBvbmVudHMucmVnaXN0ZXIoXG4gICAgICAgICAgICBrZXkucmVwbGFjZShcIm9qLVwiLCBcIm9qay1cIiksXG4gICAgICAgICAgICBoZWxwZXIoXG4gICAgICAgICAgICAgICAgY29uZmlnLmNvbXBvbmVudCxcbiAgICAgICAgICAgICAgICBjb25maWcudGVtcGxhdGUsXG4gICAgICAgICAgICAgICAgY29uZmlnLmRlZmF1bHRzXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfSk7XG59O1xuXG5leHBvcnQgY29uc3Qga29DbGFzcyA9IGZ1bmN0aW9uIChuYW1lLCBvakRlZmF1bHRzKSB7XG4gICAgdmFyIGRlZmF1bHRGaWVsZHMgPSBbJ2NsaWNrJywgJ2lkJywgJ3N0eWxlJywgJ2NzcycsICd0aXRsZSddO1xuXG4gICAgcmV0dXJuIGNsYXNzIENsYXNzIHtcbiAgICAgICAgcHVibGljIHBhcmFtc1xuICAgICAgICBwdWJsaWMgb2pjb21wb25lbnRcblxuICAgICAgICBjb25zdHJ1Y3RvcihwYXJhbXMpe1xuICAgICAgICAgICAgdGhpcy5wYXJhbXMgPSBwYXJhbXM7XG4gICAgICAgICAgICB0aGlzLm9qY29tcG9uZW50ID0gT2JqZWN0LmFzc2lnbih7fSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudDogbmFtZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb2pEZWZhdWx0cyxcbiAgICAgICAgICAgICAgICBwYXJhbXNcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBkZWZhdWx0RmllbGRzLm1hcCgoaykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXNba10gPSAocGFyYW1zW2tdKSA/IHBhcmFtc1trXSA6ICcnO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBvakh0bWwgPSAobmFtZSkgPT4ge1xuXG4gICAgbGV0IGRlZmF1bHRGaWVsZHMgPSBbJ2lkJywndGl0bGUnLCdzdHlsZScsICdjc3MnXTtcblxuICAgIGxldCBjaGlsZCA9ICcnO1xuICAgIGlmIChuYW1lICE9PSAnaW5wdXQnKXtcbiAgICAgICAgY2hpbGQgPSBgPCEtLSBrbyB3aXRoOiRwYXJlbnQgLS0+XFxcbiAgICAgICAgPCEtLSBrbyB0ZW1wbGF0ZTogeyBub2RlczogJGNvbXBvbmVudFRlbXBsYXRlTm9kZXMgfSAtLT48IS0tIC9rbyAtLT5cXFxuICAgICAgICA8IS0tIC9rbyAtLT5gO1xuICAgIH1cbiAgICB2YXIgY2xpY2sgPSAnJztcbiAgICBpZiAobmFtZSA9PT0gJ2J1dHRvbicpe1xuICAgICAgICBjbGljayA9IGBjbGljazpjbGljayxgO1xuICAgIH1cblxuICAgIHZhciBhdHRyID0gJyc7XG4gICAgZGVmYXVsdEZpZWxkcy5tYXAoZnVuY3Rpb24oYywgaSl7XG4gICAgICAgIGF0dHIgKz0gYFxcJyR7Y31cXCc6JHtjfSR7IChpIDwgZGVmYXVsdEZpZWxkcy5sZW5ndGgtMSkgPyAnLCcgOiAnJyB9IGA7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gYDwke25hbWV9IGRhdGEtYmluZD1cIiR7Y2xpY2t9IGF0dHI6IHske2F0dHJ9fSwgb2pDb21wb25lbnQ6IG9qY29tcG9uZW50XCI+ICR7Y2hpbGR9IDwvJHtuYW1lfT5gO1xufTsiXX0=
;


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (factory) {
    if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && _typeof(module.exports) === 'object') {
        var v = factory(require, exports);if (v !== undefined) module.exports = v;
    } else if (typeof define === 'function' && define.amd) {
        define('jet-komponents',["require", "exports", './jk/components', './jk/utils', './jk/helper'], factory);
    }
})(function (require, exports) {
    

    var components_1 = require('./jk/components');
    var ut = require('./jk/utils');
    var helper_1 = require('./jk/helper');
    exports.helper = helper_1.helper;
    exports.register = helper_1.register;
    exports.utils = ut;
    exports.components = components_1.default;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpldC1rb21wb25lbnRzLmpzIiwiamV0LWtvbXBvbmVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLENBQUMsVUFBVSxPQUFWLEVBQW1CO0FBQ2hCLFFBQUksUUFBTyxNQUFQLHlDQUFPLE1BQVAsT0FBa0IsUUFBbEIsSUFBOEIsUUFBTyxPQUFPLE9BQWQsTUFBMEIsUUFBNUQsRUFBc0U7QUFDbEUsWUFBSSxJQUFJLFFBQVEsT0FBUixFQUFpQixPQUFqQixDQUFSLENBQW1DLElBQUksTUFBTSxTQUFWLEVBQXFCLE9BQU8sT0FBUCxHQUFpQixDQUFqQjtBQUMzRCxLQUZELE1BR0ssSUFBSSxPQUFPLE1BQVAsS0FBa0IsVUFBbEIsSUFBZ0MsT0FBTyxHQUEzQyxFQUFnRDtBQUNqRCxlQUFPLENBQUMsU0FBRCxFQUFZLFNBQVosRUFBdUIsaUJBQXZCLEVBQTBDLFlBQTFDLEVBQXdELGFBQXhELENBQVAsRUFBK0UsT0FBL0U7QUFDSDtBQUNKLENBUEQsRUFPRyxVQUFVLE9BQVYsRUFBbUIsT0FBbkIsRUFBNEI7QUFDM0I7O0FDUkosUUFBQSxlQUFBLFFBQWtCLGlCQUFsQixDQUFBO0FBQ0EsUUFBWSxLQUFFLFFBQU0sWUFBTixDQUFkO0FBRUEsUUFBQSxXQUFBLFFBQStCLGFBQS9CLENBQUE7QUFBUSxZQUFBLE1BQUEsR0FBQSxTQUFBLE1BQUE7QUFBUSxZQUFBLFFBQUEsR0FBQSxTQUFBLFFBQUE7QUFDSCxZQUFBLEtBQUEsR0FBUSxFQUFSO0FBQ0EsWUFBQSxVQUFBLEdBQWEsYUFBQSxPQUFiO0FEV1osQ0FoQkQiLCJmaWxlIjoiamV0LWtvbXBvbmVudHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICB2YXIgdiA9IGZhY3RvcnkocmVxdWlyZSwgZXhwb3J0cyk7IGlmICh2ICE9PSB1bmRlZmluZWQpIG1vZHVsZS5leHBvcnRzID0gdjtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXCJyZXF1aXJlXCIsIFwiZXhwb3J0c1wiLCAnLi9qay9jb21wb25lbnRzJywgJy4vamsvdXRpbHMnLCAnLi9qay9oZWxwZXInXSwgZmFjdG9yeSk7XG4gICAgfVxufSkoZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBjb25zdCBjb21wb25lbnRzXzEgPSByZXF1aXJlKCcuL2prL2NvbXBvbmVudHMnKTtcbiAgICBjb25zdCB1dCA9IHJlcXVpcmUoJy4vamsvdXRpbHMnKTtcbiAgICB2YXIgaGVscGVyXzEgPSByZXF1aXJlKCcuL2prL2hlbHBlcicpO1xuICAgIGV4cG9ydHMuaGVscGVyID0gaGVscGVyXzEuaGVscGVyO1xuICAgIGV4cG9ydHMucmVnaXN0ZXIgPSBoZWxwZXJfMS5yZWdpc3RlcjtcbiAgICBleHBvcnRzLnV0aWxzID0gdXQ7XG4gICAgZXhwb3J0cy5jb21wb25lbnRzID0gY29tcG9uZW50c18xLmRlZmF1bHQ7XG59KTtcbiIsImltcG9ydCBjb21wcyBmcm9tICcuL2prL2NvbXBvbmVudHMnO1xuaW1wb3J0ICogYXMgdXQgZnJvbSAnLi9qay91dGlscyc7XG5cbmV4cG9ydCB7aGVscGVyLCByZWdpc3Rlcn0gZnJvbSAnLi9qay9oZWxwZXInO1xuZXhwb3J0IGNvbnN0IHV0aWxzID0gdXRcbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0gY29tcHMiXX0=
;
require.config({
  "bundles": {}
});
