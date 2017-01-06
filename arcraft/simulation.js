/**
 * Created by 秦晨 on 2016/12/29.
 */
var simulation = function () {
    //对象
    var flightBase = [ // 飞行基地
        {x: 120, y: 180, r: 15, color: "red"},
        {x: 90, y: 430, r: 15, color: "red"},
    ];
    var missileBase = [// 导弹基地
        {x: 440, y: 160, r: 15, color: "blue", islaunch: true},
        {x: 420, y: 370, r: 15, color: "blue", islaunch: true},
    ];
    var targetBase = [// 目标点
        {x: 430, y: 230, r: 15, color: "gray"},
        {x: 380, y: 430, r: 15, color: "gray"}
    ];
    var routes = [// 进攻路线
        {a: 0, b: 0},
        {a: 1, b: 0},
        {a: 1, b: 1}
    ];

    //模型
    var aircraftModel = new Array();//飞机模型
    var missileModel = new Array();//导弹模型
    var routeModel = new Array();//路线模型
    var rangeModel = new Array();//攻击范围模型
    var focusModel = new Array();//攻击点模型
    //参数
    var par = {
        aircraftSpeed: 5,//飞机速度 最小1 最大5
        aircraftCheckpoint: 50,//飞机波数 最小1
        aircraftNum: 30, //每一波飞机数量
        aircraftInterval: 2000, //每一波飞机间隔
        aircraftDodge: 0.2, // 干扰概率 最小0 最大1
        aircraftImg: new Image(),//飞机图片
        aircraftWidth: 20,
        aircraftHeight: 12,
        missileSpeed: 5, //导弹速度 最小3 最大8
        missileNum: 100000, // 导弹数量 最小 1
        missileInterval: 1, //导弹发射间隔 最小1
        missileR: 150,//导弹射程
        missileImg: new Image(),//导弹图片
        missileWidth: 10,
        missileHeight: 6
    };
    //全局变量
    var fix = {
        isAircraftImg: false,
        isMissileImg: false,
        routeWidth: 30, //路线宽度
        flight: 200,//速度参数
        BaseR: 15//基地半径
    };
    var canvas, ctx, framenum = 60, fra = 0, isrun = false;


    var bg = function () {
        this.cacheCanvas = document.createElement("canvas");
        this.cacheCtx = this.cacheCanvas.getContext("2d");
        this.cacheCanvas.width = canvas.offsetWidth;
        this.cacheCanvas.height = canvas.height;
        this.draw();
    };

    bg.prototype = {
        draw: function () {
            for (var i in flightBase) {  // 飞行基地
                var b = flightBase[i];
                this.circle(b.x, b.y, b.r, b.color);
            }

            for (var i in missileBase) {  // 导弹基地
                var b = missileBase[i];
                this.circle(b.x, b.y, b.r, b.color);
            }

            for (var i in targetBase) {  // 目标点
                var b = targetBase[i];
                this.circle(b.x, b.y, b.r, b.color);
            }

            for (var i in rangeModel) {
                var ran = rangeModel[i];
                for (var j in ran) {
                    var r = ran[j];
                    this.cacheCtx.beginPath();
                    this.cacheCtx.arc(r.x, r.y, par.missileR, r.o, r.o1);
                    this.cacheCtx.strokeStyle = '#16C4CB';
                    this.cacheCtx.stroke();
                    this.cacheCtx.closePath();
                }
            }

            for (var i in routeModel) {
                var rout = routeModel[i];
                this.cacheCtx.beginPath();
                for (var j in rout) {
                    var route = rout[j];
                    var x = route.x;
                    var y = route.y;
                    this.cacheCtx.lineTo(x, y);
                }
                this.cacheCtx.closePath();
                this.cacheCtx.stroke();
            }

        },

        circle: function (x, y, r, color) {
            this.cacheCtx.beginPath();
            this.cacheCtx.arc(x, y, r, 0, 360, false);
            this.cacheCtx.fillStyle = color;//填充颜色,默认是黑色
            this.cacheCtx.fill();//画实心圆
            this.cacheCtx.closePath();
        },

        paint: function (ctx) {
            ctx.drawImage(this.cacheCanvas, 0, 0);
        }

    };

    var aircraft = function (n) {
        this.route = routeModel[n];
        this.i = 0;
        this.width = par.aircraftWidth;
        this.height = par.aircraftHeight;
        this.cacheCanvas = document.createElement("canvas");
        this.cacheCtx = this.cacheCanvas.getContext("2d");
        this.cacheCanvas.width = this.width;
        this.cacheCanvas.height = this.height;
        this.cacheCtx.drawImage(par.aircraftImg, 0, 0, this.width, this.height);
        this.isbom = false;
    };

    aircraft.prototype = {
        setOut: false,

        move: function () {
            if (this.i == 0) {

            }
            if (this.i >= this.route.length - 10) {
                remove(this,aircraftModel);
                return;
            }
            this.x = this.route[this.i].x;
            this.y = this.route[this.i].y;
            this.o = this.route[this.i].o;
            this.i++;
            this.paint(ctx);
        },

        paint: function (ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.o);
            ctx.drawImage(this.cacheCanvas, -this.width / 2, -this.height / 2);
            ctx.restore();
        }

    };

    var misslie = function (type, x1, y1) {
        this.width = par.missileWidth;
        this.height = par.missileHeight;
        this.cacheCanvas = document.createElement("canvas");
        this.cacheCtx = this.cacheCanvas.getContext("2d");
        this.cacheCanvas.width = this.width;
        this.cacheCanvas.height = this.height;
        this.cacheCtx.drawImage(par.missileImg, 0, 0, this.width, this.height);
        var x = missileBase[type].x;
        var y = missileBase[type].y;
        var x2, y2, o;
        o = getSlope(x, y, x1, y1);
        if (y - y1 < 0 && x - x1 < 0 || x - x1 < 0)
            o += Math.PI;
        x2 = par.missileSpeed * Math.cos(o);
        y2 = par.missileSpeed * Math.sin(o);
        this.x = x;
        this.y = y;
        this.x1 = x2;
        this.y1 = y2;
        this.o = o;
        this.x2 = x;
        this.y2 = y;
        this.type = type
    };

    misslie.prototype = {
        move: function () {
            if(!isRange(this.x,this.y,this.x2,this.y2,par.missileR)){
                remove(this,missileModel[this.type]);
                return;
            }
            this.x = this.x - this.x1;
            this.y = this.y - this.y1;
            this.paint(ctx);
        },

        paint: function (ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.o);
            ctx.drawImage(this.cacheCanvas, -this.width / 2, -this.height / 2);
            ctx.restore();
        }
    };

    var aircraftBaseController = function () {
        this.time = par.aircraftInterval;
        this.checkpoint = par.aircraftCheckpoint;
        this.num = par.aircraftNum;
        this.j = new Array();
        var _this = this;

        var controller = {
            start: function () {
                _this.i = 0;
                this.point();
            },

            point: function () {
                var n = getZ(Math.random() * routes.length * 10) % routes.length;
                _this.j[_this.i] = 0;
                this.numb(n, _this.i);
                _this.i++;
                setTimeout(function () {
                    if (_this.i < _this.checkpoint) {
                        controller.point();
                    }
                }, _this.time);
            },

            numb: function (n, i) {
                aircraftModel.push(new aircraft(n));
                _this.j[i] = _this.j[i] + 1;
                setTimeout(function () {
                    if (_this.j[i] < _this.num) {
                        controller.numb(n, i);
                    }
                }, 100)
            }
        };

        return controller;
    };

    var missileBaseController = function () {
        this.r = par.missileR;

        var controller = {
            attack: function () {
                for (var i = 0; i < missileBase.length; i++) {
                    var miss = missileBase[i];
                    for (var j = 0; j < aircraftModel.length; j++) {
                        var air = aircraftModel[j];
                        if (missileModel[i].length < par.missileNum && isRange(miss.x, miss.y, air.x, air.y, par.missileR)) {
                            missileModel[i].push(new misslie(i, air.x, air.y));
                        }
                    }
                }
            }
        };

        return controller;

    };

    function listen() {
        for (var i in aircraftModel) {
            var air = aircraftModel[i];
            for (var i in targetBase) {
                var tar = targetBase[i];
                if (!air.isbom && isRange(air.x, air.y, tar.x, tar.y, 15)) {
                    air.isbom = true;
                    aircraftModel[i].isbom = true;

                }
            }
            for (var j in missileModel) {
                for(var k in missileModel[j]){
                    var mis = missileModel[j][k];

                    if(isRange(mis.x,mis.y,air.x,air.y,5)){
                        remove(air,aircraftModel);
                        remove(mis,missileModel[j]);
                    }
                }
            }
        }
    }

    function remove(t,list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i] == t) {
                list.splice(i, 1);
            }
        }
    }

    function initData() {
        initImg();//图片初始化
        initRoute();//路线初始化
        isrun = true;
    }

    function initRoute() {
        for (var i in missileBase) {
            missileModel[i] = new Array();
        }
        for (var i in missileBase) {
            var base = missileBase[i], rage = new Array();
            for (var j = 0; j < 180; j++) {
                var o = (j * 9) / 360 * Math.PI;
                var o1 = (j * 9 + 5) / 360 * Math.PI;
                var ra = {x: base.x, y: base.y, o: o, o1: o1};
                rage[j] = ra;
            }
            rangeModel[i] = rage;
        }
        for (var rou in routes) {
            var coor = getCoordinate(routes[rou]);
            var o = getSlope(coor.x, coor.y, coor.x1, coor.y1), rout = new Array();
            var w = coor.h, h = fix.routeWidth;
            var t = par.aircraftSpeed / w;
            var x = coor.x0, y = coor.y0;
            w = Math.round(w);
            o = Math.round(o * 100) / 100;
            var x1 = x - w * Math.cos(0) * Math.cos(o) + h * Math.sin(0) * Math.sin(o);
            var y1 = y - w * Math.cos(0) * Math.sin(o) - h * Math.sin(0) * Math.cos(o);
            for (var i = 0, j = 0; i < 2 * Math.PI; i += t, j++) {
                var x2 = x - w * Math.cos(i + t) * Math.cos(o) + h * Math.sin(i + t) * Math.sin(o);
                var y2 = y - w * Math.cos(i + t) * Math.sin(o) - h * Math.sin(i + t) * Math.cos(o);
                var o1 = getSlope(x1, y1, x2, y2);
                if (y2 - y1 < 0 && x2 - x1 < 0 || x2 - x1 < 0) {
                    o1 += 1 * Math.PI;
                }
                x1 = x2;
                y1 = y2;
                rout[j] = {x: x2, y: y2, o: o1}
            }
            routeModel[rou] = rout;
        }

        for (var i in missileBase) {
            var misBase = missileBase[i], focu = new Array();
            var x = misBase.x;
            var y = misBase.y;
            for (var j in routeModel) {
                var rout = routeModel[j], fo = new Array();
                for (var k in rout) {
                    var ro = rout[k];
                    var x1 = ro.x;
                    var y1 = ro.y;
                    var h = Math.sqrt((x + x1) * (x + x1) + (y + y1) * (y + y1));
                    if (h < par.missileR) {
                        var t = par.missileSpeed;
                        fo[k] = {x: x1, y: y1, t: t};
                    }
                }
                focu[j] = fo;
            }
            focusModel[i] = focu;
        }
    }

    function getSlope(x, y, x1, y1) {
        var o, a, b;
        a = (y - y1);
        b = (x - x1);
        if (b == 0)
            if (y > y1) {
                o = Math.PI / 2;
            }
            else {
                o = -Math.PI / 2;
            }
        else
            o = Math.atan(a / b);
        return o;
    }

    function getCoordinate(rout) {
        var a = flightBase[rout.a];
        var b = targetBase[rout.b];
        var h = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)) / 2;
        var x0 = (a.x + b.x) / 2;
        var y0 = (a.y + b.y) / 2;
        return {
            x: a.x, y: a.y, x1: b.x, y1: b.y, x0: x0, y0: y0, h: h
        }
    }

    function initImg() {
        par.aircraftImg.src = "images/aircraft.png";
        par.missileImg.src = "images/missile.png";
        par.aircraftImg.onload = function () {
            fix.isAircraftImg = true;
        };
        par.missileImg.onload = function () {
            fix.isMissileImg = true;
        };
    }

    function isRange(x, y, x1, y1, r) {
        return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1)) <= r;
    }

    function getZ(num) {
        var rounded;
        rounded = (0.5 + num) | 0;
        // A double bitwise not.
        rounded = ~~(0.5 + num);
        // Finally, a left bitwise shift.
        rounded = (0.5 + num) << 0;

        return rounded;
    }

    var Game = {
        init: function () {
            canvas = document.getElementById("canvas");
            ctx = canvas.getContext("2d");
            initData();
            bg1 = new bg();

        },

        update: function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            bg1.paint(ctx);
            for (var i = 0; i < aircraftModel.length; i++) {
                aircraftModel[i].move();
            }
            for (var i in missileModel) {
                for (var j in missileModel[i]) {
                    missileModel[i][j].move();
                }
            }
            miscontroller.attack();
            listen();
        },

        loop: function () {
            var _this = this;
            if (isrun)
                this.update();
            RAF(function () {
                _this.loop();
            })
        },

        start: function () {
            var _this = this;
            this.init();
            setTimeout(function () {
                _this.loading();
            }, 1000);
        },

        loading: function () {
            var _this = this;
            if (fix.isAircraftImg) {
                var aircontroller = new aircraftBaseController();
                aircontroller.start();
                miscontroller = new missileBaseController();
                this.loop();
            } else {
                RAF(function () {
                    _this.loading();
                })
            }
        }
    };

    window.RAF = (function () {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    return Game;

}();