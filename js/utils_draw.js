function drawVisibilityLine(context, x1, y1, x2, y2) {
    context.beginPath();
    context.setLineDash([5, 3]);
    context.strokeStyle = "black";
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.setLineDash([]);
}


function drawLine(context, x1, y1, x2, y2) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
}

