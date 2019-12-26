

(function(app) {

	function createElement(tagName, className, $appendTo, text) {
		const $elem = document.createElement(tagName);
		className != null && ($elem.className = className);
		$appendTo && $appendTo.appendChild($elem);
		text != null && ($elem.innerText = text);
		return $elem;
	}

	function cls() {
		const res = [];
		for (let i = 0; i < arguments.length; i++) {
			res.push(CLS_MAIN+'-'+arguments[i]);
		}
		return res.join(' ');
	}

	const CLS_MAIN = 'e-Range';

	app.Range = function($input, min, max, onChange) {

		const api = this,

			$wrapper    = createElement('span', cls('wrapper'), $input.parentNode),
			$btnUP      = createElement('span', cls('btn','btn_up'), $wrapper),
			$text       = createElement('span', cls('text'), $wrapper, 0),
			$btnDN      = createElement('span', cls('btn','btn_dn'), $wrapper);

		let lastSendedValue;

		function update(dontFireEvent) {
			const value = $text.innerText = $input.value =
				Math.max(Math.min(+$input.value.replace(/\D+/g, ''), max), min) + '';
			dontFireEvent || value !== lastSendedValue && onChange(value, $input, api);
			lastSendedValue = value;
		}

		function onBtnUp() {
			$input.value = +$input.value + 1;
			update();
		}

		function onBtnDn() {
			$input.value = +$input.value - 1;
			update();
		}

		api.$input = $input;
		$input.style.display = 'none';
		update(true);
		lastSendedValue = +$input.value;

		app.on($input, 'change', update);

		app.on($btnUP, 'mousedown', onBtnUp);
		app.on($btnDN, 'mousedown', onBtnDn);

	}

})(window.reedy);
