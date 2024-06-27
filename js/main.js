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
});
