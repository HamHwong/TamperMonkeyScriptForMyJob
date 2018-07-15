// ==UserScript==
// @name         BMS Vitalize raise ticket plugs
// @namespace    http://tampermonkey.net/
// @version      0.15
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
    let $ = jQuery;
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
        this.iFrame = null;
        this.iFrameChanged = true;
        this.dataHashMap = null;
        this.init = function () {
            this.debugmode();
            this.initHtml();
            this.initStyle();
            this.initMouseEvent();
            this.initPlugsConfig();

        }
        this.debugmode = function () {
            if (!this.debug) return;
            this.initdebugEvent()
        }
        this.initdebugEvent = function () {
            let inputs = document.querySelector("iframe[name='gsft_main']").contentDocument.getElementsByTagName("input")
            for (let i = 0; i < inputs.length; i++) {
                let item = inputs[i]
                item.setAttribute("draggable", "true")
            }
        }
        this.getIFrame = function () {
            return this.Config.utils.getIFrame();
        }
        this.initHtml = function () {
            console.log('初始化中...')
            console.log('载入结构')
            let structure = $(`<div id="plugsMenu" class="draggable">
                              <header class="dragHandle"></header>
                                  <div class="menuLists"></div>
                              </div>`)

            for (let i in this.Config.lists) {
                (function (i) {
                    let item = $(`<span class="plugsRow">${i}</span>`)
                    let funcOrName = this.Config.lists[i]
                    console.log(funcOrName)
                    let func = null;
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
            this.iFrame = this.Config.utils.getIFrame();
            this.iFrame.onload = function () {
                //当子框架改变时,将iFrameChanged设置为true
                this.iFrameChanged = true;

                const whiteList = ["com.glideapp.servicecatalog_cat_item_view.do"]
                // debugger
                if (this.Config.utils.ifMatchIframePath(whiteList)) {
                    //将该子页面的节点和数据进行绑定
                    this.dataHashMap = this.Config.utils.bindDataTitleWithNodeId();
                    console.log("数据绑定结束..")
                }

                // alert('子框架变了!');
            }.bind(this)
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
        this.initPlugsConfig = function () {
            let plugsConfig = localStorage.getItem("BMS_PlugsConfig")
            // let version = parseInt(plugsConfig.ver.split(".").join(""))
            // if (plugsConfig && plugsConfig.ver) {
            if (!plugsConfig) {

                let configObject = {
                    ver: 1.0,
                    fieldsMap: {
                        Retrieval: {
                            title: "requested_for"
                        }
                    }
                }
                
                localStorage.setItem("BMS_PlugsConfig",JSON.stringify(configObject))
            }
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
                "Request New Asset": "devTest",
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
                        //获取该页面的数据Map
                        let dataHashMap = this.dataHashMap
                        let object = {
                            title: 'HHHHH'
                        }

                        for (var dataNameInExcelString in dataHashMap) {
                            let value = object[dataNameInExcelString]
                            let fieldNode = dataHashMap[dataNameInExcelString]
                            this.Config.utils.textInputFillAndTriggerEvent(fieldNode, value)
                        }
                    } else {
                        alert('填写失败，请不要在其他页面尝试填写');
                    }
                },
                devTest: function () {
                    var evt = new KeyboardEvent("keydown", {
                        key: "Tab",
                        code: "Tab",
                        location: 0,
                        ctrlKey: false,
                        shiftKey: false,
                        altKey: false,
                        metaKey: false,
                        repeat: false,
                        isComposing: false,
                        charCode: 0,
                        keyCode: 9,
                        which: 9
                    })
                    var iframe = $(this.getIFrame()).contents()
                    var inp = iframe.find("#sys_display\\.IO\\:bb43d80c89393400f283af8e80bb86f4")[0]
                    inp.value = "hh"
                    inp.ac.keyDown(evt)
                }
            },
            utils: {
                getIFrame: function () {
                    //HACK TODO this 的作用域被限制再这个utils中了
                    return document.querySelectorAll("iframe#gsft_main")[0]
                },
                getFieldsMap: function (name) {
                    let config = JSON.parse(localStorage.getItem("BMS_PlugsConfig"))
                    // if(!config){
                    //     this.
                    // }
                    // JSON.parse(config)
                    return config.fieldsMap[name]
                },
                ifMatchIframePath: function (pathList) {
                    return null != pathList.find((v, i) => {
                        return document.querySelector("iframe").contentWindow.location.pathname == "/" + v
                    })
                },
                initCurrentFieldsMap: function () {
                    //初始化当前页面所有待填字段的Hash映射
                    let set = {}
                    let iframe = $(this.getIFrame())
                    // debugger
                    iframe.contents().find("#variable_map item").toArray().forEach(item => {
                        let fieldId = item.getAttribute("id")
                        let name = item.getAttribute("qname")
                        set[name] = fieldId
                    })
                    return set
                },
                loadFieldMapedConfig: function (currentFiledsHashMap) {
                    //获取字符字段与页面字段的对应映射，并生成一个原生节点队列
                    let filedsMapSet = this.getFieldsMap("Retrieval")
                    let dataWithNodeMap = {}

                    for (var name in filedsMapSet) {
                        let fieldId = filedsMapSet[name]
                        let fieldInputNodeHash = currentFiledsHashMap[fieldId]
                        let iFrame = this.getIFrame()
                        let iFrameDocument = iFrame.contentDocument
                        let Node = iFrameDocument.getElementById("sys_display.IO:" + fieldInputNodeHash)
                        dataWithNodeMap[name] = Node
                    }
                    return dataWithNodeMap
                },
                bindDataTitleWithNodeId: function () {
                    //将用户数据id和节点id进行绑定
                    let currentFiledsHashMap = this.initCurrentFieldsMap(); //初始化当前页面待填字段的映射,考虑缓存 页面数据id:真实节点ID
                    let dataWithNodeMap = this.loadFieldMapedConfig(currentFiledsHashMap); //获取已配置的字符数据对应字段的节点们,考虑缓存 用户数据title:页面数据id
                    return dataWithNodeMap
                },
                textInputFillAndTriggerEvent: function (inputElement, value) {
                    //fill
                    inputElement.value = value
                    //trigger
                    var evt = new KeyboardEvent("keydown", {
                        key: "Tab",
                        code: "Tab",
                        location: 0,
                        ctrlKey: false,
                        shiftKey: false,
                        altKey: false,
                        metaKey: false,
                        repeat: false,
                        isComposing: false,
                        charCode: 0,
                        keyCode: 9,
                        which: 9
                    })
                    inputElement.ac.keyDown(evt)
                }
            }

        }

    }
})(jQuery);