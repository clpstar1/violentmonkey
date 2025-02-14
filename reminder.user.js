/* Instructions

What: 
When you access a site which matches one of the Violentmonkey @match rules below
this script will show a fullscreen modal as a reminder if you really want to continue.
You're free to continue by pressing the "Break Streak" Button which will grant access to the site.
If you press "Resist" it will redirect the browser tab to a user defined web-page.

As a little motivation to resist accessing the site the script will try to count how often you resisted and
show it in the modal. If you access the site, the counter will reset to 0, if you resist it goes up by 1.
The current implementation uses github repositories as a persistence layer for storing the counter.
See Counter-Integration in the Setup section. 
This is optional though. If you wish to skip it, the counter will show N/A as a default.

Setup: 
- Install Violentmonkey and add this Script as a userscript

Counter-Integration:
- Setup a Github repository and create a file counter.json with the contents
{
"counter" : "0"
}
- Create a fine grained access token with Read and Write Access for that Repository 
- Create the following Violentmonkey Values for the Userscript:
{
"gh_token" : "Bearer <YOUR-CREATED-GITHUB-TOKEN>"
"gh_url" : "https://api.github.com/repos/<YOUR-USERNAME>/<YOUR-REPONAME>/contents/counter.json
"redirect_url": "<YOUR-PREFERRED-REDIRECT-URL>"
}

Known Problems:
The counter sometimes doesn't seem to update instantly. 
If thats of concern to you, you should seek other ways to store the counter than Gihtub.


*/

// ==UserScript==
// @name        Porn Reminder
// @namespace   Violentmonkey Scripts
// @match       *://*hentai*/*
// @match       *://*porn*/*
// @match       *://4chan*/h/*
// @match       *://sxyprn*/*
// @match       *://mat6tube*/*
// @grant       GM_xmlhttpRequest
// @grant       GM_getValues
// @grant       window.close
// @version     1.0
// @author      -
// @description 2/12/2025, 3:06:31 PM
// ==/UserScript==

var showPopup = true;
var gh_token = undefined;
var gh_url = undefined;

(function () {
    'use strict';

    if (!showPopup) return;

    let values = GM_getValues(['gh_token', 'gh_url', 'redirect_url', 'debug'])
    gh_token = values['gh_token']
    gh_url = values['gh_url']

    displayPopup()

})();

function getGhCounter() {

    return new Promise((resolve, reject) => {
        const details = {
            url: gh_url,
            method: "GET",
            headers: {
                "Authorization": gh_token,
                "Accept": "application/vnd.github+json"
            },

            onload: function (response) {
                try {
                    let responseJson = JSON.parse(response.response)
                    console.debug("get response:")
                    console.debug(JSON.stringify(responseJson, null, 2))
                    if (response.status != 200) reject(response)
                    let counterDecoded = atob(responseJson.content)
                    let counterJson = JSON.parse(counterDecoded)
                    let counter = parseInt(counterJson.counter)
                    resolve([counter, responseJson.sha])
                }
                catch (e) {
                    reject(e)
                }
            },
            onerror: (response) => {
                reject(response)
            }
        }
        GM_xmlhttpRequest(details)
    })
}


function updateGhCounter(update_fn) {
    return new Promise((resolve, reject) => {
        getGhCounter()
            .then(([counter, sha]) => {
                let new_counter = update_fn(counter)
                let details = {
                    url: gh_url,
                    method: "PUT",
                    headers: {
                        "Authorization": gh_token,
                        "Accept": "application/vnd.github+json"
                    },
                    data: JSON.stringify({
                        message: "update counter",
                        content: btoa(JSON.stringify({ counter: new_counter.toString() })),
                        sha: sha
                    }),
                    // https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents
                    onload: function (response) {
                        let responseJson = JSON.parse(response.response)
                        console.debug("post response:")
                        console.debug(JSON.stringify(responseJson, null, 2))
                        if (response.status != 200) reject(response)
                        resolve(new_counter)
                    },
                    onerror: function (response) {
                        reject(response)
                    }
                }
                GM_xmlhttpRequest(details)
            })

    })
}

function displayPopup() {

    if (!showPopup) return;

    var counter = 'N/A'

    // Create a modal popup
    const popup = document.createElement('div')
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.width = '100vw';
    popup.style.height = '100vh';
    popup.style.backgroundColor = 'white'
    popup.style.color = 'white';
    popup.style.display = 'flex';
    popup.style.justifyContent = 'center';
    popup.style.alignItems = 'center';
    popup.style.flexDirection = 'column'
    popup.style.fontSize = '24px';
    popup.style.zIndex = '10000';
    popup.innerHTML = `
                <h2 style="color: initial">Are you sure you want to look at porn?</h2>
                <p/>
                <button style="color: initial" id="proceedBtn">Break Streak</button>
                <button style="color: initial" id="resistBtn">Resist</button>
                <p/>
                <p style="color: initial">You've already resisted: <strong id="counterLabel">${counter}</strong> times!</p>
            `;

    document.body.appendChild(popup);

    if (gh_token != undefined && gh_url != undefined) {
        getGhCounter()
            .then(([counter, _]) => document.getElementById("counterLabel").innerHTML = counter)
            .catch(reason => console.error(reason))
    }

    if (gh_token != undefined && gh_url != undefined) {
        document.getElementById('proceedBtn').addEventListener('click', () => {
            updateGhCounter((_ => 0))
                .then(new_counter => document.getElementById("counterLabel").innerHTML = new_counter)
                .catch(reason => console.error(reason))
                .finally(() => {
                    showPopup = false
                    document.body.removeChild(popup)
                })
        })
        document.getElementById('resistBtn').addEventListener('click', () => {
            updateGhCounter(old_counter => parseInt(old_counter) + 1)
                .then(new_counter => document.getElementById("counterLabel").innerHTML = new_counter)
                .catch(reason => console.error(reason))
                .finally(() => {
                    window.close()
                })

        })
    } else {
        document.getElementById('proceedBtn').addEventListener('click', () => {
            showPopup = false
            document.body.removeChild(popup)
        });

        document.getElementById('resistBtn').addEventListener('click', () => window.location.href = redirect_url)
    }

}
