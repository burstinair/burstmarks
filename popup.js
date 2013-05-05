var $b = chrome.bookmarks;
var $bkg = chrome.extension.getBackgroundPage();
var item_per_page = 15;
var cur_page, all_marks, page_count, page_info_span, result;
var selected_result = null;
var cur_results = [];

var select = function (cur_select) {
    if(selected_result != null) {
        selected_result.classList.remove("select");
    }
    cur_select.classList.add("select");
    selected_result = cur_select;
};

var select_up = function () {
    if(selected_result == null || cur_results.indexOf(selected_result) == 0) {
        select(cur_results[cur_results.length - 1]);
    } else {
        select(cur_results[cur_results.indexOf(selected_result) - 1]);
    }
};

var select_down = function () {
    if(selected_result == null || cur_results.indexOf(selected_result) == cur_results.length - 1) {
        select(cur_results[0]);
    } else {
        select(cur_results[cur_results.indexOf(selected_result) + 1]);
    }
};

var enable_select = function () {
    var collection = document.getElementById('result').children;
    cur_results = [];
    for(var i = 0, l = collection.length; i < l; ++i) {
        if(collection[i].tagName.toLowerCase() == 'a') {
            cur_results.push(collection[i]);
            collection[i].addEventListener('mouseover', function () {
                select(this);
            });
        }
    }
};

document.addEventListener('keydown', function (e) {
    if(e.keyCode == 38) {
        select_up();
    } else if(e.keyCode == 40) {
        select_down();
    } else if(e.keyCode == 13) {
        if(selected_result != null) {
            //selected_result.focus();
            window.open(selected_result.attributes["href"].value);
        }
    }
});

var show = function (page) {
    cur_page = page;
    page_info_span.innerHTML = [cur_page, "/", page_count].join('');
    var res = [], odd = false;
    for(
        var i = (cur_page - 1) * item_per_page,
        len = cur_page * item_per_page < all_marks.length ? cur_page * item_per_page : all_marks.length; i < len; ++i
    ) {
        res.push("<a target='_blank' href='");
        res.push(all_marks[i].url);
        res.push("' title='");
        res.push(all_marks[i].title);
        if(odd)
            res.push("' class='odd'>");
        else
            res.push("'>");
        odd = !odd;
        res.push(all_marks[i].title);
        res.push("</a>");
    }
    result.innerHTML = res.join('');
    enable_select();
};

//search
var search = function (key) {
    result.innerHTML = "<div class='tip'>载入中...</div>";
    var calc_and_show = function (marks) {
        if(marks.length == 0) {
            result.innerHTML = "<div class='tip'>没有找到。</div>";
        } else {
            for(var i = 0, len = marks.length; i < len; ++i) {
                marks[i].value = $bkg.getValue(marks[i].url);
            }
            marks.sort(function (a, b) {
                return b.value - a.value;
            });
            all_marks = marks;
            page_count = Math.ceil(marks.length / item_per_page);
            show(1);
        }
    };
    if(!key || key == "") {
        var marks = [];
        var first = true;
        var _add_bookmark_tree_nodes = function (nodes) {
            var show = first;
            first = false;
            for(var i = 0, len = nodes.length; i < len; ++i) {
                var node = nodes[i];
                if(node.url == null) {
                    _add_bookmark_tree_nodes(node.children);
                } else {
                    marks.push(node);
                }
            }
            if(show) {
                calc_and_show(marks);
            }
        };
        $b.getTree(_add_bookmark_tree_nodes);
    } else {
        $b.search(key, function (marks) {
            calc_and_show(marks);
        });
    }
};

document.addEventListener('DOMContentLoaded', function () {
    page_info_span = document.getElementById("pager_info");
    result = document.getElementById("result");
    document.getElementById("prev").addEventListener("click", function () {
        if(cur_page > 1) {
            show(cur_page - 1);
        }
    });
    document.getElementById("next").addEventListener("click", function () {
        if(cur_page < page_count) {
            show(cur_page + 1);
        }
    });
    var last_key = null;
    var search_key = document.getElementById("search_key");
    var _search = function () {
        var key = search_key.value;
        if(key != last_key) {
            last_key = key;
            search(key);
        }
    }
    search_key.addEventListener("keydown", _search);
    search_key.addEventListener("keyup", _search);
    search_key.addEventListener("change", _search);
    search("");
    search_key.focus();
});