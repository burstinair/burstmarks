var $b = chrome.bookmarks;
var $h = chrome.history;

var copy = function(str, mimetype) {
    mimetype = mimetype || "text/plain";
    var oriOnCopy = document.oncopy;
    document.oncopy = function(event) {
        event.clipboardData.setData(mimetype, str);
        event.preventDefault();
    };
    document.execCommand("Copy", false, null);
    document.oncopy = oriOnCopy;
};
chrome.contextMenus.create({
    title: "复制链接地址",
    contexts: ["link"],
    documentUrlPatterns: ["chrome-extension://" + chrome.i18n.getMessage("@@extension_id") + "/popup.html"],
    onclick: function (info, tab) {
        copy(info.linkUrl);
    }
});

var recent_count = 10;
var value_base = 7 * 24 * 60 * 60 * 1000;

var bookmark_id_url = {};
var url_bookmark_id = {};
var url_value = {};
var url_recent = {};
var reload_mark = function (id, url) {
    var now = new Date().getTime();
    bookmark_id_url[id] = url;
    url_bookmark_id[url] = id;
    $h.getVisits({url: url}, function (visits) {
        var res = 0;
        for(var j = 0, jlen = visits.length; j < jlen; ++j) {
            res += value_base / (now - visits[j].visitTime);
        }
        url_value[url] = res;
    });
};
var reload_recent = function () {
    url_recent = {};
    $b.getRecent(recent_count, function (marks) {
        for(var i = 0, len = marks.length; i < len; ++i) {
            url_recent[marks[i].url] = len - i;
        }
    });
};
var reload = function () {
    var _add_bookmark_tree_nodes = function (nodes) {
        for(var i = 0, len = nodes.length; i < len; ++i) {
            var node = nodes[i];
            if(node.url == null) {
                _add_bookmark_tree_nodes(node.children);
            } else {
                reload_mark(node.id, node.url);
            }
        }
    };
    $b.getTree(_add_bookmark_tree_nodes);
};

$b.onCreated.addListener(function (id, mark) {
    reload_mark(id, mark.url);
    reload_recent();
});
$b.onChanged.addListener(function (id, change_info) {
    var old_url = bookmark_id_url[id];
    var url = change_info.url;
    
    url_bookmark_id[old_url] = null;
    url_bookmark_id[url] = id;
    
    bookmark_id_url[id] = url;
    url_value[url] = url_value[old_url];
    url_value[old_url] = null;
    
    reload_recent();
});
$b.onRemoved.addListener(function (id, remove_info) {
    var old_url = boolmark_id_url[id];
    url_value[old_url] = null;
    url_bookmark_id[old_url] = null;
    bookmark_id_url[id] = null;
    reload_recent();
});

$h.onVisited.addListener(function (history) {
    var url = history.url;
    reload_mark(url_bookmark_id[url], url);
    reload_recent();
});
$h.onVisitRemoved.addListener(function (removed) {
    if(removed.allHistory) {
        reload();
    } else {
        for(var i = 0, len = removed.urls.length; i < len; ++i) {
            reload_mark(removed.urls[i]);
        }
    }
    reload_recent();
});

this.g = this.getValue = function (url) {
    var res = 0;
    if(url_value[url] != null) {
        res += url_value[url];
    }
    if(url_recent[url] != null) {
        res += url_recent[url];
    }
    return res;
}

reload();