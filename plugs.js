// ==UserScript==
// @name         BMS Vitalize raise ticket plugs
// @namespace    http://tampermonkey.net/
// @version      0.152
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
            //避免重复启动
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
        this.debug = false;
        this.iFrame = null;
        this.iFrameChanged = true;
        this.dataHashMap = null;
        this.init = function () {

            this.initHtml(); //初始化结构
            this.initStyle(); //初始化样式TODO
            this.initMouseEvent(); //初始化鼠标事件
            this.initPlugsConfig(); //初始化插件设置
            this.debugmode(); //初始化Debug模式

        }
        /**
         * @description 当Debug为True时，加载Debug窗口
         */
        this.debugmode = function () {
            debugger
            if (!this.debug) return;
            this.initDebugDialog();
            this.initDebugEvent()
        }
        this.initDebugDialog = function () {
            //toggle Debug的对话框
            // if (!this.dataHashMap) return
            // if(!this.debug) return
            var dialogNode = $("#plug_debug_mode_dialog")
            var header = $(`<tr>
                                <th>Title</th>
                                <th>Node</th>
                            </tr>`)
            if (dialogNode.length <= 0) {
                var structure = `
                    <div id="plug_debug_mode_dialog" style="background-color:#fff;position:absolute;z-index:9999;right:0px;top:300px;overflow:scroll;max-height:360px">
                        <table border="8" cellpadding="10">
                            <tbody id="plug_debug_mode_dialog_table_body">
                            
                            </tbody>
                        </table>
                    </div>`
                var $_structure = $(structure)
                $("body").append($_structure)
            }
            $("#plug_debug_mode_dialog_table_body").empty().append(header)
            for (var name in this.dataHashMap) {
                if (!this.dataHashMap[name]) continue
                var row = $(`
                <tr>
                    <td>${name}</td>
                </tr>
                `)
                var nodeElement = this.dataHashMap[name]
                var td = $('<td>Hover Show</td>');
                (function (td, nodeElement, $) {
                    td.on({
                        "mouseover": function () {
                            $(nodeElement).css("background-color", "rgba(45,45,45,0.2)")
                        },
                        "mouseout": function () {
                            $(nodeElement).css("background-color", "")
                        },
                        "dblclick": function () {
                            //双击给赋值
                            console.log("dbclick done!")
                            // document.onmouseover = function (e) {
                            //     console.log(e)
                            // }
                            // document.onclick = function (e) {
                            //     console.log(e)
                            // }
                        }
                    })
                })(td, nodeElement, $)

                row.append(td)
                $("#plug_debug_mode_dialog_table_body").append(row)
            }
        }
        this.initDebugEvent = function () {
            let iframe = this.getIFrame()
            // let inputs = iframe.contentDocument.getElementsByTagName("input")
            // let selects = iframe.contentDocument.getElementsByTagName("select")
            // for (let i = 0; i < inputs.length; i++) {
            //     let item = inputs[i]
            //     item.setAttribute("draggable", "true")
            // }
            // for (let j = 0; j < selects.length; j++) {
            //     let item = selects[j]
            //     item.setAttribute("draggable", "true")
            // }

            console.log("设置模式初始化完成！")
        }

        this.getIFrame = function () {
            return this.Config.utils.getIFrame();
        }
        /**
         * @description 初始化插件结构，并将对应this.Config.lists中的值绑定成选项
         */
        this.initHtml = function () {
            console.log('初始化中...')
            console.log('载入结构')
            let structure = $(`<div id="plugsMenu" class="draggable">
                              <header class="dragHandle"></header>
                                  <div class="menuLists"></div>
                              </div>`)

            for (let i in this.Config.lists) {
                //将this.Config.lists上配置的所有事件绑定到Plugs上
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
            //绑定子框架的onload事件
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
                    this.debugmode();
                    console.log("数据绑定结束..")
                }
                // alert('子框架变了!');
            }.bind(this)
        }
        /**
         * @description 初始化结构样式，将this.Config.Style插入页面
         */
        this.initStyle = function () {
            console.log('载入结构完成')
            //载入样式
            $("body").append(`<style>${this.Config.style}</style>`)
            //END
            console.log('样式载入')
        }
        /**
         * @description 初始化鼠标事件，plugs拖拽事件
         */
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
        /**
         * @description 初始化插件配置属性，将其存入LocalStorage
         */
        this.initPlugsConfig = function () {
            //TODO 初始化插件配置属性,并将其存入LocalStorage
            let plugsConfig = localStorage.getItem("BMS_PlugsConfig")
            // let version = parseInt(plugsConfig.ver.split(".").join(""))
            // if (plugsConfig && plugsConfig.ver) {
            // if (!plugsConfig) {
            let configObject = {
                ver: 1.0,
                fieldsMap: {
                    Retrieval: {
                        "additional_info": "additional_info",
                        "alt_contact": "alt_contact",
                        "asset_tag": "asset_tag",
                        "assignment_group": "assignment_group",
                        "attachment_button": "attachment_button",
                        "business_justification": "business_justification",
                        "cancelled_from_incident": "cancelled_from_incident",
                        "chat_conversation": "chat_conversation",
                        "cmdb_ci": "cmdb_ci",
                        "contact_type": "contact_type",
                        "delivery_priority": "delivery_priority",
                        "device_type": "device_type",
                        "docking_station": "docking_station",
                        "end_ci": "end_ci",
                        "end_peripherals": "end_peripherals",
                        "esetup_number": "esetup_number",
                        "external_ref_number": "external_ref_number",
                        "filter_fulfillment_group": "filter_fulfillment_group",
                        "form_factor": "form_factor",
                        "group_approval": "group_approval",
                        "group_approval_needed": "group_approval_needed",
                        "inst_building": "inst_building",
                        "inst_floor": "inst_floor",
                        "inst_room": "inst_room",
                        "inst_site": "inst_site",
                        "keyboard": "keyboard",
                        "lab_type": "lab_type",
                        "manual_device_end": "manual_device_end",
                        "manufacturer": "manufacturer",
                        "monitor": "monitor",
                        "mouse": "mouse",
                        "new_asset_tag": "new_asset_tag",
                        "new_cmdb_ci": "new_cmdb_ci",
                        "new_device_type": "new_device_type",
                        "new_docking_station": "new_docking_station",
                        "new_form_factor": "new_form_factor",
                        "new_install_building": "new_install_building",
                        "new_install_floor": "new_install_floor",
                        "new_install_room": "new_install_room",
                        "new_install_site": "new_install_site",
                        "new_keyboard": "new_keyboard",
                        "new_lab_type": "new_lab_type",
                        "new_manufacturer": "new_manufacturer",
                        "new_monitor": "new_monitor",
                        "new_mouse": "new_mouse",
                        "new_other": "new_other",
                        "new_serial_num": "new_serial_num",
                        "new_unable_to_locate_ci": "new_unable_to_locate_ci",
                        "only_show_devices_assigned_to_the_user": "only_show_devices_assigned_to_the_user",
                        "other": "other",
                        "outer_group_end": "outer_group_end",
                        "request_type": "request_type",
                        "requested_date": "requested_date",
                        "title": "requested_for",
                        "requestor_notification": "requestor_notification",
                        "sales_force": "sales_force",
                        "serial_num": "serial_num",
                        "short_description": "short_description",
                        "unable_to_locate_ci": "unable_to_locate_ci"
                    }
                }
            }
            localStorage.setItem("BMS_PlugsConfig", JSON.stringify(configObject))
            // }
        }
        /**
         * @description 插件配置
         */
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
              }`,
              /**
               * @description 下拉菜单配置（显示名：函数名）
               */
            lists: {
                "Retrieval": "fillRetrievalTicket",
                "Disk Wipe": "Disk Wipe function",
                "Request New Asset": "devTest",
                "unlock": "unlock"
            },
            /**
             * @description 下拉菜单对应方法
             */
            method: {
                /**
                 * @description 解锁所有填选项，仅在未关闭的相关页面才能使用
                 */
                unlock: function () {
                    const whiteList = ["sc_task.do", "incident.do", "u_incident_task.do"]

                    if (this.Config.utils.ifMatchIframePath(whiteList)) {
                        document.querySelector("#gsft_main").contentDocument.querySelectorAll("*[readonly=readonly]").forEach(function (elem) {
                            elem.removeAttribute('readonly');
                            elem.removeAttribute("disabled");
                        })
                        document.querySelector("#gsft_main").contentDocument.querySelectorAll(".readonly").forEach(function (elem) {
                            elem.removeClassName("readonly");
                        })
                        document.querySelector("#gsft_main").contentDocument.querySelectorAll(".disabled").forEach(function (elem) {
                            elem.removeClassName("disabled");
                        })
                        alert('Unlocked!');

                    } else {
                        alert('解锁失败，请不要在其他页面尝试解锁')
                    }
                },
                /**
                 * @description 根据excel表填单子
                 */
                fillRetrievalTicket: function () {
                    const whiteList = ["com.glideapp.servicecatalog_cat_item_view.do"]
                    if (this.Config.utils.ifMatchIframePath(whiteList)) {
                        //获取该页面的数据Map
                        let dataHashMap = this.dataHashMap
                        //真实数据
                        let object = {
                            title: 'Agnieszka Ostachowska'
                        }
                        //End

                        for (var dataNameInExcelString in dataHashMap) {
                            let value = object[dataNameInExcelString]
                            let fieldNode = dataHashMap[dataNameInExcelString] ? dataHashMap[dataNameInExcelString] : null
                            if (!fieldNode) continue
                            this.Config.utils.triggerFieldEventByNode(fieldNode)
                        }
                    } else {
                        alert('填写失败，请不要在其他页面尝试填写');
                    }
                }
            },
            /**
             * @description 工具方法
             */
            utils: {
                /**
                 * @description 获取iFrame窗口对象
                 */
                getIFrame: function () {
                    //HACK TODO this 的作用域被限制再这个utils中了
                    return document.querySelectorAll("iframe#gsft_main")[0]
                },
                /**
                 * @description 根据页面名字获取该页面所有参数映射对象
                 */
                getFieldsMap: function (name) {
                    let config = JSON.parse(localStorage.getItem("BMS_PlugsConfig"))
                    // JSON.parse(config)
                    return config.fieldsMap[name]
                },
                /**
                 * @description 检测该页面是否在白名单中
                 */
                ifMatchIframePath: function (pathList) {
                    return null != pathList.find((v, i) => {
                        return document.querySelector("iframe").contentWindow.location.pathname == "/" + v
                    })
                },
                /**
                 * @description 根据页面上variable_map节点获取到所有页面上字段对应的Hash映射，并返回一个set集合
                 */
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
                /**
                 * @description 根据当前页面字段的HashMap，结合配置的页面与数据的映射（页面字段名：excel字段名）生成一个（excel字段名：页面字段真实节点）对象映射集
                 */
                loadFieldMapedConfig: function (currentFiledsHashMap) {
                    //获取字符字段与页面字段的对应映射，并生成一个 原生 节点队列
                    let filedsMapSet = this.getFieldsMap("Retrieval")
                    let dataWithNodeMap = {}

                    for (var name in filedsMapSet) {
                        let fieldId = filedsMapSet[name]
                        let fieldInputNodeHash = currentFiledsHashMap[fieldId]
                        let iFrame = this.getIFrame()
                        let iFrameDocument = iFrame.contentDocument
                        let Node = iFrameDocument.getElementById("sys_display.IO:" + fieldInputNodeHash)
                        if (!Node) Node = iFrameDocument.getElementById("IO:" + fieldInputNodeHash)
                        dataWithNodeMap[name] = Node
                    }
                    console.log(dataWithNodeMap)
                    return dataWithNodeMap
                },
                bindDataTitleWithNodeId: function () {
                    //将用户数据id和节点id进行绑定
                    //从页面上获取到字段
                    let currentFiledsHashMap = this.initCurrentFieldsMap(); //初始化当前页面待填字段的映射,考虑缓存 页面数据id:真实节点ID
                    // debugger
                    this.currentFiledsHashMap = currentFiledsHashMap
                    console.log(currentFiledsHashMap)
                    //从缓存中获取到配置字段
                    let dataWithNodeMap = this.loadFieldMapedConfig(currentFiledsHashMap); //获取已配置的字符数据对应字段的节点们,考虑缓存 用户数据title:页面数据id
                    return dataWithNodeMap
                },
                textInputFillAndTriggerEvent: function (inputElement, value) {
                    if ("INPUT" != inputElement.nodeName ||
                        "checkbox" == inputElement.type ||
                        "hidden" == inputElement.type ||
                        "radio" == inputElement.type) return
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
                    if (inputElement.ac) {
                        inputElement.ac.keyDown(evt)
                    } else {
                        inputElement.dispatchEvent(evt)
                    }
                },
                selectChangeAndTriggerEvent: function (selectElement, value) {
                    if ("SELECT" != selectElement.nodeName) return
                    selectElement.value = value;
                    var evt = new Event("change");
                    selectElement.dispatchEvent(evt);
                },
                triggerFieldEventByNode: function (fieldNode) {
                    if (null == fieldNode) return null;
                    switch (fieldNode.nodeName) {
                        case "INPUT":
                            this.textInputFillAndTriggerEvent(fieldNode, value)
                            break;

                        case "SELECT":
                            this.selectChangeAndTriggerEvent(fieldNode, value)
                            break;
                    }
                }
            }

        }

    }


})(jQuery);