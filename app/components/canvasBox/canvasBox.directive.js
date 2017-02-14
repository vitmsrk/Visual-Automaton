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

	function canvasBoxCtrl($scope, $compile, $mdMenu) {
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
		
		$scope.getCanvas = function () {
			return document.getElementById($scope.tabs[$scope.current].id);
		};

		$scope.addTab = function () {
			$scope.tabs.push(new Tab(++$scope.tabsCount));
		};

		$scope.removeTab = function (tab) {
			$scope.tabs.splice($scope.tabs.indexOf(tab), 1);
		};

		$scope.drawState = function (event, tab) {
			var state = new State(tab.index, ++tab.statesCount, $scope.preferences.stateNamePrefix + (tab.statesCount - 1));

			var circle = document.createElementNS(src, 'circle');
			circle.setAttributes({
				'ng-attr-fill': '{{tabs[current].states.getById("' + state.id + '").final ? tabs[current].finalStateColor : tabs[current].states.getById("' + state.id + '").start ? tabs[current].startStateColor : tabs[current].defaultStateColor}}',
				'ng-attr-r': '{{tabs[current].stateRadius}}',
			});

			var text = document.createElementNS(src, 'text');
			text.innerHTML = state.name;
			text.setAttributes({
				'class': 'non-selectable',
				'ng-attr-fill': '{{tabs[current].stateNameColor}}',
				'text-anchor': 'middle',
				'alignment-baseline': 'middle'
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
				'ng-attr-transform': 'scale({{tabs[current].scale}})',
				'ng-click': 'openMenu($event)'
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
			var canvas = document.getElementById($scope.tabs[$scope.current].id);
			canvas.removeChild($scope.activeState.use);
			canvas.removeChild($scope.activeState.defs);
			$scope.tabs[$scope.current].states.splice($scope.tabs[$scope.current].states.indexOf($scope.activeState), 1);
			menuCtrl.close();
		};

		$scope.openMenu = function (event) {
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
			transition = new Transition(tab.index, ++tab.transitionsCount);
			transition.M.x = parseInt($scope.activeState.use.getAttribute('x')) + tab.stateRadius;
			transition.M.y = $scope.activeState.use.getAttribute('y');
			$scope.activeState.targets.push(transition.M);
			//$scope.activeState.use.draggable($scope.activeState.targets);
			$scope.$watch('activeState', function (newValue, oldValue) {
				console.log(newValue);
			});

			var path = document.createElementNS(src, 'path');
			path.setAttributes({
				'id': transition.id + '-' + 'def',
				'ng-attr-d': 'M {{tabs[current].transitions.getById("' + transition.id + '").M.x}}, {{tabs[current].transitions.getById("' + transition.id + '").M.y}} L 400, 400',
				'fill': 'none',
				'ng-attr-stroke': '{{preferences.pathColor}}',
				'ng-attr-stroke-width': '{{preferences.pathWidth}}px',
				'marker-end': 'url(#arrow)'
			});

			var defs = document.createElementNS(src, 'defs');
			defs.appendChild($compile(path)($scope)[0]);

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

			//$scope.$watch('tabs[current].transitions.getById("' + transition.id + '").M')

			var canvas = $scope.getCanvas();
			canvas.appendChild(transition.defs);
			canvas.appendChild(transition.use);
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
			this.finalStateColor = $scope.preferences.finalStateColor;
			this.stateRadius = $scope.preferences.stateRadius;
			this.stateNameColor = $scope.preferences.stateNameColor;
		}

		function State(tabIndex, index, name) {
			this.id = 'state-' + tabIndex + '-' + index;
			this.index = index;
			this.name = name;
			this.start = false;
			this.final = false;
			this.defs = null;
			this.use = null;
			this.targets = [];
			this.position = { x: 0, y: 0 };
		}

		function Transition(tabIndex, index) {
			this.id = 'transition-' + tabIndex + '-' + index;
			this.index = index;
			this.name = null;
			this.defs = null;
			this.use = null;
			this.M = { x: 0, y: 0 };
		}

		Element.prototype.setAttributes = function (attrs) {
			for (var key in attrs)
				this.setAttribute(key, attrs[key]);
		};

		Element.prototype.draggable = function (targets) {
			var that = this;

			that.addEventListener('mousedown', function (event) {
				event.preventDefault();
				document.addEventListener('mousemove', mouseMove);
				document.addEventListener('mouseup', mouseUp);
			});

			function mouseMove(event) {
				$scope.hasDragged = true;
				var scale = $scope.tabs[$scope.current].scale;
				that.setAttribute('x', that.x.animVal.value + event.movementX / scale);
				that.setAttribute('y', that.y.animVal.value + event.movementY / scale);
				if (!targets) return;
				for (var i in targets) {
					targets[i].x += event.movementX / scale;
					targets[i].y += event.movementY / scale;
					//targets[i].setAttribute('x', targets[i].x.animVal[0].value + event.movementX / scale);
					//targets[i].setAttribute('y', targets[i].y.animVal[0].value + event.movementY / scale);
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