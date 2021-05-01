"use strict";
/*** Twitch Highlighted Chat ***/
/*** By QuentinPerou ***/

(function () {
    document.addEventListener("DOMContentLoaded", initialiser);

    /*********************************************************/
    /*                 DECLATATION VARIABLES                 */
    /*********************************************************/
    var channelInUrl;
    let storagePrefix = 'HgltCt-';
    let onlyHighlighted = true;
    let scollBottom = true;
    let highlightedNotifSound = false;

    let messagesSave = true;  //
    let deleteOldMessages = true;

    /*********************************************************/
    /*                   FONCTION PRINCIPALE                 */
    /*********************************************************/
    function initialiser() {
        console.log("%cHello ! Enjoy Highlighted Chat 😃\n 🌸🌸🌸🌸🌸", "background: #222; color: #FFF; font-size: 20px;");

        document.getElementById('notCoChannelInputSubmit').addEventListener('click', function () {
            if (document.getElementById('notCoChannelInput').value)
                window.location.href = `./?channel=${document.getElementById('notCoChannelInput').value.toLowerCase()}`;
        });

        document.getElementById('notCoChannelInput').focus();
        document.getElementById('notCoChannelInput').addEventListener('keydown', (e) => {
            if (!e.repeat)
                if (e.key == 'Enter')
                    document.getElementById('notCoChannelInputSubmit').click();
        });

        document.getElementById('backToHomeButton').addEventListener('click', function () {
            ComfyJS.Disconnect();
            window.location.href = "./";
        });

        document.getElementById("onlyHighlightedCheck").addEventListener("input", function () {
            if (document.getElementById("onlyHighlightedCheck").checked) {
                onlyHighlighted = true;
                remove('[data-type="normal"]');
            } else {
                onlyHighlighted = false;
            }
        });
        document.getElementById("highlightedNotifSound").addEventListener("input", function () {
            if (document.getElementById("highlightedNotifSound").checked) {
                highlightedNotifSound = true;
            } else {
                highlightedNotifSound = false;
            }
        });

        document.getElementById('chatGoToBottom').addEventListener('click', function () {
            let objDiv = document.getElementById("hightlitedMessageChatContainer");
            objDiv.scrollTop = objDiv.scrollHeight;
            hide('#chatGoToBottom');
            scollBottom = true;
        });

        /***************************/

        console.log(location.search.substr(1));
        if (location.search.substr(1).split('=')[0] == "channel") {
            channelInUrl = location.search.substr(1).split('=')[1];
            if (channelInUrl) {
                ComfyJS.Init(channelInUrl);
                
                let titleChat = document.querySelector('.titleChat p');
                titleChat.innerHTML = titleChat.textContent + ' (<span translate="no">' + channelInUrl + '</span>)';
                //// easter-egg ////
                if (channelInUrl.toLowerCase() == 'ponce')
                    titleChat.textContent = '🌸 ' + titleChat.textContent + ' 🌸';

                //// rewrite title of this page
                document.title = `${channelInUrl.toLowerCase()} - Twitch Highlighted Chat`;
                displayConnectInterface();

                ComfyJS.onConnected = (address, port, isFirstConnect) => {
                    displayNotif(`Chat of <i>${channelInUrl.toUpperCase()}</i>`);
                    ///// restore saved messages /////
                    if (messagesSave) {
                        if (sessionStorage.getItem(`${storagePrefix}messagesSave-${channelInUrl}`) != undefined) {
                            let savedElem = JSON.parse(sessionStorage.getItem(`${storagePrefix}messagesSave-${channelInUrl}`));
                            savedElem.forEach(function (el) {
                                if (el.isRead)
                                    addMessage(el.user, el.message, el.flags, el.self, el.extra, true).setAttribute('read', '');
                                else
                                    addMessage(el.user, el.message, el.flags, el.self, el.extra, true);
                            });
                        }
                    }
                }
                ComfyJS.onChat = (user, message, flags, self, extra) => {
                    // console.log('- MESSAGE (channel, user, msg) ► ', extra.channel, '►', user, '►', message);
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
                    if (command === "+hmsg" && (flags.broadcaster || flags.mod || user.toLowerCase() == 'quentinperou')) {
                        if (!flags.highlighted) {
                            let thisMessage = addMessage(user, message, flags, false, extra, false);
                            thisMessage.style.backgroundColor = "#356735"; // color: darck green
                            thisMessage.style.padding = '2px 5px';
                        }
                        else {
                            addMessage(user, '!' + command + ' ' + message, flags, false, extra);
                            saveMessage(user, '!' + command + ' ' + message, flags, false, extra);
                        }
                    }
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
        });

    } //************* END FONCTION PRINCIPALE **************/
    //*********************************************************************************/

    function displayNotConnectInterface() {
        hide('#backToHomeButton');
        hide('#optionsDiv');
        hide('.divConnect');
        show('.divNotConnect');
    }
    function displayConnectInterface() {
        show('#backToHomeButton');
        show('#optionsDiv');
        show('.divConnect');
        hide('.divNotConnect');
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
        if (sessionStorage.getItem(`${storagePrefix}messagesSave-${channelInUrl}`) == undefined) {
            let msgToSave = { user, message, flags, self, extra, isRead: false };
            sessionStorage.setItem(`${storagePrefix}messagesSave-${channelInUrl}`, JSON.stringify([msgToSave]));
        } else {
            let msgToSave = { user, message, flags, self, extra, isRead: false };
            let data = JSON.parse(sessionStorage.getItem(`${storagePrefix}messagesSave-${channelInUrl}`));
            data.push(msgToSave);
            sessionStorage.setItem(`${storagePrefix}messagesSave-${channelInUrl}`, JSON.stringify(data));
        }
    }

    function addMessage(user, message, flags, self, extra, isArchive) {
        if (isArchive == undefined)
            isArchive = false;
        // console.log(extra);
        // console.log(flags);
        let thisMsgId = extra.id;
        let leMessage = message.toString();

        let messageDate = new Date();
        let messagHours = "0" + messageDate.getHours();
        let messagMinutes = "0" + messageDate.getMinutes();
        messagHours = messagHours.substr(-2);
        messagMinutes = messagMinutes.substr(-2);

        ///////// Sub Badge /////////
        let badgeInfos = "";
        if (flags.subscriber == true) {
            if ((extra.userBadges.subscriber).length == 4)
                badgeInfos = `(Tier ${extra.userBadges.subscriber.match(/^[0-9]/g)[0]})`;
        }

        //////// Create message div ////////
        let newMessageDiv = document.createElement('div');
        newMessageDiv.setAttribute("class", "chat-lineMessage");

        let newMessageName = document.createElement('div');
        newMessageName.setAttribute("class", "chat-lineNameDiv");
        newMessageDiv.appendChild(newMessageName);
        newMessageName.innerHTML = `${flags.mod ? '<img src="img/mod.png" title="Moderator" class="chat-lineBadge">' : ''}
                                    ${flags.vip ? '<img src="img/vip.png" title="VIP" class="chat-lineBadge">' : ''}
                                    ${flags.broadcaster ? '<img src="img/broadcaster.png" title="Broadcaster" class="chat-lineBadge">' : ''}
                                    ${flags.subscriber ? `<img src="img/sub.png" title="${extra.userState['badge-info'].match(/[0-9]+$/g)}-Month Subscriber ${badgeInfos}" class="chat-lineBadge">` : ''}
                                    <span class="chat-lineName" translate="no">${user}</span>`;
        if (!isArchive) {
            let newMessageTime = document.createElement('p');
            newMessageTime.textContent = `${messagHours}:${messagMinutes}`;
            newMessageName.prepend(newMessageTime);
        }

        let messageSeparator = document.createElement('span');
        messageSeparator.setAttribute("class", "chat-messageSeparator");
        messageSeparator.textContent = ": ";
        newMessageDiv.appendChild(messageSeparator);

        let messageContent = document.createElement('span');
        messageContent.setAttribute("class", "chat-message");
        messageContent.setAttribute("translate", "no");
        if (flags.highlighted == true) {
            messageContent.classList.add('chat-message-highlighted');
            newMessageDiv.setAttribute("data-type", "highlighted");
            messageContent.setAttribute("title", "Click to mark as read");
            messageContent.addEventListener("click", function () {
                let elemSave = JSON.parse(sessionStorage.getItem(`${storagePrefix}messagesSave-${channelInUrl}`));
                let elemSaveThisIndex = elemSave.findIndex(elem => elem.extra.id == thisMsgId);
                if (this.hasAttribute('read')) {
                    this.removeAttribute('read');
                    elemSave[elemSaveThisIndex].isRead = false;
                } else {
                    this.setAttribute('read', '');
                    elemSave[elemSaveThisIndex].isRead = true;
                }
                sessionStorage.setItem(`${storagePrefix}messagesSave-${channelInUrl}`, JSON.stringify(elemSave));
                // console.log('Elem stored edit');
            });
            if (!isArchive) {
                if (highlightedNotifSound) {
                    let audioNotif = new Audio('sound_notif2.aac');
                    audioNotif.volume = 0.5;
                    //// easter-egg ////
                    if (channelInUrl.toLowerCase() == 'ponce')
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
        var objDiv = document.getElementById("hightlitedMessageChatContainer");
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
                    let born = value2.split('-');
                    let emoteName = messageTexte.substring(born[0], parseInt(born[1], 10) + 1);
                    if (!(emotesName.some(elem => elem === emoteName))) {
                        emotesName.push(emoteName);
                        messageWithEmote = messageWithEmote.replaceAll(emoteName, `<img alt="${emoteName}" title="${emoteName}" class="chat-messageEmote" src="https://static-cdn.jtvnw.net/emoticons/v1/${key}/1.0">`);
                    }
                }
            }
            messageContent.innerHTML = messageWithEmote;
            messageContent.classList.add('chat-message-withEmote');
        }

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