/* =========================================================== *
 * @site http:tt-cc.cn
 * @email mvpjly@163.com
 * Copyright 2014 imwr
 * Licensed under the Apache License, Version 2.0 (the "License")
 * =========================================================== */
;
(function ($) {
    "use strict";
    var defaults = {
        addStyle: true,//是否自动添加样式
        event: "click",//切换tab事件：mouseover、click ...
        title: "top",//标题显示位置：top/bottom/none
        titleWidth: null,//每个tab title的宽度
        width: "auto",//tab宽度，不包括边框、补白
        height: "auto",//tab高度(含title)，auto：各tab内容自身高；fix：所有tab为最大tab高；{num}：指定tab一致高度
        movable: false,//move 滑动 或 display 显隐
        type: "linear", //滑动类型 linear easeInQuad easeOutQuad easeInOutQuad easeInCubic easeOutCubic easeInOutCubic
        // easeInQuart easeOutQuart easeInOutQuart easeInQuint easeOutQuint easeInOutQuint easeInSine easeOutSine easeInOutSine
        auto: false//是否自动切换，movable为true则滑动切换
    };
    $.fn.movableTab = function (method) {
        var args = arguments;
        return this.each(function () {
            var ui = $._data(this, "MovableTab");
            if (!ui) {
                var opts = $.extend({}, defaults, typeof method == 'object' && method);
                ui = new MovableTab(this, opts);
                $._data(this, "MovableTab", ui);
            }
            if (typeof method === "string" && typeof ui[method] == "function") {
                ui[method].apply(ui, Array.prototype.slice.call(args, 1));
            }
        });
    };
    var MovableTab = function (element, options) {
        this.ele = element;
        this.options = options;
        return "undefined" != typeof this.init && this.init.apply(this, arguments)
    };
    MovableTab.prototype = {
        currIndex: 0,
        init: function () {
            if (this._analyzeTab()) {
                this._createTemp();
                this._createTab();
                this.options.auto && this._autoMove();
            }
        },
        _analyzeTab: function () {
            var target = $(this.ele);
            if (!target || target.length == 0) return false;
            this.options.addStyle && target.addClass("panda-movabletab");
            //用户限定了tab宽度
            if (this.options.width && typeof this.options.width == "number") {
                this.width = this.options.width;
                target.width(this.width - target.outerWidth() + target.width());
            } else {
                this.width = this.ele.clientWidth;
            }
            var selector = target.find("A.tab");
            if (!selector || selector.length == 0 || (selector[0].item && selector[0].item.length == 0)) return false;
            var _this = this;
            //用户限定每个title宽，若所有title宽的和超过tab总宽，取1/4值
            if (_this.options.titleWidth) {
                var titleMargin = selector.outerWidth(true) - selector.outerWidth();
                if (this.options.titleWidth + titleMargin > this.width / selector.length) {
                    _this.options.titleWidth = this.width / selector.length - selector.outerWidth() + selector.width();
                } else {
                    _this.options.titleWidth = _this.options.titleWidth - selector.outerWidth() + selector.width();
                }
            }
            //用户限制了tab高
            if (_this.options.height) {
                //如果是fix，this.height=0，以下selector.each比较出最大值；若为数值，则置为所有tab的高度
                (_this.options.height == "fix" && (this.height = 0)) ||
                (typeof _this.options.height == "number" && (this.height = _this.options.height));
            }
            _this.tabs = new Array();
            _this.titleHeight = selector.each(function (index, item) {
                var tab = {};
                //用户手动设置了可用tab
                if ($(item).hasClass("active")) _this.currIndex = index;
                _this.options.titleWidth && $(item).width(_this.options.titleWidth);
                var content = $(item).attr("data-href").replace(/.*(?=#[^\s]*$)/, '');
                $(content) && _this.options.addStyle && $(content).addClass("panda-tab-panel");
                //如果用户设置高为fix，循环比较出最大高度
                _this.options.height == "fix" && (_this.height < $(content).outerHeight(true)) && (_this.height = $(content).outerHeight(true));
                tab.title = $(item), tab.content = $(content), tab.height = content.clientHeight;
                _this.tabs.push(tab);
            }).outerHeight();
            _this.options.height == "fix" && (_this.height += _this.titleHeight + $(this.ele).outerHeight(true) - $(this.ele).height());
            return true;
        },
        _createTemp: function () {
            //创建content父节点div
            var handle = document.createElement('DIV');
            this.handle = $(handle);
            this.options.movable && this.handle.css({"position": "relative"});
            //创建title父节点div
            var title = document.createElement('DIV');
            this.title = $(title);
            if (this.options.title == "none") {//如果不限制标题
                this.title.hide();
                $(this.ele).append(this.handle);
            } else if (this.options.title == "top") {//如果标题在顶部，内容距离顶部为标题高度
                $(this.ele).append(this.title);
                $(this.ele).append(this.handle);
                this.options.movable && (this.title.css("height", this.titleHeight));
            } else if (this.options.title == "bottom") {//如果标题在底部，标题距离顶部为内容高度
                $(this.ele).append(this.handle);
                $(this.ele).append(this.title);
                if (this.height > 0) {
                    var containerMargin = $(this.ele).outerHeight(true) - $(this.ele).height();
                    var borderWidth = $(this.ele).outerHeight() - $(this.ele).innerHeight();
                    this.title.css({
                        position: "absolute",
                        overflow: "hidden",
                        bottom: (containerMargin - borderWidth) / 2
                    });
                    this.handle.css({
                        height: this.height - this.titleHeight - containerMargin,
                        overflow: "hidden"
                    });
                }
                this.options.movable && (this.title.css("height", this.titleHeight));
            }
        },
        _createTab: function () {
            for (var i = 0; i < this.tabs.length; i++) {
                //显示当前tab
                i != this.currIndex ? this._hideDisplayTab(i) : this._showDisplayTab(i);
                this.tabs[i].content.appendTo(this.handle);
                this.tabs[i].title.appendTo(this.title);
                //高度不为空，即设置了fix或数值，高度不会变
                this.options.movable && this.tabs[i].content.css({
                    "width": this.width,
                    "overflow": "hidden"
                });
                this.options.title == "none" || this.tabs[i].title.on(this.options.event, this.bind(this.show, this, i));
            }
            if (this.height > 0) {//高度不为空，即设置了fix或数值，高度不会变了
                $(this.ele).css({
                    "overflow": "hidden",
                    "height": this.height,
                    "position": "relative"
                });
            } else {
                $(this.ele).css({
                    "overflow": "hidden",
                    "height": this.tabs[this.currIndex].height + this.tabs[this.currIndex].title[0].clientHeight
                });
            }
        },
        bind: function (a, b, c) {
            var d = a;
            return "array" != typeof c && (c = [c]),
                function () {
                    return d.apply(b, c)
                }
        },
        _autoMove: function () {
            var _this = this;
            _this.auto = true;
            _this.timer = setInterval(function () {
                if (!_this.auto) return;
                _this.options.movable ? _this.moveTo(_this.currIndex + 1) :
                    _this.currIndex + 1 >= _this.tabs.length ? _this.show(0) : _this.show(_this.currIndex + 1);
            }, 3000)
        },
        _doTween: function (index) {
            if (!this.dir || this.tabs.length == 1) return;
            var _this = this;
            var current = _this.currIndex, next = 0, to = 0;
            if (_this.dir < 0) {//右滑动
                if (index == 0 || index) {
                    next = index < 0 ? _this.tabs.length - 1 : index;
                } else {
                    next = current <= 0 ? _this.tabs.length - 1 : current - 1;
                }
                to = this.width;
            } else {
                if (index == 0 || index) {
                    next = index >= _this.tabs.length ? 0 : index;
                } else {
                    next = current >= _this.tabs.length - 1 ? 0 : current + 1;
                }
                to = -1 * this.width;
            }
            _this._hideDisplayTab(current);
            _this.tabs[next].content.show().css("margin-left", -1 * to);
            _this.handle.stop().animate({
                left: to
            }, _this.width, _this.options.type, function () {
                _this.currIndex = next;
                _this.tabs[next].title.addClass("active");
                _this.tabs[next].content.show().css("margin-left", "0px");
                _this.handle.css("left", "0px");
            })
        },
        moveTo: function (index, dir) {
            if (this.currIndex == index || !this.options.movable) return;
            this.dir = (dir == 1 || dir == -1) ? dir : (index > this.currIndex ? 1 : -1);
            this._doTween(index);
        },
        show: function (index) {
            if (this.tabs) {
                for (var i = 0; i < this.tabs.length; i++) {
                    index == i || this._hideDisplayTab(i);
                }
                if (this.options.movable) {
                    clearInterval(this.timer);
                    this.timer = null;
                    return this.moveTo(index, 1);
                }
                this._showDisplayTab(index);
            }
            return this;
        },
        toggleTitle: function () {
            if (this.options.title == "none") return;
            if (this.options.title == "bottom") {//由下切换到上
                this.handle.appendTo($(this.ele));
                this.options.movable && (this.handle.css("top", this.tabs[this.currIndex].title[0].clientHeight + "px"));
                this.title.css("margin-top", "0px");
            } else {//由上切换到下
                this.title.appendTo($(this.ele));
                if (this.options.movable) {
                    this.height ? this.title.css("margin-top", this.height) :
                        this.title.css("margin-top", this.tabs[this.currIndex].content[0].clientHeight);
                    this.handle.css("top", "0px");
                }
            }
            this.options.title = (this.options.title == "top") ? "bottom" : "top";
        },
        stop: function () {
            this.timer && (this.auto = false) && clearInterval(this.timer) && ( this.timer = null);
        },
        start: function () {
            this.timer && (this.auto = true) && this._autoMove();
        },
        toggleAuto: function () {
            !this.timer ? this._autoMove() : (this.auto ? this.stop() : this.start());
        },
        _hideDisplayTab: function (index) {
            if (this.tabs && this.tabs[index]) {
                this.tabs[index].title.removeClass("active");
                this.tabs[index].content.hide();
            }
        },
        _showDisplayTab: function (index) {
            this.currIndex = index;
            if (this.tabs && this.tabs[index]) {
                this.tabs[index].title.addClass("active");
                this.tabs[index].content.show();
            }
        }
    }
})(jQuery);

