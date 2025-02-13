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
// @version     1.0
// @author      -
// @description 2/12/2025, 3:06:31 PM
// ==/UserScript==

var showPopup = true;
var debug = false;

(function () {
    'use strict';

    if (!showPopup) return;

    let values = GM_getValues(['token', 'counter_url', 'redirect_url', 'debug'])
    let gh_token = values['token']
    let gh_url = values['counter_url']
    let redirect_url = values['redirect_url'] || "https://www.youtube.com"
    console.log(values)
    debug = values['debug'] == true || false;
    console.log(debug)

    displayPopup(gh_token, gh_url, redirect_url);

})();

function getCounterFromGh(gh_token, gh_url) {
    return new Promise((resolve, reject) => {
        const details = {
            url: gh_url,
            method: "GET",
            headers: {
                "Authorization": gh_token,
                "Accept": "application/vnd.github+json"
            },

            onload: function (response) {
                resolve(response)
            },
            onerror: (response) => {
                resolve(response)
            }
        }
        GM_xmlhttpRequest(details)
    })
}


function updateGhCounter(newValue, sha, gh_token, gh_url) {
    return new Promise((resolve, reject) => {
        const details = {
            url: gh_url,
            method: "PUT",
            headers: {
                "Authorization": gh_token,
                "Accept": "application/vnd.github+json"
            },
            data: JSON.stringify({
                message: "update counter",
                content: btoa(JSON.stringify({ counter: newValue.toString() })),
                sha: sha
            }),
            // https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents
            onload: function (response) {
                resolve(response)
            },
            onerror: function (response) {
                resolve(response)
            }
        }
        GM_xmlhttpRequest(details)
    })
}

function displayPopup(gh_token, gh_url, redirect_url) {

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
        getCounterFromGh(gh_token, gh_url)
            .then(response => {
                try {
                    let responseJson =JSON.parse(response.response)
                    if (debug) {
                        console.log("get response:")
                        console.log(JSON.stringify(responseJson, null, 2))
                    }
                    if (response.status >= 400) throw new Error(response)
                    counterDecoded = atob(responseJson.content)
                    let counterJson = JSON.parse(counterDecoded)
                    counter = parseInt(counterJson.counter)
                    let sha = responseJson.sha

                    document.getElementById("counterLabel").innerHTML = counter
                    document.getElementById('proceedBtn').addEventListener('click', () => {
                        updateGhCounter(0, sha, gh_token, gh_url)
                            .then((response) => {
                                if (debug) {
                                    let responseJson =JSON.parse(response.response)
                                    console.log("get response:")
                                    console.log(JSON.stringify(responseJson, null, 2))
                                } else {
                                    showPopup = false;
                                    document.body.removeChild(popup)
                                }
                            })
                            .catch(e => console.error(e))
                    })
                    document.getElementById('resistBtn').addEventListener('click', () => {
                        updateGhCounter(counter + 1, sha, gh_token, gh_url)
                            .then((response) => { 
                                if (debug) {
                                    let responseJson =JSON.parse(response.response)
                                    console.log("post response:")
                                    console.log(JSON.stringify(responseJson, null, 2))
                                } else {
                                    window.location.href = redirect_url
                                }
                            })
                            .catch(e => console.error(e))
                    })
                }
                catch (e) {
                    console.error(e)
                }
            })
            .catch(e => console.error(e))
    } else {
        document.getElementById('proceedBtn').addEventListener('click', () => {
            showPopup = false
            document.body.removeChild(popup)
        });

        document.getElementById('resistBtn').addEventListener('click', () => window.location.href = redirect_url)
    }

}
