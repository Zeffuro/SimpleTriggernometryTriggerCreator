document.addEventListener('DOMContentLoaded', (event) => {
    const baseURL = 'https://beta.xivapi.com/api/1';

    // Function to fetch and load JSON data
    async function fetchJsonData(filePath) {
        let response = await fetch(filePath);
        let data = await response.json();
        return data;
    }

    // Function to search for a name in the JSON data and return an array of IDs
    async function searchByName(name) {
        let actionData = await fetchJsonData('json/Action.json');
        let statusData = await fetchJsonData('json/Status.json');
        let itemData = await fetchJsonData('json/Item.json');

        let actionResults = actionData.filter(item => item.Name && item.Name.toLowerCase().includes(name.toLowerCase()));
        let statusResults = statusData.filter(item => item.Name && item.Name.toLowerCase().includes(name.toLowerCase()));
        let itemResults = itemData.filter(item => item.Name && item.Name.toLowerCase().includes(name.toLowerCase()));

        let actionIds = actionResults.slice(0, 100).map(item => item.ID.toString());
        let statusIds = statusResults.slice(0, 100).map(item => item.ID.toString());
        let itemIds = itemResults.slice(0, 100).map(item => item.ID.toString());

        return { actionIds, statusIds, itemIds };
    }

    // Function to fetch detailed data from the API
    async function fetchDetails(sheet, ids, fields = 'Icon,Name') {
        if (ids.length === 0) return { rows: [] }; // Return empty result if no IDs
        let url = `${baseURL}/sheet/${sheet}?rows=${ids.join(',')}&fields=${fields}`;
        let response = await fetch(url);
        let data = await response.json();
        return data;
    }

    // Function to fetch details for a specific ID and Type
    async function fetchDetailsByIdAndType(id, type) {
        let details = {};
        if (type === 'Action') {
            let actionDetails = await fetch(`${baseURL}/sheet/Action/${id}`);
            let actionTransientDetails = await fetch(`${baseURL}/sheet/ActionTransient/${id}`);
            details = {
                action: await actionDetails.json(),
                actionTransient: await actionTransientDetails.json()
            };
        } else if (type === 'Status') {
            let statusDetails = await fetch(`${baseURL}/sheet/Status/${id}`);
            details = { status: await statusDetails.json() };
        } else if (type === 'Item') {
            let itemDetails = await fetch(`${baseURL}/sheet/Item/${id}`);
            details = { item: await itemDetails.json() };
        }
        return details;
    }

    // Example usage
    async function searchAbility() {
        let query = document.getElementById('searchquery').value;
        let actionSelect = document.getElementById('actionselect').value;
        let filteredIds = document.getElementById('filteredids').value;

        let actionIds = [];
        let statusIds = [];
        let itemIds = [];

        if (filteredIds) {
            let ids = filteredIds.split(',').map(id => id.trim());
            if (actionSelect === 'Any' || actionSelect === 'Action') {
                actionIds = ids;
            }
            if (actionSelect === 'Any' || actionSelect === 'Status') {
                statusIds = ids;
            }
            if (actionSelect === 'Any' || actionSelect === 'Item') {
                itemIds = ids;
            }
        } else {
            ({ actionIds, statusIds, itemIds } = await searchByName(query));
        }

        let actionDetails = { rows: [] };
        let statusDetails = { rows: [] };
        let itemDetails = { rows: [] };

        if (actionSelect === 'Any' || actionSelect === 'Action') {
            actionDetails = await fetchDetails('Action', actionIds);
        }
        if (actionSelect === 'Any' || actionSelect === 'Status') {
            statusDetails = await fetchDetails('Status', statusIds);
        }
        if (actionSelect === 'Any' || actionSelect === 'Item') {
            itemDetails = await fetchDetails('Item', itemIds);
        }

        console.log("Action Details:", actionDetails);
        console.log("Status Details:", statusDetails);
        console.log("Item Details:", itemDetails);

        // Populate the table with the new data
        $(".results-anchor").empty();
        $(".details-anchor").empty();
        $(".details-anchor").addClass("d-none");
        $(".info-anchor").removeClass("d-none");

        function createTableRow(result, type) {
            return `
                <tr>
                    <td>${result.row_id}</td>
                    <td>${result.row_id.toString(16).toUpperCase()}</td>
                    <td>${result.fields.Name}</td>
                    <td>${type}</td>
                    <td><img src='${baseURL}/asset/${result.fields.Icon.path}?format=png'></td>
                    <td><img src='${baseURL}/asset/${result.fields.Icon.path_hr1}?format=png'></td>
                    <td>${result.fields.Icon.id}</td>
                    <td><button type="button" class="btn btn-primary" id="detailsbutton" data-url="${
                        result.row_id
                    }" data-urltype="${type}">Use this</button><a class="btn btn-primary" id="jsonbutton" href="https://xivapi.com/${type}/${result.row_id}" target="_blank">XIVAPI</a></td>
                </tr>`;
        }

        if (actionDetails.rows.length > 0) {
            for (let result of actionDetails.rows) {
                let element = createTableRow(result, "Action");
                $(".results-anchor").append(element);
            }
        }

        if (statusDetails.rows.length > 0) {
            for (let result of statusDetails.rows) {
                let element = createTableRow(result, "Status");
                $(".results-anchor").append(element);
            }
        }

        if (itemDetails.rows.length > 0) {
            for (let result of itemDetails.rows) {
                let element = createTableRow(result, "Item");
                $(".results-anchor").append(element);
            }
        }

        if (actionDetails.rows.length === 0 && statusDetails.rows.length === 0 && itemDetails.rows.length === 0) {
            $(".info-anchor").append(`<p>No results found for ${query}</p>`);
        }

        window.scrollTo(0, document.body.scrollHeight);
    }

    // Event listener for the search button
    document.getElementById('searchbutton').addEventListener('click', searchAbility);

    // Event listener for pressing Enter in the search input
    document.getElementById('searchquery').addEventListener('keypress', function (e) {
        if (e.key === "Enter") {
            searchAbility();
        }
    });

    // Event listener for the details button
    document.querySelector('.results-anchor').addEventListener('click', async function (e) {
        if (e.target && e.target.id == "detailsbutton") {
            let id = e.target.getAttribute('data-url');
            let type = e.target.getAttribute('data-urltype');
            let details = await fetchDetailsByIdAndType(id, type);

            console.log("Fetched Details:", details);

            // Populate the fields with the fetched details
            if (type === 'Action') {
                let action = details.action.fields;
                let actionTransient = details.actionTransient.fields;
                console.log(action);

                $("#abilityname").val(action.Name);
                $("#spellid").val(details.action.row_id.toString(16).toUpperCase());
                $("#cooldown").val(action.Recast100ms / 10 || '');

                let durationMatch = actionTransient.Description.match(/Duration: (\d+)s/);
                let suggestedDuration = durationMatch ? durationMatch[1] : '';
                $("#duration").val(suggestedDuration);

                $("#imageurl").val(`${baseURL}/asset/${action.Icon.path_hr1}?format=png`);
                $("#triggertypeability").prop("checked", true);
                $("#imageoverlayenabled").prop("checked", true);

                currentRatio = 1;
                $("#ratiotext").val(currentRatio);
                $("#imageratio").val(currentRatio);
                applyNewImageRatio();
                loadImage();
            } else if (type === 'Status') {
                let status = details.status.fields;

                $("#abilityname").val(status.Name);
                $("#spellid").val(details.status.row_id.toString(16).toUpperCase());
                $("#cooldown").val('');

                let durationMatch = status.Description.match(/Duration: (\d+)s/);
                let suggestedDuration = durationMatch ? durationMatch[1] : '';
                $("#duration").val(suggestedDuration);

                $("#imageurl").val(`${baseURL}/asset/${status.Icon.path_hr1}?format=png`);

                if (status.StatusCategory === 1) {
                    $("#triggertypestatus").prop("checked", true);
                    $("#imageoverlayenabled").prop("checked", false);
                } else {
                    $("#triggertypedot").prop("checked", true);
                    $("#imageoverlayenabled").prop("checked", false);
                }

                currentRatio = 1;
                $("#ratiotext").val(currentRatio);
                $("#imageratio").val(currentRatio);
                applyNewImageRatio();
                loadImage();
            }

            $(".details-anchor").removeClass("d-none");
            $(".trigger-anchor").removeClass("d-none");

            window.scrollTo(0, document.body.scrollHeight);
        }
    });

    function loadImage() {
        var tmpImg = new Image();
        tmpImg.src = $("#imageurl").val();
        $(tmpImg).one("load", function () {
            $("#imagewidth").val(tmpImg.width);
            $("#imageheight").val(tmpImg.height);
            $("#imageloaded").attr("width", tmpImg.width);
            $("#imageloaded").attr("height", tmpImg.height);
            originalWidth = tmpImg.width;
            originalHeight = tmpImg.height;
        });

        $("#imageloaded").attr("src", $("#imageurl").val());
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

    $(document).on("input", "#imageratio", function () {
        currentRatio = $(this).val();
        $("#ratiotext").val(currentRatio);
        applyNewImageRatio();
    });

    $(document).on("input", "#ratiotext", function () {
        currentRatio = $(this).val();
        $("#imageratio").val(currentRatio);
        applyNewImageRatio();
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

    async function generateTrigger() {
        let template = "";
        let fetchHeaders = new Headers();
        fetchHeaders.append("pragma", "no-cache");
        fetchHeaders.append("cache-control", "no-cache");
    
        let fetchInit = {
            method: "GET",
            headers: fetchHeaders,
        };

        if ($("#triggertypeability").prop("checked")) {
            template = await fetch("templates/Ability.xml", fetchInit).then(
                (response) => response.text()
            );
            fontsize = 36;
        }
        if ($("#triggertypestatus").prop("checked")) {
            template = await fetch("templates/Status.xml", fetchInit).then(
                (response) => response.text()
            );
            fontsize = 16;
        }
        if ($("#triggertypedot").prop("checked")) {
            template = await fetch("templates/DoT.xml", fetchInit).then(
                (response) => response.text()
            );
            fontsize = 16;
        }
    
        let x = $("#imagex").val();
        let y = $("#imagey").val();
        let overlayx = x - 8 * currentRatio;
        let overlayy = y - 4 * currentRatio;
        let overlaywidth = 96 * currentRatio;
        let overlayheight = 96 * currentRatio;
        fontsize = fontsize * currentRatio;
    
        template = template.replace(/%uuidv4%/g, uuidv4());
        template = template.replace(/%ability%/g, $("#abilityname").val());
        template = template.replace(/%spellid%/g, $("#spellid").val());
        template = template.replace(
            /%imageenabled%/g,
            capitalize($("#imageenabled").prop("checked").toString())
        );
        template = template.replace(
            /%imageoverlayenabled%/g,
            capitalize($("#imageoverlayenabled").prop("checked").toString())
        );
        template = template.replace(/%imageurl%/g, $("#imageurl").val());
        template = template.replace(
            /%textenabled%/g,
            capitalize($("#textenabled").prop("checked").toString())
        );
        template = template.replace(
            /%ttsenabled%/g,
            capitalize($("#ttsenabled").prop("checked").toString())
        );
        template = template.replace(/%duration%/g, $("#duration").val());
        template = template.replace(/%cooldown%/g, $("#cooldown").val());
        template = template.replace(/%cooldownms%/g, $("#cooldown").val() * 1000);
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

    function uuidv4() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
            (
                c ^
                (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
            ).toString(16)
        );
    }
    
    function capitalize(s) {
        if (typeof s !== "string") return "";
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function copyTriggerToClipboard() {
        let copyText = document.getElementById("triggeroutput");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
    }
});
