/** @constructor */
function Floatable() {
	this.velocity = {
		x : 0,
		y : -1
	};

	this.pageDiv = document.getElementById("bubbleDiv");
	this.updateContainerSize();

	this.div = document.createElement("div");
	this.div.className = "floatableDiv";
	this.pageDiv.appendChild(this.div);
	this.innerDiv = document.createElement("div");
	this.div.appendChild(this.innerDiv);
	this.innerDiv.className = "innerDiv";

	// Add this object to the update array
	updateTargets.push(this);
}

Floatable.prototype.updateContainerSize = function() {
	this.pageDivWidth = $(this.pageDiv).width();
	this.pageDivHeight = $(this.pageDiv).height();
};

Floatable.prototype.update = function(deltatime) {
	var HVEL_MAX = 1;
	var step = deltatime / 50;

	this.x += this.velocity.x * step;
	this.y += this.velocity.y * step;

	this.velocity.x += (Math.random() * 0.1 - 0.05) * step;
	if (this.velocity.x > HVEL_MAX) {
		this.velocity.x = HVEL_MAX;
	} else if (this.velocity.x < -HVEL_MAX) {
		this.velocity.x = -HVEL_MAX;
	}
	if (this.x < 0) {
		this.velocity.x += 0.005 * step;
	} else if (this.x > this.pageDivWidth - this.width) {
		this.velocity.x -= 0.005 * step;
	}

	this.updateDiv();

	if (this.y < -this.height)
		this.removeSelf();
};

Floatable.prototype.updateDiv = function() {
	this.div.style["-webkit-transform"] = "translate(" + this.x + "px," + this.y + "px)";
	this.div.style.transform = "translate(" + this.x + "px," + this.y + "px)";
};

Floatable.prototype.removeSelf = function() {
	this.pageDiv.removeChild(this.div);
	// Remove self from update array
	updateTargets.splice(updateTargets.indexOf(this), 1);
};

Floatable.prototype.addImage = function(image, width, height) {
	this.canvas = document.createElement('canvas');
	this.image = image;
	this.canvas.height = height;
	this.canvas.width = width;
	this.canvas.style.position = "absolute";
	this.canvas.style.top = "0px";
	this.canvas.style.left = "0px";
	var ctx = this.canvas.getContext("2d");
	ctx.drawImage(this.image, 0, 0, width - 1, height - 1);

	this.div.appendChild(this.canvas);
};

Floatable.prototype.addText = function(text) {
	this.innerDiv.innerHTML += text;
};

Floatable.prototype.initPosition = function() {
	this.x = Math.random() * (this.pageDivWidth - this.width);
	this.y = this.pageDivHeight;
	this.updateDiv();
	this.div.style.width = this.width + "px";
	this.div.style.height = this.height + "px";
	this.innerDiv.style.top = (this.height / 2 - this.innerDiv.offsetHeight / 2) + 'px';
	// Centers the text within the bubble
};
