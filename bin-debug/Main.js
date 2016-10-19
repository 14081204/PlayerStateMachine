//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-2015, Egret Technology Inc.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var Main = (function (_super) {
    __extends(Main, _super);
    function Main() {
        _super.call(this);
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }
    var d = __define,c=Main,p=c.prototype;
    p.onAddToStage = function (event) {
        //设置加载进度界面
        //Config to load process interface
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);
        //初始化Resource资源加载库
        //initiate Resource loading library
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    };
    /**
     * 配置文件加载完成,开始预加载preload资源组。
     * configuration file loading is completed, start to pre-load the preload resource group
     */
    p.onConfigComplete = function (event) {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
        RES.loadGroup("preload");
    };
    /**
     * preload资源组加载完成
     * Preload resource group is loaded
     */
    p.onResourceLoadComplete = function (event) {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
            this.createGameScene();
        }
    };
    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    p.onItemLoadError = function (event) {
        console.warn("Url:" + event.resItem.url + " has failed to load");
    };
    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    p.onResourceLoadError = function (event) {
        //TODO
        console.warn("Group:" + event.groupName + " has failed to load");
        //忽略加载失败的项目
        //Ignore the loading failed projects
        this.onResourceLoadComplete(event);
    };
    /**
     * preload资源组加载进度
     * Loading process of preload resource group
     */
    p.onResourceProgress = function (event) {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    };
    /**
     * 创建游戏场景
     * Create a game scene
     */
    p.createGameScene = function () {
        var sky = this.createBitmapByName("background2_jpg");
        this.addChild(sky);
        var stageW = this.stage.stageWidth;
        var stageH = this.stage.stageHeight;
        sky.width = stageW;
        sky.height = stageH;
        this.player = new Player();
        this.addChild(this.player);
        this.player.x = stageW / 2;
        this.player.y = stageH / 2;
        this.player.Idle();
        this.touchEnabled = true;
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.Moveby, this);
    };
    p.Moveby = function (evt) {
        this.player.Move(evt.stageX, evt.stageY);
    };
    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    p.createBitmapByName = function (name) {
        var result = new egret.Bitmap();
        var texture = RES.getRes(name);
        result.texture = texture;
        return result;
    };
    return Main;
}(egret.DisplayObjectContainer));
egret.registerClass(Main,'Main');
var StateMachine = (function () {
    function StateMachine() {
    }
    var d = __define,c=StateMachine,p=c.prototype;
    p.setState = function (s) {
        if (this._currentState != null) {
            this._currentState.onExit();
        }
        this._currentState = s;
        this._currentState.onEnter();
    };
    return StateMachine;
}());
egret.registerClass(StateMachine,'StateMachine');
var MoveState = (function () {
    function MoveState(x, y, player) {
        this.PlayerPositionx = x;
        this.PlayerPositiony = y;
        this.player = player;
    }
    var d = __define,c=MoveState,p=c.prototype;
    p.onEnter = function () {
        var _this = this;
        this.player.Modle++; //使用行走序列
        var positionx = this.PlayerPositionx - this.player.x; //计算坐标
        var positiony = this.PlayerPositiony - this.player.y;
        if (positionx > 0) {
            this.player.scaleX = 1;
        }
        else {
            this.player.scaleX = -1; //水平翻转
        }
        var distance = Math.sqrt(positionx * positionx + positiony * positiony);
        var time = distance / this.player.MoveSpeed; //行走时间
        this.timer = new egret.Timer(50, time);
        this.LeastTime = time;
        this.timer.addEventListener(egret.TimerEvent.TIMER, function () {
            _this.player.x = _this.player.x + positionx / time;
            _this.player.y = _this.player.y + positiony / time;
            _this.LeastTime--;
            if (_this.LeastTime < 1) {
                _this.timer.stop();
                if (_this.LeastTime > 0) {
                    _this.player.Idle();
                }
            }
        }, this);
        this.timer.start();
        this.player.PlayerAni(this.player.MoveAni);
    };
    p.onExit = function () {
    };
    return MoveState;
}());
egret.registerClass(MoveState,'MoveState',["State"]);
var IdleState = (function () {
    function IdleState(player) {
        this.player = player;
    }
    var d = __define,c=IdleState,p=c.prototype;
    p.onEnter = function () {
        this.player.Modle = 0;
        this.player.PlayerAni(this.player.IdleAni);
    };
    p.onExit = function () {
    };
    return IdleState;
}());
egret.registerClass(IdleState,'IdleState',["State"]);
var Player = (function (_super) {
    __extends(Player, _super);
    function Player() {
        _super.call(this);
        this.Mystate = new StateMachine;
        this.MoveSpeed = 20;
        this.Modle = 0; //初始站立
        this.IdleAni = new Array();
        this.MoveAni = new Array();
        this.Initial = this.createBitmapByName("stand_0001_png");
        this.addChild(this.Initial);
        this.LoadAni();
        this.anchorOffsetX = this.Initial.width / 2;
        this.anchorOffsetY = this.Initial.height / 2;
    }
    var d = __define,c=Player,p=c.prototype;
    p.createBitmapByName = function (name) {
        var result = new egret.Bitmap();
        var texture = RES.getRes(name);
        result.texture = texture;
        return result;
    };
    p.LoadAni = function () {
        var texture = RES.getRes("stand_0001_png");
        this.IdleAni.push(texture);
        texture = RES.getRes("stand_0002_png");
        this.IdleAni.push(texture);
        texture = RES.getRes("stand_0003_png");
        this.IdleAni.push(texture);
        texture = RES.getRes("stand_0004_png");
        this.IdleAni.push(texture);
        texture = RES.getRes("stand_0005_png");
        this.IdleAni.push(texture);
        texture = RES.getRes("stand_0006_png");
        this.IdleAni.push(texture);
        texture = RES.getRes("stand_0007_png");
        this.IdleAni.push(texture);
        texture = RES.getRes("stand_0008_png");
        this.IdleAni.push(texture);
        texture = RES.getRes("166-1_png");
        this.MoveAni.push(texture);
        texture = RES.getRes("166-2_png");
        this.MoveAni.push(texture);
        texture = RES.getRes("166-3_png");
        this.MoveAni.push(texture);
        texture = RES.getRes("166-4_png");
        this.MoveAni.push(texture);
        texture = RES.getRes("166-5_png");
        this.MoveAni.push(texture);
        texture = RES.getRes("166-6_png");
        this.MoveAni.push(texture);
        texture = RES.getRes("166-7_png");
        this.MoveAni.push(texture);
        texture = RES.getRes("166-8_png");
        this.MoveAni.push(texture);
    };
    p.PlayerAni = function (Ani) {
        var count = 0;
        var Photo = this.Initial;
        var modle = this.Modle;
        var timer = new egret.Timer(125, 0);
        timer.addEventListener(egret.TimerEvent.TIMER, Play, this);
        timer.start();
        function Play() {
            Photo.texture = Ani[count];
            if (count < Ani.length - 1) {
                count++;
            }
            else {
                count = 0;
            }
            if (this.Modle != modle) {
                timer.stop();
            }
        }
    };
    p.Move = function (x, y) {
        var movestate = new MoveState(x, y, this);
        this.Mystate.setState(movestate);
    };
    p.Idle = function () {
        var idlestate = new IdleState(this);
        this.Mystate.setState(idlestate);
    };
    return Player;
}(egret.DisplayObjectContainer));
egret.registerClass(Player,'Player');
//# sourceMappingURL=Main.js.map