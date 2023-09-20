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
import './listeners.js'

let dtMin = new DateTime(document.getElementById('min'))
dtMin.val("2002-01-20")
let dtMax = new DateTime(document.getElementById('max'))
dtMax.val("2023-01-20")


// Function to count emails per day from an array of emails
function countEmailsPerDay(emails) {
    const counts = {}
    
    emails.forEach(email => {
        const date = moment.unix(email.timestamp).format("YYYY-MM-DD")
        counts[date] = (counts[date] || 0) + 1
    })
    
    return counts
}

async function fetchData(senderName) {
    try {
        const url = `http://s-lib007.lib.uiowa.edu/flint/api/api.php/records/emails?filter=sender,cs,${encodeURIComponent(senderName)}`
        const response = await axios.get(url)
        return response.data
    } catch (error) {
        console.error("Error fetching data:", error)
        return []
    }
}

async function renderChart() {
    const senderName = "Miller, Mark"
    const emails = await fetchData(senderName)
    const emailCounts = countEmailsPerDay(emails.records)

    const labels = Object.keys(emailCounts).map(date => moment(date).format("YYYY-MM-DD"))
    const data = Object.values(emailCounts)

    const ctx = document.getElementById('emailChart').getContext('2d')
    

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Emails by ${senderName}`,
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

renderChart()

function formatTimestamp(timestamp) {
    return moment.unix(timestamp).format("YYYY-MM-DD HH:mm:ss");
}

async function populateTable() {
    const senderName = "Miller, Mark"
    const emails = await fetchData(senderName)
    const email = emails.records
    
    const tableBody = $('#emailTable tbody');
    
    // Populate table rows
    email.forEach(email => {
        const row = `
            <tr>
                <td>${email.sender}</td>
                <td>${email.email_to}</td>
                <td>${email.subject}</td>
                <td>${formatTimestamp(email.timestamp)}</td>
            </tr>
        `
        tableBody.append(row);
    });

    // Initialize DataTable
    const table = $('#emailTable').DataTable();

    // Bind the date filters to the table redraw event
    $('#min, #max').change(function() {
        table.draw();
    });
}

function toUnixTimestamp(dateString) {
    // Convert a date string to UNIX timestamp (seconds since epoch)
    return Math.floor(new Date(dateString).getTime() / 1000);
}

function constructApiUrl(params) {
    const baseApiUrl = "http://s-lib007.lib.uiowa.edu/flint/api/api.php/records/emails"
    const filters = []
    
    params.search.forEach(term => {
        const value = encodeURIComponent(term.searchTerm)
        
        // Check criteria and add filters accordingly
        switch (term.criteria) {
            case "sender/receiver":
                filters.push(`sender,cs,${value}`)
                //filters.push(`email_to,cs,${value}`)
                break
            case "keyword":
                filters.push(`full_email,cs,${value}`)
                break
            case "subject":
                filters.push(`subject,cs,${value}`)
                break
            default:
                throw new Error(`Unsupported criteria: ${term.criteria}`)
        }

        // Check logicOperator and adjust the filter if needed
        if (term.logicOperator === "NOT") {
            const lastIndex = filters.length - 1
            filters[lastIndex] = `!${filters[lastIndex]}`
        }
    })

    // Add date filters
    if (params.minDate) {
        filters.push(`timestamp,ge,${toUnixTimestamp(params.minDate)}`)
    }
    if (params.maxDate) {
        filters.push(`timestamp,le,${toUnixTimestamp(params.maxDate)}`)
    }

    // Construct final URL
    return `${baseApiUrl}?filter=${filters.join('&filter=')}`
}

const searchObj = {
    "search": [
        {
            "searchTerm": "Miller, Mark",
            "criteria": "sender/receiver"
        },
        {
            "searchTerm": "WIC",
            "criteria": "keyword",
            "logicOperator": "AND"
        }
    ],
    "minDate": "2002-01-20",
    "maxDate": "2023-01-20"
}

console.log(constructApiUrl(searchObj))


// Load table on page load
$(document).ready(function() {
    populateTable()
})