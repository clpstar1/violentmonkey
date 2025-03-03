// ==UserScript==
// @name        Safebooru keyboard controls
// @namespace   Violentmonkey Scripts
// @match       *://*safebooru*/index.php?page=post*
// @version     1.0
// @author      -
// @description 
// ==/UserScript==

const baseUrl = "https://safebooru.org";
const galleryPosition = 0

    // TODO Add Keyboard navigation for list view

    (function () {

        // gallery view
        if (document.location.toString().includes("s=list")) {
            let posts = document
                .body
                .getElementsByClassName("thumb")

            let hrefs = []
            for (let post of posts) {
                hrefs.push(post.children[0].attributes.getNamedItem("href").value)
            }

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

            document.addEventListener("keydown", ev => {
                // move left
                if (ev.key == "h") {

                }
                // move up
                if (ev.key == "j") {

                }
                // move down
                if (ev.key == "k") {

                }
                // move right
                if (ev.key == "l") {

                }
            })
        }

        // post view
        else {
            let currentId = document.location.toString().split("id")[1].slice(1)
            let hrefs = localStorage.getItem("safebooru-hrefs").split(";")
            let url = localStorage.getItem("safebooru-url")
            let pid = parseInt(localStorage.getItem("safebooru-pid"))

            document.addEventListener("keydown", ev => {
                // return to list view
                if (ev.key == "k") {
                    window.location.href = url + "&pid=" + pid
                }

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
                        let nextPid = (pid == 0 ? 0 : (pid - hrefs.length)).toString()
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
