﻿(function (app) {
	'use strict';

	app.directive('canvasBox', canvasBox);
	app.controller('canvasBoxCtrl', canvasBoxCtrl);

	function canvasBox() {
		return {
			bindToController: true,
			controller: 'canvasBoxCtrl',
			replace: true,
			templateUrl: '/app/components/canvasBox/canvasBox.html'
		}
	}

	function canvasBoxCtrl($scope, $compile) {
		const src = 'http://www.w3.org/2000/svg';

		$scope.scale = 1.0;
		$scope.tabsCount = 1;
		$scope.tabs = [new Tab($scope.tabsCount)];

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
				'fill': '{{preferences.defaultStateColor}}',
				'r': '{{preferences.stateRadius}}',
				'transform': 'scale({{scale}})'
			});

			var text = document.createElementNS(src, 'text');
			text.innerHTML = state.name;
			text.setAttributes({
				'class': 'non-selectable'
			});

			var g = document.createElementNS(src, 'g');
			g.setAttributes({
				'id': state.id + '-' + 'def'
			});
			g.appendChild($compile(circle)($scope)[0]);
			g.appendChild($compile(text)($scope)[0]);

			var defs = document.createElementNS(src, 'defs');
			defs.appendChild($compile(g)($scope)[0]);
			
			var use = document.createElementNS(src, 'use');
			use.setAttributes({
				'x': event.offsetX / $scope.scale,
				'y': event.offsetY / $scope.scale,
				'xlink:href': '#' + g.getAttribute('id'),
				'class': 'state'
			});

			var canvas = document.getElementById(tab.id);
			canvas.appendChild($compile(defs)($scope)[0]);
			canvas.appendChild($compile(use)($scope)[0]);
		};

		function Tab(index) {
			this.id = 'tab-' + index;
			this.index = index;
			this.statesCount = 0;
			this.states = [];
		}

		function State(tabIndex, index, name) {
			this.id = 'state-' + tabIndex + index;
			this.index = index;
			this.name = name;
			this.svg = null;
		}

		Element.prototype.setAttributes = function (attrs) {
			for (var key in attrs)
				this.setAttribute(key, attrs[key]);
		};

		Element.prototype.draggable = function (targets) {
			var that = this;
			targets = targets || [];

			that.addEventListener('mousedown', function (event) {
				event.preventDefault();
				document.addEventListener('mousemove', mouseMove);
				document.addEventListener('mouseup', mouseUp);
			});

			function mouseMove(event) {
				that.setAttribute('cx', that.cx.animVal.value + event.movementX / $scope.scale);
				that.setAttribute('cy', that.cy.animVal.value + event.movementY / $scope.scale);
				for (var i in targets) {
					targets[i].setAttribute('x', targets[0].x.animVal[0].value + event.movementX / $scope.scale);
					targets[i].setAttribute('y', targets[0].y.animVal[0].value + event.movementY / $scope.scale);
				}
			}

			function mouseUp(event) {
				document.removeEventListener('mousemove', mouseMove);
				document.removeEventListener('mouseup', mouseUp);
			}
		};
	}

})(angular.module('VisualAutomatonApp'));