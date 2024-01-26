function getCookie(name) {
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1) {
        begin = dc.indexOf(prefix);
        if (begin != 0) return null;
    }
    else
    {
        begin += 2;
        var end = document.cookie.indexOf(";", begin);
        if (end == -1) {
        end = dc.length;
        }
    }
    // because unescape has been deprecated, replaced with decodeURI
    //return unescape(dc.substring(begin + prefix.length, end));
    return decodeURI(dc.substring(begin + prefix.length, end));
} 

function checkNoodlCookie() {
    const cookieIsGone = window.location.href.indexOf("noodlapp") !== -1 && getCookie("X-Noodl-Auth") == null;
    if(cookieIsGone) {
        window.location.reload(true);
    }
}

 setInterval(checkNoodlCookie, 1000);