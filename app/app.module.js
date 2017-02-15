(function () {
	'use strict';

	angular.module('VisualAutomatonApp', ['ngMaterial', 'ngResource', 'ngCookies'])
		.constant('config', { version: '0.1.7' })
		.run(['$rootScope', '$cookies', '$resource', run])
		.config(['$mdThemingProvider', config]);

	const DEFAULT_TRANSLATION = 'en';

	function run($rootScope, $cookies, $resource) {
		($rootScope.getTranslation = function (code) {
			var path = 'assets/resources/';
			if (!code)
				code = $cookies.get('VISUAL_AUTOMATON_TRANSLATION') || DEFAULT_TRANSLATION;
			$resource(path + code + '.json').get(function (data) {
				$rootScope.translation = data;
			});
			$cookies.put('VISUAL_AUTOMATON_TRANSLATION', code);
			$rootScope.currentTranslation = code;
		})();

		$rootScope.preferences = {
			defaultStateColor: '#8f9ca2',
			startStateColor: '#0277BD',
			acceptStateColor: '#388E3C',
			stateRadius: 25,
			stateNamePrefix: 'q',
			stateNameColor: '#fff',
			stateNameMaxLength: 3,
			pathColor: '#666',
			pathWidth: 2,
			startPathSize: 35
		};
	}

	function config($mdThemingProvider) {
		$mdThemingProvider.theme('default')
			.primaryPalette('blue-grey', {
				'default': '800',
				'hue-1': '100',
				'hue-2': '300',
				'hue-3': '600'
			})
			.accentPalette('blue-grey', {
				'default': '300',
				'hue-1': '100',
				'hue-2': '300',
				'hue-3': '600'
			});
	}
})();