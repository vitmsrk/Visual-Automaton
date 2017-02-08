Element.prototype.setAttributes = function (attrs) {
	for (var key in attrs)
		this.setAttribute(key, attrs[key]);
};

Element.prototype.draggable = function (targets) {
	var that = this;
	targets = targets || [];

	that.addEventListener('mousedown', function (event) {
		event.preventDefault();
		document.addEventListener('mousemove', mouseMove);
		document.addEventListener('mouseup', mouseUp);
	});

	function mouseMove(event) {
		that.setAttribute('cx', that.cx.animVal.value + event.movementX / 1.5);
		that.setAttribute('cy', that.cy.animVal.value + event.movementY / 1.5);
		for (var i in targets) {
			targets[i].setAttribute('cx', targets[i].cx.animVal + event.movementX);
			targets[i].setAttribute('cy', targets[i].cy.animVal + event.movementY);
		}
	}

	function mouseUp(event) {
		document.removeEventListener('mousemove', mouseMove);
		document.removeEventListener('mouseup', mouseUp);
	}
};