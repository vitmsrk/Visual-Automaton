(function (app) {
	'use strict';

	app.directive('leftNav', leftNav);
	app.controller('leftNavCtrl', leftNavCtrl);

	function leftNav() {
		return {
			bindToController: true,
			controller: 'leftNavCtrl',
			replace: true,
			templateUrl: 'app/components/leftNav/leftNav.html',
		}
	}

	function leftNavCtrl($scope, $rootScope, automatonSrvc) {
		$scope.clear = function () {
			$scope.regexp = '';
			$rootScope.$emit('clearAutomaton');
		};

		$scope.build = function () {
			var automaton = automatonSrvc.regExpToNFA($scope.regexp);
			$rootScope.$emit('drawAutomaton', automaton);
		};

		$rootScope.$on('sendAutomatonName', function (event, name) {
			$scope.automatonName = name;
		});

		$scope.rename = function () {
			$rootScope.$emit('renameAutomaton', $scope.automatonName);
		};
	}

})(angular.module('VisualAutomatonApp'));