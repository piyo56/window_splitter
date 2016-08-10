var store_key = "temporarily_stored_tabs";

/* not use yet */
function getHalfDisplaySize() {
    return {
        "width":  Math.floor(window.parent.screen.width / 2),
        "height": window.parent.screen.height
    };
}

//-------------------------------------------------------------
//  split機能
//  [説明] : 今開いているタブを基準に右側のタブを新しいウィン
//           ドウで開く
//-------------------------------------------------------------
document.getElementById("split").onclick = function() {
    chrome.tabs.query( {currentWindow: true}, function(tabArray){
        var active_tabId = -1,
            left_tabIds  = [],
            right_tabIds = [];

        //  
        for (var i=0; i<tabArray.length; i++) {
            var tabId = tabArray[i]["id"]
            if( tabArray[i]["active"] ){
                active_tabId = tabId;
            } else if( active_tabId === -1) {
                left_tabIds.push(tabId);
            } else {
                right_tabIds.push(tabId);
            }
        }
        console.info(tabArray);
        console.info("now: " + active_tabId);
        console.info("left: " + left_tabIds);
        console.info("right: " + right_tabIds);
        
        // open right_tabs in a new window
        chrome.windows.create({
                "tabId":   active_tabId,
                "focused": true,
                "type":    "normal"
            }, function(window_info) {
                chrome.tabs.move(right_tabIds, {"windowId":window_info["id"], "index":-1});
            }
        );
    });
};


//-------------------------------------------------------------
//  store機能
//  [説明] : 一時的にWebStorageを使ってデバイスにタブのurlを保存
//
//  [TO DO]: - 今のところ保存できるタブは一回分のみ 改良の検討
//           - storeしたタブを削除する機能
//-------------------------------------------------------------
document.getElementById("store").onclick = function() {
    chrome.tabs.query({"currentWindow": true}, function(all_tabs) {

        // get each url of tabs of current window
        var urls_to_store = [];
        for( var i=0; i<all_tabs.length; i++) {
            urls_to_store.push(all_tabs[i].url);
        }

        // store them on WebStorage
        localStorage.setItem(store_key, JSON.stringify(urls_to_store));

        // remove current window
        chrome.windows.getCurrent(function(window_info) {
            chrome.windows.remove(window_info["id"]);
        });
    });
};

document.getElementById("retrieve").onclick = function() {
    var stored_urls = JSON.parse(localStorage.getItem(store_key));
    localStorage.removeItem(store_key);
    chrome.windows.create({
        "url": stored_urls,
        "focused": true,
        "type":    "normal",
    }, function(){
        window.close();
    }
    );
};

//-------------------------------------------------------------
//  bookmark機能
//  [説明] : 今開いている全てのタブをまとめてブックマークする
//-------------------------------------------------------------
document.getElementById("bookmark").onclick = function() {
    document.body.style.height = "300px";
    document.getElementById("bookmark_setting").style.display = "block";

    var target_div = document.getElementById("bookmark_folder");

    var createOption = function(val, str){
        var new_option = document.createElement("option");
        new_option.value = val;
        new_option.innerHTML = str;
        return new_option;
    };
    
    
    var getAllDir = function(node, index, callback) {
        var children = node["children"];
        var grand_children;
        var new_index;

        //ノードのレベル
        var indent="";
        for( var j=0; j<index.split("|").length; j++) {
            indent += "&nbsp;&nbsp;";
        }
        
        // 子ノードに対し:
        //     一回目であれば全表示
        //     その他の場合は子ノードがディレクトリであれば表示
        for (var i=0; i<children.length; i++) {
            grand_children = children[i]["children"];
            if (index === "") {
            //1回目
                new_index = String(i);
                target_div.appendChild(createOption(new_index, children[i]["title"]));
                //console.info(children[i]["title"]);
                callback(children[i], new_index, callback);
            }else if (typeof(grand_children) !== "undefined") {
            //その他
                new_index = index + "|" + String(i);
                //console.info(indent, children[i]["title"]);
                target_div.appendChild(createOption(new_index, indent+children[i]["title"]));
                callback(children[i], new_index, callback);
            }
        }
    };

    //main
    chrome.bookmarks.getTree(function(bookmark_tree) {
        console.info(bookmark_tree[0]);
        getAllDir(bookmark_tree[0], "", getAllDir);
    });
};

    /*
    var applyToChildren = function(node, index, callback){
        for (var i=0; i<node.length; i++) {
            var new_index = index + "|" + i;
            //target_div.appendChild(createOption(new_index, children[i]["title"]));
            var children = node[i]["children"];
            if (typeof(children) !== "undefined" && children.length !== 0) {
                console.info(node[i]["title"]);
                var next_children = children[i]["children"];
                console.info(typeof(next_children));
                if (typeof(next_children) !== "undefined" && next_children.length !== 0) {
                    callback(children, new_index, callback);
                }
            }
        }
    };
    //main
    chrome.bookmarks.getTree(function(bookmark_tree) {
        var bookmark_tree = bookmark_tree[0]["children"];
        for(var i=0; i<bookmark_tree.length; i++) {
            //target_div.appendChild(createOption(i, bookmark_tree[i]["title"]));
            console.info(bookmark_tree[i]["title"]);
            var children = bookmark_tree[i]["children"];
            if (typeof(children) !== "undefined" && children.length !== 0) {
                applyToChildren(children, i, applyToChildren);
            }
        }
    });
    */
