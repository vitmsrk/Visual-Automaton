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

	function canvasBoxCtrl($scope, $rootScope, $compile, $mdMenu, $mdDialog, fileIOSrvc) {
		const src = 'http://www.w3.org/2000/svg';
		const xlink = 'http://www.w3.org/1999/xlink';

		var stateMenuCtrl = {
			open: function (event) {
				$scope.activeState = $scope.tabs[$scope.current].states.getById(event.target.id);
				$scope.activeStateName = $scope.activeState.name;

				$mdMenu.show({
					scope: $scope,
					mdMenuCtrl: stateMenuCtrl,
					element: $compile(angular.element(angular.copy(document.getElementById('state-menu').firstElementChild)))($scope),
					target: event.target
				});
			},
			close: function () {
				$mdMenu.hide();

				if (!$scope.activeState) return;

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

		var transitionMenuCtrl = {
			open: function (event) {								
				$scope.activeTransition = $scope.tabs[$scope.current].transitions.getById(event.target.id);
				$scope.activeTransition.name = $scope.activeTransition.getString();

				$mdMenu.show({
					scope: $scope,
					mdMenuCtrl: transitionMenuCtrl,
					element: $compile(angular.element(angular.copy(document.getElementById('transition-menu').firstElementChild)))($scope),
					target: event.target
				});
			},
			close: function () {
				$mdMenu.hide();

				if (!$scope.activeTransition) return;

				if ($scope.activeTransition.name.length == 0) {
					$scope.activeTransition.name = $scope.activeTransition.getString();
				} else {
					$scope.activeTransition.symbols = $scope.activeTransition.name.split(',');
					$scope.activeTransition.textPath.innerHTML = $scope.activeTransition.getString();
				}

				window.setTimeout(function () {
					$scope.activeTransition = null;
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
					top: $scope.transitionMenuOffsets.Y + 12,
					left: $scope.transitionMenuOffsets.X
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
		$scope.transitionMenuOffsets = null;

		$scope.getCanvas = function () {
			return document.getElementById($scope.tabs[$scope.current].id);
		};

		$scope.transitionMode = new (function () {
			var that = this, target = null, canvas = null, scale = 0, r = 0, h = 0, clientRect = null, activeState = null, C = null;

			that.enabled = false;

			that.start = function (t) {
				that.enabled = true;
				target = t;
				canvas = $scope.getCanvas();
				scale = $scope.tabs[$scope.current].scale;
				r = $scope.preferences.stateRadius;
				clientRect = canvas.getBoundingClientRect();
				activeState = $scope.activeState;
				C = { x: parseFloat(activeState.use.getAttribute('x')), y: parseFloat(activeState.use.getAttribute('y')) };
				document.addEventListener('mousemove', mouseMove);
				canvas.addEventListener('click', click);
			};

			that.stop = function () {
				that.enabled = false;
				$scope.$apply();
				if ($scope.hoverState) {
					$scope.bindTransition(activeState);
				} else {
					canvas.removeChild($scope.activeTransition.use);
					canvas.removeChild($scope.activeTransition.defs);
					activeState.startTransitions.splice(activeState.startTransitions.indexOf($scope.activeTransition), 1);
					$scope.tabs[$scope.current].transitions.splice($scope.tabs[$scope.current].transitions.indexOf($scope.activeTransition), 1);
					$scope.activeTransition = null;
				}
			};

			function mouseMove(event) {
				var E = { x: (event.x - clientRect.left) / scale, y: (event.y - clientRect.top) / scale },
					w = distance(C, E);
				h = Math.max($scope.activeTransition.h, 150 - w);
				$scope.activeTransition.a = angle(C, E) || $scope.activeTransition.a;
				var	Q = quadratic(C, E, h, $scope.activeTransition.a),
					M = transform(C, Q[0], r),
					L = transform(E, Q[2], 10),
					d = quadraticPath(M, Q[0], Q[1], Q[2], L);
				target.setAttribute('d', d);
			}

			function click(event) {
				event.preventDefault();
				$scope.activeTransition.h = h;
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

		$scope.addState = function (event, tab) {
			if ($scope.transitionMode.enabled) return;
			var state = new State(tab.index, ++tab.statesCount, $scope.preferences.stateNamePrefix + (tab.statesCount - 1));
			state.position = {
				x: event.offsetX / $scope.tabs[$scope.current].scale,
				y: event.offsetY / $scope.tabs[$scope.current].scale
			};
			$scope.drawState(state);
			tab.states.push(state);
		};

		$scope.drawState = function (state) {
			var circle = document.createElementNS(src, 'circle');
			circle.setAttributes({
				'ng-attr-fill': '{{tabs[current].states.getById("' + state.id + '").accept ? preferences.acceptStateColor : tabs[current].states.getById("' + state.id + '").start ? preferences.startStateColor : preferences.defaultStateColor}}',
				'ng-attr-r': '{{preferences.stateRadius}}',
			});

			var text = document.createElementNS(src, 'text');
			text.innerHTML = state.name;
			text.setAttributes({
				'class': 'non-selectable',
				'ng-attr-fill': '{{preferences.stateNameColor}}',
				'text-anchor': 'middle',
				'alignment-baseline': 'central'
			});

			var startPath = document.createElementNS(src, 'path'),
				mx = -($scope.preferences.stateRadius + $scope.preferences.startPathSize + 10),
				lx = -($scope.preferences.stateRadius + 10);
			startPath.setAttributes({
				'ng-if': 'tabs[current].states.getById("' + state.id + '").start',
				'ng-attr-d': 'M ' + mx + ', 0 L ' + lx + ', 0',
				'fill': 'none',
				'ng-attr-stroke': '{{preferences.pathColor}}',
				'ng-attr-stroke-width': '{{preferences.pathWidth}}px',
				'marker-end': 'url(#arrow-marker)'
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
				'x': state.position.x,
				'y': state.position.y,
				'class': 'state',
				'ng-class': '{"transition-mode": transitionMode.enabled}',
				'ng-attr-transform': 'scale({{tabs[current].scale}})',
				'ng-click': 'openStateMenu($event)',
				'ng-mouseenter': 'transitionMode.enabled ? setHoverState("' + state.id + '") : 0',
				'ng-mouseleave': 'transitionMode.enabled ? dropHoverState() : 0'
			});
			use.draggable($scope);

			state.defs = $compile(defs)($scope)[0];
			state.use = $compile(use)($scope)[0];

			var canvas = $scope.getCanvas();
			canvas.appendChild(state.defs);
			canvas.appendChild(state.use);
		};

		$scope.removeState = function () {
			$scope.deleteState($scope.activeState);
			$scope.tabs[$scope.current].states.splice($scope.tabs[$scope.current].states.indexOf($scope.activeState), 1);
			stateMenuCtrl.close();
		};

		$scope.deleteState = function (state) {
			var canvas = $scope.getCanvas();

			canvas.removeChild(state.use);
			canvas.removeChild(state.defs);

			for (var i in state.startTransitions) {
				var transition = state.startTransitions[i];
				canvas.removeChild(transition.use);
				canvas.removeChild(transition.defs);
				transition.endState.endTransitions.splice(transition.endState.endTransitions.indexOf(transition), 1);
				$scope.tabs[$scope.current].transitions.splice($scope.tabs[$scope.current].transitions.indexOf(transition), 1);
			}

			for (var i in state.endTransitions) {
				var transition = state.endTransitions[i];
				canvas.removeChild(transition.use);
				canvas.removeChild(transition.defs);
				transition.startState.startTransitions.splice(transition.startState.startTransitions.indexOf(transition), 1);
				$scope.tabs[$scope.current].transitions.splice($scope.tabs[$scope.current].transitions.indexOf(transition), 1);
			}
		};

		$scope.openStateMenu = function (event) {
			if ($scope.transitionMode.enabled) return;
			$scope.hasDragged ? $scope.hasDragged = false : stateMenuCtrl.open(event);
		};

		$scope.closeStateMenu = function () {
			stateMenuCtrl.close();
		};

		$scope.openTransitionMenu = function (event) {
			//event.target.blur();
			var clientRect = event.target.getBoundingClientRect();
			$scope.transitionMenuOffsets = {
				X: event.x - clientRect.left,
				Y: event.y - clientRect.top
			};
			transitionMenuCtrl.open(event);
		};

		$scope.closeTransitionMenu = function () {
			transitionMenuCtrl.close();
		};

		$scope.toggleStart = function () {
			for (var i in $scope.tabs[$scope.current].states)
				if (!angular.equals($scope.tabs[$scope.current].states[i], $scope.activeState))
					$scope.tabs[$scope.current].states[i].start = false;
		};

		$scope.addTransition = function (event) {
			var tab = $scope.tabs[$scope.current],
				transition = new Transition(tab.index, ++tab.transitionsCount),
				clientRect = $scope.getCanvas().getBoundingClientRect(),
				C = { x: parseFloat($scope.activeState.use.getAttribute('x')), y: parseFloat($scope.activeState.use.getAttribute('y')) },
				E = { x: (event.x - clientRect.left) / tab.scale, y: (event.y - clientRect.top) / tab.scale };

			transition.a = angle(C, E);
			transition.M = transform(C, E, $scope.preferences.stateRadius);
			transition.L = transform(E, C, 10);
			transition.startState = $scope.activeState;
			tab.transitions.push(transition);
			$scope.activeState.startTransitions.push(transition);
			$scope.drawTransition(transition);
			$scope.activeTransition = transition;
			$scope.transitionMode.start(transition.defs.firstElementChild.firstElementChild);
		};

		$scope.drawTransition = function (transition) {
			var Q = quadratic(transition.M, transition.L, transition.h, transition.a);

			var path = document.createElementNS(src, 'path');
			path.setAttributes({
				'id': transition.id + '-' + 'path',
				'ng-attr-d': quadraticPath(transition.M, Q[0], Q[1], Q[2], transition.L),
				'fill': 'none',
				'ng-attr-stroke': '{{preferences.pathColor}}',
				'ng-attr-stroke-width': '{{preferences.pathWidth}}px',
				'marker-end': 'url(#arrow-marker)'
			});

			var textPath = document.createElementNS(src, 'textPath');
			textPath.setAttributeNS(xlink, 'href', '#' + path.getAttribute('id'));
			textPath.setAttributes({
				'startOffset': '50%',
				'class': 'non-selectable'
			});
			textPath.innerHTML = transition.getString();

			var text = document.createElementNS(src, 'text');
			text.setAttributes({
				'text-anchor': 'middle',
				'class': 'transition-text'
			});
			text.appendChild($compile(textPath)($scope)[0]);

			var g = document.createElementNS(src, 'g');
			g.setAttributes({ 'id': transition.id + '-' + 'def' });
			g.appendChild($compile(path)($scope)[0]);
			g.appendChild($compile(text)($scope)[0]);

			var defs = document.createElementNS(src, 'defs');
			defs.appendChild($compile(g)($scope)[0]);

			var use = document.createElementNS(src, 'use');
			use.setAttributeNS(xlink, 'href', '#' + g.getAttribute('id'));
			use.setAttributes({
				'id': transition.id,
				'class': 'transition',
				'ng-attr-transform': 'scale({{tabs[current].scale}})',
				'ng-click': 'openTransitionMenu($event)'
			});
			use.transitionDraggable($scope);

			transition.defs = $compile(defs)($scope)[0];
			transition.use = $compile(use)($scope)[0];
			transition.textPath = transition.defs.firstElementChild.childNodes[1].firstElementChild;
			
			var canvas = $scope.getCanvas();
			canvas.appendChild(transition.defs);
			canvas.appendChild(transition.use);
		};

		$scope.bindTransition = function (activeState) {
			var E = { x: parseFloat($scope.hoverState.use.getAttribute('x')), y: parseFloat($scope.hoverState.use.getAttribute('y')) },
				C = { x: parseFloat(activeState.use.getAttribute('x')), y: parseFloat(activeState.use.getAttribute('y')) },
				path = $scope.activeTransition.defs.firstElementChild.firstElementChild,
				r = $scope.preferences.stateRadius,
				a = angle(C, E) || $scope.activeTransition.a,
				Q = quadratic(C, E, $scope.activeTransition.h, a),
				M = transform(C, Q[0], r),
				L = transform(E, Q[2], r + 10),
				d = quadraticPath(M, Q[0], Q[1], Q[2], L);
			path.setAttribute('d', d);
			$scope.activeTransition.a = a;

			$mdDialog.show($mdDialog.prompt()
				.title($scope.translation.TRANSITION_PROMPT_TITLE)
				.textContent($scope.translation.TRANSITION_PROMPT_MESSAGE)
				.placeholder($scope.translation.TRANSITION_PROMPT_PLACEHOLDER)
				.ariaLabel("Transition characters")
				.ok($scope.translation.TRANSITION_PROMPT_OK)
				.cancel($scope.translation.TRANSITION_PROMPT_CANCEL)
			).then(function (result) {
				if (!result) {
					cancelBind();
					return;
				}
				$scope.activeTransition.symbols = result.split(',');
				endBind();
			}, function () {
				cancelBind();
			});

			function endBind() {
				$scope.activeTransition.textPath.innerHTML = $scope.activeTransition.getString();
				$scope.activeTransition.endState = $scope.hoverState;
				$scope.hoverState.endTransitions.push($scope.activeTransition);
				$scope.hoverState = null;
				$scope.activeTransition = null;
			}

			function cancelBind() {
				var canvas = $scope.getCanvas();
				canvas.removeChild($scope.activeTransition.use);
				canvas.removeChild($scope.activeTransition.defs);
				$scope.tabs[$scope.current].transitions.splice($scope.tabs[$scope.current].transitions.indexOf($scope.activeTransition), 1);
				activeState.startTransitions.splice(activeState.startTransitions.indexOf($scope.activeTransition), 1);
				$scope.hoverState = null;
				$scope.activeTransition = null;
			}
		};

		$scope.removeTransition = function () {
			var canvas = $scope.getCanvas();

			canvas.removeChild($scope.activeTransition.use);
			canvas.removeChild($scope.activeTransition.defs);

			$scope.activeTransition.startState.startTransitions.splice($scope.activeTransition.startState.startTransitions.indexOf($scope.activeTransition), 1);
			$scope.activeTransition.endState.endTransitions.splice($scope.activeTransition.endState.endTransitions.indexOf($scope.activeTransition), 1);
			$scope.tabs[$scope.current].transitions.splice($scope.tabs[$scope.current].transitions.indexOf($scope.activeTransition), 1);

			transitionMenuCtrl.close();
		};

		$scope.setHoverState = function (id) {
			$scope.hoverState = $scope.tabs[$scope.current].states.getById(id);
		};

		$scope.dropHoverState = function () {
			$scope.hoverState = null;
		};

		$scope.openTransitionTable = function (event) {
			$scope.tabs[$scope.current].transitionTable.update();

			$mdDialog.show({
				controller: modalCtrl({
					table: $scope.tabs[$scope.current].transitionTable
				}),
				templateUrl: 'app/components/modals/transitionTable.html',
				parent: angular.element(document.body),
				targetEvent: event,
				clickOutsideToClose: false
			})
			.then(function (answer) { }, function () { });
		};

		$scope.openPreferences = function (event) {
			$mdDialog.show({
				controller: modalCtrl({
					init: initPreferences,
					restore: function (event, scope) {
						$mdDialog.show({
							controller: modalCtrl({
								title: $scope.translation.PREFERENCES_CONFIRM_TITLE,
								textContent: $scope.translation.PREFERENCES_CONFIRM_MESSAGE,
								answer: scope
							}),
							templateUrl: 'app/components/modals/confirm.html',
							parent: angular.element(document.body),
							targetEvent: event,
							skipHide: true,
							clickOutsideToClose: false
						})
						.then(function (scope) {
							$scope.restorePreferences();
							initPreferences(scope);
						}, function () { });
					},
					equals: function (preferences) {
						return angular.equals(preferences, $scope.getDefaultPreferences());
					}
				}),
				templateUrl: 'app/components/modals/preferences.html',
				parent: angular.element(document.body),
				targetEvent: event,
				clickOutsideToClose: false
			})
			.then(function (preferences) {
				$scope.setPreferences(preferences);
			}, function () { });
		};

		$scope.$watch('activeState.name', function (newValue, oldValue) {
			if (newValue && newValue.length > $scope.preferences.stateNameMaxLength)
				$scope.activeState.name = oldValue;
		});

		$scope.$watch('current', function (newValue, oldValue) {
			if ($scope.tabs[newValue]) {
				$rootScope.$emit('sendAutomatonName', $scope.tabs[newValue].title || $scope.translation.NEW_TAB + ' ' + $scope.tabs[newValue].index);
			}
		});

		$rootScope.$on('drawAutomaton', function (event, automaton) {
			var tab = $scope.tabs[$scope.current];
			tab.clear();

			var startStatePosition = { x: 100, y: 100 },
				stateSpacing = { x: 200, y: 100 },
				statePosition = { x: startStatePosition.x, y: startStatePosition.y };

			for (var i in automaton.states) {
				var state = new State(tab.index, ++tab.statesCount, automaton.states[i]);
				state.start = state.name === automaton.start;
				state.accept = automaton.accept.indexOf(state.name) != -1;
				state.position = { x: statePosition.x, y: statePosition.y };
				statePosition.x += stateSpacing.x;
				if (i % 4 == 0) {
					statePosition.y += stateSpacing.y;
					statePosition.x = startStatePosition.x;
				}
				tab.states.push(state);
				$scope.drawState(state);
			}

			for (var i in automaton.transitions) {
				var transition = new Transition(tab.index, ++tab.transitionsCount);
				transition.symbols = automaton.transitions[i].input;
				transition.startState = tab.states.getByName(automaton.transitions[i].source);
				transition.endState = tab.states.getByName(automaton.transitions[i].target);
				var C = { x: parseFloat(transition.startState.use.getAttribute('x')), y: parseFloat(transition.startState.use.getAttribute('y')) };
				var E = { x: parseFloat(transition.endState.use.getAttribute('x')), y: parseFloat(transition.endState.use.getAttribute('y')) };
				transition.a = angle(C, E) || transition.a;
				transition.M = transform(C, E, $scope.preferences.stateRadius);
				transition.L = transform(E, transition.M, $scope.preferences.stateRadius + 10);
				if (angular.equals(transition.startState, transition.endState)) {
					transition.h = 100;
					var Q = quadratic(transition.M, transition.L, transition.h, transition.a);
					transition.M = transform(C, Q[0], $scope.preferences.stateRadius);
					transition.L = transform(E, Q[2], $scope.preferences.stateRadius + 10);
				}
				transition.startState.startTransitions.push(transition);
				transition.endState.endTransitions.push(transition);
				tab.transitions.push(transition);
				$scope.drawTransition(transition);
			}
		});

		$rootScope.$on('drawFromFile', function (event, automaton) {
			$scope.fromFile = automaton;
			document.getElementById('draw').click();
		});

		$scope.drawFromFile = function (automaton) {
			var tab = $scope.tabs[$scope.current];
			tab.clear();

			for (var i in automaton.states) {
				var state = new State(tab.index, ++tab.statesCount, automaton.states[i].name);
				state.start = state.name === automaton.start;
				state.accept = automaton.accept.indexOf(state.name) != -1;
				state.position = automaton.states[i].position;
				tab.states.push(state);
				$scope.drawState(state);
			}

			for (var i in automaton.transitions) {
				var transition = new Transition(tab.index, ++tab.transitionsCount);
				transition.symbols = automaton.transitions[i].input;
				transition.startState = tab.states.getByName(automaton.transitions[i].source);
				transition.endState = tab.states.getByName(automaton.transitions[i].target);
				var C = { x: parseFloat(transition.startState.use.getAttribute('x')), y: parseFloat(transition.startState.use.getAttribute('y')) };
				var E = { x: parseFloat(transition.endState.use.getAttribute('x')), y: parseFloat(transition.endState.use.getAttribute('y')) };
				transition.h = automaton.transitions[i].height;
				transition.a = angle(C, E) || transition.a;
				transition.M = transform(C, E, $scope.preferences.stateRadius);
				transition.L = transform(E, transition.M, $scope.preferences.stateRadius + 10);
				var Q = quadratic(transition.M, transition.L, transition.h, transition.a);
				transition.M = transform(C, Q[0], $scope.preferences.stateRadius);
				transition.L = transform(E, Q[2], $scope.preferences.stateRadius + 10);
				transition.startState.startTransitions.push(transition);
				transition.endState.endTransitions.push(transition);
				tab.transitions.push(transition);
				$scope.drawTransition(transition);
			}
		};

		$rootScope.$on('clearAutomaton', function (event) {
			$scope.tabs[$scope.current].clear();
		});

		$rootScope.$on('translationChanged', function (event) {
			$rootScope.$emit('sendAutomatonName', $scope.tabs[$scope.current].title || $scope.translation.NEW_TAB + ' ' + $scope.tabs[$scope.current].index);
		});

		$rootScope.$on('renameAutomaton', function (event, name) {
			if (name !== $scope.translation.NEW_TAB + ' ' + $scope.tabs[$scope.current].index) {
				$scope.tabs[$scope.current].title = name;
			}
		});

		$rootScope.$on('serialize', function (event) {
			fileIOSrvc.serialize($scope.tabs[$scope.current]);
		});

		$rootScope.$on('saveAsImage', function (event) {
			fileIOSrvc.saveAsImage($scope.tabs[$scope.current].title || $scope.translation.NEW_TAB + ' ' + $scope.tabs[$scope.current].index);
		});

		function initPreferences(scope) {
			scope.preferences = angular.copy($scope.preferences);
			scope.$watch('preferences.stateNamePrefix', function (newValue, oldValue) {
				if (newValue && newValue.length > 1)
					scope.preferences.stateNamePrefix = oldValue;
			});
		}

		function Tab(index) {
			var that = this;
			this.id = 'tab-' + index;
			this.index = index;
			this.title = null;
			this.statesCount = 0;
			this.transitionsCount = 0;
			this.states = [];
			this.transitions = [];
			this.scale = 1.0;
			this.transitionTable = new TransitionTable(this);
			this.clear = function () {
				var canvas = $scope.getCanvas();
				for (var i in that.transitions) {
					canvas.removeChild(that.transitions[i].use);
					canvas.removeChild(that.transitions[i].defs);
				}
				for (var i in that.states) {
					canvas.removeChild(that.states[i].use);
					canvas.removeChild(that.states[i].defs);
				}
				that.states = [];
				that.transitions = [];
				that.statesCount = 0;
				that.transitionsCount = 0;
			};
		}

		function State(tabIndex, index, name) {
			this.id = 'state-' + tabIndex + '-' + index;
			this.index = index;
			this.name = name;
			this.start = false;
			this.accept = false;
			this.defs = null;
			this.use = null;
			this.position = null;
			this.startTransitions = [];
			this.endTransitions = [];
		}

		function Transition(tabIndex, index) {
			var that = this;
			this.id = 'transition-' + tabIndex + '-' + index;
			this.index = index;
			this.symbols = [];
			this.startState = null;
			this.endState = null;
			this.name = null;
			this.defs = null;
			this.use = null;
			this.textPath = null;
			this.h = 0;
			this.a = 0;
			this.M = null;
			this.L = null;
			this.getString = function () {
				var s = '';
				for (var i in that.symbols) {
					s += i == 0 ? that.symbols[i] : ', ' + that.symbols[i];
				}
				return s;
			};
		}

		function TransitionTable(tab) {
			var that = this;
			that.tab = tab;

			that.update = function () {
				that.alphabet = [];
				that.rows = [];

				for (var i in that.tab.transitions) {
					var transition = that.tab.transitions[i];
					if (typeof transition === 'function') continue;
					for (var j in transition.symbols) {
						var symbol = transition.symbols[j];
						if (typeof symbol === 'function') continue;
						if (that.alphabet.indexOf(symbol) == -1)
							that.alphabet.push(symbol);
					}
				}

				for (var i in that.tab.states) {
					var state = that.tab.states[i];
					if (typeof state === 'function') continue;
					that.rows[state.name] = [];
					for (var j in that.alphabet) {
						var symbol = that.alphabet[j];
						if (typeof symbol === 'function') continue;
						that.rows[state.name][symbol] = [];
						for (var k in state.startTransitions) {
							var transition = state.startTransitions[k];
							if (typeof transition === 'function') continue;
							for (var l in transition.symbols) {
								if (typeof transition.symbols[l] === 'function') continue;
								if (transition.symbols[l] == symbol)
									that.rows[state.name][symbol].push(transition.endState);
							}
						}
					}
				}
			};

			that.update();
		}
	}
})(angular.module('VisualAutomatonApp'));