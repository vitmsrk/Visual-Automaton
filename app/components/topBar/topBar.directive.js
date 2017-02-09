(function (app) {
	'use strict';

	app.directive('topBar', topBar);
	app.controller('topBarCtrl', topBarCtrl);

	function topBar() {
		return {
			bindToController: true,
			controller: 'topBarCtrl',
			replace: true,
			templateUrl: 'topBar.html',
		}
	}

	function topBarCtrl($scope, $rootScope) {

	}

})(angular.module('VisualAutomatonApp'));