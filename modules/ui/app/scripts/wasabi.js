/*global Promise:false*/
'use strict';
// Wasabi module
// Supports easy use of the Wasabi A/B Testing service from JavaScript.
//
// TODO: May need to add es6-promise to package.json to support Promise in IE.
//
var WASABI = (function (wasabi) {

    var assignmentCache = {};

    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            var buf = new Uint8Array(16);
            crypto.getRandomValues(buf);
            // RFC 4122 version 4
            buf[6] = (buf[6] & 0x0f) | 0x40;
            buf[8] = (buf[8] & 0x3f) | 0x80;
            var hex = [];
            for (var i = 0; i < 256; i++) {
                hex[i] = (i + 0x100).toString(16).substr(1);
            }
            return (
                hex[buf[0]] + hex[buf[1]] + hex[buf[2]] + hex[buf[3]] + '-' +
                hex[buf[4]] + hex[buf[5]] + '-' +
                hex[buf[6]] + hex[buf[7]] + '-' +
                hex[buf[8]] + hex[buf[9]] + '-' +
                hex[buf[10]] + hex[buf[11]] + hex[buf[12]] + hex[buf[13]] + hex[buf[14]] + hex[buf[15]]
            );
        }

        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    function getCookie(name) {
        if (typeof document === 'undefined' || !document.cookie) {
            return null;
        }
        var value = '; ' + document.cookie;
        var parts = value.split('; ' + name + '=');
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    function setCookie(name, value, days) {
        if (typeof document === 'undefined') {
            return;
        }
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
    }

    function getOrCreateUserId() {
        var existing = getCookie('wasabi_uid');
        if (existing) {
            return existing;
        }
        var uid = generateUUID();
        setCookie('wasabi_uid', uid, 365);
        return uid;
    }

    /*
      This allows things that should be saved across usage to be defined once, such as applicationName.
      For example, you can call this once in your app:
        WASABI.setOptions({
            'applicationName': 'CTG',
            'experimentName': 'test_feedback_link',
            'protocol': 'http',
            'host': 'localhost:8080'
        });
      From then on, you don't need to provide those options in other calls.
      These can also be set and retrieved using setOptions() and getOptions().
     */
    wasabi.wasabiOptions = (typeof wasabi.getOptions === 'function' ? wasabi.getOptions() : {});

    var buildURL = function (path, options) {
        var url = '';
        var defaults = Object.assign({
            protocol: 'http',
            host: 'localhost:8080'
        }, options || {});

        url += defaults.protocol + '://';
        url += defaults.host;

        url += path.replace(/%\w+%/g, function (all) {
            var replaceStr = all.replace(/%/g, '');
            return (replaceStr in defaults ? defaults[replaceStr] : replaceStr);
        });
        return url;
    };

    var doWasabiOperation = function (urlTemplate, funcName, requiredOptions, options, postBody) {
        var opts = Object.assign({}, wasabi.wasabiOptions || {}, options || {});

        // Auto userID injection (cookie-based)
        if (!opts.userID) {
            opts.userID = getOrCreateUserId();
        }

        for (var i = 0; i < requiredOptions.length; i++) {
            if (!opts.hasOwnProperty(requiredOptions[i])) {
                throw new Error('Missing parameter ' + requiredOptions[i] + ' for ' + funcName);
            }
        }

        var url = buildURL(urlTemplate, opts);

        var fetchOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (postBody) {
            fetchOptions.method = 'POST';
            fetchOptions.body = postBody;
        }

        return new Promise(function (resolve, reject) {
            // Assignment caching for plain getAssignment (no segmentation)
            if (funcName === 'getAssignment' && !postBody) {
                var cacheKey = String(opts.applicationName) + '|' +
                    String(opts.experimentName) + '|' +
                    String(opts.userID);
                if (assignmentCache.hasOwnProperty(cacheKey)) {
                    resolve(assignmentCache[cacheKey]);
                    return;
                }
                fetch(url, fetchOptions)
                    .then(function (response) {
                        if (response.status === 201 || response.status === 204) {
                            resolve(null);
                            return;
                        }
                        if (!response.ok) {
                            throw new Error('Request failed with status ' + response.status);
                        }
                        return response.text().then(function (text) {
                            if (!text) {
                                resolve(null);
                                return;
                            }
                            var data;
                            try {
                                data = JSON.parse(text);
                            } catch (e) {
                                data = text;
                            }
                            assignmentCache[cacheKey] = data;
                            resolve(data);
                        });
                    })
                    .catch(function (err) {
                        reject(err);
                    });
                return;
            }

            fetch(url, fetchOptions)
                .then(function (response) {
                    // jQuery.ajax used to treat 201+empty as error; keep same success semantics
                    if (response.status === 201 || response.status === 204) {
                        resolve(null);
                        return;
                    }
                    if (!response.ok) {
                        throw new Error('Request failed with status ' + response.status);
                    }
                    return response.text().then(function (text) {
                        if (!text) {
                            resolve(null);
                            return;
                        }
                        var data;
                        try {
                            data = JSON.parse(text);
                        } catch (e) {
                            data = text;
                        }
                        resolve(data);
                    });
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    };

    /*
    Assuming you have called wasabiOptions with applicationName, experimentName, protocol and host, an example use
    of this function would be:
        WASABI.getAssignment({
            'userID': 'myid-1'
        }).then(
            function(response) {
                console.log('getAssignment: success');
                console.log(JSON.stringify(response));
                // This object will include the assignment made and the status, which might tell you the experiment
                // has not been started, etc.
            },
            function(error) {
                console.log('getAssignment: error');
            }
        );
     */
    wasabi.getAssignment = function (options) {
        return doWasabiOperation(
            '/api/v1/assignments/applications/%applicationName%/experiments/%experimentName%/users/%userID%',
            'getAssignment',
            ['applicationName', 'experimentName', 'userID'],
            options
        );
    };

    /*
    Example:
        WASABI.getAssignmentWithSegmentation(
        '{\
            "profile": {\
                "platform": "mac"\
            }\
        }',
        {
            'userID': 'myid-2'
        }).then(
            function(response) {
                console.log('getAssignmentWithSegmentation: success');
                console.log(JSON.stringify(response));
            },
            function(error) {
                console.log('getAssignmentWithSegmentation: error');
            }
        );
    Where the "profile" contains the attributes to be plugged into your Segmentation Rule.
     */
    wasabi.getAssignmentWithSegmentation = function (profile, options) {
        return doWasabiOperation(
            '/api/v1/assignments/applications/%applicationName%/experiments/%experimentName%/users/%userID%',
            'getAssignmentWithSegmentation',
            ['applicationName', 'experimentName', 'userID'],
            options,
            profile
        );
    };

    /*
    Example:
        WASABI.getPageAssignment({
            'userID': 'myid-3',
            'pageName': 'test_page'
        }).then(
            function(response) {
                console.log('getPageAssignment: success');
                console.log(JSON.stringify(response));
            },
            function(error) {
                console.log('getPageAssignment: error');
            }
        );
     */
    wasabi.getPageAssignment = function (options) {
        return doWasabiOperation(
            '/api/v1/assignments/applications/%applicationName%/pages/%pageName%/users/%userID%',
            'getPageAssignment',
            ['applicationName', 'pageName', 'userID'],
            options
        );
    };

    /*
    Example:
        WASABI.getPageAssignmentWithSegmentation(
        '{\
            "profile": {\
                "platform": "windows"\
            }\
        }',
        {
            'userID': 'myid-4',
            'pageName': 'test_page'
        }).then(
            function(response) {
                console.log('getPageAssignmentWithSegmentation: success');
                console.log(JSON.stringify(response));
            },
            function(error) {
                console.log('getPageAssignmentWithSegmentation: error');
            }
        );
     */
    wasabi.getPageAssignmentWithSegmentation = function (profile, options) {
        return doWasabiOperation(
            '/api/v1/assignments/applications/%applicationName%/pages/%pageName%/users/%userID%',
            'getPageAssignmentWithSegmentation',
            ['applicationName', 'pageName', 'userID'],
            options,
            profile
        );
    };

    /*
    Example:
        WASABI.postImpression({
            'userID': 'myid-2'
        }).then(
            function(response) {
                console.log('postImpression: success');
                console.log(JSON.stringify(response));
            },
            function(error) {
                console.log('postImpression: error');
            }
        );
     */
    wasabi.postImpression = function (options) {
        var eventJSON = '{"events":[{"name":"IMPRESSION"}]}';
        return doWasabiOperation(
            '/api/v1/events/applications/%applicationName%/experiments/%experimentName%/users/%userID%',
            'postImpression',
            ['applicationName', 'experimentName', 'userID'],
            options,
            eventJSON
        );
    };

    /*
    Example:
        WASABI.postAction(
        'MY_EVENT',
        '{\\"more things\\":\\"more stuff\\"}',
        {
            'userID': 'myid-2'
        }).then(
            function(response) {
                console.log('postAction: success');
                console.log(JSON.stringify(response));
            },
            function(error) {
                console.log('postAction: error');
            }
        );
    Where 'MY_EVENT' is the action name, '{"more things": "more stuff"} is an OPTIONAL JSON object (suitably escaped
    above) that is saved with the action for this user and can be retrieved from the data.  If you don't need to pass
    the eventPayload object, pass null.
     */
    wasabi.postAction = function (eventName, eventPayload, options) {
        var eventObject = {
            'events': [
                {
                    'name': eventName
                }
            ]
        };
        if (eventPayload) {
            eventObject.events[0].payload = eventPayload;
        }

        return doWasabiOperation(
            '/api/v1/events/applications/%applicationName%/experiments/%experimentName%/users/%userID%',
            'postAction',
            ['applicationName', 'experimentName', 'userID'],
            options,
            JSON.stringify(eventObject)
        );
    };

    /*
    Allows the caller to set the values used in each call to Wasabi, for example, the applicationName.  The "options"
    object will have fields for those values.
     */
    wasabi.setOptions = function (options) {
        wasabi.wasabiOptions = options || {};
    };

    /*
    Allows the caller to retrieve the values used in each call to this object.
     */
    wasabi.getOptions = function () {
        return wasabi.wasabiOptions;
    };

    // Shorthand helpers using stored config and auto userId.
    // These are new but built on top of the existing public API.
    wasabi.assign = function (experimentName) {
        if (!wasabi.wasabiOptions || !wasabi.wasabiOptions.applicationName) {
            throw new Error('applicationName must be set via WASABI.setOptions before calling WASABI.assign');
        }
        return wasabi.getAssignment({
            experimentName: experimentName
        });
    };

    wasabi.impression = function (experimentName) {
        if (!wasabi.wasabiOptions || !wasabi.wasabiOptions.applicationName) {
            throw new Error('applicationName must be set via WASABI.setOptions before calling WASABI.impression');
        }
        return wasabi.postImpression({
            experimentName: experimentName
        });
    };

    wasabi.track = function (experimentName, eventName) {
        if (!wasabi.wasabiOptions || !wasabi.wasabiOptions.applicationName) {
            throw new Error('applicationName must be set via WASABI.setOptions before calling WASABI.track');
        }
        return wasabi.postAction(eventName, null, {
            experimentName: experimentName
        });
    };

    function autoInit() {
        if (typeof document === 'undefined') {
            return;
        }

        var options = wasabi.getOptions ? wasabi.getOptions() : wasabi.wasabiOptions || {};

        // Variant containers
        var experimentNodes = document.querySelectorAll('[data-wasabi-experiment]');
        Array.prototype.forEach.call(experimentNodes, function (node) {
            var experimentName = node.getAttribute('data-wasabi-experiment');
            if (!experimentName) {
                return;
            }

            wasabi.getAssignment({
                experimentName: experimentName
            }).then(function (response) {
                var assignment = response && response.assignment;
                if (!assignment) {
                    // Fallback: show all variants
                    var allChildren = node.querySelectorAll('[data-wasabi-variant]');
                    Array.prototype.forEach.call(allChildren, function (child) {
                        if (child.classList) {
                            child.classList.remove('wasabi-hidden');
                        }
                    });
                    return;
                }

                var bucketLabel = assignment.bucketLabel;
                var variants = node.querySelectorAll('[data-wasabi-variant]');
                Array.prototype.forEach.call(variants, function (child) {
                    var variantName = child.getAttribute('data-wasabi-variant');
                    if (variantName === bucketLabel) {
                        if (child.classList) {
                            child.classList.remove('wasabi-hidden');
                        }
                    } else {
                        if (child.classList) {
                            child.classList.add('wasabi-hidden');
                        }
                    }
                });

                wasabi.postImpression({
                    experimentName: experimentName
                });
            }).catch(function () {
                var children = node.querySelectorAll('[data-wasabi-variant]');
                Array.prototype.forEach.call(children, function (child) {
                    if (child.classList) {
                        child.classList.remove('wasabi-hidden');
                    }
                });
            });
        });

        // Tracking elements
        var trackNodes = document.querySelectorAll('[data-wasabi-track]');
        Array.prototype.forEach.call(trackNodes, function (el) {
            var spec = el.getAttribute('data-wasabi-track');
            if (!spec) {
                return;
            }
            // Format: Experiment:Event
            var parts = spec.split(':');
            if (parts.length !== 2) {
                return;
            }
            var expName = parts[0];
            var evtName = parts[1];

            el.addEventListener('click', function () {
                wasabi.postAction(evtName, null, {
                    experimentName: expName
                });
            });
        });
    }

    wasabi.autoInit = autoInit;

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', function () {
            if (wasabi.wasabiOptions && wasabi.wasabiOptions.applicationName) {
                autoInit();
            }
        });
    }

    return wasabi;

}(WASABI || {}));