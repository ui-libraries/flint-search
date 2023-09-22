const newRowTemplate = `
    <tr class="searchRow">
        <td>
            <select class="form-control logicOperator">
                <option value="AND">AND</option>
                <option value="OR">OR</option>
                <option value="NOT">NOT</option>
            </select>
        </td>
        <td><input type="text" placeholder="Enter search term..." class="form-control" /></td>
        <td>
            <select class="form-control">
                <option value="sender/receiver">Sender/Receiver</option>
                <option value="subject">Subject</option>
                <option value="keyword">Keyword</option>
            </select>
        </td>
        <td><button class="btn btn-danger removeRow">-</button></td>
    </tr>
`

$('#addRow').on('click', function() {
    let lastRow = $('#searchTable tbody tr:last')
    $(newRowTemplate).insertAfter(lastRow)
})

$('#searchTable').on('click', '.removeRow', function() {
    let currentRow = $(this).closest('.searchRow')
    if ($("#searchTable .searchRow").length > 1) { 
        currentRow.remove()
    }
})

$('#searchBtn').on('click', function() {
    console.log("Search button clicked")
})

$('#searchBtn').on('click', function() {
    let searchData = [];

    $('#searchTable .searchRow').each(function() {
        let searchTerm = $(this).find('input').val()
        let criteria = $(this).find('select:not(.logicOperator)').val()

        let logicOperator = $(this).find('.logicOperator').val()

        let row = {
            searchTerm: searchTerm,
            criteria: criteria
        }

        if (logicOperator) {
            row.logicOperator = logicOperator
        }

        searchData.push(row)
    })

    let minDate = $('#min').val()
    let maxDate = $('#max').val()

    let allData = {
        search: searchData,
        minDate: minDate,
        maxDate: maxDate
    }

    console.log(allData)
})