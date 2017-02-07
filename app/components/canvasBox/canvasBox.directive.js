(function (app) {
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

		$scope.tabsCount = 1;
		$scope.tabs = [{ id: 'tab-1', index: 1}];

		$scope.addTab = function () {
			$scope.tabs.push({ id: 'tab-' + ++$scope.tabsCount, index: $scope.tabsCount });
		};

		$scope.removeTab = function (tab) {
			$scope.tabs.splice($scope.tabs.indexOf(tab), 1);
		};

		$scope.drawState = function (event, id) {
			var attrs = {
				fill: '{{preferences.defaultStateColor}}',
				cx: event.offsetX,
				cy: event.offsetY,
				r: '{{preferences.stateRadius}}'
			};
			var circle = document.createElementNS(src, 'circle');
			circle.setAttributes(attrs);
			circle.classList.add('state');
			circle.draggable();
			document.getElementById(id).appendChild($compile(circle)($scope)[0]);
		};
	}

})(angular.module('VisualAutomatonApp'));