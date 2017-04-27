(function () {
	'use strict';

	angular.module('VisualAutomatonApp', ['ngMaterial', 'ngResource', 'ngCookies', 'mdColorPicker'])
	.constant('config', { version: '1.0.0' })
	.run(['$rootScope', '$cookies', '$resource', run])
	.config(['$mdThemingProvider', '$compileProvider', config]);

	const DEFAULT_TRANSLATION = 'en';

	const DEFAULT_PREFERENCES = {
		defaultStateColor: '#8f9ca2',
		startStateColor: '#0277BD',
		acceptStateColor: '#388E3C',
		stateRadius: 25,
		stateNamePrefix: 'q',
		stateNameColor: '#fff',
		stateNameMaxLength: 3,
		pathColor: '#666',
		pathWidth: 2,
		startPathSize: 35,
		emptySetSymbol: '-',
		emptyExpressionSymbol: 'e'
	};

	function run($rootScope, $cookies, $resource) {
		($rootScope.getTranslation = function (code) {
			var path = 'assets/resources/';

			if (!code) {
				code = $cookies.get('VISUAL_AUTOMATON_TRANSLATION') || DEFAULT_TRANSLATION;
			}

			$resource(path + code + '.json').get(function (data) {
				$rootScope.translation = data;
				$rootScope.$emit('translationChanged');
			});

			$cookies.put('VISUAL_AUTOMATON_TRANSLATION', code);
			$rootScope.currentTranslation = code;
		})();

		($rootScope.getPreferences = function () {
			$rootScope.preferences = $cookies.getObject('VISUAL_AUTOMATON_PREFERENCES') || DEFAULT_PREFERENCES;
		})();

		$rootScope.getDefaultPreferences = function () {
			return DEFAULT_PREFERENCES;
		};

		$rootScope.setPreferences = function (preferences) {
			$cookies.putObject('VISUAL_AUTOMATON_PREFERENCES', preferences);
			$rootScope.preferences = preferences;
		};

		$rootScope.restorePreferences = function () {
			$cookies.remove('VISUAL_AUTOMATON_PREFERENCES');
			$rootScope.preferences = DEFAULT_PREFERENCES;
		};
	}

	function config($mdThemingProvider, $compileProvider) {
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

		$compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
	}
})();