/**
 * This module is the application entry point
 * @module Index
 * @namespace
 */

import axios from 'axios'
import moment from 'moment'
import Chart from 'chart.js/auto'
import $ from 'jquery'
import 'datatables.net'
import DateTime from 'datatables.net-datetime'
//import './listeners.js'

let flintChart
//const pdf_url = "http://d3o55pxnb4jrui.cloudfront.net/"
const pdf_url = "http://s-lib007.lib.uiowa.edu/flint/pdf/"
let dtMin = new DateTime(document.getElementById('min'))
dtMin.val("2002-01-20")
let dtMax = new DateTime(document.getElementById('max'))
dtMax.val("2023-01-20")


function countEmailsPerDay(emails) {
    const counts = {}
    
    emails.forEach(email => {
        const date = moment.unix(email.timestamp).format("YYYY-MM-DD")
        counts[date] = (counts[date] || 0) + 1
    })
    
    return counts
}

function formatName(encodedName) {
    // Decode the URI components
    const inputName = decodeURIComponent(encodedName)

    // Remove any leading or trailing whitespaces
    const trimmedName = inputName.trim()

    // Find the last space in the string assuming that the string after the last space is the last name.
    const lastSpaceIndex = trimmedName.lastIndexOf(' ')

    // If no space is found, return the input as it is.
    if (lastSpaceIndex === -1) return trimmedName

    const firstName = trimmedName.substring(0, lastSpaceIndex).trim()
    const lastName = trimmedName.substring(lastSpaceIndex).trim()

    // Return the formatted name
    return encodeURIComponent(`${lastName}, ${firstName}`)
}

async function fetchData(url) {
    try {
        const response = await axios.get(url);
        if (response.data && Array.isArray(response.data.records)) {
            response.data.records.sort((a, b) => a.timestamp - b.timestamp);
        }
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}

async function renderChart(url) {
    const emails = await fetchData(url)
    const emailCounts = countEmailsPerDay(emails.records)

    const labels = Object.keys(emailCounts).map(date => moment(date).format("YYYY-MM-DD"))
    const data = Object.values(emailCounts)

    const ctx = document.getElementById('emailChart').getContext('2d')
    if (flintChart) flintChart.destroy()
    

    flintChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Number of emails per day.`,
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'category',
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    })
}

function formatTimestamp(timestamp) {
    return moment.unix(timestamp).format("YYYY-MM-DD HH:mm:ss")
}

async function populateTable(url) {
    const emails = await fetchData(url)
    const email = emails.records
    
    const tableBody = $('#emailTable tbody')
    
    email.forEach(email => {
        // convert the email.bookmark to lowercase
        email.bookmark = email.bookmark.toLowerCase()        
        const row = `
            <tr>
                <td>${email.sender}</td>
                <td>${email.email_to}</td>
                <td>${email.subject}</td>
                <td>${formatTimestamp(email.timestamp)}</td>
                <td><a href="${pdf_url + email.bookmark}.pdf" target="_blank" title="Open PDF"><i class="fas fa-file-pdf fa-2x" style="color: #FF0000;"></i></td>
            </a></td>
            </tr>
        `
        tableBody.append(row)
    })

    const table = $('#emailTable').DataTable()

    // Bind the date filters to the table redraw event
    $('#min, #max').change(function() {
        table.draw()
    })
}

function toUnixTimestamp(dateString) {
    // Convert a date string to UNIX timestamp (seconds since epoch)
    return Math.floor(new Date(dateString).getTime() / 1000)
}

function constructApiUrl(params) {
    const baseApiUrl = "http://s-lib007.lib.uiowa.edu/flint/api/api.php/records/emails"
    const filters = []
    
    params.search.forEach(term => {
        const value = encodeURIComponent(term.searchTerm)
        let filterKey = 'filter'
        
        switch (term.criteria) {
            case "sender/receiver":
                filters.push(`filter1=sender,cs,${formatName(value)}`)
                filters.push(`filter2=email_to,cs,${formatName(value)}`)
                break
            case "keyword":
                filters.push(`${filterKey}=full_email,cs,${value}`)
                break
            case "subject":
                filters.push(`${filterKey}=subject,cs,${value}`)
                break
            default:
                throw new Error(`Unsupported criteria: ${term.criteria}`)
        }

        if (term.logicOperator === "NOT") {
            const lastIndex = filters.length - 1
            filters[lastIndex] = `${filterKey}=!${filters[lastIndex].split('=')[1]}`
        }
    })

    if (params.minDate) {
        filters.push(`filter=timestamp,ge,${toUnixTimestamp(params.minDate)}`)
    }
    if (params.maxDate) {
        filters.push(`filter=timestamp,le,${toUnixTimestamp(params.maxDate)}`)
    }

    return `${baseApiUrl}?${filters.join('&')}`
}

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
    let searchData = []

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

    let url = constructApiUrl(allData)
    console.log(url)
    renderChart(url)
    populateTable(url)
})