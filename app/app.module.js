(function () {
	'use strict';

	angular.module('VisualAutomatonApp', ['ngMaterial', 'ngResource', 'ngCookies'])
		.run(['$rootScope', '$cookies', '$resource', run])
		.config(['$mdThemingProvider', config]);

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

	function config($mdThemingProvider) {
		$mdThemingProvider.theme('default')
			.primaryPalette('blue-grey', {
				'default': '800',
				'hue-1': '100',
				'hue-2': '300',
				'hue-3': '600'
			});
	}
})();