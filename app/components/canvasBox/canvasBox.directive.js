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

	function canvasBoxCtrl($scope, $rootScope, $compile) {
		const src = 'http://www.w3.org/2000/svg';

		$scope.preferences = $rootScope.preferences;

		$scope.drawState = function (event) {
			console.log(event);
			var attrs = {
				fill: '{{preferences.defaultStateColor}}',
				cx: event.offsetX,
				cy: event.offsetY,
				r: '{{preferences.stateRadius}}'
			};
			var circle = document.createElementNS(src, "circle");
			circle.setAttributes(attrs);
			circle.classList.add('state');
			circle.draggable();
			document.getElementById('canvas').appendChild($compile(circle)($scope)[0]);
		};

        var selected = null,
        previous = null;
        $scope.tabs = [{}, {}, {}];
		$scope.selectedIndex = 2;
		$scope.$watch('selectedIndex', function (current, old) {
			previous = selected;
			selected = $scope.tabs[current];
		});
		$scope.addTab = function (title, view) {
			view = view || title + " Content View";
			$scope.tabs.push({ title: title, content: view, disabled: false });
		};
		$scope.removeTab = function (tab) {
			var index = $scope.tabs.indexOf(tab);
			$scope.tabs.splice(index, 1);
		};
	}

})(angular.module('VisualAutomatonApp'));