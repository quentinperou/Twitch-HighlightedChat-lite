"use strict";
/*** Twitch Highlighted Chat - lite ***/
/*** By QuentinPerou ***/

/*  lite-v2.2  */

(function () {
    document.addEventListener("DOMContentLoaded", initialiser);

    /*********************************************************/
    /*                 DECLATATION VARIABLES                 */
    /*********************************************************/
    let channelInUrl;
    const storagePrefix = 'HgltCt-';
    let onlyHighlighted = true;
    let scollBottom = true;
    let highlightedNotifSound = false;
    let messagesSave = true;
    let deleteOldMessages = true;
    let enableModCommand = true;
    // let mentionIsColorised = false;

    /*********************************************************/
    /*                   FONCTION PRINCIPALE                 */
    /*********************************************************/
    function initialiser() {
        console.log("%cHello ! Enjoy π\n πΈπΈπΈπΈπΈ", "background: #222; color: #FFF; font-size: 20px;");

        document.getElementById('notCoChannelInputSubmit').addEventListener('click', function () {
            if (document.getElementById('notCoChannelInput').value)
                window.location.href = `./?channel=${document.getElementById('notCoChannelInput').value.toLowerCase()}`;
        }, { passive: true });

        document.getElementById('notCoChannelInput').focus();
        document.getElementById('notCoChannelInput').addEventListener('keydown', (e) => {
            if (!e.repeat)
                if (e.key == 'Enter')
                    document.getElementById('notCoChannelInputSubmit').click();
        });

        document.getElementById('backToHomeButton').addEventListener('click', function () {
            ComfyJS.Disconnect();
            window.location.href = "./";
        }, { passive: true });

        if (sessionStorage.getItem(`${storagePrefix}onlyHighlightedCheck`) != undefined) {
            document.getElementById("onlyHighlightedCheck").checked = false;
            onlyHighlighted = false;
        }
        document.getElementById("onlyHighlightedCheck").addEventListener("input", function () {
            if (document.getElementById("onlyHighlightedCheck").checked) {
                onlyHighlighted = true;
                remove('[data-type="normal"]');
                sessionStorage.removeItem(`${storagePrefix}onlyHighlightedCheck`);
            } else {
                onlyHighlighted = false;
                sessionStorage.setItem(`${storagePrefix}onlyHighlightedCheck`, false);
            }
        });
        document.getElementById("highlightedNotifSound").addEventListener("input", function () {
            if (document.getElementById("highlightedNotifSound").checked) {
                highlightedNotifSound = true;
            } else {
                highlightedNotifSound = false;
            }
        });
        document.getElementById("enableModCommand").addEventListener("input", function () {
            if (document.getElementById("enableModCommand").checked)
                enableModCommand = true;
            else
                enableModCommand = false;
        });

        if (localStorage.getItem(`${storagePrefix}theme`) != undefined) {
            document.querySelector(`#choiceTheme input[value="${localStorage.getItem(`${storagePrefix}theme`)}"]`).checked = true;
            changeTheme(localStorage.getItem(`${storagePrefix}theme`));
        }
        document.querySelectorAll('#choiceTheme input').forEach(function (elm) {
            elm.addEventListener("input", function () {
                if (elm.checked) {
                    localStorage.setItem(`${storagePrefix}theme`, elm.value);
                    console.log("theme:", elm.value);
                    changeTheme(elm.value);
                }
                else
                    console.log("false", elm.value);
            });
        });
        function changeTheme(theme) {
            if (theme == "blue") {
                document.documentElement.classList.remove("styleDarkTheme");
                document.documentElement.classList.add("styleOriginalTheme");
            } if (theme == "dark") {
                document.documentElement.classList.remove("styleOriginalTheme");
                document.documentElement.classList.add("styleDarkTheme");
            }
        }
        document.getElementsByClassName('mainContainer')[0].addEventListener('click', function () {
            document.getElementById('headerBurger').classList.remove('menuVisible');
            document.getElementById('headerNav').classList.remove('menuVisible');
        });

        document.getElementById('clearCacheButton').addEventListener('click', function () {
            show('#popupDivContainer');
        });
        document.getElementById('clearCachePopupDelete').addEventListener('click', function () {
            sessionStorage.clear();
            localStorage.clear();
            hide('#popupDivContainer');
            document.getElementById('headerBurger').classList.remove('menuVisible');
            document.getElementById('headerNav').classList.remove('menuVisible');
            displayNotif('Cache clear !');
        });
        document.getElementById('clearCachePopupCancel').addEventListener('click', function () {
            hide('#popupDivContainer');
        });

        document.getElementById('headerBurger').addEventListener('click', function () {
            this.classList.toggle('menuVisible');
            document.getElementById('headerNav').classList.toggle('menuVisible');
        });

        document.getElementById('chatGoToBottom').addEventListener('click', function () {
            let objDiv = document.getElementById("hightlitedMessageChatContainer");
            objDiv.scrollTop = objDiv.scrollHeight;
            hide('#chatGoToBottom');
            scollBottom = true;
        }, { passive: true });

        /***************************/

        console.log(location.search.substr(1));
        if (location.search.substr(1).split('=')[0] == "channel") {
            channelInUrl = location.search.substr(1).split('=')[1].toLowerCase();
            if (channelInUrl) {
                ComfyJS.Init(channelInUrl);

                let titleChat = document.querySelector('.titleChat p');
                titleChat.innerHTML = titleChat.textContent + '<span translate="no">' + channelInUrl + '</span>';

                fetch(`https://decapi.me/twitch/avatar/${channelInUrl}`)
                    .then(function (response) {
                        return response.text();
                    })
                    .then(function (body) {
                        // console.log(body);
                        let channelProfilePicture = document.createElement('div');
                        let channelProfilePictureLink = document.createElement('a');
                        channelProfilePictureLink.href = `https://twitch.tv/${channelInUrl}`;
                        channelProfilePictureLink.target = '_blank';
                        let channelProfilePicturePic = document.createElement('img');
                        channelProfilePicturePic.src = body;
                        channelProfilePicturePic.id = "channelProfilePicturePic";
                        channelProfilePicturePic.alt = "profile picture";
                        channelProfilePicture.appendChild(channelProfilePictureLink);
                        channelProfilePictureLink.appendChild(channelProfilePicturePic);
                        document.querySelector('.titleChat').insertBefore(channelProfilePicture, document.querySelector('.titleChat p'));
                    });

                //// easter-egg ////
                if (channelInUrl == 'ponce')
                    titleChat.textContent = 'πΈ ' + titleChat.textContent + ' πΈ';

                //// rewrite title of this page
                document.title = `${channelInUrl} - Twitch Highlighted Chat`;
                displayConnectInterface();

                ComfyJS.onConnected = (address, port, isFirstConnect) => {
                    displayNotif(`Connected to <i>${channelInUrl.toUpperCase()}</i> 's chat`);
                    ///// restore saved messages /////
                    if (messagesSave) {
                        if (localStorage.getItem(`${storagePrefix}messagesSave-${channelInUrl}`) != undefined) {
                            let savedElem = JSON.parse(localStorage.getItem(`${storagePrefix}messagesSave-${channelInUrl}`));
                            let savedElemClean = [];
                            savedElem.forEach(function (el) {
                                //delete el.date if date il older than 5 day
                                let date = new Date(el.date);
                                let now = new Date();
                                if (now.getTime() - date.getTime() > 1000 * 60 * 60 * 24 * 5) {
                                    console.log("delete elements older than 5 day");
                                }
                                else savedElemClean.push(el);

                                if (el.isRead)
                                    addMessage(el.user, el.message, el.flags, el.self, el.extra, true, new Date(el.date)).setAttribute('read', '');
                                else
                                    addMessage(el.user, el.message, el.flags, el.self, el.extra, true, new Date(el.date));
                            });
                            localStorage.setItem(`${storagePrefix}messagesSave-${channelInUrl}`, JSON.stringify(savedElemClean)); //clean localStorage
                            let separationLine = document.createElement('span');
                            separationLine.style = 'display: block; height: 1px; background-color: #fff; margin: 2px 0;';
                            document.getElementById('hightlitedMessageChatContainer').appendChild(separationLine);
                        }
                    }
                }
                ComfyJS.onChat = (user, message, flags, self, extra) => {
                    // console.log('- MESSAGE (channel, user, msg) βΊ ', extra.channel, 'βΊ', user, 'βΊ', message);
                    if (!onlyHighlighted)
                        addMessage(user, message, flags, self, extra);
                    if (flags.highlighted == true) {
                        if (onlyHighlighted)
                            addMessage(user, message, flags, self, extra);
                        if (messagesSave) {
                            saveMessage(user, message, flags, self, extra);
                        }
                    }
                }
                ComfyJS.onCommand = (user, command, message, flags, extra) => {
                    // console.log(user, command, message, flags, extra);
                    if (enableModCommand && command === "+hmsg" && (flags.broadcaster || flags.mod || user.toLowerCase() == 'quentinperou')) {
                        if (!flags.highlighted) {
                            let thisMessage = addMessage(user, message, flags, false, extra, false);
                            thisMessage.style.backgroundColor = "var(--main-bg-color0)";
                            thisMessage.style.padding = '2px 5px';
                        }
                        else {
                            addMessage(user, '!' + command + ' ' + message, flags, false, extra);
                            if (messagesSave)
                                saveMessage(user, '!' + command + ' ' + message, flags, false, extra);
                        }
                    } else if (!onlyHighlighted) {
                        addMessage(user, '!' + command + ' ' + message, flags, false, extra);
                    } else if (flags.highlighted) {
                        addMessage(user, '!' + command + ' ' + message, flags, false, extra);
                    }
                }
                ComfyJS.onError = (error) => {
                    console.log(error);
                }
            }
        } ///////////////////////////////////////

        /****** Scroll ******/
        document.getElementById('hightlitedMessageChatContainer').addEventListener('wheel', function onScroll(evt) {
            if (evt.deltaY < 0) {
                if (this.clientHeight != this.scrollHeight) {
                    scollBottom = false;
                    show('#chatGoToBottom');
                }
            } else if (evt.deltaY > 0) {
                if (this.scrollTop + this.clientHeight == this.scrollHeight) {
                    scollBottom = true;
                    hide('#chatGoToBottom');
                }
            }
        }, { passive: true });

        // let updateMsg = addMessage("βΊ System β", "(25/01/2022) UPDATE ! You can now change the color theme ! Go to menu ;) ", {}, false, {});
        // updateMsg.parentElement.style.backgroundColor = "var(--bg-adminMsg)";
        // updateMsg.parentElement.addEventListener('click', function () { this.remove(); });

    } //************* END FONCTION PRINCIPALE **************/
    //*********************************************************************************/

    function displayConnectInterface() {
        // show('#backToHomeButton');
        show('#optionsDiv');
        show('#optionsDiv div');
        show('#choiceTheme');
        show('#backToHomeButton');
        show('#clearCacheButton');
        show('.divConnect');
        hide('.divNotConnect');
        document.getElementById('headerBurger').classList.add('displayOn');
    }

    function displayNotif(texteNotif) {
        var uniqueId = Math.floor(Math.random() * Date.now())
        document.getElementById('notifContainer').innerHTML += `<div class="oneNotifContainer hide"> <div id="notifNow${uniqueId}" class="notif"> <p class="notifTitle">${texteNotif}</p> </div></div>`;
        setTimeout(function () {
            document.getElementById(`notifNow${uniqueId}`).parentElement.classList.remove('hide');
        }, 10);
        setTimeout(function () {
            document.getElementById(`notifNow${uniqueId}`).parentElement.classList.add('hide');
            setTimeout(function () {
                document.getElementById(`notifNow${uniqueId}`).parentElement.remove();
            }, 400);
        }, 2700);
    }

    function saveMessage(user, message, flags, self, extra) {
        if (localStorage.getItem(`${storagePrefix}messagesSave-${channelInUrl}`) == undefined) {
            let msgToSave = { user, message, flags, self, extra, isRead: false, date: new Date() };
            localStorage.setItem(`${storagePrefix}messagesSave-${channelInUrl}`, JSON.stringify([msgToSave]));
        } else {
            let msgToSave = { user, message, flags, self, extra, isRead: false, date: new Date() };
            let data = JSON.parse(localStorage.getItem(`${storagePrefix}messagesSave-${channelInUrl}`));
            data.push(msgToSave);
            localStorage.setItem(`${storagePrefix}messagesSave-${channelInUrl}`, JSON.stringify(data));
        }
    }

    function addMessage(user, message, flags, self, extra, isArchive, date) {
        if (isArchive == undefined)
            isArchive = false;
        let dateUndefined = false;
        if (date == undefined) {
            date = new Date();
            dateUndefined = true;
        }
        // console.log(user, message, flags, self, extra, isArchive);
        let thisMsgId = extra.id;
        let leMessage = message.toString();

        let messageDate = date;
        let messagHours = "0" + messageDate.getHours();
        let messagMinutes = "0" + messageDate.getMinutes();
        messagHours = messagHours.substr(-2);
        messagMinutes = messagMinutes.substr(-2);

        ///////// Sub Badge /////////
        let badgeInfos = "";
        if (flags.subscriber == true) {
            if (extra.userBadges.subscriber != undefined)
                if ((extra.userBadges.subscriber).length == 4)
                    badgeInfos = `(Tier ${extra.userBadges.subscriber.match(/^[0-9]/g)[0]})`;
        }

        //////// Create message div ////////
        let newMessageDiv = document.createElement('div');
        newMessageDiv.classList.add("chat-lineMessage");

        let newMessageName = document.createElement('div');
        newMessageName.classList.add("chat-lineNameDiv");
        newMessageDiv.appendChild(newMessageName);
        newMessageName.innerHTML = `${flags.mod ? '<img src="img/mod.png" title="Moderator" class="chat-lineBadge">' : ''}
                                    ${flags.vip ? '<img src="img/vip.png" title="VIP" class="chat-lineBadge">' : ''}
                                    ${flags.broadcaster ? '<img src="img/broadcaster.png" title="Broadcaster" class="chat-lineBadge">' : ''}
                                    ${flags.subscriber ? `<img src="img/sub.png" title="${extra.userState['badge-info'].subscriber.match(/[0-9]+$/g)}-Month Subscriber ${badgeInfos}" class="chat-lineBadge">` : ''}
                                    <span class="chat-lineName" translate="no">${user}</span>`;
        if (!isArchive || !dateUndefined) {
            let newMessageTime = document.createElement('span');
            newMessageTime.classList.add("chat-messageTime");
            newMessageTime.textContent = `${messagHours}:${messagMinutes}`;
            newMessageName.prepend(newMessageTime);
            if (isArchive) {
                let newMessageDate = document.createElement('span');
                newMessageDate.classList.add("chat-messageDate");
                newMessageDate.textContent = `${((messageDate.getDate() + 1) < 10 ? '0' : '') + (messageDate.getDate())}/${((messageDate.getMonth() + 1) < 10 ? '0' : '') + (messageDate.getMonth() + 1)}/${messageDate.getFullYear()} - `;
                newMessageName.insertBefore(newMessageDate, newMessageTime);
                newMessageDiv.setAttribute("data-archive", true);
            }
        }

        let messageSeparator = document.createElement('span');
        messageSeparator.classList.add("chat-messageSeparator");
        messageSeparator.textContent = ":";
        newMessageName.appendChild(messageSeparator);

        let messageContent = document.createElement('span');
        messageContent.classList.add("chat-message");
        messageContent.setAttribute("translate", "no");
        if (flags.highlighted == true) {
            messageContent.classList.add('chat-message-highlighted');
            newMessageDiv.setAttribute("data-type", "highlighted");
            messageContent.setAttribute("title", "Click to mark as read");
            messageContent.addEventListener("click", function () {
                let elemSave = JSON.parse(localStorage.getItem(`${storagePrefix}messagesSave-${channelInUrl}`));
                let elemSaveThisIndex = elemSave.findIndex(elem => elem.extra.id == thisMsgId);
                if (this.hasAttribute('read')) {
                    this.removeAttribute('read');
                    elemSave[elemSaveThisIndex].isRead = false;
                } else {
                    this.setAttribute('read', '');
                    elemSave[elemSaveThisIndex].isRead = true;
                }
                localStorage.setItem(`${storagePrefix}messagesSave-${channelInUrl}`, JSON.stringify(elemSave));
                // console.log('Elem stored edit');
            });
            if (!isArchive) {
                if (highlightedNotifSound) {
                    let audioNotif = new Audio('sound_notif2.aac');
                    audioNotif.volume = 0.5;
                    //// easter-egg ////
                    if (channelInUrl == 'ponce')
                        audioNotif = new Audio('sound_notif_ponce.aac'),
                            audioNotif.volume = 0.7;
                    audioNotif.play();
                }
            }
        } else
            newMessageDiv.setAttribute("data-type", "normal");
        messageContent.textContent = leMessage;
        newMessageDiv.appendChild(messageContent);

        document.getElementById('hightlitedMessageChatContainer').appendChild(newMessageDiv);

        ///// scroll bottom 
        let objDiv = document.getElementById("hightlitedMessageChatContainer");
        if (scollBottom)
            objDiv.scrollTop = objDiv.scrollHeight;

        ////// EMOTES
        let emoteInMessage = extra.messageEmotes;
        if (emoteInMessage != null) {
            let emotesName = [];
            let messageTexte = messageContent.textContent;
            let messageWithEmote = messageTexte;
            for (const [key, value] of Object.entries(emoteInMessage)) {
                for (const [key2, value2] of Object.entries(value)) {
                    let emotePosition = value2.split('-');
                    let emoteName = messageTexte.substring(emotePosition[0], parseInt(emotePosition[1], 10) + 1);
                    if (!(emotesName.some(elem => elem === emoteName))) {
                        emotesName.push(emoteName);
                        messageWithEmote = messageWithEmote.replaceAll(emoteName, `</span><img alt="${emoteName}" title="${emoteName}" class="chat-messageEmote" src="https://static-cdn.jtvnw.net/emoticons/v1/${key}/1.0"><span class="messageFragment">`);
                    }
                }
            }
            messageContent.innerHTML = messageWithEmote;
            messageContent.classList.add('chat-message-withEmote');
        }

        // if (mentionIsColorised) {
        //     let messageMention = messageContent.innerHTML;
        //     let mentionMatch = /(@[a-zA-Z0-9]+)/gim;
        //     console.log(mentionMatch);
        //     messageMention = messageMention.replace(mentionMatch, '<span class="chat-messageMention">$1</span>');
        //     messageContent.innerHTML = messageMention;
        // }

        ///// Delete old message 
        if (deleteOldMessages && scollBottom) {
            while (document.querySelectorAll('.chat-lineMessage[data-type="normal"]').length > 150) {
                document.querySelector('.chat-lineMessage[data-type="normal"]').remove();
            }
        }

        return messageContent;
    }

    /*********************************************************/
    /*                FONCTION GLOBALES - TOOLS              */
    /*********************************************************/
    function hide(selector) {
        document.querySelectorAll(selector).forEach(elem => elem.hidden = true);
    }
    function show(selector) {
        document.querySelectorAll(selector).forEach(elem => elem.hidden = false);
    }
    function remove(selector) {
        document.querySelectorAll(selector).forEach(elem => elem.remove());
    }

}());
