(function (app) {
	'use strict';

	app.directive('topBar', topBar);
	app.controller('topBarCtrl', topBarCtrl);

	function topBar() {
		return {
			bindToController: true,
			controller: 'topBarCtrl',
			replace: true,
			templateUrl: 'app/components/topBar/topBar.html',
		}
	}

	function topBarCtrl($scope, $rootScope, config, $mdMenu, fileIOSrvc) {
		$scope.version = config.version;

		$scope.saveAsImage = function() {
			$rootScope.$emit('saveAsImage');
		};

		$scope.saveAsFile = function() {
			$rootScope.$emit('serialize');
		};

		$scope.open = function() {
			document.getElementById('file-uploader').click();
		};

		$scope.uploadFile = function (event) {
			if (event.target.files[0]) {
				fileIOSrvc.deserialize(event.target.files[0]);
				event.target.value = "";
			}
		};
	}

})(angular.module('VisualAutomatonApp'));