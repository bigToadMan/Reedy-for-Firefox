

chrome.runtime.getBackgroundPage(function(bgWindow) {

	function querySelector(selector) {
		return document.querySelector(selector);
	}

	function querySelectorAll(selector) {
		return document.querySelectorAll(selector);
	}

	function getTextSelection(callback) {
		app.sendMessageToSelectedTab({type: 'getSelection'}, function(sel) {
			callback(sel || '');
		});
	}

	function onExternalLinkClick(e) {
		app.event('External link', e.target.href);
		window.open(e.target.href);
	}

	function onSwitchBtnClick(e) {
		const viewName = e.target.getAttribute('switch-to');
		switchToView(viewName);
	}

	function onCheckbox(value, $checkbox) {
		app.setSettings($checkbox.name, value);
	}

	function onRange(value, $input) {
		app.setSettings($input.name, value);
	}

	function onStartReadingClick() {
		app.event('Reader', 'Open', 'Popup');
		startReading();
	}

	function onStartSelectorClick() {
		app.event('Content selector', 'Start', 'Popup');
		startSelector();
	}

	function onCloseReaderClick() {
		app.event('Reader', 'Close', 'Popup');
		closeReader();
	}

	function onOfflineBtnClick() {
		app.event('Offline', 'Open');
		window.open(app.offlineUrl);
	}

	function onShortcutInputKeydown(e) {
		app.stopEvent(e);
		newShortcut = app.eventToShortcutData(e);
		$iShortcut.value = app.shortcutDataToString(newShortcut, true);
	}

	function onSaveShortcutBtn() {
		if (newShortcut) {
			if (app.checkShortcut(newShortcut)) {
				runShortcut = newShortcut;
				app.setSettings('runShortcut', newShortcut);
				updateShortcutElems(newShortcut);
				app.event('Run shortcut', 'Set', app.shortcutDataToString(newShortcut));
			}
			else {
				alert(app.t('wrongShortcut'));
				$iShortcut.focus();
				app.event('Run shortcut', 'Set wrong', app.shortcutDataToString(newShortcut));
				return;
			}
		}

		switchToView('main');
	}

	function onCancelShortcutBtn() {
		$iShortcut.value = app.shortcutDataToString(runShortcut, true);
		switchToView('main');
	}

	function updateShortcutElems(data) {
		app.each(querySelectorAll('.j-shortcut'), function($elem) {
			$elem.textContent = app.shortcutDataToString(data);
		});
	}

	function onKeyDown(e) {
		if (runShortcut && app.checkEventForShortcut(e, runShortcut)) {
			app.stopEvent(e);
			getTextSelection(function(text) {
				if (text.length) {
					app.event('Reader', 'Open', 'Shortcut in popup ');
					startReading();
				}
				else {
					app.event('Content selector', 'Start', 'Shortcut in popup');
					startSelector();
				}
			});
		}
	}

	function startReading() {
		app.sendMessageToSelectedTab({type: 'startReading'});
		window.close();
	}

	function startSelector() {
		app.isSystemTab(function(isSystem) {
			if (isSystem) {
				alert(app.t('cantLaunchOnSystemPages'));
			}
			else {
				app.sendMessageToSelectedTab({type: 'startSelector'});
				window.close();
			}
		});
	}

	function closeReader() {
		app.sendMessageToSelectedTab({type: 'closeReader'});
		window.close();
	}

	function switchToView(name) {
		app.each($views, function($view) {
			$view.setAttribute('active', $view.getAttribute('view-name') === name);
		});
		$body.setAttribute('active-view', name);

		if (name === 'shortcut')
			$iShortcut.focus();

		app.event('Popup', 'Switch to', name);
	}

	function initControls(settings) {
		app.each(querySelectorAll('.j-checkbox'), function($elem) {
			$elem.checked = settings[$elem.name];
			new app.Checkbox($elem, onCheckbox);
		});

		app.each(querySelectorAll('.j-range'), function($elem) {
			$elem.value = settings[$elem.name];
			new app.Range($elem, +$elem.getAttribute('min-value'), +$elem.getAttribute('max-value'), onRange);
		});

		runShortcut = settings.runShortcut;
		$iShortcut.value = app.shortcutDataToString(runShortcut, true);
		updateShortcutElems(runShortcut);

		// Since Firefox doesn't support the fontSettings API yet,
		// we use a hard coded list of web safe CSS fonts:
		const fontList = [
			'Andale Mono', 'Arial', 'Arial Black', 'Arial Narrow',
			'Arial Rounded MT Bold', 'Avant Garde', 'Baskerville', 'Big Caslon',
			'Bodoni MT', 'Book Antiqua', 'Brush Script MT', 'Calibri',
			'Calisto MT', 'Cambria', 'Candara', 'Century Gothic', 'Consolas',
			'Copperplate', 'Courier New', 'Didot', 'Franklin Gothic Medium',
			'Futura', 'Garamond', 'Geneva', 'Georgia', 'Gill Sans',
			'Goudy Old Style', 'Helvetica', 'Hoefler Text', 'Impact',
			'Lucida Bright', 'Lucida Console', 'Lucida Grande',
			'Lucida Sans Typewriter', 'Monaco', 'Optima', 'Palatino', 'Papyrus',
			'Perpetua', 'Rockwell Extra Bold', 'Rockwell', 'Segoe UI', 'Tahoma',
			'Times New Roman', 'Trebuchet MS', 'Verdana'];

		initThemeControls(settings, fontList);
	}

	function initThemeControls(settings, fontList) {
		function updateThemeControls() {
			app.each(colorPickerApis, function(api) {
				api.setValue(theme[api.$input.name]);
			});

			app.each(themeCheckboxApis, function(api) {
				api.setState(theme[api.$checkbox.name]);
			});

			$iFontFamily.value = DEFAULT_FONT_VALUE;
			if (theme.font_family != null)
				app.each(fontList, function(item) {
					if (theme.font_family === item) {
						$iFontFamily.value = item;
						return false;
					}
				});
		}


		let DEFAULT_FONT_VALUE = "-",
			themeName = settings.darkTheme ? "dark" : "light",
			theme = settings.theme[themeName],
			colorPickerApis = [],
			themeCheckboxApis = [],
			$iFontFamily = querySelector(".j-iFont");


		// Building font list
		(function() {
			function append(value, text) {
				const option = document.createElement('option');
				option.value = value;
				option.innerText = text;
				$iFontFamily.appendChild(option);
			}

			append(DEFAULT_FONT_VALUE, app.t("defaultFont"));

			for (let i = 0; i < fontList.length; i++) {
				append(fontList[i], fontList[i]);
			}
		})();

		app.each(querySelectorAll(".j-iColorPicker"), function($elem) {
			colorPickerApis.push(new app.ColorPicker($elem, function(value, $input) {
				app.setThemeSettings(themeName, $input.name, value);
				theme[$input.name] = value;
			}));
		});

		app.each(querySelectorAll(".j-iThemeCheckbox"), function($elem) {
			themeCheckboxApis.push(new app.Checkbox($elem, function(value, $checkbox) {
				app.setThemeSettings(themeName, $checkbox.name, value);
				theme[$checkbox.name] = value;
			}));
		});

		app.on($iFontFamily, "change", function() {
			app.setThemeSettings(themeName, $iFontFamily.name, $iFontFamily.value === DEFAULT_FONT_VALUE ? null : $iFontFamily.value);
			theme.font_family = $iFontFamily.value;
		});

		app.on(querySelector(".j-resetThemeBtn"), "click", function() {
			app.resetThemeSettings(themeName, function() {
				app.getSettings("theme."+themeName, function(t) {
					theme = t;
					updateThemeControls();
				});
			});
			app.event("Popup", "Reset theme");
		});

		updateThemeControls();
	}


	const app = bgWindow.reedy,

		$body = querySelector('body'),
		$startReadingBtn = querySelector('.j-startReadingBtn'),
		$startSelectorBtn = querySelector('.j-startContentSelectorBtn'),
		$closeReaderBtn = querySelector('.j-closeReaderBtn'),
		$views = querySelectorAll('[view-name]'),

		$iShortcut = querySelector('.j-iShortcut'),
		$saveShortcutBtn = querySelector('.j-saveShortcutBtn'),
		$cancelShortcutBtn = querySelector('.j-cancelShortcutBtn');

	let runShortcut, newShortcut;

	app.Tabs(
		"settings",
		querySelector('.j-tabs'),
		querySelectorAll('.j-tab'),
		querySelectorAll('.j-tabContent')
	);

	chrome.runtime.connect({name: "Popup"});

	app.localizeElements(document);

	/**
	 * Preparing buttons
	 * `getTextSelection` - is a pretty difficult method, so we check for the reader state at first
	 */
	app.sendMessageToSelectedTab({type: 'isReaderStarted'}, function(isReaderStarted) {
		if (isReaderStarted) {
			$startSelectorBtn.setAttribute('hidden', true);
			$closeReaderBtn.setAttribute('hidden', false);
		}
		else {
			app.sendMessageToSelectedTab({type: 'isOfflinePage'}, function(isOfflinePage) {
				if (isOfflinePage)
					$startSelectorBtn.setAttribute('hidden', true);
				else
					getTextSelection(function(text) {
						$startReadingBtn.setAttribute('hidden', !text.length);
						$startSelectorBtn.setAttribute('hidden', !!text.length);
					});
			});
		}
	});

	app.getSettings(null, initControls);


	app.on(document, "keydown", onKeyDown);

	app.on($startReadingBtn, "click", onStartReadingClick);
	app.on($startSelectorBtn, "click", onStartSelectorClick);
	app.on($closeReaderBtn, "click", onCloseReaderClick);

	app.on(querySelector('.j-offlineBtn'), "click", onOfflineBtnClick);

	app.each(querySelectorAll('a[href^=http]'), function($elem) {
		app.on($elem, 'click', onExternalLinkClick);
	});
	app.each(querySelectorAll('[switch-to]'), function($elem) {
		app.on($elem, 'click', onSwitchBtnClick);
	});

	app.on($iShortcut, "keydown", onShortcutInputKeydown);
	app.on($saveShortcutBtn, "click", onSaveShortcutBtn);
	app.on($cancelShortcutBtn, "click", onCancelShortcutBtn);

});
