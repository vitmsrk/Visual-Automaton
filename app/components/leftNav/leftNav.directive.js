(function (app) {
	'use strict';

	app.directive('leftNav', leftNav);
	app.controller('leftNavCtrl', leftNavCtrl);

	function leftNav() {
		return {
			bindToController: true,
			controller: 'leftNavCtrl',
			replace: true,
			templateUrl: 'leftNav.html',
		}
	}

	function leftNavCtrl($scope, $rootScope) {

	}

})(angular.module('VisualAutomatonApp'));