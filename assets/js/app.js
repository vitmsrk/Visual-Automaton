Element.prototype.setAttributes = function (attrs) {
	for (var key in attrs) {
		this.setAttribute(key, attrs[key]);
	}
};

Object.defineProperty(Array.prototype, 'getById', {
    enumerable: false,
    value: function (id) { return this[this.map(function (e) { return e.id }).indexOf(id)]; }
});

Object.defineProperty(Array.prototype, 'getByName', {
    enumerable: false,
    value: function (name) { return this[this.map(function (e) { return e.name }).indexOf(name)]; }
});

Element.prototype.draggable = function (scope) {
	var that = this, state = null, scale = 0, r = 0;

	that.addEventListener('mousedown', function (event) {
		if (scope.transitionMode.enabled) return;
		var tab = scope.tabs[scope.current];
		state = tab.states.getById(event.target.getAttribute('id'));
		scale = tab.scale;
		r = scope.preferences.stateRadius;
		event.preventDefault();
		document.addEventListener('mousemove', mouseMove);
		document.addEventListener('mouseup', mouseUp);
	});

	function mouseMove(event) {
		scope.hasDragged = true;
		var x = event.movementX / scale,
			y = event.movementY / scale,
			C = { x: that.x.animVal.value + x, y: that.y.animVal.value + y };
		that.setAttribute('x', C.x);
		that.setAttribute('y', C.y);
		state.position.x = C.x;
		state.position.y = C.y;
		for (var i in state.startTransitions) {
			var transition = state.startTransitions[i];
			var path = transition.defs.firstElementChild.firstElementChild,
				E = { x: transition.endState.use.x.animVal.value, y: transition.endState.use.y.animVal.value },
				a = angle(C, E) || transition.a,
				Q = quadratic(C, E, transition.h, a),
				M = transform(C, Q[0], r),
				L = transform(E, Q[2], r + 10),
				d = quadraticPath(M, Q[0], Q[1], Q[2], L);
			path.setAttribute('d', d);
			transition.a = a;
		}
		for (var i in state.endTransitions) {
			var transition = state.endTransitions[i];
			var path = transition.defs.firstElementChild.firstElementChild,
				E = { x: transition.startState.use.x.animVal.value, y: transition.startState.use.y.animVal.value },
				a = angle(E, C) || transition.a,
				Q = quadratic(E, C, transition.h, a),
				L = transform(C, Q[2], r + 10),
				M = transform(E, Q[0], r),
				d = quadraticPath(M, Q[0], Q[1], Q[2], L);
			path.setAttribute('d', d);
			transition.a = a;
		}
	}

	function mouseUp(event) {
		document.removeEventListener('mousemove', mouseMove);
		document.removeEventListener('mouseup', mouseUp);
	}
};

Element.prototype.transitionDraggable = function (scope) {
	var that = this, transition = null, scale = 0, r = 0, M = null, L = null, a = 0;

	that.addEventListener('mousedown', function (event) {
		if (scope.transitionMode.enabled) return;
		var tab = scope.tabs[scope.current];
		transition = tab.transitions.getById(event.target.getAttribute('id'));
		scale = tab.scale;
		r = scope.preferences.stateRadius;
		M = { x: transition.startState.use.x.animVal.value, y: transition.startState.use.y.animVal.value };
		L = { x: transition.endState.use.x.animVal.value, y: transition.endState.use.y.animVal.value };
		a = angle(M, L) || transition.a,
		event.preventDefault();
		document.addEventListener('mousemove', mouseMove);
		document.addEventListener('mouseup', mouseUp);
	});

	function mouseMove(event) {
		scope.hasDragged = true;
		var path = transition.defs.firstElementChild.firstElementChild,
			E = { x: event.offsetX / scale, y: event.offsetY / scale },
			_E = rotate(M, E, -a),
			h = L.x >= M.x ? M.y - _E.y : _E.y - M.y,
			Q = quadratic(M, L, h, a),
			m = transform(M, Q[0], r),
			l = transform(L, Q[2], r + 10),
			d = quadraticPath(m, Q[0], Q[1], Q[2], l);
		path.setAttribute('d', d);
		transition.h = h;
	}

	function mouseUp(event) {
		document.removeEventListener('mousemove', mouseMove);
		document.removeEventListener('mouseup', mouseUp);
	}
};

function transform(C, L, r) {
	var a = Math.atan((L.x - C.x) / (L.y - C.y)) || 0,
		k = L.y >= C.y ? 1 : -1;
	return {
		x: r * Math.sin(a) * k + C.x,
		y: r * Math.cos(a) * k + C.y
	};
}

function quadratic(M, L, h, a) {
	var	k = L.x >= M.x ? 1 : -1,
		_L = rotate(M, L, -a),
		_C = { x: M.x + (_L.x - M.x) / 2, y: M.y - h * k},
		w = Math.max((_C.x - M.x) / 2, Math.abs(h / 2)),
		_Q1 = { x: _C.x - w * k, y: _C.y },
		_Q2 = { x: _C.x + w * k, y: _C.y },
		C = rotate(M, _C, a),
		Q1 = rotate(M, _Q1, a),
		Q2 = rotate(M, _Q2, a);
	return [ Q1, C, Q2 ];
}

function rotate(O, M, a) {
	var x = M.x - O.x,
		y = M.y - O.y;
	return {
		x: O.x + x * Math.cos(a) - y * Math.sin(a),
		y: O.y + x * Math.sin(a) + y * Math.cos(a)
	}
}

function quadraticPath(M, Q1, C, Q2, L) {
	return 'M' + M.x + ',' + M.y + ' Q' + Q1.x + ',' + Q1.y + ',' + C.x + ',' + C.y + ' Q' + Q2.x + ',' + Q2.y + ',' + L.x + ',' + L.y;
}

function distance(A, B) {
	return Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
}

function angle(A, B) {
	return Math.atan((B.y - A.y) / (B.x - A.x));
}