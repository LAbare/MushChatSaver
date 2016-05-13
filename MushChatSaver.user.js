// ==UserScript==
// @name         MushChatSaver
// @version      2
// @match        http://mush.vg/
// @match        http://mush.vg/#*
// @match        http://mush.vg/play*
// @match        http://mush.vg/?*
// @match        http://mush.twinoid.com/
// @match        http://mush.twinoid.com/#*
// @match        http://mush.twinoid.com/play*
// @match        http://mush.twinoid.com/?*
// @match        http://mush.twinoid.es/
// @match        http://mush.twinoid.es/#*
// @match        http://mush.twinoid.es/play*
// @match        http://mush.twinoid.es/?*
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      mush.vg
// @connect      mush.twinoid.com
// @connect      mush.twinoid.es
// @connect      data.twinoid.com
// @require      http://code.jquery.com/jquery-latest.js
// @downloadURL  http://labare.github.io/MushChatSaver/MushChatSaver.user.js
// ==/UserScript==

var console = unsafeWindow.console;
var Main = unsafeWindow.Main;


function createButton(html) {
	return $('<div>').addClass('but').html("<div class='butright'><div class='butbg'>" + html + "</div></div>");
};


if (document.domain == 'mush.vg') {
	TXT = {
		scriptName: "Mush Chat Saver",
		wallLoaded: "Mur chargé !",
		unfav: "MCS : Plus favori...",
		copyPrivate: "Copier le canal privé",
		loadWholeWall: "Charger tout le mur",
		copyMainWall: "Copier le mur",
		pageLink: "Accéder à l'éditeur (nouvel onglet)",
		showReplies: "Montrer les réponses",
		popupTitle: "Copiez ce code :",
		popupTip: "(Cliquez dans le texte et faites Ctrl+A pour tout sélectionner)",
	}
}
else {
	TXT = {
		scriptName: "Mush Chat Saver",
		wallLoaded: "Wall loaded!",
		unfav: "MCS: Remove favorite...",
		copyPrivate: "Copy private channel",
		loadWholeWall: "Load the whole main wall",
		copyMainWall: "Copy main wall",
		pageLink: "Open editor page (new tab)",
		showReplies: "Show replies",
		popupTitle: "Copy this code:",
		popupTip: "(Click in the text and press Ctrl+A to select all)",
	}
}

//Tout charger
var lmwProcessing = false;
var loadWholeWall = function(k) { //Extracted from Ctrl+W; thanks to kill0u and/or badconker!
	if (lmwProcessing) {
		return;
	}
	lmwProcessing = true;

	var datak = (k ? k : $('#cdStdWall').find(".unit").last().attr("data-k"));
	GM_xmlhttpRequest({
		method: 'GET', url: 'http://' + document.domain + '/retrWallAfter/' + datak,
		onload: function(content) {
			var news = $(content.responseText);
			lmwProcessing = false;
			if (news.find(".wall").html().trim().length > 0) {
				//Get data-k
				var datak = news.find(".wall .unit").last().attr("data-k");
				if (datak == k) {
					lmwProcessing = false;
					$('.MCSloading').remove();
					alert(TXT.wallLoaded);
				}
				else {
					news.find('form').each(function() {
						if (!$('[data-k="' + $(this).find('.unit').attr('data-k') + '"]').length) {
							$('#cdStdWall .wall').append($(this).html());
						}
					});
					loadWholeWall(datak);
				}
			}
		}
	});
};

//Greaaaaaaat thanks to brock-adams (http://stackoverflow.com/questions/8778863/)
function customBase64Encode(inputStr) {
	var bbLen = 3, enCharLen = 4, inpLen = inputStr.length, inx = 0, jnx, keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=', output = '', paddingBytes = 0;
	var bytebuffer = new Array(bbLen), encodedCharIndexes = new Array(enCharLen);

	while (inx < inpLen) {
		for (jnx = 0; jnx < bbLen; ++jnx) {
			if (inx < inpLen) {
				bytebuffer[jnx] = inputStr.charCodeAt(inx++) & 0xff;
			}
			else {
				bytebuffer[jnx] = 0;
			}
		}
		encodedCharIndexes[0] = bytebuffer[0] >> 2;
		encodedCharIndexes[1] = ((bytebuffer[0] & 0x3) << 4) | (bytebuffer[1] >> 4);
		encodedCharIndexes[2] = ((bytebuffer[1] & 0x0f) << 2) | (bytebuffer[2] >> 6);
		encodedCharIndexes[3] = bytebuffer[2] & 0x3f;
		paddingBytes = inx - (inpLen - 1);
		switch (paddingBytes) {
			case 1:
				encodedCharIndexes[3] = 64;
				break;
			case 2:
				encodedCharIndexes[3] = 64;
				encodedCharIndexes[2] = 64;
				break;
			default:
				break;
		}
		for (jnx = 0; jnx < enCharLen; ++jnx) {
			output += keyStr.charAt(encodedCharIndexes[jnx]);
		}
	}
	return output;
}

var images = {};
var imagesToData = function(el, callback) {
	var img = el.find('.what_happened img:not(.MSC-datafied), .bubble p img:not(.MSC-datafied)');
	if (!img.length) { //All images have been datafied
		callback();
	}
	else {
		var src, name;
		img = img.eq(0);
		img.addClass('MSC-datafied');
		if (img.attr('src') == '/img/design/pixel.gif') {
			src = img.css('background-image').replace(/url\(['"]|['"]\)/g, '');
		}
		else {
			src = img.attr('src');
		}
		src = src.replace(/^\/\//, 'http://').replace(/^\/img/, 'http://' + document.domain + '/img');
		name = /[^\/]+\.(png|gif|jpe?g)/.exec(src)[0];
		var width = img[0].naturalWidth;
		var height = img[0].naturalHeight;
		if (name in images) {
			img.attr({
				src: 'data:image/' + name.split('.')[1] + ';base64,' + images[name],
				'data-imgname': name.split('.')[0],
				'data-imgw': width,
				'data-imgh': height,
			});
			imagesToData(el, callback);
		}
		else {
			console.log('MSC: downloading ' + name);
			GM_xmlhttpRequest({
				method: 'GET', url: src, overrideMimeType: 'text/plain; charset=x-user-defined',
				onload: function(resp) {
					var binResp = customBase64Encode(resp.responseText);
					img.attr({
						src: 'data:image/' + name.split('.')[1] + ';base64,' + binResp,
						'data-imgname': name.split('.')[0],
						'data-imgw': width,
						'data-imgh': height,
					});
					images[name] = binResp;
					imagesToData(el, callback);
				}
			});
		}
	}
};


//Privates
var channelButtons = function() {
	$('#mushChannel, #cdPrivate0, #cdPrivate1, #cdPrivate2, #cdPrivate3, #cdPrivate4').each(function() {
		if ($(this).size() < 1) {
			return true;
		}

		createButton(TXT.copyPrivate).insertBefore($(this).find('.mini_priv').eq(0)).on('click', function() {
			var channel = $(this).parent();
			var output = '';
			imagesToData(channel, function() {
				$(channel.find('.cdChatLine').get().reverse()).each(function() {
					var line = $(this);
					if (line.find('.bubble').length) { //Message
						var char = line.find('.char');

						//Fix style bugs
						var style = char.attr('style');
						if (/background-position-x/.test(style)) {
							style = '';
						}
						else if (style) {
							style = 'background-position: 0px ' + /(-[0-9]+px) !important/.exec(style)[1];
						} //else: style = ''

						var charDiv = '<div class="' + char.attr('class') + '" style="' + style + '"></div>';
						output += '<div class="message"> ' + charDiv + ' <p>' + line.find('.buddy')[0].outerHTML + line.find('p').html() + '</p> </div>\n';
					}
					else { //Log
						var log = line.find('.what_happened').clone();
						log.find('.ago, .clear').remove();
						output += '<div class="log"> <p>' + log.html().trim() + '</p> </div>\n';
					}
				});
				$('#MCS-output').val(output);
				$('#MCS-popup').show();
			});
		});
	});
	$('<div>').attr('id', 'MSC-reloadTest').appendTo($('#chatBlock'));

	//Unfav buttons on death page
	$('#cdFavWall .mainmessage .replybuttons').each(function() {
		if (!$(this).find('[src*="fav.png"]').length) {
			$(this).append('<a href="#" class="butmini" onclick="Main.onUnfavClick($(this));return false;"> <img src="/img/icons/ui/fav.png"> ' + TXT.unfav + '</a>');
		}
	});
};

//Buttons panel
var buttonsPanel = $('<div>').css({ marginTop: '20px', textAlign: 'center', backgroundColor: '#339', border: '2px #008 solid' }).appendTo($('#chat_col'));
$('<h3>').css('text-align', 'center').text(TXT.scriptName).appendTo(buttonsPanel);

createButton(TXT.loadWholeWall).appendTo(buttonsPanel).on('click', function() {
	$(this).find('.butbg').prepend("<img class='MCSloading' src='/img/icons/ui/loading1.gif' alt='loading…' /> ");
	loadWholeWall();
});

//Generate shortened HTML
var generateMessage = function(parent, type) {
	var content = /<span class=['"]buddy['"]>[^<]+<\/span>(.*)<span class=['"]ago['"]>/.exec(parent.html().replace(/\n/g, '').replace(/\s+/g, ' '))[1];
	if (parent.find('p').length) { //content is a paragraph
		content = $(content);
	}
	else { //content is a text node
		content = $('<p>').html(content);
	}
	content.find('img').removeAttr('class');
	if (parent.find('.neron').length) {
		return '<div class="' + type + ' neron"> <div class="neron"></div> <p>' + parent.find('.buddy')[0].outerHTML + content.html().trim() + '</p> </div>\n';
	}
	else {
		return '<div class="' + type + '"> ' + parent.find('.char')[0].outerHTML + ' <p>' + parent.find('.buddy')[0].outerHTML + ' ' + content.html().trim() + '</p> </div>\n';
	}
};

//Main wall
createButton(TXT.copyMainWall).appendTo(buttonsPanel).on('click', function() {
	$(this).find('.butbg').prepend("<img class='MCSloading' src='/img/icons/ui/loading1.gif' alt='loading…' /> ");
	imagesToData($('#cdStdWall'), function() {
		var output = '';
		var ks = [];
		$('#cdStdWall .unit').each(function() {
			//Check for double topics
			var k = $(this).attr('data-k');
			if (ks.indexOf(k) != -1) {
				return true;
			}
			ks.push(k);

			//Main message
			output += generateMessage($(this).find('.mainmessage'), 'main');

			//Replies
			if ($(this).find('.reply.bubble').length) {
				output += '<div class="show" onclick="show(this);">' + TXT.showReplies + '</div>\n';
				output += '<div class="hiddenreplies">\n';
				$(this).find('.reply.bubble').each(function() {
					output += '\t' + generateMessage($(this), 'reply');
				});
				output += '</div>\n';
			}
			output += '\n';
		});
		$('#MCS-output').val(output);
		$('#MCS-popup').show();
		$('.MCSloading').remove();
	});
});

//$('<a>').attr({ href: 'http://labare.github.io/MushChatSaver/MushChatSaver.html', target: '_blank' }).css('margin-top', '5px').text(TXT.pageLink).appendTo(buttonsPanel);
createButton('<a href="http://labare.github.io/MushChatSaver/MushChatSaver.html" target="_blank">' + TXT.pageLink + '</a>').appendTo(buttonsPanel);

//Output
var popup = $('<div>').attr('id', 'MCS-popup').css({
	position: 'absolute', width: '400px', padding: '20px 5px 5px 5px', zIndex: '3000',
	left: Math.floor((window.innerWidth - 400) / 2) + 'px', top: (window.scrollY + 50) + 'px',
	backgroundColor: '#33C', border: '2px #008 solid', borderRadius: '5px'
}).hide().appendTo($('body'));
$('<h1>').css({ textAlign: 'center', fontSize: '1.2em' }).text(TXT.popupTitle).appendTo(popup);
$('<h3>').css({ textAlign: 'center', fontSize: '0.8em', marginBottom: '5px' }).text(TXT.popupTip).appendTo(popup);
createButton("X").css({ position: 'absolute', right: '5px', top: '5px' }).appendTo(popup).on('click', function() { $('#MCS-popup').hide(); });
$('<textarea>').css({ width: '100%', height: '300px', color: 'black' }).attr('id', 'MCS-output').appendTo(popup);

channelButtons();

window.setInterval(function() {
	if (!$('#MSC-reloadTest').length) {
		channelButtons();
	}
}, 500);
