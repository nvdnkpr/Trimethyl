var callback = null;
if (OS_IOS) {
	var Social = require('dk.napp.social');
	Social.addEventListener('complete', onSocialComplete);
	Social.addEventListener('cancelled', onSocialCancelled);
}

function onSocialComplete(e) {
	if (!callback) return;
	e.type = 'complete';
	if (e.activityName) e.platform = e.activityName;
	callback(e);
}

function onSocialCancelled(e) {
	if (!callback) return;
	e.type = 'cancelled';
	if (e.activityName) e.platform = e.activityName;
	callback(e);
}

function _init(args) {
	args = args || {};
	if (args.image) args.image_blob = Ti.UI.createImageView(args.image).toBlob();
	return args;
}

exports.twitter = function(args, _callback) {
	callback = _callback || null;
	_init(args);

	var webUrl = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(args.url) + '&text=' + encodeURIComponent(args.text);
	var textUrl = (args.url && args.image) ? (args.text ? args.text + ' ' + args.url : args.url) : args.text;

	if (OS_IOS) {
		if (Social.isTwitterSupported()) {
			// Twitter SDK does not support both URL and image: https://github.com/viezel/TiSocial.Framework/issues/41
			Social.twitter({
				text: textUrl,
				image: args.image,
				url: args.image ? null : args.url
			});
		} else {
			var url = 'twitter://post?message=' + encodeURIComponent(textUrl);
			if (!Ti.Platform.canOpenURL(url)) url = webUrl;
			Ti.Platform.openURL(url);
		}
	} else if (OS_ANDROID) {
		try {
			var intent = Ti.Android.createIntent({
				action: Ti.Android.ACTION_SEND,
				packageName: "com.twitter.android",
				className: "com.twitter.android.PostActivity",
				type: "text/plain"
			});
			intent.putExtra(Ti.Android.EXTRA_TEXT, textUrl);
			Ti.Android.currentActivity.startActivity(intent);
		} catch (error) {
			Ti.Platform.openURL(webUrl);
		}
	} else {
		Ti.Platform.openURL(webUrl);
	}
};

exports.facebook = function(args, _callback) {
	callback = _callback || null;
	args = _init(args);

	if (OS_IOS && Social.isFacebookSupported()) {
		Social.facebook({
			text: args.text,
			image: args.image,
			url: args.url
		});
	} else {
		require('facebook').dialog('feed', {
			link: args.url,
			caption: args.caption,
			description: args.description || args.text,
			picture: args.image
		}, function(e) {
			if (e.cancelled) {
				onSocialCancelled({
					success: false,
					platform: 'facebook'
				});
			} else {
				onSocialComplete({
					success: e.success,
					platform: 'facebook'
				});
			}
		});
	}
};

exports.mail = function(args, _callback) {
	callback = _callback || null;
	args = _init(args);

	var emailDialog = Ti.UI.createEmailDialog({
		subject: args.description || args.text,
		html: true,
		messageBody: args.body || args.text + (args.url ? "<br><br>" + args.url : ''),
	});

	if (args.image_blob) emailDialog.addAttachment(args.image_blob);

	emailDialog.addEventListener('complete', function(e) {
		if (e.result === this.CANCELLED) {
			onSocialCancelled({
				success: false,
				platform: 'mail'
			});
		} else {
			onSocialComplete({
				success: (e.result === this.SENT),
				platform: 'mail'
			});
		}
	});

	emailDialog.open();
};

exports.options = function(args, _callback) {
	callback = _callback || null;
	args = _init(args);

	if (OS_IOS && Social.isActivityViewSupported()) {

		if (require('util').isIPad()) {
			Social.activityPopover({
				text: args.url ? (args.text ? args.text + ' ' + args.url : args.url) : args.text,
				image: args.image,
				removeIcons: args.removeIcons,
				view: args.view
			}, args.customIcons || []);
		} else {
			Social.activityView({
				text: args.url ? (args.text ? args.text + ' ' + args.url : args.url) : args.text,
				image: args.image,
				removeIcons: args.removeIcons
			}, args.customIcons || []);
		}

	} else if (OS_ANDROID) {

		var intent = Ti.Android.createIntent({ action: Ti.Android.ACTION_SEND });
		if (args.text) intent.putExtra(Ti.Android.EXTRA_TEXT, args.text);
		if (args.text || args.description) intent.putExtra(Ti.Android.EXTRA_SUBJECT, args.description || args.text);
		if (args.image_blob) intent.putExtraUri(Ti.Android.EXTRA_STREAM, args.image_blob);
		var shareActivity = Ti.Android.createIntentChooser(intent, args.titleid ? L(args.titleid, args.title || 'Share') : (args.title || 'Share'));
		Ti.Android.currentActivity.startActivity(shareActivity);

	} else {

		var options = [];
		var callbacks = [];
		if (!args.removeIcons || args.removeIcons.indexOf('twitter') === -1) {
			options.push('Twitter');
			callbacks.push(_twitter);
		}
		if (!args.removeIcons || args.removeIcons.indexOf('facebook') === -1) {
			options.push('Facebook');
			callbacks.push(_facebook);
		}
		if (!args.removeIcons || args.removeIcons.indexOf('mail') === -1) {
			options.push(L('Mail'));
			callbacks.push(_mail);
		}

		if (args.customIcons) {
			args.customIcons.forEach(function (customIcon) {
				options.push(customIcon.title);
				callbacks.push(customIcon.callback);
			});
		}

		if (options.length === 0) return;
		options.push(L('Cancel'));

		var dialog = Ti.UI.createOptionDialog({
			cancel: options.length - 1,
			options: options,
			title: args.title,
			titleid: args.titleid,
			androidView: args.androidView,
			tizenView: args.tizenView
		});

		dialog.addEventListener('click', function(e) {
			if (e.index === e.source.cancel) return;
			callbacks[e.index](args);
		});

		if (require('util').isIPad()) {
			dialog.show({
				animated: args.animated,
				rect: args.rect,
				view: args.view
			});
		} else {
			dialog.show();
		}
	}
};