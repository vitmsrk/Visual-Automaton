﻿(function (app) {
	'use strict';

	app.directive('draggable', ['$document', draggable]);

	function draggable($document) {
		return {
			link: function (scope, element, attr) {
				var startX = 0, startY = 0, x = 0, y = 0;

				element.on('mousedown', function (event) {
					event.preventDefault();
					startX = event.pageX - x;
					startY = event.pageY - y;
					$document.on('mousemove', mousemove);
					$document.on('mouseup', mouseup);
				});

				function mousemove(event) {
					y = event.pageY - startY;
					x = event.pageX - startX;
					element.attr('cx', x);
					element.attr('cy', y);
				}

				function mouseup() {
					$document.off('mousemove', mousemove);
					$document.off('mouseup', mouseup);
				}
			}
		}
	}

})(angular.module('VisualAutomatonApp'));