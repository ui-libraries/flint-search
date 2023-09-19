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
        type: 'line',
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
                    type: 'category',  // Changed from 'time' to 'category'
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
    
    const tableBody = $('#emailTable tbody')
    
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
        tableBody.append(row)
    })

    // Initialize DataTable
    $('#emailTable').DataTable()
}

// Load table on page load
$(document).ready(function() {
    populateTable()
})