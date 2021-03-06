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

class Main extends egret.DisplayObjectContainer {

    /**
     * 加载进度界面
     * Process interface loading
     */
    private loadingView:LoadingUI;
    private player: Player;

    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }

    private onAddToStage(event:egret.Event) {
        //设置加载进度界面
        //Config to load process interface
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);

        //初始化Resource资源加载库
        //initiate Resource loading library
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    }

    /**
     * 配置文件加载完成,开始预加载preload资源组。
     * configuration file loading is completed, start to pre-load the preload resource group
     */
    private onConfigComplete(event:RES.ResourceEvent):void {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
        RES.loadGroup("preload");
    }

    /**
     * preload资源组加载完成
     * Preload resource group is loaded
     */
    private onResourceLoadComplete(event:RES.ResourceEvent):void {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
            this.createGameScene();
        }
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onItemLoadError(event:RES.ResourceEvent):void {
        console.warn("Url:" + event.resItem.url + " has failed to load");
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onResourceLoadError(event:RES.ResourceEvent):void {
        //TODO
        console.warn("Group:" + event.groupName + " has failed to load");
        //忽略加载失败的项目
        //Ignore the loading failed projects
        this.onResourceLoadComplete(event);
    }

    /**
     * preload资源组加载进度
     * Loading process of preload resource group
     */
    private onResourceProgress(event:RES.ResourceEvent):void {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    }

    private textfield:egret.TextField;

    /**
     * 创建游戏场景
     * Create a game scene
     */
    private createGameScene():void {
        var sky:egret.Bitmap = this.createBitmapByName("background2_jpg");
        this.addChild(sky);
        var stageW:number = this.stage.stageWidth;
        var stageH:number = this.stage.stageHeight;
        sky.width = stageW;
        sky.height = stageH;
        
        this.player = new Player();
        this.addChild(this.player);
        this.player.x = stageW / 2;
        this.player.y = stageH / 2;
        this.player.UpdateIdle();
        this.touchEnabled = true;
        this.addEventListener(egret.TouchEvent.TOUCH_TAP,this.MoveTo,this);
    }

    private MoveTo(evt:egret.TouchEvent): void{
        this.player.UpdateMove(evt.stageX,evt.stageY);
    }

    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    private createBitmapByName(name:string):egret.Bitmap {
        var result = new egret.Bitmap();
        var texture:egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }
}

interface State{    //接口
    onEnter();
    onExit();
}

class StateMachine{
    _currentState:State;

    public setState(s:State):void{        //退出当前状态，进入新状态
        if(this._currentState != null){
            this._currentState.onExit();
        }
        
        this._currentState = s;
        this._currentState.onEnter();
    }
}

class MoveState implements State{
    private PlayerPositionx:number;
    private PlayerPositiony:number;
    private player:Player;
    private timer:egret.Timer;
    private ResidualMovementTime:number;

    constructor(x: number,y: number,player:Player){
        this.PlayerPositionx = x;
        this.PlayerPositiony = y;
        this.player = player;
    }

    onEnter(){
        this.player.PersonModel++;                    //改为行走序列
        var positionx = this.PlayerPositionx - this.player.x;           //计算坐标
        var positiony = this.PlayerPositiony - this.player.y;

        if(positionx > 0){
            this.player.scaleX = 1;
        }
        else{
            this.player.scaleX = -1;            //水平翻转
        }

        var distance = Math.sqrt(positionx * positionx + positiony * positiony);

        var time:number = distance / this.player.Speed;     //行走时间
        this.timer = new egret.Timer(50, time);
        this.ResidualMovementTime = time;

        this.timer.addEventListener(egret.TimerEvent.TIMER,() => {
            this.player.x = this.player.x + positionx / time;
            this.player.y = this.player.y + positiony / time;
            this.ResidualMovementTime--;

            if(this.ResidualMovementTime < 1){
                this.timer.stop();
                if(this.ResidualMovementTime > 0){                         //到指定位置后停下
                    this.player.UpdateIdle();
                }
            }
        }, this);
        this.timer.start();
        this.player.PlayerPic(this.player.MoveTexture);
    }

    onExit(){
    }
}

class IdleState implements State{
    private player:Player;
    constructor(player: Player){
        this.player = player;
    }

    onEnter(){
        this.player.PersonModel = 0;
        this.player.PlayerPic(this.player.IdleTexture);
    }

    onExit(){
    }
}

class Player extends egret.DisplayObjectContainer{
    public Initial:egret.Bitmap;
    private Mystate:StateMachine = new StateMachine;
    public Speed:number = 20;
    public PersonModel:number = 0;                                 //初始站立
    public IdleTexture:Array<egret.Texture> = new Array<egret.Texture>();
    public MoveTexture:Array<egret.Texture> = new Array<egret.Texture>();

    constructor(){
        super();
        this.Initial = this.createBitmapByName("stand_0001_png");
        this.addChild(this.Initial);
        this.LoadPic();
        this.anchorOffsetX = this.Initial.width / 2;
        this.anchorOffsetY = this.Initial.height / 2;
    }

    private createBitmapByName(name:string):egret.Bitmap {
        var result = new egret.Bitmap();
        var texture:egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }

    private LoadPic(){
        var texture:egret.Texture = RES.getRes("stand_0001_png");
        this.IdleTexture.push(texture);
        texture = RES.getRes("stand_0002_png");
        this.IdleTexture.push(texture);
        texture = RES.getRes("stand_0003_png");
        this.IdleTexture.push(texture);
        texture = RES.getRes("stand_0004_png");
        this.IdleTexture.push(texture);
        texture = RES.getRes("stand_0005_png");
        this.IdleTexture.push(texture);
        texture = RES.getRes("stand_0006_png");
        this.IdleTexture.push(texture);
        texture = RES.getRes("stand_0007_png");
        this.IdleTexture.push(texture);
        texture = RES.getRes("stand_0008_png");
        this.IdleTexture.push(texture);
        texture = RES.getRes("166-1_png");
        this.MoveTexture.push(texture);
        texture = RES.getRes("166-2_png");
        this.MoveTexture.push(texture);
        texture = RES.getRes("166-3_png");
        this.MoveTexture.push(texture);
        texture = RES.getRes("166-4_png");
        this.MoveTexture.push(texture);
        texture = RES.getRes("166-5_png");
        this.MoveTexture.push(texture);
        texture = RES.getRes("166-6_png");
        this.MoveTexture.push(texture);
        texture = RES.getRes("166-7_png");
        this.MoveTexture.push(texture);
        texture = RES.getRes("166-8_png");
        this.MoveTexture.push(texture);
    }

    public PlayerPic(Pic:Array <egret.Texture>){
        var count = 0;
        var Photo = this.Initial;
        var model = this.PersonModel;
        var timer: egret.Timer = new egret.Timer(125,0);
        timer.addEventListener(egret.TimerEvent.TIMER,Play,this);
        timer.start();

        function Play(){
            Photo.texture = Pic[count];
            if(count < Pic.length - 1){
                count++;                
            }
            else{
                count = 0;
            }
            if(this.PersonModel != model){
                timer.stop();
            }                            
        }
    }

    public UpdateMove(x: number,y: number){
        var movestate:MoveState = new MoveState(x, y, this);
        this.Mystate.setState(movestate);
    }

    public UpdateIdle(){
        var idlestate = new IdleState(this);
        this.Mystate.setState(idlestate);
    }    
}