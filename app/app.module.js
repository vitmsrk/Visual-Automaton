(function () {
	'use strict';

	angular.module('VisualAutomatonApp', ['ngMaterial', 'ngResource', 'ngCookies'])
		.run(['$rootScope', '$cookies', '$resource', run]);

	const DEFAULT_TRANSLATION = 'en';

	function run($rootScope, $cookies, $resource) {
		($rootScope.getTranslation = function (translation) {
			var path = '/assets/resources/';
			if (!translation)
				translation = $cookies.get('VISUAL_AUTOMATON_TRANSLATION') || DEFAULT_TRANSLATION;
			$resource(path + translation + '.json').get(function (data) {
				$rootScope.translation = data;
			});
			$cookies.put('VISUAL_AUTOMATON_TRANSLATION', translation);
		})();
	}
})();