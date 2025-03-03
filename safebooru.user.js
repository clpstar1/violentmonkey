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

        localStorage.setItem("safebooru-hrefs", hrefs.join(";"))
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

                window.location = baseUrl + hrefs[cur + 1]
            }
        })

    }

})()
