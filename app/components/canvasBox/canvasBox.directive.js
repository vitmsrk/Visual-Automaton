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
				$mdMenu.show({
					scope: $scope,
					mdMenuCtrl: menuCtrl,
					element: $compile(angular.element(angular.copy(document.getElementById('state-menu').firstElementChild)))($scope),
					target: event.target
				});
			},
			close: function () {
				$mdMenu.hide();
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
					left: $scope.preferences.stateRadius * 2 * $scope.tabs[$scope.current].scale
				};
			}
		};

		$scope.tabsCount = 1;
		$scope.tabs = [new Tab($scope.tabsCount)];
		$scope.current = 0;
		$scope.hasDragged = false;
		$scope.activeState = 5;

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
				'ng-attr-fill': '{{preferences.defaultStateColor}}',
				'ng-attr-r': '{{preferences.stateRadius}}'
			});

			var text = document.createElementNS(src, 'text');
			text.innerHTML = state.name;
			text.setAttributes({
				'class': 'non-selectable',
				'ng-attr-fill': '{{preferences.stateNameColor}}',
				'text-anchor': 'middle',
				'alignment-baseline': 'middle'
			});

			var g = document.createElementNS(src, 'g');
			g.setAttributes({ 'id': state.id + '-' + 'def' });
			g.appendChild($compile(circle)($scope)[0]);
			g.appendChild($compile(text)($scope)[0]);

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

			var canvas = document.getElementById(tab.id);
			canvas.appendChild(state.defs);
			canvas.appendChild(state.use);
		};

		$scope.removeState = function () {
			var canvas = document.getElementById($scope.tabs[$scope.current].id);
			canvas.removeChild($scope.activeState.use);
			canvas.removeChild($scope.activeState.defs);
			$scope.tabs[$scope.current].states.splice($scope.tabs[$scope.current].states.indexOf($scope.activeState), 1);
			$scope.activeState = null;
		};

		$scope.openMenu = function (event) {
			if ($scope.hasDragged)
				$scope.hasDragged = false;
			else {
				$scope.activeState = $scope.tabs[$scope.current].states.getById(event.target.id);
				menuCtrl.open(event);
			}
		};

		function Tab(index) {
			this.id = 'tab-' + index;
			this.index = index;
			this.statesCount = 0;
			this.states = [];
			this.scale = 1.0;
		}

		function State(tabIndex, index, name) {
			this.id = 'state-' + tabIndex + index;
			this.index = index;
			this.name = name;
			this.initial = false;
			this.final = false;
			this.defs = null;
			this.use = null;
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
				if (!targets)
					return;
				for (var i in targets) {
					targets[i].setAttribute('x', targets[i].x.animVal[0].value + event.movementX / scale);
					targets[i].setAttribute('y', targets[i].y.animVal[0].value + event.movementY / scale);
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