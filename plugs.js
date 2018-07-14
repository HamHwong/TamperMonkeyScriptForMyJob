// ==UserScript==
// @name         BMS Vitalize raise ticket plugs
// @namespace    http://tampermonkey.net/
// @version      0.11
// @description  try to take over the world!
// @author       You
// @match        *://bmsprod.service-now.com/navpage.do
// @match        *://bmsprod.service-now.com/nav_to.do
// @match        *://bmsprod.service-now.com/
// @match        *://bmsprod.service-now.com
// @grant        none
// ==/UserScript==

(function (jQuery) {
    'use strict';
    var $ = jQuery;
    window.onload = function () {
        if (window.pluged || window.parent.pluged) {
            return;
        }
        new plugWindow().init();
        $(".menuLists").slideUp();
    }

    const plugWindow = function () {
        window.pluged = true;
        this.relativeX = 0;
        this.relativeY = 0;
        this.isdrag = false;
        this.debug = true;
        this.init = function () {
            this.debugmode();
            this.initHtml();
            this.initStyle();
            this.initMouseEvent();

        }
        this.debugmode = function () {
            if (!this.debug) return;
            this.initdebugEvent()
        }
        this.initdebugEvent = function () {
            var inputs = document.querySelector("iframe[name='gsft_main']").contentDocument.getElementsByTagName("input")
            for (var i = 0; i < inputs.length; i++) {
                var item = inputs[i]
                item.setAttribute("draggable", "true")
            }
        }
        this.initHtml = function () {
            console.log('初始化中...')
            console.log('载入结构')
            let structure = $(`<div id="plugsMenu" class="draggable">
                              <header class="dragHandle"></header>
                                  <div class="menuLists"></div>
                              </div>`)

            for (var i in this.Config.lists) {
                (function (i) {
                    var item = $(`<span class="plugsRow">${i}</span>`)
                    var funcOrName = this.Config.lists[i]
                    console.log(funcOrName)
                    var func = null;
                    if (null == funcOrName) {
                        func = function () {
                            alert(funcOrName + " 这个函数未定义!,请在methods中定义")
                        }
                    } else if ("function" == typeof funcOrName) {
                        func = funcOrName
                    } else if ("string" == typeof funcOrName) {
                        if ("function" == typeof this.Config.method[funcOrName]) {
                            func = this.Config.method[funcOrName]
                        } else {
                            func = function () {
                                alert(funcOrName + " 这个函数未定义!,请在methods中定义")
                            }
                        }
                    }
                    //绑定点击事件
                    item.on('click', func.bind(this))
                    structure.find(".menuLists").append(item)
                }).apply(this, [i])
            }

            $("header[role='banner']").append(structure)
        }
        this.initStyle = function () {
            console.log('载入结构完成')
            //载入样式
            $("body").append(`<style>${this.Config.style}</style>`)
            //ENd
            console.log('样式载入')
        }
        this.initMouseEvent = function () {
            console.log('初始化鼠标事件中...')
            let plugsMenu = document.getElementById("plugsMenu");
            let handle = plugsMenu.firstElementChild;
            let menuLists = $(".menuLists");
            document.onmousedown = function (e) {
                if (handle == e.target) {
                    this.isdrag = true;
                    this.relativeX = handle.offsetParent.offsetLeft - e.x;
                    this.relativeY = handle.offsetParent.offsetTop - e.y;
                }
            }
            document.onmousemove = function (e) {
                // console.log(e)
                if (plugsMenu.offsetLeft + plugsMenu.offsetWidth >= window.document.body.offsetWidth) {
                    plugsMenu.style.left = window.document.body.offsetWidth - plugsMenu.offsetWidth + "px";
                }
                if (plugsMenu.offsetTop <= 0) {
                    plugsMenu.style.top = "0px";
                }
                if (this.isdrag) {
                    plugsMenu.style.left = e.x + this.relativeX + "px";
                    plugsMenu.style.top = e.y + this.relativeY + "px";
                }

            }
            plugsMenu.ondblclick = function (e) {
                menuLists.slideToggle(200);
            }
            document.onmouseup = function (e) {
                this.isdrag = false;

            }
            console.log('初始化鼠标事件完成...')
        }
        this.Config = {
            style: `#plugsMenu {
              position: absolute;
              top: 0;
              left: 0;
              z-index: 999;
              display: flex;
              flex-direction: column;
              min-width: 100px;
              }

              .dragHandle {
              height: 10px;
              background-color: #98abbb;
              padding-bottom: 2px;
              border-radius: 2px 2px 0 0;
              }

              .line {
              height: 2px;
              margin: 2px 0;
              border-style: solid;
              border-color: #64798b;
              border-width: 2px 0;
              }

              .menuLists {
              display: flex;
              flex-direction: column;
              background-color: #cc6d6d;
              }

              #plugsMenu .plugsRow {
              padding: 5px 4px;
              text-align: center;
              vertical-align: middle;
              flex: 1;
              user-select: none;
              font-size: 0.5em;
              border-top: #383838 solid 2px;
              }

              #plugsMenu .plugsRow:hover {
              background-color: #acd3f4;
              }

              #plugsMenu .plugsRow:active {
              background-color: #3775aa;
              }
      `,
            lists: {
                "Retrieval": "fillRetrievalTicket",
                "Disk Wipe": "Disk Wipe function",
                "Request New Asset": "Request New Asset function",
                "unlock": "unlock"
            },
            method: {
                unlock: function () {
                    const whiteList = ["sc_task.do", "incident.do", "u_incident_task.do"]

                    if (this.Config.utils.ifMatchIframePath(whiteList)) {
                        document.querySelector("#gsft_main").contentDocument.querySelectorAll("*[readonly=readonly]").forEach(function (elem) {
                            elem.removeAttribute('readonly');
                            elem.removeAttribute("disabled");
                        })
                        alert('Unlocked!');

                    } else {
                        alert('解锁失败，请不要在其他页面尝试解锁')
                    }
                },
                fillRetrievalTicket: function () {
                    const whiteList = ["com.glideapp.servicecatalog_cat_item_view.do"]
                    if (this.Config.utils.ifMatchIframePath(whiteList)) {
                        let filedsArray = this.Config.utils.loadFieldConfig();
                        filedsArray.forEach(item => {
                            var hash = item.key;
                            var name = item.value;
                            
                        })
                        this.Config.utils.textInputFillAndTriggerEvent();
                    } else {
                        alert('填写失败，请不要在其他页面尝试填写');
                    }
                }
            },
            utils: {
                ifMatchIframePath: function (pathList) {
                    return null != pathList.find((v, i) => {
                        return document.querySelector("iframe").contentWindow.location.pathname == "/" + v
                    })
                },
                loadFieldConfig: function () {
                    //获取到该页面的参数配置，并生成一个节点队列
                },
                textInputFillAndTriggerEvent: function (inputElement, value) {
                    if ($(inputElement).exist()) {

                    }
                }
            }

        }

    }
})(jQuery);