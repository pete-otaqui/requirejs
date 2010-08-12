/**
 * @license RequireJS text Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 * 
 * @todo sort out contexts in fetchCss()
 * 
 */
/*jslint regexp: false, nomen: false, plusplus: false */
/*global require: false, XMLHttpRequest: false, ActiveXObject: false */

//>>includeStart("useStrict", pragmas.useStrict);
"use strict";
//>>includeEnd("useStrict");

(function () {
    
    var idPrefix = 'requireCss',
        cssCount = 0,
        cssInFlight = [],
        cssTimeout = 10000,
        cssTagName = 'code',
        urlToClassNameRegExp = /[^a-zA-Z0-9]+/,
        urlToClassNameReplace = '';
        
    
    if (!require.hasCssOnLoad) {
        require.hasCssOnLoad = function() {
            //could be used to test for, essentially, ie or
            //opera which support link tag onload events
            return false;
        };
    }
    if (!require.hasCssSheetRules) {
        require.hasCssSheetRules = function() {
            //could be used to test for same-domain css
            //being loaded by mozilla or webkit browsers
            return false;
        };
    }
    
    if (!require.fetchCSS) {
        require.fetchCSS = function (url, callback, cssTest) {
            //Fetches a CSS file with a callback.  If the third parameter
            //is boolean true, a default magic test is assumed which makes
            //a div of classname 'url' have a z-index > 1000.  The third
            //parameter can also be a custom test function
            cssCount = cssCount+1;
            var css = {
                index: cssCount-1,
                id: idPrefix + cssCount,
                url: url,
                callback: callback,
                test: test,
                link: document.createElement('link'),
                loaded: false
            };
            css.link.type = 'text/css';
            css.link.rel = 'stylesheet';
            css.link.href = url;
            document.getElementsByTagName('head')[0].appendChild(css.link);
            
            var className = url.replace(urlToClassNameRegExp, urlToClassNameReplace);
            
            if ( typeof cssTest === 'string' ) {
                //custom className
                className = cssTest;
                cssTest = true;
            }
            
            if ( cssTest === true ) {
                if ( require.hasCssSheetRules() ) {
                    cssTest = function() {
                        return (css.link.sheet.cssRules);
                    };
                } else {
                    //magic test which expects a special '.myfilename{z-index:1000}' rule
                    //in the css file.  This could be added by the build.
                    var tag = document.createElement(cssTagName);
                
                    tag.id                 = css.id;
                    tag.className          = className;
                    tag.style.display      = 'block !important';
                    tag.style.position     = 'absolute !important';
                    tag.style.left         = '-1000px !important';
                    tag.style.top          = '-1000px !important';
                    tag.style.visibility   = 'hidden !important';
                
                    document.body.appendChild(cssTagName);
                    css.tag = tag;
                
                    cssTest = function() {
                        return (document.getElementById(tag.id).style.zIndex == "1000");
                    };
                }
            }
            
            
            if ( require.hasCssOnLoad() ) {
                css.link.onload = function() {
                    css.loaded = true;
                    css.link.onload = null;
                };
            } else if ( require.hasCssSheetRules() ) {
                //this is actually done above, but since it's browser
                //affected, I wanted something to point that out here
                //while this code is in flux.
            } else if ( cssTest ) {
                css.interval = setInterval(function() {
                    if (cssTest()) {
                        css.loaded = true;
                        clearInterval(css.interval);
                    }
                });
            } else if ( cssTest === false ) {
                //might be useful for folks who don't care in some cases
                //but want to keep the same patterns for loading all css
                css.loaded = true;
            } else {
                throw "No css loading mechanism available";
            }
            
            cssInFlight.push(css);
        };
    }

    require.plugin({
        prefix: "css",

        /**
         * This callback is prefix-specific, only gets called for this prefix
         */
        require: function (name, deps, callback, context) {
            //No-op, require never gets these text items, they are always
            //a dependency, see load for the action.
        },

        /**
         * Called when a new context is defined. Use this to store
         * context-specific info on it.
         */
        newContext: function (context) {
            require.mixin(context, {
                cssSheets: [],
                cssWaiting: []
            });
        },

        /**
         * Called when a dependency needs to be loaded.
         */
        load: function (name, contextName) {
            //Name has format: style!some.module.css
            
            /*
             * Do some magic!
             *
             *
             *
             *
            */
            
        },

        /**
         * Called when the dependencies of a module are checked.
         */
        checkDeps: function (name, deps, context) {
            //No-op, checkDeps never gets these text items, they are always
            //a dependency, see load for the action.
        },

        /**
         * Called to determine if a module is waiting to load.
         */
        isWaiting: function (context) {
            return !!context.cssWaiting.length;
        },

        /**
         * Called when all modules have been loaded.
         */
        orderDeps: function (context) {
            //Clear up state since further processing could
            //add more things to fetch.
            var i, dep, text, tWaitAry = context.cssWaiting;
            context.cssWaiting = [];
            for (i = 0; (dep = tWaitAry[i]); i++) {
                css = context.css[dep.key];
                context.defined[dep.name] = dep.strip ? require.textStrip(text) : text;
            }
        }
    });
}());
