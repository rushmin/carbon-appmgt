var cache = false;

var engine = caramel.engine('handlebars', (function () {
    return {
        partials: function (Handlebars) {
            var theme = caramel.theme();
            var partials = function (file) {
                (function register(prefix, file) {
                    var i, length, name, files;
                    if (file.isDirectory()) {
                        files = file.listFiles();
                        length = files.length;
                        for (i = 0; i < length; i++) {
                            file = files[i];
                            register(prefix ? prefix + '.' + file.getName() : file.getName(), file);
                        }
                    } else {
                        name = file.getName();
                        if (name.substring(name.length - 4) !== '.hbs') {
                            return;
                        }
                        file.open('r');
                        Handlebars.registerPartial(prefix.substring(0, prefix.length - 4), file.readAll());
                        file.close();
                    }
                })('', file);
            };
            //TODO : we don't need to register all partials in the themes dir.
            //Rather register only not overridden partials
            partials(new File(theme.__proto__.resolve.call(theme, 'partials')));
            partials(new File(theme.resolve('partials')));


            Handlebars.registerHelper('pagesloop', function(n, block) {
                var accum = '';
                for(var i = 1; i <= n; ++i)
                    accum += block.fn(i);
                return accum;
            });

            Handlebars.registerHelper('assetRating', function(n) {
                var html = '<span class="starRating">';
                var id = Math.random().toString(36).substring(7);
                for(var i = 5; i >= 1; --i){
                    var checked = (i == n) ? "checked" : "";
                    html += '<input name= "' + id + '" id= "' + id + '" type="radio" name="rating" value="' + i + '" disabled ' + checked + '>';
                    html += '<label for="' + id + i + '">' + i + '</label>';
                }

                html += "<span>";

                return html;
            });


            Handlebars.registerHelper('iconImage', function(imageName) {
                if(imageName == 'android'){
                    return 'fw-android fw-background-green';
                }else if(imageName == 'ios'){
                    return 'fw-apple fw-background-black';
                }else if(imageName == 'webapp'){
                    return 'fw-web-app fw-background-blue';
                }
            });

            Handlebars.registerHelper('iconImageType', function(imageName) {
                if(imageName == 'enterprise'){
                    return 'fw-enterprise-app fw-background-gray';
                }else if(imageName == 'public'){
                    return 'fw-public-app fw-background-gray';
                }else if(imageName == 'webapp'){
                    return 'fw-webclip fw-background-gray';
                }
            });



            Handlebars.registerHelper('compare', function (lvalue, rvalue, options) {

                if (arguments.length < 3)
                    throw new Error("Handlerbars Helper 'compare' needs 2 parameters");

                operator = options.hash.operator || "==";

                var operators = {
                    '==': function (l, r) {
                        return l == r;
                    },
                    '===': function (l, r) {
                        return l === r;
                    },
                    '!=': function (l, r) {
                        return l != r;
                    },
                    '<': function (l, r) {
                        return l < r;
                    },
                    '>': function (l, r) {
                        return l > r;
                    },
                    '<=': function (l, r) {
                        return l <= r;
                    },
                    '>=': function (l, r) {
                        return l >= r;
                    },
                    'typeof': function (l, r) {
                        return typeof l == r;
                    }
                }

                if (!operators[operator])
                    throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);

                var result = operators[operator](lvalue, rvalue);

                if (result) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }

            });


            Handlebars.registerHelper("math", function(lvalue, operator, rvalue, options) {
                lvalue = parseFloat(lvalue);
                rvalue = parseFloat(rvalue);

                return {
                    "+": lvalue + rvalue,
                    "-": lvalue - rvalue,
                    "*": lvalue * rvalue,
                    "/": lvalue / rvalue,
                    "%": lvalue % rvalue
                }[operator];
            });


            Handlebars.registerHelper('dyn', function (options) {
                var asset = options.hash.asset,
                    resolve = function (path) {
                        var p,
                            store = require('/modules/store.js');
                        if (asset) {
                            p = store.ASSETS_EXT_PATH + asset + '/themes/' + theme.name + '/' + path;
                            if (new File(p).isExists()) {
                                return p;
                            }
                        }
                        return theme.__proto__.resolve.call(theme, path);
                    };
                partials(new File(resolve('partials')));
                return options.fn(this);
            });
        },
        render: function (data, meta) {
            if (request.getParameter('debug') == '1') {
                response.addHeader("Content-Type", "application/json");
                print(stringify(data));
            } else {
                this.__proto__.render.call(this, data, meta);
            }
        },
        globals: function (data, meta) {
            var store = require('/modules/store.js'),
                user = require('store').server.current(meta.session);
            return 'var store = ' + stringify({
                user: user ? user.username : null
            });
        }
    };
}()));

var resolve = function (path) {
    var p,
        store = require('/modules/store.js'),
        asset = store.currentAsset();
    if (asset) {
        p = store.ASSETS_EXT_PATH + asset + '/themes/' + this.name + '/' + path;
        if (new File(p).isExists()) {
            return p;
        }
    }
    return this.__proto__.resolve.call(this, path);
};