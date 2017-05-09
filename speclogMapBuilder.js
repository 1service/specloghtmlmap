<script>

// handler onload event
$(window).load(function() {
    $("label[for='showRelations']").text($("label[for='showRelations']").text() + " and map");
    $(".expander").hide();
    // change logo
    $(".logo").children().attr("href", "http://www.1service.ru/"); // log
    $(".logo").find("img").attr("title", "Visit 1service.ru");
    $(".logo").find("img").attr("src", "http://www.1service.ru/bitrix/templates/1services/images/logo.png");
    $(".logo").find("img").attr("alt", "1Service");
    $(".logo").find("img").css("width", "200px");

    addLiView();

    window.scale = 0.3; // by default
    $(".heap").find("a").attr('onclick', '').attr("onclick", "returnView();");
    $(".heap").find("a").first().attr('onclick', '').attr("onclick", "returnView(\"li\");");

    $("#showRelations").attr('onclick', '').attr("onclick", "returnView(\"toggle\");");

    // spoiler handler
    $("#lb-spoiler").on("click", function () {
        if ($("#custom-template ui").css('display') == 'none') {
            $("#custom-template ui").show("normal");
        } else {
            $("#custom-template ui").hide();
        }
    });

});

function addLiView() {
    var nodeProject = $("<li>", { "id": "custom-template" }).append($("<input>", {"id": "treeNodeCustom", "type": "checkbox"}));
    nodeProject.append($("<label>", {"id": "lb-spoiler", "class": "arrow", "for": "treeNodeCustom"}));
    nodeProject.append($("<a>", {"class": "templateRoot azure", text: "Карта проекта"}));
    nodeProject.appendTo(".treeview");

    $("<ui>", { "id": "custom-conteiner", css: {"display": "none"} }).appendTo("#custom-template");

    for (workspace in workspaces) {
        $("#custom-conteiner").append(
            $("<li>", {"class": "custom-leaf", "data": workspaces[workspace].id})).append(
                $("<a>", { css: {"margin-left": "10%"},
                            "onclick": "javascript:renderMap('" + workspaces[workspace].id + "');",
                                text: workspaces[workspace].name }));
    }
}

function renderMap(id) {

    //replaceHash("map-" + id.slice(0, 8));  ???
    var mapWidth        = 180,
        mapHeight       = 40;

    $("li").removeClass("selected");
    returnView("map");

    // get current workspace
    var workspace = null;
    for (var ws in workspaces) {
        if (workspaces[ws].id == id) {
            workspace = workspaces[ws];
        }
    }

    // clone default view model
    window._content = $("#content").clone();


    $(".tree-leaf").attr('onclick', '').click(returnView);
    $(".tree-leaf").parent().parent().attr('onclick', '').click(returnView);

    $("#content").empty();
    //$("#content").append(window._expander);

    var toolPanel = $("<div>", {"id": "tool-panel", css: {"position": "absolute", "top": 5, "right": 15, "z-index": "9999"}});

    var expander_custom = $("<div>", {"id": "expander-custom"});

    var zoomer = $("<div>", {"id": "zoomer"});

    expander_custom.append($("<input>", {"id": "bt-expand", "type": "button", "width": 25, "height": 25, css: {"border-radius": "10px 0px 0px 10px",                                         "outline": "none"}, "title": "click to expand map area",  "value":"<", "onclick": "javascript:expand();"}));
    expander_custom.append($("<input>", {"id": "bt-squeeze", "type": "button", "width": 25, "height": 25, css: {"border-radius": "0px 10px 10px 0px",
                                   "outline": "none", "margin-right":"15px"}, "title": "click to squeeze map area", "value":">", "onclick": "javascript:squeeze();"}));

    toolPanel.append(expander_custom);

    zoomer.append($("<input>", {"id": "scale-minus", "type": "button", "width": 25, "height": 25, css: {"border-radius": "10px 0px 0px 10px",                                        "outline": "none"}, "value":"-", "onclick": "javascript:scaleMinus();"}));
    zoomer.append($("<input>", {"id": "scale-plus", "type": "button", "width": 25, "height": 25, css: {"border-radius": "0px 10px 10px 0px",
                                   "outline": "none"}, "value":"+", "onclick": "javascript:scalePlus();"}));
    toolPanel.append(zoomer);

    toolPanel.insertBefore($("#content"));


    $("#content").css({"zoom": window.scale});
    $("#content").css({"overflow": "scroll"});

    var widgets    = workspace.widgets;

    // create canvas box
    $("#content").append($("<canvas>", {"id": "draw-box"}));
    var c=document.getElementById("draw-box");

    window.ctx = c.getContext("2d");
    window.ctx.beginPath();
    window.ctx.scale(0.5, 0.5);
    window.ctx.strokeStyle="gray";

    c.width = workspace.width + mapWidth;
    c.height = workspace.height + mapHeight;

    // map boulding
    for (widget in widgets) {

        // get requirement from widget
        var requirement = null;
        for (req in requirements) {
            if (requirements[req].id == widgets[widget].req) {
                requirement = requirements[req];
            }
        }

        var typeReq = null;
        for (tr in requirementTypes) {
            if (requirement.template == requirementTypes[tr].template) {
                typeReq = requirementTypes[tr];
            }
        }

        var cardColor = typeReq.color;

        // create cord list
        var nodeList = [];
        for (w in widgets) {
            for (child in requirement.children) {
                if (requirement.children[child] == widgets[w].req) {
                    var dots = {};
                    dots.x = widgets[w].left;
                    dots.y = widgets[w].top;
                    dots.req = widgets[w].req;
                    nodeList.push(dots);
                }
            }
        }

        // create card
        var card = $("<div>", {
                "class": "custom-card",
                "id": "card-" + requirement.displayId,
                css: {
                    "border-radius": "15px 0px 15px 15px",
                    "margin": "0",
                    "box-shadow": "1px 2px 9px -2px rgba(0, 0.34, 0, 0.34)",
                    "position": "absolute",
                    "top":  ((workspace.height) * widgets[widget].left) / workspace.height,
                    "left": ((workspace.width) * widgets[widget].top) /   workspace.width
                 }
        });


        var cardHeader = $("<div>", {
            "class": "cardHeader " + cardColor,
            css: {
               "margin": "0",
               "border": "0px solid lightblue",
               "border-radius": "0px 15px 0px 0px",
               "width": mapWidth + 20,
               "height": mapHeight,
               "display": "block",
               "padding": "5px 5px 5px 5px",
               "word-wrap": "break-word",
               "white-space": "pre-line",
               "hyphens": "auto",
               "overflow": "hidden"
            }
        });

        var cardContent = $("<div>", {"class": "cardContent " + cardColor, css: {"width": mapWidth + 20,
                                      "display": "block", "margin": "0", "color": "#313539", "padding": "5px",
                                      "font-size": "12px", "border-radius": "0px 0px 15px 15px"
                                       }} );
        var content = $("<div>", {"class": "line", "color": "#BA34CA"});

        // create link
        var link = $("<a>", {
            "href": "javascript:renderRequirementById(\"" + widgets[widget].req + "\", \"treeView\");",
            "onclick": "javascript:returnView();",
            css: {"white-space": "initial", "word-wrap": "break-word", "font-size": "12px",  "height": "50px",
                  "font-size": "12px", "hyphens": "auto", "color": "white", "overflow": "hidden"
                 },
            text: requirement.text
        });

        cardHeader.append(link);

        var role = requirement.actor ? requirement.actor : "-";

        content.html($("<b>").text("Роль: "));
        content.append(role);

        cardContent.append(content);

        card.append(cardHeader);
        card.append(cardContent);

        card.appendTo("#content").show();

        // draw relation for current widget
        for (node in nodeList) {

            var fromx = (workspace.width * widgets[widget].top) / workspace.width + mapWidth / 2;
            var fromy = (workspace.height * widgets[widget].left) / workspace.height + mapHeight / 2;

            var tox = workspace.width * nodeList[node].y / workspace.width + mapWidth / 2;
            var toy = workspace.height * nodeList[node].x / workspace.height + mapHeight / 2;

            window.ctx.moveTo(fromx, fromy);
            window.ctx.lineTo(tox, toy);
            window.ctx.stroke();
        }
    }
}


// claer map, return default view model
function returnView(type) {

    window.ctx = null;
    if (window._content) {
        $("#content").remove();
        $("#tool-panel").remove();
        $("#container").find("nav").first().animate({"width": "400px"});
        $("#container").find("nav").first().attr("class", "size-normal");
        $("header").show();
        window._content.appendTo($("#container"));
    }

    if (type == "li") {
        $("#custom-template").remove();
        location.reload();
    }

    if (type == "toggle") {
        if (document.getElementById('showRelations').checked) {
            location.reload();
        }
    }

    var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel"; //FF doesn't recognize mousewheel as of FF3.x
    $("#content").bind(mousewheelevt, function(e){
        if (type == "map") {
            var evt = window.event || e; //equalize event object
            evt = evt.originalEvent ? evt.originalEvent : evt; //convert to originalEvent if possible
            var delta = evt.detail ? evt.detail * (-40) : evt.wheelDelta; //check for detail first, because it is used by Opera and FF

            if (delta > 0) {
                scalePlus();
            }
            else {
                scaleMinus();
            }
        }
    });

    $('#content').on("mousedown", function(e) {

        $('#content').css({"cursor": "all-scroll"});

        var startY = e.pageY;
        var startX = e.pageX;

        var startPosY = $(this).scrollTop();
        var startPosX = $(this).scrollLeft();
        var el = $(this);

        $('#content').mousemove(function(e) {
            var offsetY = startY - e.pageY;
            var offsetX = startX - e.pageX;
            el.scrollTop(startPosY + offsetY);
            el.scrollLeft(startPosX + offsetX);
        });

        // for prevent text selection
        return false;
    });

     $('#content').on('mouseup', function(e) {
            $('#content').css({"cursor": "default"});
            $('#content').off("mousemove");
     });

}

function scalePlus() {
    if (window.scale < 2) {
        window.scale += 0.1;
        $("#content").css({"zoom": window.scale});
    }
}

function scaleMinus() {
    if (window.scale > 0.3) {
        window.scale -= 0.1;
        $("#content").css({"zoom": window.scale});
    }
}

$(document).mouseup(function (e){
    var div = $("#content");
    if (!div.is(e.target)
        && div.has(e.target).length === 0) {
            $('#content').css({"cursor": "default"});
            $('#content').off("mousemove");
    }
});

function expand() {
    $("#container").find("nav").first().animate({"width": "0px"});
    $("#container").find("nav").first().attr("class", "size-hidden");
    $("header").hide();
}

function squeeze() {
    $("#container").find("nav").first().animate({"width": "400px"});
    $("#container").find("nav").first().attr("class", "size-normal");
    $("header").show();
}

</script>