/**
 * Created with PyCharm.
 * Date: 20/11/12
 * Time: 14.46
 * To change this template use File | Settings | File Templates.
 */

var SEARCH = false; // define if guidedsearchS1 search is a new search or the same.
/* START AJAX callback */

function resultsCallback(results) {

    "use strict";
    var conceptUri;
    var dataset;
    var datasetLabel;
    var numMatch;
    var rdfLink;
    var globalID;
    var permision;
    var conceptItem;
    var conceptItemBase = $('#concept-base').clone();
    $('.media-list').html(conceptItemBase);
    $('#legend-step2').removeClass('muted').addClass('selected');

    for (conceptUri in results) {
        if (results.hasOwnProperty(conceptUri)) {

            conceptItem = conceptItemBase.clone();
            var datasetItemBase = conceptItem.find('.dataset-item');
            conceptItem.attr('id', 'concept-uri');
            conceptItem.find('.concept-label').text(conceptUri);
            dataset = results[conceptUri];
            for (datasetLabel  in dataset) {

                if (dataset.hasOwnProperty(datasetLabel)) {
                    var datasetItem =  datasetItemBase.clone();
                    numMatch = dataset[datasetLabel][0];
                    rdfLink = dataset[datasetLabel][1];
                    globalID = dataset[datasetLabel][2];
                    permision = dataset[datasetLabel][3];
                    datasetItem.show();
                    datasetItem.find('.dataset-label').text(datasetLabel);
                    datasetItem.find('.dataset-description').text('Match : ' + numMatch);
                    //conceptItem.find( '.link-to-data' ).attr( 'onclick', "datasetSearchReady( '"+rdfLink+"', '"+datasetLabel+"' );" );
                    if (permision) {
                        datasetItem.find('.link-to-data').attr('href', "/query_builder/"+globalID+"/");
                    } else {
                        datasetItem.find('.link-to-data').attr('href', "/resources/" + globalID);
                        datasetItem.find('.link-to-data').text('Get access!');
                        datasetItem.find('.link-to-data').removeClass('btn-primary');
                        datasetItem.find('.link-to-data').addClass('btn-warning');
                    }
                    datasetItem.insertAfter(datasetItemBase);

                }

            }
            if (!datasetLabel) {
                conceptItem.find('.concept-description').text('No results matching');
            }
            conceptItem.appendTo('.media-list');
            conceptItem.show();
        }
    }


}

function automaticSearchCallback(results) {

    "use strict";
    resultsCallback(results);
    $('#results').effect('slide', {direction: 'right'}, 500);
    $('#2wizard').addClass('current');

}


function guidedSearchS1CallBack(results) {

    "use strict";
    var maxMatches = results.max_matches;
    var numPages = results.num_pages;
    var numResultsTotal = results.num_results_total;
    var pagenum = parseInt(results.page_num, 10);

    var item;
    var term = $("#terms-table-base > .term").clone();
    var termList = $("#terms-table-base").clone();

    $("#terms-table").remove();
    $("#terms-table-block").append(termList);
    termList.attr('id', 'terms-table');

    var termsResults = results[pagenum];

    for (item in termsResults) {

        var addTerm = term.clone();
        var id = item;

        if (item.length > 100) {

            addTerm.children('.term-name').append(item.substr(0, 100) + "...");

        } else {

            addTerm.children('.term-name').append(item);

        }

        addTerm.children('.term-name').append('<input name="inputConceptUri" type="hidden" value="' + item + '" /> ');
        addTerm.children('.term-name').append('<input name="inputConceptLabel" type="hidden" value="' + termsResults[item][0] + '" /> ');
        addTerm.children('.term-desc').append(termsResults[item][0]);

        termList.append(addTerm);

        addTerm.show();

    }

    $("#terms-table-block").show();
    $("#query-form").show();

    SEARCH = true;
}

function complexSearchS1CallBack(results) {

    "use strict";
    var maxMatches = results.max_matches;
    var numPages = results.num_pages;
    var numResultsTotal = results.num_results_total;
    var pagenum = parseInt(results.page_num, 10);

    var item;
    var term = $("#terms-list-base > .term").clone();
    var termList = $("#terms-list-base").clone();

    $("#term-list-block").children('#terms-pagination').remove();

    var termsPagination = $("#term-list-block").children('#terms-pagination-base').clone().attr('id', 'terms-pagination');


    $("#term-list").remove();
    $("#term-list-block").append(termList);
    termList.attr('id', 'term-list');

    $("#num-terms").text(numResultsTotal).parent().show();

    var termsResults = results[pagenum];

    if (termsResults.length === 0) {

        return;

    }

    for (item in termsResults) {

        var termName = termsResults[item][0];
        var conceptName = termsResults[item][1];
        var description = termsResults[item][2];
        var addTerm = term.clone();
        var id = conceptName + termName;

        if (termName.length > 40) {

            addTerm.append(termName.substr(0, 40) + "...");

        } else {

            addTerm.append(termName);

        }

        var fieldset = $('<fieldset class="fieldsetTerm hide"></fieldset>');
        fieldset.append('<input name="inputConceptUri" type="hidden" value="' + item + '" /> ');
        fieldset.append('<input name="inputTermName" type="hidden" value="' + termName + '" /> ');
        fieldset.append('<input name="inputConceptName" type="hidden" value="' + conceptName + '" /> ');

        addTerm.append(fieldset);

        termList.append(addTerm);

        addTerm.show();
        addTerm.popover({
            title: conceptName,
            content: description,
            trigger: 'hover',
            placement: 'left',
            delay: { show: 500, hide: 100 }
        });

        addTerm.draggable({

            cancel: "a.ui-icon", // clicking an icon won't initiate dragging
            revert: "invalid", // when not dropped, the item will revert back to its initial position
            containment: "document",
            helper: "clone",
            cursor: "move"

        });


    }

    if (numPages > 1) {

        for (var i = 1; i <= numPages; i++) {

            var page = termsPagination.find('#prev').clone();
            page.attr('id', 'pg' + i).attr('page', i).children('a').attr("href", "#").text(i);

            if (i === pagenum)
                page.attr('class', 'active');

            if (i === 1) {

                page.insertAfter(termsPagination.find('#prev'));

            } else {

                page.insertAfter(termsPagination.find('#pg' + (i - 1)));

            }

        }

        if (pagenum === 1)
            termsPagination.find('#prev').addClass('disabled').removeClass('page');

        if (pagenum == numPages)
            termsPagination.find('#next').addClass('disabled').removeClass('page');

        termsPagination.show();
        termsPagination.appendTo("#term-list-block");

    }

    termList.kendoTreeView({

        select: noSelect

    });

    SEARCH = true;
}

function annotationSearchCallBack(results) {

    "use strict";
    var maxMatches = results.max_matches;
    var numPages = results.num_pages;
    var numResultsTotal = results.num_results_total;
    var pagenum = parseInt(results.page_num, 10);

    var item;
    var term = $("#terms-list-base > .term").clone();
    var termList = $("#terms-list-base").clone();

    $("#term-list-block").children('#terms-pagination').remove();

    var termsPagination = $("#term-list-block").children('#terms-pagination-base').clone().attr('id', 'terms-pagination');


    $("#term-list").remove();
    $("#term-list-block").append(termList);
    termList.attr('id', 'term-list');

    $("#num-terms").text(numResultsTotal).parent().show();

    var termsResults = results[pagenum];

    if (termsResults.length === 0) {

        return;

    }

    for (item in termsResults) {

        var annotationUri = termsResults[item][0];
        var annotationDisplayText = termsResults[item][1];
        var parentInternalName = termsResults[item][2];
        var annotationOperator = termsResults[item][3];
        var annotationType = termsResults[item][4];

        var addTerm = term.clone();
        var id = item;
        var termName;
        if (annotationDisplayText != '') {
            termName = annotationDisplayText;
        } else {

            termName = parentInternalName + ' > ' + item;

        }

        if (termName.length > 20) {

            addTerm.append(termName.substr(0, 20) + "...");

        } else {

            addTerm.append(termName);

        }

        var fieldset = $('<fieldset class="fieldsetTerm hide"></fieldset>');
        fieldset.append('<input name="inputConceptUri" type="hidden" value="' + annotationUri + '" /> ');
        fieldset.append('<input name="inputTermName" type="hidden" value="' + termName + '" /> ');
        fieldset.append('<input name="inputConceptName" type="hidden" value="' + parentInternalName + '" /> ');
        fieldset.append('<input class="term-type" type="hidden" value="' + annotationType + '" /> ');
        fieldset.append('<div class="input hide">' + annotationOperator + "</div>");

        addTerm.append(fieldset);

        termList.append(addTerm);
        addTerm.css('word-wrap:break-word;');
        addTerm.show();
        addTerm.popover({
            title: parentInternalName,
            content: $('<div style="word-wrap:break-word;">'+termName+'</div>'),
            trigger: 'hover',
            placement: 'left',
            delay: { show: 500, hide: 100 },
            html: true
        });

        addTerm.draggable({

            cancel: "a.ui-icon", // clicking an icon won't initiate dragging
            revert: "invalid", // when not dropped, the item will revert back to its initial position
            containment: "document",
            helper: "clone",
            cursor: "move"

        });


    }

    if (numPages > 1) {

        for (var i = 1; i <= numPages; i++) {

            var page = termsPagination.find('#prev').clone();
            page.attr('id', 'pg' + i).attr('page', i).children('a').attr("href", "#").text(i);

            if (i === pagenum)
                page.attr('class', 'active');

            if (i === 1) {

                page.insertAfter(termsPagination.find('#prev'));

            } else {

                page.insertAfter(termsPagination.find('#pg' + (i - 1)));

            }

        }

        if (pagenum === 1)
            termsPagination.find('#prev').addClass('disabled').removeClass('page');

        if (pagenum == numPages)
            termsPagination.find('#next').addClass('disabled').removeClass('page');

        termsPagination.show();
        termsPagination.appendTo("#term-list-block");

    }

    termList.kendoTreeView({

        select: noSelect

    });

    SEARCH = true;
}

function guidedSearchS2Callback(results) {

    "use strict";
    resultsCallback(results);
    $('#automatic-search-form').hide();
    $('#query-group').hide();
    $('#reset-groups').hide();
    $('#back-to-query').fadeIn();
    $('#query-save-button').fadeIn();
    $('#search-content').toggle('slide', {direction: 'left'}, 400);
    $('#results').delay(500).effect('slide', {direction: 'right'}, 500);
    $('#saveMessage').hide();
    $('#saveQueryForm').show();
    $('#query-save').show();
    //$( '#nameQuery' ).val('');

}

function datasetQueryCallback(results) {

    "use strict";

    var item;
    var term = $("#dataset-table-base > .term").clone();
    var termList = $("#dataset-table-base").clone();

    $("#dataset-table").remove();
    $("#dataset-table-block").append(termList);
    termList.attr('id', 'dataset-table');


    for (item in results) {

        var addTerm = term.clone();
        var id = results[item];

        addTerm.children('.dataset-value').append('<a target="_blank" href="' + id + '">' + id + '</a>');
        addTerm.show();
        termList.append(addTerm);


    }

    // update resource counter
    $('#resource-count-label').text(results.length + " Resources match your query");

    $("#dataset-table-block").show();
    $("#dataset-results").show();
    $('html, body').animate({ scrollTop: $("#dataset-results").position().top }, 'slow');


}

function datasetQueryError() {

    "use strict";

    var item;
    var term = $("#dataset-table-base > .term").clone();
    var termList = $("#dataset-table-base").clone();

    $("#dataset-table").remove();
    $("#dataset-table-block").append(termList);
    termList.attr('id', 'dataset-table');


    // update resource counter
    $('#resource-count-label').text("You need permission to query this Dataset.");

    $("#dataset-table-block").show();
    $("#dataset-results").show();

}
/* END AJAX callback */

/* START AJAX call  */
function automaticSearchCall() {

    "use strict";
    var form;
    var url;
    var input;

    form = $("#automatic-search-form");
    input = form.find('input[name="free-text"]').val();
    url = '/automatic_search/';
    $('#wait').fadeIn();
    $.address.state($.address.baseURL().split('?')[0]).value('?input=' + input);
    $.ajax({
        type: 'POST',
        url: url,
        data: {input: input},
        success: function (results) {
            $('#wait').fadeOut();
            automaticSearchCallback(results);
        },
        error: function (jqXHR, textStatus, errorThrown) {

            $('#wait').fadeOut();

        }

    });
}

function guidedSearchS1Call() {

    "use strict";
    var form = $("#automatic-search-form"),
        input = form.find('input[name="free-text"]').val(),
        url = '/class_search/',
        numMaxHits = $('#num-max-hits').val(),
        pageNum = $('#page-num').val(),
        //dataset = $('#dataset-value').val();
        dataset = $('#dataset-uri').val();

    if (SEARCH === false) {

        $('#page-num').val(1);
        pageNum = 1;

    }

    $('#wait').fadeIn();
    $.ajax({
        type: 'POST',
        url: url,
        data: {input: input, dataset: dataset, nummaxhits: numMaxHits, pagenum: pageNum},
        success: function (results) {

            $('#wait').fadeOut();
            guidedSearchS1CallBack(results);

        },
        error: function (error) {

            $('#wait').fadeOut();

        }
    });
}

function complexSearchS1Call() {

    "use strict";
    var form = $("#automatic-search-form"),
        input = form.find('input[name="free-text"]').val(),
        url = '/guided_search_s1/',
        numMaxHits = $('#num-max-hits').val(),
        pageNum = $('#page-num').val();

    if (SEARCH === false) {

        $('#page-num').val(1);
        pageNum = 1;

    }

    $('#wait-terms').fadeIn();
    $.ajax({
        type: 'POST',
        url: url,
        data: {input: input, nummaxhits: numMaxHits, pagenum: pageNum},
        success: function (results) {

            $('#wait-terms').fadeOut();
            complexSearchS1CallBack(results);

        },
        error: function (error) {

            $('#wait-terms').fadeOut();

        }
    });
}

function guidedSearchS2Call(val, conceptLabel) {

    "use strict";
    var conceptUriList = [];

    // raccogliere info dataset, datasetlabel, classe e creare la uri
    var dataset = $("#dataset-uri").val(),
        datasetLabel = $("#dataset-value").val();

    window.location.href = "/semantic-search/annotation/?dataset=" + encodeURIComponent(dataset) + "&datasetLabel=" + encodeURIComponent(datasetLabel) + "&conceptClass=" + encodeURIComponent(val) + "&conceptLabel="+ encodeURIComponent(conceptLabel);

}

function guidedSearchComplexQueryCall(saveToken) {

    "use strict";
    var groupsList = [];
    var groupsQuery = [];
    var url = '/guided_search_complex_query/';

    $('#wait').fadeIn();

    $('.group').each(function () {
        groupsList.push(this.id);
    });


    for (var i = 0; i < (groupsList.length - 1); i++) {

        var conceptUriList = [];
        var id_group = groupsList[ i ];


        $("ul#" + id_group).each(function () {

            if ($("#" + id_group + ' > .exclude').children().hasClass('active')) {
                conceptUriList.push('NOT');
            }
            else {
                conceptUriList.push('');
            }

            $(this).find('.fieldsetTerm').each(function () {

                var singleTerm = [];

                var conceptUri = $(this).find("input[name=inputConceptUri]").val();
                var termName = $(this).find("input[name=inputTermName]").val();
                var conceptName = $(this).find("input[name=inputConceptName]").val();

                singleTerm.push(conceptUri);
                singleTerm.push(termName);
                singleTerm.push(conceptName);

                conceptUriList.push(singleTerm);

            });
            if (conceptUriList.length !== 0) {
                groupsQuery.push(conceptUriList);
            }
        });


    }

    // multidimensional array with JSON
    var stringJSON = JSON.stringify(groupsQuery);

    if (saveToken === 'True') {
        return stringJSON;
    }
    else {

        var queryUrl;
        var id = "";//$( '#queryID' ).val();
        if (id !== undefined && id !== "") {

            queryUrl = '?id=' + id;

        } else {

            queryUrl = '?groups_query=' + encodeURIComponent(stringJSON);

        }

        $.address.state($.address.baseURL().split('?')[0]).value(queryUrl);

        $.ajax({
            type: 'POST',
            url: url,
            data: { groups_query: stringJSON, id: id },
            success: function (results) {

                $('#wait').fadeOut();
                guidedSearchS2Callback(results);

            },
            error: function (error) {

                $('#wait').fadeOut();

            }
        });
    }
}

function datasetQueryCall(saveToken) {

    "use strict";
    var groupsList = [];
    var groupsQuery = [];
    var url = '/dataset_query/';

    $('#wait').fadeIn();

    $('.group').each(function () {
        groupsList.push(this.id);
    });


    for (var i = 0; i < (groupsList.length - 1); i++) {

        var conceptUriList = [];
        var id_group = groupsList[ i ];


        $("ul#" + id_group).each(function () {

            if ($("#" + id_group + ' > .exclude').children().hasClass('active')) {
                conceptUriList.push('NOT');
            }
            else {
                conceptUriList.push('');
            }


            $(this).find('.fieldsetTerm').each(function () {

                var singleTerm = [];

                var conceptUri = $(this).find("input[name=inputConceptUri]").val();
                var termName = $(this).find("input[name=inputTermName]").val();
                var conceptName = $(this).find("input[name=inputConceptName]").val();
                var conceptValue = $(this).find("input[class=term-value]").val();
                var conceptOperator = $(this).find("input[class=term-operator]").val();
                var conceptType = $(this).find("input[class=term-type]").val();


                singleTerm.push(conceptUri);
                singleTerm.push(termName);
                singleTerm.push(conceptName);
                singleTerm.push(conceptValue);
                singleTerm.push(conceptOperator);
                singleTerm.push(conceptType);

                conceptUriList.push(singleTerm);

            });
            if (conceptUriList.length !== 0) {
                groupsQuery.push(conceptUriList);
            }
        });


    }

    // multidimensional array with JSON
    var stringJSON = JSON.stringify(groupsQuery);

    if (saveToken === 'True') {
        return stringJSON;
    }
    else {
        var datasetEndpoint = $('#dataset-uri').val();
        var datasetLabel = $('#dataset-value').val();
        var queryUrl;
        var id = "";//$( '#queryID' ).val();
        if (id !== undefined && id !== "") {

            queryUrl = '?id=' + id;

        } else {

            queryUrl = '?groups_query=' + encodeURIComponent(stringJSON) + '&dataset=' + encodeURIComponent(datasetEndpoint)+'&datasetLabel='+datasetLabel;

        }
        window.location.replace('/semantic-search/results/'+queryUrl);
        return;
        //$.address.state($.address.baseURL().split('?')[0]).value(queryUrl);

        $.ajax({
            type: 'POST',
            url: url,
            data: { groups_query: stringJSON, id: id, endpoint: datasetEndpoint},
            success: function (results) {

                $('#wait').fadeOut();
                datasetQueryCallback(results);

            },
            error: function (error) {

                $('#wait').fadeOut();
                datasetQueryError();

            }
        });
    }
}

function annotationSearchCall(init) {

    "use strict";
    var form = $("#automatic-search-form"),
        input = form.find('input[name="free-text"]').val(),
        url = '/annotation_search/',
        numMaxHits = $('#num-max-hits').val(),
        pageNum = $('#page-num').val(),
        //dataset = $('#dataset-value').val(),
        dataset = $('#dataset-uri').val(),
        classConcept = $('#class-value').val(),
        classLabel = $('#class-label').val();

    if (SEARCH === false) {

        $('#page-num').val(1);
        pageNum = 1;

    }
    if (input === ''){
        numMaxHits = '200';
        input = undefined;
    }
    $('#wait-terms').fadeIn();
    $.ajax({
        type: 'POST',
        url: url,
        data: {input: input, dataset: dataset, classConcept: classConcept, nummaxhits: numMaxHits, pagenum: pageNum, classLabel:classLabel},
        success: function (results) {

            $('#wait-terms').fadeOut();
            annotationSearchCallBack(results);

        },
        error: function (error) {

            $('#wait-terms').fadeOut();

        }
    });
}


function save_complex_query() {

    "use strict";

    var url = '/save_complex_query/';
    var form = $("#saveQueryForm");
    var input = form.find('input[id="nameQuery"]').val();
    var id = form.find('input[id="queryID"]').val();

    var query;
    query = guidedSearchComplexQueryCall('True');

    $.ajax({
        type: 'POST',
        url: url,
        data: { groups_query: query,
            name: input,
            id: id
        },
        success: function (results) {
            $('#wait').fadeOut();
            $('#saveQueryForm').hide();
            $('#saveMessage').show();
            $('#query-save-button').hide();
            $('#query-save').hide();
        },
        error: function (error) {
            $('#wait').fadeOut();

        }
    });
}

/* END AJAX call  */

/* START jquery ready in SEARCH page */
$(function () {

    "use strict";
    var groups = [];                   //groups array content block
    var newGroup = $('#new-group');  //is "IN AND TERMS" group that call new group event

    /** START define new event 'remove' **/

    /** define remove event**/
    var ev = new $.Event('remove'),
        orig = $.fn.remove;
    $.fn.remove = function () {
        $(this).trigger(ev);
        return orig.apply(this, arguments);
    };

    /** END define new event 'remove' **/

    /* START graphic wrap */
    groups[0] = $('#group0'); //load first group (IN OR TERMS)

    $(".exclude").tooltip({title: "Exclude"});

    $(".terms-tools > #slider-range-min").slider({
        range: "min",
        value: 20,
        min: 20,
        max: 100,
        slide: function (event, ui) {

            $("#num-max-hits").val(ui.value);
            $("#max-terms").html(ui.value);

        },
        stop: function (event, ui) {

            $("#num-max-hits").val(ui.value);
            $("#max-terms").html(ui.value);
            if ($('#page-num').val() > Math.ceil(($("#num-max-hits").val() / 20))) {
                $('#page-num').val(Math.ceil(($("#num-max-hits").val() / 20)));
            }
            if (SEARCH) {
                complexSearchS1Call();
            }

        }
    });

    $("#amount").val("$" + $(".terms-tools > #slider-range-min").slider("value"));


    $('.group').kendoTreeView({

        select: noSelect

    });
    /* END graphic wrap */

    /* START event wrap */

    /** START drang & drop events */
    groups[0].droppable({

        accept: ".term",
        activeClass: "drop-in",
        drop: function (event, ui) {

            dropTerm(ui.draggable, $(this));

        }

    });

    newGroup.droppable({

        accept: ".term",
        activeClass: "drop-in",
        drop: function (event, ui) {

            createNewGroup(ui.draggable, $(this));

        }

    });
    /** END drang & drop events */

    /* END events wrap */


    /* START callback from animations  */

    /* Create new group when term is dropped in AND group*/
    function createNewGroup(item, dropTarget) {

        var setAnnotationForm = $('#set-annotation-value-form');
        var datasetValue = $('#dataset-value').val();
        var itemValue = setAnnotationForm.find('#annotation-value').val();
        var itemSetvalue = item.find(".term-value").val();
        var setAnnotationForm = $('#set-annotation-value-form');

        if (datasetValue !== '' && (itemValue === '' || itemValue === undefined) && itemSetvalue === undefined) {

            $('#save-annotation-value').unbind('click');
            $('#set-annotation-value').modal('show');
            $('#save-annotation-value').on('click', function () {
                createNewGroup(item, dropTarget);
            });

            setAnnotationForm.find('input').remove();
            setAnnotationForm.find('select').remove();
            setAnnotationForm.append(item.find('.input').clone().show());
            setAnnotationForm.unbind('submit');
            setAnnotationForm.on('submit', function () {
                createNewGroup(item, dropTarget);
                return false;
            });

            return;

        }
        var group = dropTarget.clone();
        var nGroup = groups.length;
        var itemCloned;


        itemCloned = item;
        if (item.parents('.group').length > 0) {

            groupCheckContent(item.parents('.group'), 2);
            //itemCloned = item;

        } else {

            //itemCloned = item.clone().hide();
            //itemCloned.children().children().append( '<a class="delete-link" href="#"></a>' );
            //itemCloned.attr( 'id', item.attr( 'data-uid' ) );

        }

        groups[ nGroup ] = group;
        group.attr('id', "group" + nGroup);
        group.find('.help').hide();
        group.find('#and').show();
        group.find('.exclude').tooltip({title: "Exclude"}).delay(300).fadeIn(200);
        group.insertBefore(dropTarget.parents('.k-treeview'));
        group.hide();
        group.kendoTreeView({

            select: noSelect

        }).fadeIn();
        group.droppable({

            accept: ".term",
            activeClass: "drop-in",
            drop: function (event, ui) {

                dropTerm(ui.draggable, $(this));

            }

        });

        dropTerm(itemCloned, group);
        /*itemCloned.appendTo( group ).delay( 200 ).fadeIn( 200 );
         itemCloned.draggable( {

         cancel: "a.ui-icon", // clicking an icon won't initiate dragging
         revert: "invalid", // when not dropped, the item will revert back to its initial position
         containment: "document",
         helper: "clone",
         cursor: "move"

         } );*/

    }
    $.createNewGroup = createNewGroup;
    function checkDuplicate(item, group) {

        var duplicate = false;
        var cURI = item.find('input[name=inputConceptUri]').attr('value');
        var termName = item.find('input[name=inputTermName]').attr('value');
        var cName = item.find('input[name=inputConceptName]').attr('value');

        group.find('.term').each(function () {
            var itemLocal = $(this);
            var cURILocal = itemLocal.find('input[name=inputConceptUri]').attr('value');
            var termNameLocal = itemLocal.find('input[name=inputTermName]').attr('value');
            var cNameLocal = itemLocal.find('input[name=inputConceptName]').attr('value');

            if (cURILocal === cURI && termNameLocal === termName && cNameLocal === cName) {
                duplicate = true;
                return duplicate;
            }

        });

        return duplicate;

    }

    $('#set-annotation-cancel').click(function () {

        var setAnnotationForm = $('#set-annotation-value-form');
        $('#annotation-value:reset').val('');
        setAnnotationForm.find('input').remove();
        setAnnotationForm.find('select').remove();

    });

    function editTermValue(item) {

        var setAnnotationForm = $('#set-annotation-value-form');
        var datasetValue = $('#dataset-value').val();
        var itemFormValue = setAnnotationForm.find('#annotation-value').val();
        var operatorFormValue = setAnnotationForm.find('.operator').val();
        var textOperator = setAnnotationForm.find('.operator option:selected').text();
        var operator = $('.term-operator')
        var itemValue = item.find(".term-value");


        if (datasetValue !== '' && (itemFormValue === '' || itemFormValue === undefined)) {

            $('#save-annotation-value').unbind('click');
            $('#set-annotation-value').modal('show');
            $('#save-annotation-value').on('click', function () {
                editTermValue(item);
            });

            setAnnotationForm.find('input').remove();
            setAnnotationForm.find('select').remove();
            setAnnotationForm.append(item.find('.input').clone().show());
            setAnnotationForm.find('input').val(itemValue.val());
            setAnnotationForm.find(".operator option[value='"+operator.val()+"']").attr("selected","selected");
            setAnnotationForm.unbind('submit');
            setAnnotationForm.on('submit', function () {
                editTermValue(item);
                return false;
            });

            return;

        }

        itemValue.val(itemFormValue);
        operator.val(operatorFormValue);
        item.find('#term-value-text').text('Value '+ textOperator + " " + itemFormValue);
        $('#annotation-value:reset').val('');
        $('#set-annotation-value').modal('hide');
        setAnnotationForm.find('input').remove();
        setAnnotationForm.find('select').remove();

    }

    /* Create new group when term is dropped in OR group*/
    function dropTerm(item, dropTarget) {

        var itemCloned;
        var setAnnotationForm = $('#set-annotation-value-form');
        var datasetValue = $('#dataset-value').val();
        var itemValue = setAnnotationForm.find('#annotation-value').val();
        var operator = setAnnotationForm.find('.operator').val();
        var textOperator = setAnnotationForm.find('.operator option:selected').text();
        var itemSetvalue = item.find(".term-value").val();
        var itemSetOperator = item.find(".term-operator").val();
        if (itemSetOperator == 'regex'){
            var itemSetOperatorString = "⊃";
        }else{
            var itemSetOperatorString =  itemSetOperator;
        }
        //if term dropped is not present in group , it can be dropped
        if (!checkDuplicate(item, dropTarget)) {

            if (datasetValue !== '' && (itemValue === '' || itemValue === undefined)  && itemSetvalue === undefined) {

                $('#save-annotation-value').unbind('click');
                $('#set-annotation-value').modal('show');
                $('#save-annotation-value').on('click', function () {
                    dropTerm(item, dropTarget);
                });
                setAnnotationForm.find('input').remove();
                setAnnotationForm.find('select').remove();
                setAnnotationForm.append(item.find('.input').clone().show());
                setAnnotationForm.unbind('submit');
                setAnnotationForm.on('submit', function () {
                    dropTerm(item, dropTarget);
                    return false;
                });

                return;

            }

            //if term came from other groups or from term-list search results
            if (item.parents('.group').length > 0 || itemSetvalue !== undefined) {

                groupCheckContent(item.parents('.group'), 2);
                itemCloned = item;
                /*itemCloned.find( '#edit-annotation' ).on( 'click', function(){
                 editTermValue(itemCloned);
                 });*/


            } else {

                itemCloned = item.clone().hide();
                itemCloned.children().children().append("<a id='delete-link' class='icon-remove' href='#' style='float: right;'></a>");

                if (itemValue !== '') {

                    var edit = $("<a id='edit-annotation' class='icon-pencil' href='#' style='float:right'></a>");

                    var value = $("<div id='term-value-text' style='text-align:right;padding-right: 29px;'>Value " + textOperator + " " + itemValue + "</div>");

                    itemCloned.children().children().append(edit);
                    itemCloned.children().children().append(value);
                    itemCloned.find('.fieldsetTerm').append("<input type='hidden' class='term-value' value='" + itemValue + "'/>");
                    itemCloned.find('.fieldsetTerm').append("<input type='hidden' class='term-operator' value='" + operator + "'/>");


                    $('#annotation-value:reset').val('');
                    setAnnotationForm.find('input').remove();
                    setAnnotationForm.find('select').remove();
                    $('#set-annotation-value').modal('hide');

                }

                itemCloned.attr('id', item.attr('data-uid'));

            }

            dropTarget.find('.help').fadeOut(200);
            dropTarget.find('.exclude').delay(300).fadeIn(200);

            itemCloned.appendTo(dropTarget).delay(200).fadeIn(200);

            itemCloned.draggable({

                cancel: "a.ui-icon", // clicking an icon won't initiate dragging
                revert: "invalid", // when not dropped, the item will revert back to its initial position
                containment: "document",
                helper: "clone",
                cursor: "move"

            });
        }
    }
    $.dropTerm = dropTerm;

    //verify if group have to be delete (no more terms inside it)
    function groupCheckContent(parent, minLength) {

        if (parent.children('.term').length === minLength) {

            if (parent.attr('id') === 'group0') {

                if ($('.group').length === 2) {

                    //if group is group0 return to intial view.
                    parent.children('.help').delay(400).fadeIn(200);
                    parent.children('.exclude').fadeOut();
                    return;

                } else {

                    var newGroup0 = $('.group')[1];
                    newGroup0.id = 'group0';
                    $(newGroup0).children('#and').remove();

                }

            }

            parent.parents('.k-treeview').fadeOut(400, function () {
                $(this).parents('.k-treeview').remove();
            });
            parent.parents('.k-treeview').remove();


        }
    }
    $.groupCheckContent = groupCheckContent;
    /* END callback from animations  */

    /* START click event */

    $('#free-text').change(function () {
        SEARCH = false;
    });

    $('#query-submit').bind("click", function () {
        //guidedSearchS2Call();
        guidedSearchComplexQueryCall('False');

    });
    //$( '#query-submit' ).bind( "click", function(){ guidedSearchComplexQueryCall( ); } );

    $('#search-button').bind("click", function () {
        automaticSearchCall();
    });
    $('#automatic-search-form').bind("submit", function () {
        automaticSearchCall();
        return false;
    });

    $('#query-save').bind("click", function () {
        save_complex_query();
        return false;
    });

    /** event to delete term from group **/
    $(document).on('click', '#delete-link', function (e) {

        var parent = $(this).parents('.group');

        e.preventDefault();

        groupCheckContent(parent, 1);
        $(this).closest('.k-item').remove();


    });

    $(document).on('click', '#edit-annotation', function (e) {

        var item = $(this).closest('.k-item');

        e.preventDefault();
        editTermValue(item);

    });


    $(document).on('click', '.history_query > a', function () {

        var query;

        query = $.parseJSON(decodeURIComponent($(this).attr('query')));
        $('.group > .term').remove();

        var group0 = groups[0];
        groups = [];
        groups[0] = group0;

        //$( '#queryID' ).attr( 'value', $( this ).attr('id') );
        //$( '#nameQuery' ).val( $( this ).text() );
        //$( '#nameQuery' ).attr( 'placeholder', $( this ).text() );

        for (var i = 0; i < query.length; i++) {

            for (var j = 1; j < query[i].length; j++) {

                var item = $('<li  class="term ui-draggable k-item" style="" data-original-title=""  role="treeitem"><div class="k-mid"><span class="k-in"><span class="k-sprite folder"></span>' + query[i][j][1] + '<fieldset class="fieldsetTerm hide"><input name="inputConceptUri" type="hidden" value="' + query[i][j][0] + '"> <input name="inputTermName" type="hidden" value="' + query[i][j][1] + '"> <input name="inputConceptName" type="hidden" value="' + query[i][j][2] + '"> </fieldset></span></div></li>');
                if ($('#group' + i).length === 0) {

                    createNewGroup(item, $('#new-group'));

                } else {

                    dropTerm(item, $('#group' + i));

                }
                var exclude = $('#group' + i).find('.exclude > .btn ');
                if (query[i][0] === "NOT") {

                    if (!exclude.hasClass('active'))
                        exclude.addClass('active');

                } else {

                    exclude.removeClass('active');

                }

            }


        }
        $('.group').each(function () {

            var group = $(this);
            if (group.attr('id') !== "new-group")
                groupCheckContent(group, 0);
        });

    });

    /** event to reset groups area from all terms**/
    $(document).on('click', '#reset-groups', function () {

        $('.group > .term').remove();

        var group0 = groups[0];
        groups = [];
        groups[0] = group0;
        $('#queryID').removeAttr('value');
        $('.group').each(function () {

            var group = $(this);
            if (group.attr('id') !== "new-group")
                groupCheckContent(group, 0);
        });

    });

    /* END click event */
});

/** event to change page of terms-list **/
function pagination(call){

    $(document).off('click','.page')
    $(document).on('click','.page', function () {

        var page = $(this);
        var id = page.attr('id');
        var newpage = 1;

        if (id === 'prev' && !page.hasClass('disabled')) {

            newpage = parseInt($('#page-num').val(), 10) - 1;


        } else if (id === 'next' && !page.hasClass('disabled')) {

            newpage = parseInt($('#page-num').val(), 10) + 1;

        } else {

            newpage = page.attr('page');

        }

        $('#page-num').val(newpage);

        call();


    });
}

function loadLatestQuery() {

    "use strict";

    var url;
    url = '/semantic-search/complex/latest/';
    $.ajax({
        type: 'POST',
        url: url,
        data: {},
        success: function (results) {

            var id;
            var name;
            var query;

            if ($('.history_query') !== undefined)
                $('.history_query').remove();

            for (var i = 0; i < results.length; i++) {

                id = results[i][0];
                name = results[i][1];
                query = results[i][2];

                $('#query-group > .dropdown-menu').append('<li class="history_query"><a id="' + id + '" href="#" query="' + encodeURIComponent(query) + '">' + name + '</a></li>');

            }

        },
        error: function (error) {


        }
    });

}


$(document).on('click', '#back-to-query', function () {

    "use strict";
    $('#back-to-query').hide();
    $('#query-save-button').hide();
    $('#automatic-search-form').show();
    //loadLatestQuery();
    $('#query-group').show();
    $('#reset-groups').show();
    $('#results').toggle('slide', {direction: 'rigth'}, 400);
    $('#search-content').delay(500).effect('slide', {direction: 'left'}, 500);
    $.address.state($.address.baseURL().split('?')[0]).value('?');
    $('#legend-step2').removeClass('selected').addClass('muted');
});


$(document).on('click', '#terms-table > .term', function () {

    "use strict";

    guidedSearchS2Call($(this).find('input[name=inputConceptUri]').val(), $(this).find('input[name=inputConceptLabel]').val());


});

/*
 noSelect hide the selection event
 from term in kendo treeview ***MAYBE SOME BUG HERE***
 */
function noSelect(e) {

    "use strict";
    var item = e.node;
    item.children('.k-state-selected').removeClass('k-state-selected');
    item.children('.k-state-focused').removeClass('k-state-focused');

}

function complexSearchReady() {

    "use strict";
    $('#search-button').unbind('click');
    $('#automatic-search-form').unbind('submit');
    $('#query-submit').unbind('click');
    $('#right-nav-search').show();

    $('#results').hide();
    $('#query-group').fadeIn(/*function(){ loadLatestQuery(); }*/);
    $('#reset-groups').fadeIn();
    $('#search-content').fadeIn();
    $('#search-button').bind("click", function () {
        complexSearchS1Call();
    });
    $('#automatic-search-form').bind("submit", function () {
        complexSearchS1Call();
        return false;
    });
    $('#query-submit').bind("click", function () {
        guidedSearchComplexQueryCall('False');
    });
    $('#free-text').attr('placeholder', 'Search concepts');


    /*** START Reset Term List ***/
    var termList = $("#terms-list-base").clone();
    $("#term-list").remove();
    $("#term-list-block").append(termList);
    termList.attr('id', 'term-list');
    $("#num-max-hits").val(20);
    $("#max-terms").text(20);
    $("#num-terms").text('').parent().hide();
    $("#page-num").val(1);
    $(".terms-tools > #slider-range-min").slider('value', '20');
    $("#termsPagination").remove();

    $('.group > .term').bind('remove', function (e) {

        var parent = $(this).parents('.group');

        e.preventDefault();

        groupCheckContent(parent, 1);

    });

    $('.group > .term').remove();
    SEARCH = false;
    pagination(complexSearchS1Call);
    /*** END Reset Term List ***/

}

function guidedSearchReady() {

    "use strict";
    $('#search-button').unbind('click');
    $('#automatic-search-form').unbind('submit');
    $('#query-submit').unbind('click');
    $('#history-button').hide();
    $('#reset-groups').hide();
    //$( '#right-nav-search' ).show();

    $('#results').hide();
    $('#query-group').fadeIn(/*function(){ loadLatestQuery(); }*/);
    $('#search-content').fadeIn();
    $('#search-button').bind("click", function () {
        guidedSearchS1Call();
    });
    $('#automatic-search-form').bind("submit", function () {
        guidedSearchS1Call();
        return false;
    });
    $('#query-submit').bind("click", function () {
        guidedSearchS2Call();
    });
    $('#terms-table').show();
    $('#guided-search-content-block').hide();
    $('#free-text').attr('placeholder', 'Filter concepts');
    $('#free-text').val('');
    $('#annotation-value').val('');
    var setAnnotationForm = $('#set-annotation-value-form');
    setAnnotationForm.find('input').remove();
    setAnnotationForm.find('select').remove();
    /*** START Reset Term List ***/
    var termList = $("#terms-list-base").clone();
    $("#term-list").remove();
    $("#term-list-block").append(termList);
    termList.attr('id', 'term-list');
    $("#num-max-hits").val(20);
    $("#max-terms").text(20);
    $("#num-terms").text('').parent().hide();
    $("#page-num").val(1);
    $(".terms-tools > #slider-range-min").slider('value', '20');
    $("#termsPagination").remove();

    $('.group > .term').bind('remove', function (e) {

        var parent = $(this).parents('.group');

        e.preventDefault();

        groupCheckContent(parent, 1);

    });

    $('.group > .term').remove();
    SEARCH = false;
    /*** END Reset Term List ***/

}

function datasetSearchReady(dataset, datasetLabel) {
    var conceptClass = $('.select-class').first();
    $('#dataset-uri').val(dataset);
    conceptClass.addClass('btn-primary');
    $('#dataset-value').val(datasetLabel);
    datasetTermSearch(conceptClass.data('class'),conceptClass.val());
}

function datasetTermSearch(classValue, classLabel) {

    "use strict";
    //remember the selected dataset from guideserachS2 results
    $('#class-value').val(classValue);
    $('#class-label').val(classLabel);
    $('#legend-step3').removeClass('muted').addClass('selected');
    $('#legend-step3').after("<div id='legend-dataset'>" + $('#dataset-value').val() + "</div>");
    $('#history-button').hide();
    $(".terms-tools").hide();
    $('#right-nav-search').show();

    $('#search-button').unbind('click');
    $('#automatic-search-form').unbind('submit');
    $('#query-submit').unbind('click');

    $('#results').hide();
    $('#reset-groups').fadeIn();
    $('#search-content').fadeIn();
    $('#search-button').bind("click", function () {
        annotationSearchCall();
    });
    $('#automatic-search-form').bind("submit", function () {
        annotationSearchCall();
        return false;
    });


    $('#query-submit').bind("click", function () {
        datasetQueryCall('False');
        return;
    });
    $('#free-text').attr('placeholder', 'Filter Annotations in selected class');
    $('#free-text').val('');
    $('#annotation-value').val('');
    var setAnnotationForm = $('#set-annotation-value-form');
    setAnnotationForm.find('input').remove();
    setAnnotationForm.find('select').remove();

    /*** START Reset Term List ***/
    var termList = $("#terms-list-base").clone();
    $("#term-list").remove();
    $("#term-list-block").append(termList);
    termList.attr('id', 'term-list');
    $("#num-max-hits").val(20);
    $("#max-terms").text(20);
    $("#num-terms").text('').parent().hide();
    $("#page-num").val(1);
    $(".terms-tools > #slider-range-min").slider('value', '20');
    $("#termsPagination").remove();

    $('.group > .term').remove();
    SEARCH = false;
    /*** END Reset Term List ***/
    $('#back-to-query').hide();
    $('#query-save-button').hide();
    $('#automatic-search-form').show();
    annotationSearchCall('');
    pagination(annotationSearchCall);
    //$.address.state($.address.baseURL().split('?')[0]).value('?dataset='+encodeURIComponent(dataset)+'&datasetLabel='+encodeURIComponent(datasetLabel));

}

/* END jquery ready in search page */
