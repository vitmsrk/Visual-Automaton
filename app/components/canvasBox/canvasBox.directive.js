(function (app) {
	'use strict';

	app.directive('canvasBox', canvasBox);
	app.controller('canvasBoxCtrl', canvasBoxCtrl);

	function canvasBox() {
		return {
			bindToController: true,
			controller: 'canvasBoxCtrl',
			replace: true,
			templateUrl: '/app/components/canvasBox/canvasBox.html',
		}
	}

	function canvasBoxCtrl($scope, $rootScope, canvasSrvc) {
		canvasSrvc.drawState();
	}

})(angular.module('VisualAutomatonApp'));