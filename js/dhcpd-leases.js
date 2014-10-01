'use strict';

var data = [];
var tableOptions = {
        actualLeases: false,
        emptyHostname: true
}

$(document).ready(function(){
    $('#actualLeases')
        .on('change', function() {
            tableOptions.actualLeases = $(this).is(':checked')
            createTable(data)
        });
    $('#emptyHostname')
        .on('change', function() {
            tableOptions.emptyHostname = $(this).is(':checked')
            createTable(data)
        });
    $('#refresh-button')
        .on('click', function() {
            getLeasesFile();
        })
        .click();
});
function getLeasesFile() {
    $.ajax({
        url: "dhcpd.leases",
        dataType: "text",
        beforeSend: function() {
            $('button').attr('disabled', true);
            $('label').attr('disabled', true);
            $('table').hide()
            $('#spin').spin()
        },
        success: function(ajaxData) {
            $('button').attr('disabled', false);
            $('label').attr('disabled', false);
            parseLeasesData(ajaxData)
        }
    });
}
function applyTablesorter() {
    $.extend($.tablesorter.themes.bootstrap, {
        // these classes are added to the table. To see other table classes available,
        // look here: http://twitter.github.com/bootstrap/base-css.html#tables
        table      : 'table table-bordered table-condensed',
        caption    : 'caption',
        header     : 'bootstrap-header', // give the header a gradient background
        footerRow  : '',
        footerCells: '',
        icons      : '', // add "icon-white" to make them white; this icon class is added to the <i> in the header
        sortNone   : 'bootstrap-icon-unsorted',
        sortAsc    : 'icon-chevron-up glyphicon glyphicon-chevron-up',     // includes classes for Bootstrap v2 & v3
        sortDesc   : 'icon-chevron-down glyphicon glyphicon-chevron-down', // includes classes for Bootstrap v2 & v3
        active     : '', // applied when column is sorted
        hover      : '', // use custom css here - bootstrap class may not override it
        filterRow  : '', // filter row class
        even       : '', // odd row zebra striping
        odd        : ''  // even row zebra striping
    });

    // call the tablesorter plugin and apply the uitheme widget
    $("table").tablesorter({
        // this will apply the bootstrap theme if "uitheme" widget is included
        // the widgetOptions.uitheme is no longer required to be set
        theme : "bootstrap",
        //widthFixed: true,
        headerTemplate : '{content} {icon}', // new in v2.7. Needed to add the bootstrap icon!
        // widget code contained in the jquery.tablesorter.widgets.js file
        // use the zebra stripe widget if you plan on hiding any rows (filter widget)
        widgets : [ "uitheme", "filter", "zebra" ],
        widgetOptions : {
            // using the default zebra striping class name, so it actually isn't included in the theme variable above
            // this is ONLY needed for bootstrap theming if you are using the filter widget, because rows are hidden
            zebra : ["even", "odd"],
            // reset filters button
            filter_reset : ".reset"
        }
    })
    .tablesorterPager({
        // target the pager markup - see the HTML block below
        container: $(".ts-pager"),
        // target the pager page select dropdown - choose a page
        cssGoto  : ".pagenum",
        // remove rows from the table to speed up the sort of large tables.
        // setting this to false, only hides the non-visible rows; needed if you plan to add/remove rows with the pager enabled.
        removeRows: false,
        // output string - default is '{page}/{totalPages}';
        // possible variables: {page}, {totalPages}, {filteredPages}, {startRow}, {endRow}, {filteredRows} and {totalRows}
        output: '{startRow} - {endRow} / {filteredRows} ({totalRows})',
        size: 20
    });
}
function parseLeasesData(ajaxData) {
    var leaseBlockRegex = /lease\s+((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s+\{([\s\S]*?)\}/gm;
    var leases = ajaxData.match(leaseBlockRegex)
    data = [];
    $.each(leases, function(i, lease) {
        var entry = {
            ip: [lease.replace(leaseBlockRegex, '$1')]
        };
        var params = lease.replace(leaseBlockRegex, '$5');
        var paramsLines = params.split(/;\s*\n/);
        $.each(paramsLines, function(i, param) {
            if (!param) return
            var p = param.trim().split(' ');
            entry[p[0]] = p.slice(1);
        });
        data.push(entry)
    });
    createTable(data)
}
function createTable(data) {
    var thead = [];
    var tbody = [];
    var rowDataMap = {
        parseDefaultDBTimeFormat: function(dhcpdLeasesDate) {
            return dhcpdLeasesDate.slice(1).join(' ')
        },
        'hardware': function(macAddress) {
            return macAddress[1]
        },
    };
    // aliasing
    rowDataMap.starts = rowDataMap.parseDefaultDBTimeFormat
    rowDataMap.ends = rowDataMap.parseDefaultDBTimeFormat
    rowDataMap.cltt = rowDataMap.parseDefaultDBTimeFormat

    $('table')
        .hide()
        .trigger('destroy');
    $('#spin').spin()

    $('thead th').each(function() {
        thead.push(this.abbr)
    })
    $.each(data, function(i, dataItem) {
        var tr = [];
        var rowData = {};
        if (!tableOptions.emptyHostname && !('client-hostname' in dataItem)) {
            return
        }
        if (tableOptions.actualLeases) {
            if (!dataItem.ends) return 
            var now = new Date()
            var ends = new Date(dataItem.ends.slice(1).join(' '))
            if (ends < now) return
        }
        
        $.each(dataItem, function(k, v) {
            if (rowDataMap[k]) {
                rowData[k] = rowDataMap[k](v)
            } else {
                rowData[k] = v.join(' ')
            }
        })
        $.each(thead, function(i, th) {
            var td = rowData[th] ? rowData[th] : '';
            tr.push('<td>' + td + '</td>')
        })
        if ('abandoned' in rowData) {
            tbody.push('<tr class="warning">'+tr.join('')+'</tr>')
        } else {
            tbody.push('<tr>'+tr.join('')+'</tr>')
        }
    })
    $('tbody')
        .empty()
        .append(tbody.join(''))
    applyTablesorter();
    $('#spin').spin(false)
    $('table').show();
}
