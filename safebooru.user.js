// ==UserScript==
// @name        Safebooru enhancement
// @namespace   Violentmonkey Scripts
// @match       *://*safebooru*/index.php?page=post*
// @version     1.0
// @author      -
// @description 2/12/2025, 3:06:31 PM
// ==/UserScript==

const baseUrl = "https://safebooru.org";


(function () {
    console.log("Hello Safebooru")

    // gallery view
    if (document.location.toString().includes("s=list")) {
        let posts = document
            .body
            .getElementsByClassName("thumb")

        let hrefs = []
        for (let post of posts) {
            hrefs.push(post.children[0].attributes.getNamedItem("href").value)
        }

        console.log(hrefs)

        let pid = "0"
        let url = window.location.href

        let match = window.location.href.match(/(.*)&pid=(\d+)/)
        if (match && match.length > 2) {
            pid = match[2]
            url = match[1]
        }

        localStorage.setItem("safebooru-hrefs", hrefs.join(";"))
        localStorage.setItem("safebooru-pid", pid)
        localStorage.setItem("safebooru-url", url)
    }

    // post view
    else {
        let currentId = document.location.toString().split("id")[1].slice(1)

        let hrefs = localStorage.getItem("safebooru-hrefs").split(";")

        console.log(hrefs)

        console.log(currentId)

        document.addEventListener("keydown", ev => {
            // navigate backwards
            if (ev.key == "h") {
                let cur = 0;

                for (let href of hrefs) {
                    if (href.endsWith(currentId)) {
                        break
                    }
                    cur += 1
                }

                if (cur == 0) {
                    let url = localStorage.getItem("safebooru-url")
                    let pid = localStorage.getItem("safebooru-pid")
                    let nextPid = (parseInt(pid) - hrefs.length).toString()
                    window.location.href = url + "&pid=" + nextPid
                    return;
                }

                window.location = baseUrl + hrefs[cur - 1]

            }

            // navigate forwards
            if (ev.key == "l") {
                let cur = 0

                for (let href of hrefs) {
                    if (href.endsWith(currentId)) {
                        break
                    }
                    cur += 1
                }

                if (cur == hrefs.length - 1) {
                    let url = localStorage.getItem("safebooru-url")
                    let pid = localStorage.getItem("safebooru-pid")
                    let nextPid = (parseInt(pid) + hrefs.length).toString()
                    window.location.href = url + "&pid=" + nextPid
                }
                else {
                    window.location = baseUrl + hrefs[cur + 1]
                }

            }
        })

    }

})()
