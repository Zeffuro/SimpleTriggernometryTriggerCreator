var fetchHeaders = new Headers();
fetchHeaders.append('pragma', 'no-cache');
fetchHeaders.append('cache-control', 'no-cache');

var fetchInit = {
	method: 'GET',
	headers: fetchHeaders,
};

async function searchXivApi(query) {
	let url = `https://xivapi.com/search?string=${query}`;
	return await fetch(url).then(response => response.json());
}

async function fetchXivApiUrl(url) {
	let uri = `https://xivapi.com${url}`;
	return await fetch(uri).then(response => response.json());
}

async function searchAbility() {
	let query = $("[id=searchquery]").val();
	let data = await searchXivApi(query);
	$(".results-anchor").empty();
	$(".details-anchor").empty();
	//$(".info-anchor").empty();
	$(".details-anchor").addClass("d-none");
	$(".info-anchor").removeClass("d-none");
	if (data.Results.length > 0) {
		for (let [, result] of Object.entries(data.Results)) {
			let element = `
			<tr>
				<td>${result.ID}</td>
				<td>${result.ID.toString(16).toUpperCase()}</td>
				<td>${result.Name}</td>
				<td>${result.UrlType}</td>
				<td><img src='https://xivapi.com${result.Icon}'></td>
				<td><button type="button" class="btn btn-primary" id="detailsbutton" data-url="${result.Url}" data-urltype="${result.UrlType}">Use this</button></td>
			</tr>`;
			$(".results-anchor").append(element);
		}
	} else {
		$(".info-anchor").append(`<p>No results found for ${query}</p>`);
	}
	window.scrollTo(0, document.body.scrollHeight);
}

async function getDetails(url, urlType) {
	$(".details-anchor").empty();
	$(".details-anchor").removeClass("d-none");
	$(".trigger-anchor").removeClass("d-none");

	let data = await fetchXivApiUrl(url);
	$(".details-anchor").append(data.Description);

	if (urlType == "Action") {
		$("#triggertypeability").prop("checked", true);
		$('#imageoverlayenabled').prop("checked", true);
	}

	if (urlType == "Status") {
		//Category 1 is buff, category 2 is debuff.
		if (data.Category == 1) {
			$("#triggertypestatus").prop("checked", true);
			$('#imageoverlayenabled').prop("checked", false);
		} else {
			$("#triggertypedot").prop("checked", true);
			$('#imageoverlayenabled').prop("checked", false);
		}
	}

	$("#abilityname").val(data.Name);
	let cooldown = (data.Recast100ms / 10);
	if (data.Recast100ms == null) {
		cooldown = "";
	}
	$("#cooldown").val(cooldown);

	let durationRegex = /Duration:<\/span> (\d+)s/;
	let durationMatch = data.Description.match(durationRegex);
	let suggestedDuration = "";
	if (durationMatch != null) {
		suggestedDuration = durationMatch[1];
	}


	if (suggestedDuration != "") {
		$("#duration").val(suggestedDuration);
	} else {
		$("#duration").val("");
	}

	$("#imageurl").val(`https://xivapi.com${data.Icon}`);

	currentRatio = 1;
	$("#ratiotext").val(currentRatio);
	$("#imageratio").val(currentRatio);
	applyNewImageRatio();

	loadImage();

	window.scrollTo(0, document.body.scrollHeight);
}

async function generateTrigger() {
	let template = "";
	if ($('#triggertypeability').prop('checked')) {
		template = await fetch("templates/Ability.xml", fetchInit).then(response => response.text());
	}
	if ($('#triggertypestatus').prop('checked')) {
		template = await fetch("templates/Status.xml", fetchInit).then(response => response.text());
	}
	if ($('#triggertypedot').prop('checked')) {
		template = await fetch("templates/DoT.xml", fetchInit).then(response => response.text());
	}

	let fontsize = 8.25 * currentRatio;
	let x = $("#imagex").val();
	let y = $("#imagey").val();
	let overlayx = x - (4 * currentRatio);
	let overlayy = y - (2 * currentRatio);
	let overlaywidth = (48 * currentRatio);
	let overlayheight = (48 * currentRatio);

	template = template.replace(/%ability%/g, $("#abilityname").val());
	template = template.replace(/%imageenabled%/g, capitalize($('#imageenabled').prop('checked').toString()));
	template = template.replace(/%imageoverlayenabled%/g, capitalize($('#imageoverlayenabled').prop('checked').toString()));
	template = template.replace(/%imageurl%/g, $('#imageurl').val());
	template = template.replace(/%textenabled%/g, capitalize($('#textenabled').prop('checked').toString()));
	template = template.replace(/%ttsenabled%/g, capitalize($('#ttsenabled').prop('checked').toString()));
	template = template.replace(/%duration%/g, $("#duration").val());
	template = template.replace(/%cooldown%/g, $("#cooldown").val());
	template = template.replace(/%cooldownms%/g, ($("#cooldown").val() * 1000));
	template = template.replace(/%width%/g, $("#imagewidth").val());
	template = template.replace(/%height%/g, $("#imageheight").val());
	template = template.replace(/%x%/g, x);
	template = template.replace(/%y%/g, y);
	template = template.replace(/%overlayx%/g, overlayx);
	template = template.replace(/%overlayy%/g, overlayy);
	template = template.replace(/%overlaywidth%/g, overlaywidth);
	template = template.replace(/%overlayheight%/g, overlayheight);
	template = template.replace(/%fontsize%/g, fontsize);


	$(".output-anchor").removeClass("d-none");

	$("#triggeroutput").val(template);
	window.scrollTo(0, document.body.scrollHeight);
}

function loadImage() {
	var tmpImg = new Image();
	tmpImg.src = $("#imageurl").val();
	$(tmpImg).one('load', function () {
		$("#imagewidth").val(tmpImg.width);
		$("#imageheight").val(tmpImg.height);
		$("#imageloaded").attr("width", tmpImg.width);
		$("#imageloaded").attr("height", tmpImg.height);
		originalWidth = tmpImg.width;
		originalHeight = tmpImg.height;
	});

	$("#imageloaded").attr("src", $("#imageurl").val());
}

function copyTriggerToClipboard() {
	copyText = document.getElementById("triggeroutput");
	copyText.select();
	copyText.setSelectionRange(0, 99999);
	document.execCommand("copy");
}

const capitalize = (s) => {
	if (typeof s !== 'string') return ''
	return s.charAt(0).toUpperCase() + s.slice(1)
}

function applyNewImageRatio() {
	$("#imagewidth").val(originalWidth * currentRatio);
	$("#imageheight").val(originalHeight * currentRatio);
	$("#imageloaded").attr("width", $("#imagewidth").val());
	$("#imageloaded").attr("height", $("#imageheight").val());
}

var originalWidth = 0;
var originalHeight = 0;
var currentRatio = 1;

$(document).on("input", '#imageratio', function () {
	currentRatio = $(this).val();
	$("#ratiotext").val(currentRatio);
	applyNewImageRatio();
});

$(document).on("input", '#ratiotext', function () {
	currentRatio = $(this).val();
	$("#imageratio").val(currentRatio);
	applyNewImageRatio();
});

$(document).on("keypress", "#searchquery", function(e){
	if(e.which == 13){
		searchAbility();
	}
});

$(document).on("click", "#searchbutton", function () {
	searchAbility();
});

$(document).on("click", "#loadimagebutton", function () {
	loadImage();
});

$(document).on("click", "#generatetriggerbutton", function () {
	generateTrigger();
});

$(document).on("click", "#clipboardbutton", function () {
	copyTriggerToClipboard();
});

$(document).on("click", "#detailsbutton", function () {
	getDetails($(this).data('url'), $(this).data('urltype'));
});