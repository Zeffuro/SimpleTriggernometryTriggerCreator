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
	console.log(data.Results);
	if (data.Results.length > 0) {
		for (let [, result] of Object.entries(data.Results)) {
			console.log(result);
			let element = `
			<tr>
				<td>${result.ID}</td>
				<td>${result.Name}</td>
				<td>${result.UrlType}</td>
				<td><img src='https://xivapi.com${result.Icon}'></td>
				<td><button type="button" class="btn btn-primary" onclick="getDetails('${result.Url}','${result.UrlType}');">Use this</button></td>
			</tr>`;
			$(".results-anchor").append(element);
		}
	} else {
		$(".info-anchor").append(`<p>No results found for ${query}</p>`);
	}
}

async function getDetails(url, urlType) {
	$(".details-anchor").empty();
	$(".details-anchor").removeClass("d-none");
	$(".trigger-anchor").removeClass("d-none");

	let data = await fetchXivApiUrl(url);
	$(".details-anchor").append(data.Description);

	console.log(urlType);
	if (urlType == "Action") {
		$("#triggertypeability").prop("checked", true);
	}

	if (urlType == "Status") {
		//Category 1 is buff, category 2 is debuff.
		if (data.Category == 1) {
			$("#triggertypestatus").prop("checked", true);
		} else {
			$("#triggertypedot").prop("checked", true);
		}
	}

	$("#abilityname").val(data.Name);
	let cooldown = (data.Recast100ms / 10);
	if (data.Recast100ms == null) {
		cooldown = "";
	}
	$("#cooldown").val(cooldown);

	let durationRegex = /Duration:<\/span> (?<duration>\d+)s/;
	let durationMatch = data.Description.match(durationRegex);
	let suggestedDuration = "";
	if (durationMatch != null) {
		suggestedDuration = durationMatch.groups.duration;
	}


	if (suggestedDuration != "") {
		$("#duration").val(suggestedDuration);
	} else {
		$("#duration").val("");
	}

	console.log(data);
	console.log(suggestedDuration);
	//return data;
}

async function generateTrigger() {
	let template = "";
	if ($('#triggertypeability').prop('checked')) {
		template = await fetch("templates/Ability.xml").then(response => response.json());
	}
	if ($('#triggertypestatus').prop('checked')) {
		template = await fetch("templates/Status.xml").then(response => response.json());
	}
	if ($('#triggertypedot').prop('checked')) {
		template = await fetch("templates/DoT.xml").then(response => response.json());
	}

	template.replace("%ability%", $("#abilityname").val());
	template.replace("%imageenabled%", capitalize($('#imageenabled').prop('checked')));
	template.replace("%textenabled%", capitalize($('#textenabled').prop('checked')));
	template.replace("%ttsenabled%", capitalize($('#ttsenabled').prop('checked')));
	template.replace("%duration%", $("#duration").val());
	template.replace("%cooldown%", $("#cooldown").val());
	template.replace("%cooldownms%", ($("#cooldown").val() * 1000));

	$(".output-anchor").empty();
	$(".output-anchor").removeClass("d-none");

	$("#triggeroutput").val(template);
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