/***************************
This file enables to show a customized tooltip
*////////////////////



/**
@description hide the tooltip (does not nothing if there is no visible tooltip)
*/
function tooltipHide() {
	$("#tooltip").remove();
}

/**
@param evt an event (typically an mouse intToEvent
@param htmlContent html code to display in the tooltip
@description displays a tooltip at position given by evt, containing the label htmlContent
*/
function tooltipShow(evt, htmlContent) {
	if($("#tooltip").length > 0) {
			$("#tooltip").html(htmlContent);
			$("#tooltip").css({left: evt.clientX+16+window.scrollX,
										 top: evt.clientY+16+window.scrollY,
										 position:'absolute'});
	}
	else {

		let element = $("<div>" + htmlContent + "</div>");
		element.attr("id", "tooltip");
		element.css({left: evt.clientX+16+window.scrollX,
									 top: evt.clientY+16+window.scrollY,
									 position:'absolute'});
								element.hide();
		element.appendTo("body");
		element.delay(1000).fadeIn();
	}

}
