// ==UserScript==
// @name        Porn Reminder
// @namespace   Violentmonkey Scripts
// @match       *://*hentai*/*
// @match       *://*porn*/*
// @match       *://*sxyprn*/*
// @match       *://*mat6tube*/*
// @match       *://*donmai.us/*
// @match       *://*gelbooru*/*
// @match       *://*sankakucomplex*/*
// @include      /.*4chan.*[ehd]/
// @grant       GM_xmlhttpRequest
// @grant       GM_getValues
// @version     1.0
// @author      -
// @description 2/12/2025, 3:06:31 PM
// ==/UserScript==

var showPopup = true;
var gh_token = undefined;
var gh_url = undefined;
var streak_global = "0";

(function () {
    'use strict';

    if (sessionStorage.getItem("showPopup") == "false") {
        return;
    }

    let values = GM_getValues(['gh_token', 'gh_url'])
    gh_token = values['gh_token']
    gh_url = values['gh_url']

    displayPopup()
})();

function getStreak() {
    if (gh_token == undefined || gh_url == undefined) {
        console.log("not getting streak, variable(s) undefined")
        return Promise.resolve("0")
    }

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
                    /*
                    {
                      "name": "USERNAME",
                      "value": "octocat",
                      "created_at": "2021-08-10T14:59:22Z",
                      "updated_at": "2022-01-10T14:59:22Z"
                    }
                    */
                    let json = JSON.parse(response.response)
                    if (response.status != 200) reject(response)

                    let today = new Date(Date.now())
                    today.setHours(0, 0, 0, 0)
                    let brokenOn = new Date(json.value)
                    brokenOn.setHours(0, 0, 0, 0)

                    return resolve(Math.round((today.getTime() - brokenOn.getTime()) / (1000 * 3600 * 24)))

                }
                catch (e) {
                    reject(e)
                }
            },
            onerror: function (response) {
                reject(response)
            }
        }
        GM_xmlhttpRequest(details)
    })

}

function resetStreak() {
    if (gh_token == undefined || gh_url == undefined) {
        console.debug("not resetting streak, variable(s) undefined")
        return Promise.resolve()
    }

    return new Promise((resolve, reject) => {

        if (streak_global == "0") {
            console.debug("not resetting streak, streak is already 0")
            resolve()
        }

        let today = new Date()
        let dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`

        let details = {
            url: gh_url,
            method: "PATCH",
            headers: {
                "Authorization": gh_token,
                "Accept": "application/vnd.github+json"
            },
            data: JSON.stringify(
                {
                    name: "COUNTER",
                    value: dateString
                }
            ),
            onload: function (response) {
                if (response.status != 204) reject(response)
                resolve()
            },
            onerror: function (response) {
                reject(response)
            }
        }
        GM_xmlhttpRequest(details)
    })
}

function displayPopup() {

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
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; margin-left: 16px; margin-right: 16px;">
                    <img style="width:300px; height=290px;"src="https://github.com/clpstar1/violentmonkey/blob/7d68965e13bf7f8455490841c7d32d7a23bb6b22/romatic2.gif?raw=true"/>
                    <h2 style="color: initial">Are you sure you want to look at porn?</h2>
                    <p/>
                    <button style="color: initial" id="proceedBtn">Break Streak</button>
                    <p/>
                    <p style="color: initial">You've already resisted for: <strong id="counterLabel">${counter}</strong> days!</p>
                </div>
            `;

    document.body.appendChild(popup);

    getStreak()
        .then(streak => {
            document.getElementById("counterLabel").innerHTML = streak
            streak_global = streak
        })
        .catch(e => console.error(e))


    document.getElementById('proceedBtn').addEventListener('click', () => {
        resetStreak()
            .catch(reason => console.error(reason))
            .finally(() => {
                sessionStorage.setItem("showPopup", "false")
                document.body.removeChild(popup)
            })
    })
}
