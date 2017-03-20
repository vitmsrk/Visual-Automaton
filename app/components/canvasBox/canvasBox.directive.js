(function (app) {
	'use strict';

	app.directive('canvasBox', canvasBox);
	app.controller('canvasBoxCtrl', canvasBoxCtrl);

	function canvasBox() {
		return {
			bindToController: true,
			controller: 'canvasBoxCtrl',
			replace: true,
			templateUrl: 'app/components/canvasBox/canvasBox.html'
		}
	}

	function canvasBoxCtrl($scope, $compile, $mdMenu, $mdDialog) {
		const src = 'http://www.w3.org/2000/svg';
		const xlink = 'http://www.w3.org/1999/xlink';

		var menuCtrl = {
			open: function (event) {
				$scope.activeState = $scope.tabs[$scope.current].states.getById(event.target.id);
				$scope.activeStateName = $scope.activeState.name;
				$mdMenu.show({
					scope: $scope,
					mdMenuCtrl: menuCtrl,
					element: $compile(angular.element(angular.copy(document.getElementById('state-menu').firstElementChild)))($scope),
					target: event.target
				});
			},
			close: function () {
				$mdMenu.hide();
				if (!$scope.activeState)
					return;
				if ($scope.activeState.name.length == 0)
					$scope.activeState.name = $scope.activeStateName;
				$scope.activeState.defs.firstElementChild.childNodes[1].innerHTML = $scope.activeState.name;
				window.setTimeout(function () {
					$scope.activeState = null;
					$scope.activeStateName = null;
				}, 200);
			},
			positionMode: function () {
				return {
					left: 'target',
					top: 'target'
				};
			},
			offsets: function () {
				return {
					top: $scope.preferences.stateRadius * 1.5 * $scope.tabs[$scope.current].scale,
					left: ($scope.preferences.stateRadius * 2 + ($scope.activeState.start ? $scope.preferences.startPathSize + 10 : 0)) * $scope.tabs[$scope.current].scale
				};
			}
		};

		$scope.tabsCount = 1;
		$scope.tabs = [new Tab($scope.tabsCount)];
		$scope.current = 0;
		$scope.hasDragged = false;
		$scope.activeState = null;
		$scope.activeStateName = null;
		$scope.activeTransition = null;
		$scope.hoverState = null;

		$scope.getCanvas = function () {
			return document.getElementById($scope.tabs[$scope.current].id);
		};

		$scope.transitionMode = new (function () {
			var that = this,
				target = null,
				canvas = null,
				scale = 0,
				r = 0,
				clientRect = null,
				activeState = null,
				C = { x: 0, y: 0 };

			that.enabled = false;

			that.start = function (t) {
				that.enabled = true;
				target = t;
				canvas = $scope.getCanvas();
				scale = $scope.tabs[$scope.current].scale;
				r = $scope.tabs[$scope.current].stateRadius;
				clientRect = canvas.getBoundingClientRect();
				activeState = $scope.activeState;
				C.x = parseFloat(activeState.use.getAttribute('x'));
				C.y = parseFloat(activeState.use.getAttribute('y'));
				document.addEventListener('mousemove', mouseMove);
				canvas.addEventListener('click', click);
			};

			that.stop = function () {
				that.enabled = false;
				$scope.$apply();
				if ($scope.hoverState)
					$scope.bindTransition(activeState);
				else {
					canvas.removeChild($scope.activeTransition.use);
					canvas.removeChild($scope.activeTransition.defs);
					activeState.targetsM.splice(activeState.targetsM.indexOf($scope.activeTransition.defs.firstElementChild));
					activeState.transitions.splice(activeState.transitions.indexOf($scope.activeTransition), 1);
					$scope.tabs[$scope.current].transitions.splice($scope.tabs[$scope.current].transitions.indexOf($scope.activeTransition), 1);
					$scope.activeTransition = null;
				}
			};

			function mouseMove(event) {
				var x = (event.x - clientRect.left) / scale,
					y = (event.y - clientRect.top) / scale,
					d = target.getAttribute('d'),
					M = d.match(/M[-\d\.e]*,[-\d\.e]*\s/)[0],
					L = d.match(/L[-\d\.e]*,[-\d\.e]*/)[0],
					m = transform(C, { x: x, y: y }, r),
					l = transform({ x: x, y: y }, C, 10);

				d = d.replace(M, 'M' + m.x + ',' + m.y + ' ').replace(L, 'L' + l.x + ',' + l.y);
				target.setAttribute('d', d);
			}

			function click(event) {
				event.preventDefault();
				that.stop();
				document.removeEventListener('mousemove', mouseMove);
				canvas.removeEventListener('click', click);
			}
		});

		$scope.addTab = function () {
			$scope.tabs.push(new Tab(++$scope.tabsCount));
		};

		$scope.removeTab = function (tab) {
			$scope.tabs.splice($scope.tabs.indexOf(tab), 1);
		};

		$scope.drawState = function (event, tab) {
			if ($scope.transitionMode.enabled) return;

			var state = new State(tab.index, ++tab.statesCount, $scope.preferences.stateNamePrefix + (tab.statesCount - 1));

			var circle = document.createElementNS(src, 'circle');
			circle.setAttributes({
				'ng-attr-fill': '{{tabs[current].states.getById("' + state.id + '").accept ? tabs[current].acceptStateColor : tabs[current].states.getById("' + state.id + '").start ? tabs[current].startStateColor : tabs[current].defaultStateColor}}',
				'ng-attr-r': '{{tabs[current].stateRadius}}',
			});

			var text = document.createElementNS(src, 'text');
			text.innerHTML = state.name;
			text.setAttributes({
				'class': 'non-selectable',
				'ng-attr-fill': '{{tabs[current].stateNameColor}}',
				'text-anchor': 'middle',
				'alignment-baseline': 'central'
			});

			var startPath = document.createElementNS(src, 'path'),
			mx = -($scope.tabs[$scope.current].stateRadius + $scope.preferences.startPathSize + 10),
			lx = -($scope.tabs[$scope.current].stateRadius + 10);
			startPath.setAttributes({
				'ng-if': 'tabs[current].states.getById("' + state.id + '").start',
				'ng-attr-d': 'M ' + mx + ', 0 L ' + lx + ', 0',
				'fill': 'none',
				'ng-attr-stroke': '{{preferences.pathColor}}',
				'ng-attr-stroke-width': '{{preferences.pathWidth}}px',
				'marker-end': 'url(#arrow)'
			});

			var g = document.createElementNS(src, 'g');
			g.setAttributes({ 'id': state.id + '-' + 'def' });
			g.appendChild($compile(circle)($scope)[0]);
			g.appendChild($compile(text)($scope)[0]);
			g.appendChild($compile(startPath)($scope)[0]);

			var defs = document.createElementNS(src, 'defs');
			defs.appendChild($compile(g)($scope)[0]);
			
			var use = document.createElementNS(src, 'use');
			use.setAttributeNS(xlink, 'href', '#' + g.getAttribute('id'));
			use.setAttributes({
				'id': state.id,
				'x': event.offsetX / $scope.tabs[$scope.current].scale,
				'y': event.offsetY / $scope.tabs[$scope.current].scale,
				'class': 'state',
				'ng-class': '{"transition-mode": transitionMode.enabled}',
				'ng-attr-transform': 'scale({{tabs[current].scale}})',
				'ng-click': 'openMenu($event)',
				'ng-mouseenter': 'transitionMode.enabled ? setHoverState("' + state.id + '") : 0',
				'ng-mouseleave': 'transitionMode.enabled ? dropHoverState() : 0'
			});
			use.draggable();

			state.defs = $compile(defs)($scope)[0];
			state.use = $compile(use)($scope)[0];
			tab.states.push(state);

			var canvas = $scope.getCanvas();
			canvas.appendChild(state.defs);
			canvas.appendChild(state.use);
		};

		$scope.removeState = function () {
			var canvas = $scope.getCanvas();

			canvas.removeChild($scope.activeState.use);
			canvas.removeChild($scope.activeState.defs);

			for (var i in $scope.activeState.transitions) {
				var transition = $scope.activeState.transitions[i];
				if (transition instanceof Transition) {
					canvas.removeChild(transition.use);
					canvas.removeChild(transition.defs);
					$scope.tabs[$scope.current].transitions.splice($scope.tabs[$scope.current].transitions.indexOf(transition), 1);
				}
			}

			$scope.tabs[$scope.current].states.splice($scope.tabs[$scope.current].states.indexOf($scope.activeState), 1);
			$scope.activeState = null;
			menuCtrl.close();
		};

		$scope.openMenu = function (event) {
			if ($scope.transitionMode.enabled) return;
			$scope.hasDragged ? $scope.hasDragged = false : menuCtrl.open(event);
		};

		$scope.closeMenu = function () {
			menuCtrl.close();
		};

		$scope.toggleStart = function () {
			for (var i in $scope.tabs[$scope.current].states)
				if (!angular.equals($scope.tabs[$scope.current].states[i], $scope.activeState))
					$scope.tabs[$scope.current].states[i].start = false;
		};

		$scope.buildTransition = function (event) {
			var tab = $scope.tabs[$scope.current],
				transition = new Transition(tab.index, ++tab.transitionsCount),
				clientRect = $scope.getCanvas().getBoundingClientRect(),
				M = {
					x: parseFloat($scope.activeState.use.getAttribute('x')),
					y: parseFloat($scope.activeState.use.getAttribute('y'))
				},
				L = {
					x: (event.x - clientRect.left) / tab.scale,
					y: (event.y - clientRect.top) / tab.scale
				},
				QPoints = quadratic(M, L),
				m = transform(M, L, tab.stateRadius),
				l = transform(L, M, 10);

			var path = document.createElementNS(src, 'path');
			path.setAttributes({
				'id': transition.id + '-' + 'def',
				'ng-attr-d': 'M' + m.x + ',' + m.y + ' Q' + QPoints.lQ.x + ',' + QPoints.lQ.y + ',' + QPoints.cQ.x + ',' + QPoints.cQ.y + ' Q' + QPoints.rQ.x + ',' + QPoints.rQ.y + ',' + l.x + ',' + l.y,
				'fill': 'none',
				'ng-attr-stroke': '{{preferences.pathColor}}',
				'ng-attr-stroke-width': '{{preferences.pathWidth}}px',
				'marker-end': 'url(#arrow-marker)',
				'marker-mid': 'url(#symbol-marker)'
		});

			var defs = document.createElementNS(src, 'defs');
			defs.appendChild($compile(path)($scope)[0]);
			$scope.activeState.targetsM.push(defs.firstElementChild);

			var use = document.createElementNS(src, 'use');
			use.setAttributeNS(xlink, 'href', '#' + path.getAttribute('id'));
			use.setAttributes({
				'id': transition.id,
				'class': 'transition',
				'ng-attr-transform': 'scale({{tabs[current].scale}})'
			});

			transition.defs = $compile(defs)($scope)[0];
			transition.use = $compile(use)($scope)[0];
			tab.transitions.push(transition);
			$scope.activeState.transitions.push(transition);

			var canvas = $scope.getCanvas();
			canvas.appendChild(transition.defs);
			canvas.appendChild(transition.use);

			$scope.activeTransition = transition;
			//$scope.transitionMode.start(defs.firstElementChild);
		};

		$scope.bindTransition = function (activeState) {
			var C = { x: parseFloat($scope.hoverState.use.getAttribute('x')),
					  y: parseFloat($scope.hoverState.use.getAttribute('y')) },
				L = { x: parseFloat(activeState.use.getAttribute('x')),
					  y: parseFloat(activeState.use.getAttribute('y')) },
				path = $scope.activeTransition.defs.firstElementChild,
				r = $scope.tabs[$scope.current].stateRadius,
				d = path.getAttribute('d'),
				M = d.match(/M[-\d\.e]*,[-\d\.e]*\s/)[0],
				P = d.match(/L[-\d\.e]*,[-\d\.e]*/)[0],
				l = transform(C, L, r + 10),
				m = transform(L, C, r);

			d = d.replace(M, 'M' + m.x + ',' + m.y + ' ').replace(P, 'L' + l.x + ',' + l.y);
			path.setAttribute('d', d);

			$scope.hoverState.transitions.push($scope.activeTransition);
			$scope.hoverState = null;
			$scope.activeTransition = null;
		};

		$scope.setHoverState = function (id) {
			$scope.hoverState = $scope.tabs[$scope.current].states.getById(id);
		};

		$scope.dropHoverState = function () {
			$scope.hoverState = null;
		};

		$scope.openTransitionTable = function (event) {
			$mdDialog.show({
				controller: transitionTableCtrl,
				templateUrl: 'app/components/transitionTable/transitionTable.html',
				parent: angular.element(document.body),
				targetEvent: event,
				clickOutsideToClose: true
			})
			.then(function (answer) { }, function () { });
		};

		$scope.$watch('activeState.name', function (newValue, oldValue) {
			if (newValue && newValue.length > $scope.preferences.stateNameMaxLength)
				$scope.activeState.name = oldValue;
		});

		function Tab(index) {
			this.id = 'tab-' + index;
			this.index = index;
			this.statesCount = 0;
			this.transitionsCount = 0;
			this.states = [];
			this.transitions = [];
			this.scale = 1.0;
			this.defaultStateColor = $scope.preferences.defaultStateColor;
			this.startStateColor = $scope.preferences.startStateColor;
			this.acceptStateColor = $scope.preferences.acceptStateColor;
			this.stateRadius = $scope.preferences.stateRadius;
			this.stateNameColor = $scope.preferences.stateNameColor;
		}

		function State(tabIndex, index, name) {
			this.id = 'state-' + tabIndex + '-' + index;
			this.index = index;
			this.name = name;
			this.start = false;
			this.accept = false;
			this.defs = null;
			this.use = null;
			this.transitions = [];
			this.targetsM = [];
		}

		function Transition(tabIndex, index) {
			this.id = 'transition-' + tabIndex + '-' + index;
			this.index = index;
			this.name = null;
			this.defs = null;
			this.use = null;
		}

		function transform(C, L, r) {
			var a = Math.atan((L.x - C.x) / (L.y - C.y)),
				k = L.y >= C.y ? 1 : -1;
			return {
				x: r * Math.sin(a) * k + C.x,
				y: r * Math.cos(a) * k + C.y
			};
		}

		function quadratic(M, L) {
			var cQ = {
				x: M.x + (L.x - M.x) / 2,
				y: M.y + (L.y - M.y) / 2
			};
			var lQ = {
				x: M.x + (cQ.x - M.x) / 2,
				y: M.y + (cQ.y - M.y) / 2
			};
			var rQ = {
				x: M.x + (L.x - cQ.x) / 2,
				y: M.y + (L.y - cQ.y) / 2
			};
			return { lQ: lQ, cQ: cQ, rQ: rQ };
		}

		Element.prototype.setAttributes = function (attrs) {
			for (var key in attrs)
				this.setAttribute(key, attrs[key]);
		};

		Element.prototype.draggable = function () {
			var that = this,
				targetsM = [],
				scale = 0,
				r = 0;

			that.addEventListener('mousedown', function (event) {
				if ($scope.transitionMode.enabled) return;
				targetsM = $scope.tabs[$scope.current].states.getById(event.target.getAttribute('id')).targetsM;
				scale = $scope.tabs[$scope.current].scale;
				r = $scope.tabs[$scope.current].stateRadius;
				event.preventDefault();
				document.addEventListener('mousemove', mouseMove);
				document.addEventListener('mouseup', mouseUp);
			});

			function mouseMove(event) {
				$scope.hasDragged = true;

				var x = event.movementX / scale,
					y = event.movementY / scale,
					C = {
						x: that.x.animVal.value + x,
						y: that.y.animVal.value + y
					};

				that.setAttribute('x', C.x);
				that.setAttribute('y', C.y);

				for (var i in targetsM) {
					if (typeof targetsM[i] === 'function')
						continue;

					var d = targetsM[i].getAttribute('d'),
						M = d.match(/M[-\d\.e]*,[-\d\.e]*\s/)[0],
						L = d.match(/L[-\d\.e]*,[-\d\.e]*/)[0],
						l = L.substring(1).split(','),
						lx = parseFloat(l[0]) + x,
						ly = parseFloat(l[1]) + y,
						m = transform(C, { x: lx, y: ly }, r);

					d = d.replace(M, 'M' + m.x + ',' + m.y + ' ');
					targetsM[i].setAttribute('d', d);
				}
			}

			function mouseUp(event) {
				document.removeEventListener('mousemove', mouseMove);
				document.removeEventListener('mouseup', mouseUp);
			}
		};

		Array.prototype.getById = function (id) {
			return this[this.map(function (e) { return e.id }).indexOf(id)];
		};
	}
})(angular.module('VisualAutomatonApp'));