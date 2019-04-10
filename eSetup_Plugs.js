// ==UserScript==
// @name         eSetup_Plugs
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        http://eprov.bms.com/idm/user/workItemListExt.jsp*
// @grant        none
// @require      http://libs.baidu.com/jquery/1.11.3/jquery.min.js
// ==/UserScript==
(function ($) {
    $(document).ready(function () {
        let NodeArray = analysisNodes();
        for (var nodeObject of NodeArray) {
            var url = nodeObject.url;
            var contentPromise = getHtml(url);
            var node = nodeObject.node;
            (function (nodeObject) {
                contentPromise.done(function (content) {
                    var detailObj = generateDetailInfoObjByContent(content);
                    nodeObject.fill(detailObj);
                })
            })(nodeObject)
        }
    })

    function analysisNodes() {
        let NodeArray = [];
        let header = $(".tablesortbody").find("tr:first");
        let rows = $(".tablesortbody").find("tr:not(:first)");
        if (rows.length <= 0) {
            alert("无任务");
            return [];
        }
        for (var i = 0; i < rows.length; i++) {
            var row = $(rows[i]);
            //console.log(url);
            (function (row) {
                NodeArray.push(new nodeObject(row));
            })(row);

        }
        return NodeArray;
    }

    /**
     * temp
     * @param {string} url
     * @returns {promise}
     */
    function getHtml(url) {
        return $.ajax({
            url: url,
            type: "GET",
            dataType: "html",
        })
    }

    function generateDetailInfoObjByContent(content) {
        // debugger
        var infoTable = $(content).find("form[name='mainform']");
        var rows = infoTable.find("tr");
        var infoObj = {};
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var key = "";
            var value = "";
            if ($(row).find("td").length <= 2) continue;
            if ("" == $(row).find("td:first").text().trim()) {
                key = "summary";
                var strArr = $(row).find("td:nth-child(2)").text().trim().split(/[\n\t]/);
                // console.log(strArr);
                var obj = new Object();
                for(var str of strArr){
                    var KVStrArr = str.trim().split(":").map(e=>{return e.trim()})
                    // console.log(KVStrArr)
                    var k = KVStrArr[0];
                    if(k=="") continue;
                    var v = KVStrArr[1];
                    obj[k] = v;
                }
                value = obj;
                //console.log(value);
            }else{
                key = $(row).find("td:first").text().trim();
                value = $(row).find("td:nth-child(2)").text().trim();
            }

            infoObj[key] = value;
        }
        return infoObj;
    }

    class nodeObject {
        constructor($node) {
            this.node = $($node);
            this.url = this.node.find("td:nth-child(2) a").attr("href");
            $("html").append(`
            <style type="text/css">
                .shown{
                    display:block;
                }
                .hidden{
                    display:none;
                }
            </style>
            `);
        }
        fill(detailObj) {
            console.log(detailObj);
            //到职日期
            if(detailObj.summary["What is the expected start date of the new hire"]){
                if($("#dzrq").length<=0)
                  $(".tablesortbody").find("tr:first").append(`<th class="tablehdr" nowrap="nowrap" scope="col" id="dzrq">到职日期</th>`)
                var expectedDate = detailObj.summary["What is the expected start date of the new hire"];
                var datetypeDate = new Date(expectedDate);
                var nowDate = new Date();
                var daysToNow = Math.ceil((datetypeDate-nowDate)/(1000*60*60*24));
                if(daysToNow<3){
                    this.node.append(`<td class='tablebody' style='color:red;'>${expectedDate}</td>`);
                }else{
                    this.node.append(`<td class='tablebody' >${expectedDate}</td>`);
                }
            }else{
                //占位,避免错位
                if($("#dzrq").length<=0){
                    $(".tablesortbody").find("tr:first").append(`<th class="tablehdr" nowrap="nowrap" scope="col" id="dzrq">到职日期</th>`);
                }
                this.node.append(`<td class='tablebody'></td>`);
            }
            //所选机型
            if(detailObj.summary["Select the type of equipment needed for your new hire"]){
                var serial = detailObj.summary["Select the type of equipment needed for your new hire"]
                  if($("#sxjx").length<=0)
                  $(".tablesortbody").find("tr:first").append(`<th class="tablehdr" nowrap="nowrap" scope="col" id="sxjx">所选机型</th>`)
                this.node.append(`<td class='tablebody'>${serial}</td>`);
            }else{
                //占位,避免错位
                if($("#sxjx").length<=0){
                    $(".tablesortbody").find("tr:first").append(`<th class="tablehdr" nowrap="nowrap" scope="col" id="sxjx">所选机型</th>`);
                }
                this.node.append(`<td class='tablebody'></td>`);
            }
            //uid
            var client = detailObj["Client"]||detailObj["客户"];
            var trimClient = client.replace(/\s+/g,"");
            var UIDregex = /([(]UID=(.+)[)])/
            var uid  =UIDregex.exec(trimClient)[2]
            if($("#uid").length<=0){
                    $(".tablesortbody").find("tr:first").append(`<th class="tablehdr" nowrap="nowrap" scope="col" id="uid">UID</th>`);
                this.node.append(`<td class='tablebody' >${uid}</td>`);
            }else{
                    this.node.append(`<td class='tablebody' >${uid}</td>`);
            }
            //Manager Email
             var manager = detailObj["Manager"]||detailObj["经理"];
            var trimManager = manager.replace(/\s+/g,"");
            var EmailRegex =/\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}/
            var email  =EmailRegex.exec(trimManager)[0]
            if($("#managerEmail").length<=0){
                    $(".tablesortbody").find("tr:first").append(`<th class="tablehdr" nowrap="nowrap" scope="col" id="managerEmail">经理邮箱</th>`);
                this.node.append(`<td class='tablebody' >${email}</td>`);
            }else{
                    this.node.append(`<td class='tablebody' >${email}</td>`);
            }
            //备注
            if(detailObj["Comments"]||detailObj["意见"]){
                var comments = detailObj["Comments"]||detailObj["意见"];
                this.node.find("td:first").append(`<div class="comments hidden" style="position:relative;white-space:normal"><textarea rows="10" resizeable="false" style="position:absolute;width:300px;left:0px;top:0px;background-color:#ffffff;">${comments}</textarea></div>`);
                this.node.find("td:first").hover(e=>{
                    this.node.find(".comments").removeClass("hidden").removeClass("shown").addClass("shown");
                },e=>{
                    this.node.find(".comments").removeClass("hidden").removeClass("shown").addClass("hidden");
                });

                this.node.find(".comments").hover(e=>{
                    this.node.find(".comments").removeClass("hidden").removeClass("shown").addClass("shown");
                },e=>{
                    this.node.find(".comments").removeClass("hidden").removeClass("shown").addClass("hidden");
                })
            }
        }
    }
})($);