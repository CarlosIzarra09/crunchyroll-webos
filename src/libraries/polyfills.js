// Element.matches
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
}

// Element.closest
if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
        var el = this;
        if (!document.documentElement.contains(el)) return null;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement;
        } while (el !== null);
        return null;
    };
}

// Array.find
if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

// Array.includes
if( !Array.prototype.includes ) {
    Array.prototype.includes = function(search){
        return !!~this.indexOf(search);
    };
}

// Fetch
window.fetch || (window.fetch = function (e, n) {
    return n = n || {}, new Promise(function (t, s) {
        var r = new XMLHttpRequest,
            o = [],
            u = [],
            i = {},
            a = function () {
                return {
                    ok: 2 == (r.status / 100 | 0),
                    statusText: r.statusText,
                    status: r.status,
                    url: r.responseURL,
                    text: function () {
                        return Promise.resolve(r.responseText)
                    },
                    json: function () {
                        return Promise.resolve(r.responseText).then(JSON.parse)
                    },
                    blob: function () {
                        return Promise.resolve(new Blob([r.response]))
                    },
                    clone: a,
                    headers: {
                        keys: function () {
                            return o
                        },
                        entries: function () {
                            return u
                        },
                        get: function (e) {
                            return i[e.toLowerCase()]
                        },
                        has: function (e) {
                            return e.toLowerCase() in i
                        }
                    }
                }
            };
        for (var c in r.open(n.method || "get", e, !0), r.onload = function () {
            r.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm, function (e, n, t) {
                o.push(n = n.toLowerCase()), u.push([n, t]), i[n] = i[n] ? i[n] + "," + t : t
            }), t(a())
        }, r.onerror = s, r.withCredentials = "include" == n.credentials, n.headers) r.setRequestHeader(c, n.headers[c]);
        r.send(n.body || null)
    })
});