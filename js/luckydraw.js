function drawNext() {
	return function(){
	  var lastdraw = $("#luckyperson").html();
	  var alllucky = $("#drawhistory").html();
	  $("#drawhistory").html(lastdraw + '<br />' + alllucky);
	  var personname = data[Math.floor(Math.random() * data.length)];
	  $("#luckyperson").html(personname);
  	}
}
function countdown() {
	$("#luckyperson").html(1);
	setTimeout(countnumber(1), 2000);
	setTimeout(countnumber(2), 4000);
	setTimeout(realdraw(), 6000);
	setTimeout(drawNext(), 7000);
}
function countnumber(number){
	return function(){
		$("#luckyperson").html(number+1);
	}
}
function startloop() {
	countdown()
}

function realdraw(){
	return function(){
		$("#luckyperson").html(personname);
	}
}
