export default {
	point:{
		screenToSvg(svg, x, y){
			let screenPoint = new DOMPoint(x,y);
			let svgToScreenMatrix = DOMMatrix.fromMatrix(svg.getScreenCTM());
			let screenToSvgMatrix = svgToScreenMatrix.inverse();
			return screenToSvgMatrix.transformPoint(screenPoint);
		}
	},
	distance:{
		screenToSvg(svg, x, y){
			let screenOrigin = new DOMPoint(0,0);
			let screenVec = new DOMPoint(x,y);
			let svgToScreenMatrix = DOMMatrix.fromMatrix(svg.getScreenCTM());
			let screenToSvgMatrix = svgToScreenMatrix.inverse();
			let svgOffset = screenToSvgMatrix.transformPoint(screenOrigin);
			let svgPoint = screenToSvgMatrix.transformPoint(screenVec);
			return new DOMPoint(svgPoint.x - svgOffset.x, svgPoint.y - svgOffset.y);
		}
	}
}