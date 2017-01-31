(function () {
	'use strict';

	angular.module('VisualAutomatonApp', ['ngMaterial', 'ngResource', 'ngCookies'])
		.run(['$rootScope', '$cookies', run]);

	function run($rootScope, $cookies) {
		$rootScope.click = function () {
			console.log('sfsdfg');
		};
	}
})();