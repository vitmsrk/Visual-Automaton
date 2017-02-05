(function (app) {
	'use strict';

	app.service('canvasSrvc', canvasSrvc);

	const src = 'http://www.w3.org/2000/svg';

	function canvasSrvc() {
		var canvas = document.getElementById('canvas');

		this.drawState = function () {
			var circle = document.createElementNS(src, "circle");
			circle.setAttribute("fill", "orange");
			circle.setAttribute("stroke", "black");
			circle.setAttribute("stroke-width", "1")
			circle.setAttribute("cx", "70");
			circle.setAttribute("cy", "60");
			circle.setAttribute("r", "30");
			circle.setAttribute('draggable', '');
			canvas.appendChild(circle);
		};
	}

})(angular.module('VisualAutomatonApp'));